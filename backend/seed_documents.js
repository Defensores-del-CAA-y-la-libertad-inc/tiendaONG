const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to your service account key file
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('Error reading serviceAccountKey.json:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const documents = [
  {
    name: 'Guía Completa de Derechos Fundamentales',
    description: 'Manual digital detallado sobre derechos fundamentales, con ejemplos reales, modelos de cartas legales y pasos para proteger tus derechos. 45 páginas en formato PDF.',
    price: 15.00,
    category: 'Documentos',
    image: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', // Placeholder image of a book or law
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Dummy PDF for testing
    status: 'active',
    createdAt: new Date().toISOString(),
    isDocument: true
  },
  {
    name: 'Plantilla de Asesoramiento Legal',
    description: 'Una plantilla profesional lista para llenar. Descarga inmediata en PDF.',
    price: 5.00,
    category: 'Documentos',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Dummy PDF
    status: 'active',
    createdAt: new Date().toISOString(),
    isDocument: true
  }
];

async function seedDocuments() {
  console.log('Starting document seeding...');
  
  for (const doc of documents) {
    try {
      const docRef = await db.collection('products').add(doc);
      console.log(`Added document: ${doc.name} with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error adding document ${doc.name}:`, error);
    }
  }
  
  console.log('Document seeding finished.');
  process.exit(0);
}

seedDocuments();
