require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Credentials
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  const saPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(saPath)) {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = fs.readFileSync(saPath, 'utf8');
  }
}

const { db, bucket } = require('./src/config/firebase');

const imagesToUpload = [
  'mug_detained.png',
  'tshirt_detained.png',
  'cap_detained.png',
  'detained_deported_paused.png'
];

const LOCAL_PATH = path.join(__dirname, '../frontend/public/products');

async function fixVercelImages() {
  try {
    console.log('☁️ Cargando imágenes a Firebase Storage para producción...');
    
    const urlMap = {};

    for (const fileName of imagesToUpload) {
      const filePath = path.join(LOCAL_PATH, fileName);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${filePath}`);
        continue;
      }

      console.log(`📤 Subiendo ${fileName}...`);
      const destination = `products/${fileName}`;
      await bucket.upload(filePath, {
        destination,
        public: true,
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000'
        }
      });

      // Firebase Storage Public URL format
      // Note: This format works for public files in Firebase Storage
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
      urlMap[fileName] = publicUrl;
      console.log(`✅ Subido: ${publicUrl}`);
    }

    console.log('📝 Actualizando productos en Firestore...');
    const snapshot = await db.collection('products').get();
    
    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const currentImage = data.image;

      if (currentImage && currentImage.includes('/products/')) {
        const imageName = currentImage.split('/').pop();
        if (urlMap[imageName]) {
          batch.update(doc.ref, { image: urlMap[imageName] });
          count++;
          console.log(`Updated ${data.name} -> ${urlMap[imageName]}`);
        }
      }
    });

    await batch.commit();
    console.log(`✨ ¡Éxito! Se actualizaron ${count} productos con URLs de nube (compatibles con Vercel).`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    process.exit();
  }
}

fixVercelImages();
