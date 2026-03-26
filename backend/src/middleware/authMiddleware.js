const { auth } = require('../config/firebase');

// Middleware that verifies the Firebase ID token
exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No se propocionó token de autenticación (Unauthorized)' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado (Forbidden)' });
  }
};
