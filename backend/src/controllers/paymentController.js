const getStripe = () => {
  // Priorizar la llave real restringida proporcionada por el usuario
  const key = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')
    ? process.env.STRIPE_SECRET_KEY.trim()
    : '';

  if (!key) {
    console.warn("⚠️ Advertencia: No se ha detectado STRIPE_SECRET_KEY en el entorno.");
  }
  
  return require('stripe')(key || 'sk_test_placeholder');
};

const { db } = require('../config/firebase');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { 
      items, customerEmail, orderId, salesTax = 0,
      customerFirstName, customerLastName, shippingAddress, 
      shippingCity, shippingState, shippingZip 
    } = req.body;
    const stripe = getStripe();

    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          // Remover imágenes si no son URLs absolutas para evitar errores en Stripe
          images: (item.image && item.image.startsWith('http')) ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    if (salesTax > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: "Sales Tax - Pinellas County, FL (7%)" },
          unit_amount: Math.round(Number(salesTax) * 100),
        },
        quantity: 1,
      });
    }

    const cartSubtotal = items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    const finalTotal = cartSubtotal + Number(salesTax);

    const newOrder = {
      customerEmail,
      customerName: `${customerFirstName || ''} ${customerLastName || ''}`.trim() || customerEmail.split('@')[0],
      customerFirstName: customerFirstName || '',
      customerLastName: customerLastName || '',
      shippingAddress: shippingAddress || '',
      shippingCity: shippingCity || '',
      shippingState: shippingState || '',
      shippingZip: shippingZip || '',
      items,
      subtotal: cartSubtotal,
      salesTax,
      totalAmount: finalTotal,
      paymentStatus: 'pending',
      status: 'received',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      stripeSessionId: 'pending'
    };

    await db.collection('orders').doc(orderId).set(newOrder);

    // Detección de URL base para redirección automática
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = host.includes('localhost') ? `${protocol}://${host}` : 'https://frontend-topaz-ten-91.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${baseUrl}/catalogo`,
      metadata: { orderId }
    });

    await db.collection('orders').doc(orderId).update({ stripeSessionId: session.id });
    res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error("❌ Stripe Production Error:", error);
    res.status(500).json({ 
      message: 'Error al inicializar el pago real. Por favor revisa la configuración de Stripe.', 
      error: error.message 
    });
  }
};

exports.createDocumentCheckoutSession = async (req, res) => {
  const { documentId, customerEmail, orderId } = req.body;

  try {
    const stripe = getStripe();
    const docRef = await db.collection('products').doc(documentId).get();
    
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    const documentData = docRef.data();
    const price = Number(documentData.price);

    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: documentData.name,
          images: (documentData.image && documentData.image.startsWith('http')) ? [documentData.image] : [],
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    }];

    const newOrder = {
      customerEmail,
      customerName: customerEmail.split('@')[0],
      items: [{
        productId: documentId,
        name: documentData.name,
        price: price,
        quantity: 1,
        image: documentData.image,
        fileUrl: documentData.fileUrl || '',
        isDocument: true
      }],
      totalAmount: price,
      paymentStatus: 'pending',
      status: 'completed',
      createdAt: new Date().toISOString(),
      stripeSessionId: 'pending',
      isDocumentOrder: true,
      isDeleted: false
    };

    await db.collection('orders').doc(orderId).set(newOrder);

    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = host.includes('localhost') ? `${protocol}://${host}` : 'https://frontend-topaz-ten-91.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${baseUrl}/documentos`,
      metadata: { orderId, isDocument: 'true' }
    });

    await db.collection('orders').doc(orderId).update({ stripeSessionId: session.id });
    res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error("❌ Document Production Error:", error);
    res.status(500).json({ 
      message: 'Error al procesar el pago del documento.', 
      error: error.message 
    });
  }
};

exports.refundOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'ID de la orden es requerido' });

  try {
    const stripe = getStripe();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'La orden no existe en el sistema' });
    }

    const orderData = orderSnap.data();
    if (!orderData.stripeSessionId || orderData.stripeSessionId === 'pending') {
      return res.status(400).json({ error: 'Esta orden no tiene un pago procesado/registrado para reembolsar' });
    }

    if (orderData.paymentStatus === 'refunded') {
      return res.status(400).json({ error: 'Esta orden ya ha sido reembolsada previamente' });
    }

    // 1. Obtener la sesión de Stripe para encontrar el PaymentIntent
    const session = await stripe.checkout.sessions.retrieve(orderData.stripeSessionId);
    const paymentIntentId = session.payment_intent;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'No se encontró un registro de pago válido en Stripe para esta orden.' });
    }

    // 2. Ejecutar el reembolso
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    if (refund.status === 'failed') {
      throw new Error('Stripe falló al procesar el reembolso.');
    }

    // 3. Actualizar Firestore
    await orderRef.update({
      paymentStatus: 'refunded',
      status: 'cancelled',
      refundedAt: new Date().toISOString(),
      refundId: refund.id
    });

    res.json({ success: true, refundId: refund.id });

  } catch (error) {
    console.error('Error al procesar refund:', error);
    res.status(500).json({ error: 'Error en el servidor al intentar reembolsar.', details: error.message });
  }
};
