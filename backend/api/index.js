require('dotenv').config();
const app = require('../src/app');

// En Vercel, Firebase se inicializa cuando se importa src/app -> src/config/firebase
// Pero podemos asegurarnos de que se importe aquí también si queremos
// const { db } = require('./src/config/firebase');

// Ruta de diagnóstico directo para Firebase
app.get('/test-db', async (req, res) => {
  const { db } = require('./src/config/firebase');
  try {
    const testDoc = await db.collection('test').add({ 
      timestamp: new Date().toISOString(),
      source: 'Vercel Diagnostic' 
    });
    res.json({ success: true, docId: testDoc.id, message: "Conexión a Firestore exitosa." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 5001;

// En Vercel no hace falta el listen, pero si se deja, que sea solo si no es Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

// Exportar para Vercel en producción
module.exports = app;
