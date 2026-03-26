require('dotenv').config();
const fs = require('fs');
const path = require('path');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  const saPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(saPath)) {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = fs.readFileSync(saPath, 'utf8');
  }
}

const { db } = require('./src/config/firebase');

const products = [
  {
    name: "Apoya la causa - Tumbler Térmico Pro",
    description: "Vaso térmico de acero inoxidable con pitillo. Cada compra financia directamente nuestra misión de proteger los derechos ciudadanos.",
    price: 29.99,
    category: "Accesorios",
    image: "/products/media__1774376498453.jpg",
    stock: 50,
    isActive: true,
    type: "Accesorios",
    providerProfit: 14.50,
    ongProfit: 15.49
  },
  {
    name: "Apoya la causa - Gorra Trucker Oficial",
    description: "Gorra blanca tipo trucker con logo premium. Un símbolo portátil de compromiso con la causa. Resistente y ajustable.",
    price: 19.99,
    category: "Ropa",
    image: "/products/media__1774376498483.jpg",
    stock: 40,
    isActive: true,
    type: "Ropa",
    providerProfit: 9.50,
    ongProfit: 10.49
  },
  {
    name: "Apoya la causa - Taza de Cerámica Especial",
    description: "El compañero perfecto para tus mañanas. Taza blanca de alta calidad con el escudo oficial de Defensores.",
    price: 17.99,
    category: "Accesorios",
    image: "/products/media__1774376498576.jpg",
    stock: 100,
    isActive: true,
    type: "Accesorios",
    providerProfit: 8.50,
    ongProfit: 9.49
  },
  {
    name: "Apoya la causa - Camiseta Blanca Premium",
    description: "T-shirt de algodón 100% orgánico. Vístete con propósito y apoya directamente nuestra misión y comunidad.",
    price: 27.99,
    category: "Ropa",
    image: "/products/media__1774376498685.jpg",
    stock: 60,
    isActive: true,
    type: "Ropa",
    providerProfit: 14.50,
    ongProfit: 13.49
  },
  {
    name: "Apoya la causa - Llavero Institucional",
    description: "Llavero metálico con acabado premium. Un pequeño gesto de apoyo que impacta directamente en nuestros programas sociales.",
    price: 9.99,
    category: "Accesorios",
    image: "/products/media__1774376498694.jpg",
    stock: 150,
    isActive: true,
    type: "Accesorios",
    providerProfit: 4.00,
    ongProfit: 5.99
  },
  {
    name: "Apoya la causa - Aroma Carro Premium",
    description: "Fragancia exclusiva para tu vehículo. Tu aporte ayuda a financiar la educación y defensa ciudadana en Florida.",
    price: 7.99,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1596460618051-5ee45bfe4dbb?q=80&w=600&auto=format&fit=crop",
    stock: 200,
    isActive: true,
    type: "Accesorios",
    providerProfit: 3.00,
    ongProfit: 4.99
  },
  {
    name: "Apoya la causa - Placa de Auto Metalizada",
    description: "Identidad y propósito en tu camino. Placa metálica oficial de la organización Defensores CAA.",
    price: 19.99,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1613939632306-0562e153965b?q=80&w=600&auto=format&fit=crop",
    stock: 80,
    isActive: true,
    type: "Accesorios",
    providerProfit: 10.50,
    ongProfit: 9.49
  },
  {
    name: "Guía de Defensa Ciudadana 2026 (Digital)",
    description: "Documento maestro con estrategias y derechos legales para la defensa comunitaria. Al comprarlo, recibirás el enlace de descarga oficial.",
    price: 19.99,
    category: "Documentos",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop",
    stock: 9999,
    isActive: true,
    type: "Documentos",
    isDocument: true,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    providerProfit: 0,
    ongProfit: 19.99
  },
  {
    name: "Manual de Acción Comunitaria (Digital)",
    description: "Guía paso a paso para organizar iniciativas locales. 100% de la recaudación apoya la misión de la Organización.",
    price: 14.99,
    category: "Documentos",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop",
    stock: 9999,
    isActive: true,
    type: "Documentos",
    isDocument: true,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    providerProfit: 0,
    ongProfit: 14.99
  }
];

async function seed() {
  try {
    console.log('🗑️ Limpiando catálogo antiguo...');
    const collectionRef = db.collection('products');
    const snapshot = await collectionRef.get();
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ Catálogo limpiado con éxito.');

    console.log('🌱 Sembrando productos con Precios Psicológicos y Narrativa...');
    for (const product of products) {
      const docRef = await collectionRef.add({
        ...product,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Registrado: ${product.name} - $${product.price} (ONG: $${product.ongProfit})`);
    }
    
    console.log('✨ Base de Datos optimizada para ventas de ONG.');
  } catch (error) {
    console.error('❌ Error crítico en el seed:', error.message);
  } finally {
    process.exit();
  }
}

seed();
