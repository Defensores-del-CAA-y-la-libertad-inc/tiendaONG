const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://frontend-topaz-ten-91.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Si el origen está en la lista o es una petición local (sin origin), permitimos.
    const isVercel = origin && origin.endsWith('.vercel.app');
    if (!origin || allowedOrigins.includes(origin) || isVercel) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Intento de acceso bloqueado por CORS desde: ${origin}`);
      callback(new Error('Sitio no autorizado por CORS. Revisa la variable FRONTEND_URL.'));
    }
  }
}));
app.use(express.json());

// Main route
app.get('/', (req, res) => {
  res.json({ message: 'API de la Tienda Virtual de Defensores en Acción (CAA) funcionando.' });
});

// Routes
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditRoutes = require('./routes/auditRoutes');

// Usar rutas
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/shipping-labels', shippingRoutes); // Alias plano para evitar 404 en subrutas de Vercel
app.use('/api/admins', adminRoutes);
app.use('/api/audit', auditRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: err.message
  });
});

module.exports = app;

