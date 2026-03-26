const { db } = require('../config/firebase');

exports.logAction = async (adminEmail, action, details) => {
  try {
    await db.collection('audit_logs').add({
      adminEmail: adminEmail || 'Admin Desconocido',
      action: action || 'ACCIÓN_DESCONOCIDA',
      details: details || 'Sin detalles.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al escribir el log de auditoría:", error);
  }
};
