const { admin } = require('./src/config/firebase');

async function createAdmin(email, password) {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });
    console.log('✅ Administrador creado exitosamente:', userRecord.uid);
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
  } finally {
    process.exit();
  }
}

// Cambia los valores aquí para crear el admin real
const email = process.argv[2] || 'admin@defensorescaa.org';
const password = process.argv[3] || 'admin123';

if (!email || !password) {
  console.log('Uso: node create_admin.js <email> <password>');
  process.exit(1);
}

createAdmin(email, password);
