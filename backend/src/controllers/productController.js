const firebase = require('../config/firebase');
const auditService = require('../services/auditService');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const productsSnapshot = await firebase.db.collection('products').get();
    const products = [];
    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get a single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const productDoc = await firebase.db.collection('products').doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ id: productDoc.id, ...productDoc.data() });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

  // Create a product
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, description, price, stock, image, type, categoryId, 
      fileUrl, isDocument, hasSizes, providerProfit, ongProfit,
      requiresNote, noteQuestion 
    } = req.body;
    const adminEmail = req.headers['x-admin-email'] || 'Desconocido';
    
    console.log('📦 Intentando crear producto:', { name, price, isDocument, adminEmail });
 
    const newProduct = {
      name,
      description: description || '',
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      image: image || '',
      type: type || categoryId || 'product',
      categoryId: categoryId || 'general',
      fileUrl: fileUrl || '',
      isDocument: isDocument || false,
      hasSizes: hasSizes !== undefined ? hasSizes : (isDocument ? false : true),
      requiresNote: requiresNote || false,
      noteQuestion: noteQuestion || '',
      providerProfit: parseFloat(providerProfit) || 0,
      ongProfit: parseFloat(ongProfit) || 0,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await firebase.db.collection('products').add(newProduct);
    
    // Audit Log
    await auditService.logAction(adminEmail, 'Creó Mercancía/Documento', `ID: ${docRef.id} | Nombre: ${name} | Precio: $${price}`);

    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const adminEmail = req.headers['x-admin-email'] || 'Desconocido';

    const productRef = firebase.db.collection('products').doc(id);
    await productRef.update({
      ...data,
      updatedAt: new Date().toISOString()
    });

    // Audit Log
    await auditService.logAction(adminEmail, 'Actualizó Mercancía/Documento', `ID: ${id} | Nuevo Nombre: ${data.name || 'N/A'}`);

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.headers['x-admin-email'] || 'Desconocido';
    
    await firebase.db.collection('products').doc(id).delete();
    
    // Audit Log
    await auditService.logAction(adminEmail, 'Eliminó Mercancía/Documento', `ID Eliminado: ${id}`);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Upload a generic file to Firebase Storage
exports.uploadFileToStorage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const bucket = firebase.bucket;

    if (!bucket) {
      return res.status(500).json({ message: 'Firebase Storage bucket no configurado en el servidor' });
    }

    const folder = file.mimetype.startsWith('image/') ? 'images' : 'documents';
    const fileName = `${folder}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      console.error("Storage upload error:", error);
      return res.status(500).json({ message: 'No se pudo subir a Firebase Storage. Asegúrate de configurar Storage.', error: error.message });
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        return res.status(200).json({ url: publicUrl, message: 'Subido correctamente' });
      } catch (err) {
        try {
          const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
          });
          return res.status(200).json({ url: url, message: 'Subido correctamente con URL firmada a largo plazo' });
        } catch (signErr) {
          const fallbackUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
          return res.status(200).json({ url: fallbackUrl, message: 'Subido usando Fallback URL' });
        }
      }
    });

    blobStream.end(file.buffer);

  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
