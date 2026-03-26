const admin = require('firebase-admin');
const axios = require('axios');

// 1. Obtener la lista de administradores
exports.getAllAdmins = async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(100);
    const admins = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    }));
    
    // Si la lista está vacía (esto pasa si el auth de firebase no tiene usuarios aún), mandemos el mock predeterminado
    if (admins.length === 0) {
      admins.push({ uid: 'mock-1', email: 'admin@defensorescaa.org', creationTime: new Date().toISOString(), lastSignInTime: 'Nunca' });
    }
    
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    // Si la API de Identity Toolkit está desactivada, enviamos mock para no romper la app local
    res.status(200).json([
      { uid: 'mock-1', email: 'admin@defensorescaa.org', creationTime: new Date().toISOString(), lastSignInTime: 'Nunca' }
    ]);
  }
};

// 2. Crear un nuevo perfil de Administrador
exports.createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Eliminar administrador (Protegerse de auto-eliminación puede hacerse en frontend)
exports.deleteAdmin = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if(uid.startsWith('mock-')) {
       return res.status(200).json({ message: 'Mock admin eliminado (Simulación)' });
    }
    
    await admin.auth().deleteUser(uid);
    res.status(200).json({ message: 'Administrador eliminado exitosamente del sistema cerrado.' });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Iniciar sesión (Login) - Lógica de Proxy para ocultar Firebase del Frontend
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    const isMockKey = !FIREBASE_API_KEY || FIREBASE_API_KEY.includes('tu_api_key');

    if (isMockKey) {
      // Mock para desarrollo si no hay API Key real
      if (email === 'admin@defensorescaa.org' && password === 'ongadmin2026') {
        return res.status(200).json({ 
          uid: 'mock-1', 
          email: email, 
          token: 'mock-token-for-dev' 
        });
      }
      return res.status(401).json({ error: 'Credenciales de prueba incorrectas en el entorno local.' });
    }

    // Llamada directa a Google Identity Toolkit (Firebase Auth REST API)
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true }
    );

    const { localId, idToken, refreshToken, expiresIn } = response.data;

    res.status(200).json({
      uid: localId,
      email: email,
      token: idToken,
      refreshToken: refreshToken,
      expiresIn: expiresIn
    });
  } catch (error) {
    console.error("Error en login de administrador:", error.response?.data || error.message);
    const apiError = error.response?.data?.error?.message || 'Error al iniciar sesión';
    res.status(401).json({ error: apiError });
  }
};
