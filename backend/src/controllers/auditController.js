const { db } = require('../config/firebase');

exports.getAuditLogs = async (req, res) => {
  try {
    const snapshot = await db.collection('audit_logs').orderBy('timestamp', 'desc').get();
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener auditoría', error: error.message });
  }
};
