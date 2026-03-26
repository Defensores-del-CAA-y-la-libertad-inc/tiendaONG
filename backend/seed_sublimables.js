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

// Ensure we don't initialize twice if running in a watcher, but usually not an issue in one-off scripts
if (!admin.apps.length) {
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const newProducts = [
  {
    name: 'Taza Blanca Sublimable (Logo Oficial)',
    description: 'Taza clásica de cerámica blanca de 11 oz, sublimada con el logo oficial de la ONG a todo color. Perfecta para el café de la mañana y apoyar nuestra causa.',
    price: 15.00,
    category: 'Oficina',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop', // White mug
    type: 'product',
    stock: 50,
    hasSizes: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    name: 'Camiseta Blanca de Algodón (Logo ONG)',
    description: 'Cómoda camiseta de algodón 100% en color blanco. Lleva estampado el escudo de la ONG en el pecho. Muestra tu apoyo en cualquier lugar.',
    price: 25.00,
    category: 'Ropa',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', // White tshirt
    type: 'product',
    stock: 100,
    hasSizes: true,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    name: 'Gorra Blanca Clásica (Logo ONG)',
    description: 'Gorra estilo béisbol en color blanco puro con el logo de la ONG bordado o sublimado en el frente. Material transpirable.',
    price: 18.00,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop', // White cap
    type: 'product',
    stock: 30,
    hasSizes: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    name: 'Termo / Botella Blanca Sublimada',
    description: 'Botella térmica de acero inoxidable color blanco. Mantiene tus bebidas frías o calientes y lleva nuestra identidad en el exterior.',
    price: 22.00,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop', // White bottle
    type: 'product',
    stock: 45,
    hasSizes: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    name: 'Bolsa Ecológica Blanca (Tote Bag)',
    description: 'Bolsa de tela reutilizable en color blanco crudo, sublimada con nuestro emblema. Ideal para compras o libros.',
    price: 12.00,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1597349141014-411a5feab2f4?q=80&w=800&auto=format&fit=crop', // Tote bag
    type: 'product',
    stock: 200,
    hasSizes: false,
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

async function wipeAndSeed() {
  console.log('⏳ Buscando productos existentes...');
  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    // Eliminación por lotes para ser eficientes
    if (!snapshot.empty) {
      console.log(`🗑️ Eliminando ${snapshot.size} productos existentes...`);
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('✅ Base de datos limpiada. Todos los antiguos fueron borrados.');
    } else {
      console.log('No había productos que borrar.');
    }
    
    console.log('🌱 Inyectando nuevos productos sublimables blancos...');
    const seedBatch = db.batch();
    
    for (const doc of newProducts) {
      const docRef = productsRef.doc(); // Auto ID
      seedBatch.set(docRef, doc);
    }
    
    await seedBatch.commit();
    console.log(`✅ ¡Éxito! Se añadieron ${newProducts.length} artículos sublimables a la tienda.`);
    
  } catch (error) {
    console.error('❌ Error fatal en el proceso:', error);
  } finally {
    process.exit(0);
  }
}

wipeAndSeed();
