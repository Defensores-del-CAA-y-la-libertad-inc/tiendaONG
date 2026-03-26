const { db } = require('../config/firebase');
const auditService = require('../services/auditService');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, totalAmount, paymentStatus } = req.body;
    
    const newOrder = {
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      items, // Array of product objects: [{ productId, quantity, price, name }]
      totalAmount: parseFloat(totalAmount) || 0,
      paymentStatus: paymentStatus || 'pending', // pending, completed, failed
      status: 'received', // received, processing, shipped, delivered
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('orders').add(newOrder);
    res.status(201).json({ id: docRef.id, ...newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get all orders (Admin only eventually)
exports.getAllOrders = async (req, res) => {
  try {
    const showDeleted = req.query.showDeleted === 'true';
    let query = db.collection('orders');
    
    if (!showDeleted) {
      query = query.where('isDeleted', '==', false);
    }

    const snapshot = await query.get();
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Ordenar en memoria por createdAt desc para evitar requerir un índice compuesto en Firestore
    orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a specific order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ id: orderDoc.id, ...orderDoc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const adminEmail = req.headers['x-admin-email'] || 'Desconocido';
    
    const updateData = { updatedAt: new Date().toISOString() };
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const orderRef = db.collection('orders').doc(id);
    await orderRef.update(updateData);
    
    // Audit Log
    await auditService.logAction(adminEmail, 'Actualizó Orden', `Orden ID: ${id} | Nuevo Estado: ${status || 'N/A'} | Pago: ${paymentStatus || 'N/A'}`);

    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};
// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.headers['x-admin-email'] || 'Desconocido';
    
    // Soft Delete
    await db.collection('orders').doc(id).update({ 
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: adminEmail
    });
    
    // Audit Log
    await auditService.logAction(adminEmail, 'Eliminó Orden', `ID Eliminado: ${id}`);

    res.status(200).json({ message: 'Order archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error archiving order', error: error.message });
  }
};

// Restore an archived order
exports.restoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.headers['x-admin-email'] || 'Desconocido';
    
    await db.collection('orders').doc(id).update({ 
      isDeleted: false,
      restoredAt: new Date().toISOString(),
      restoredBy: adminEmail
    });
    
    // Audit Log
    await auditService.logAction(adminEmail, 'Restauró Orden', `ID Restaurado: ${id}`);

    res.status(200).json({ message: 'Order restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring order', error: error.message });
  }
};
