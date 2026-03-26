const path = require('path');
const fs = require('fs');

// Forzar el ID del proyecto a nivel global antes de cargar nada más
process.env.GOOGLE_CLOUD_PROJECT = 'ong-store';
process.env.FIREBASE_PROJECT_ID = 'ong-store';

const admin = require('firebase-admin');

let _db, _auth, _bucket;

function getFirebase() {
  if (_db && _auth && _bucket) return { db: _db, auth: _auth, bucket: _bucket };

  try {
    let serviceAccount;
    const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (jsonStr) {
      try {
        let finalJson = jsonStr.trim();
        if (finalJson.startsWith('"') && finalJson.endsWith('"')) {
          finalJson = finalJson.substring(1, finalJson.length - 1);
        }
        if ((finalJson.startsWith('ew') || finalJson.startsWith('ey')) && !finalJson.includes('{')) {
          finalJson = Buffer.from(finalJson, 'base64').toString('utf8');
        }
        serviceAccount = JSON.parse(finalJson);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n').trim();
        }
      } catch (err) {
        console.error("❌ Firebase JSON parse error:", err.message);
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const fullPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(fullPath)) {
        console.log(`📂 [Firebase] Cargando desde archivo: ${fullPath}`);
        serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      }
    }

    if (admin.apps.length === 0) {
      if (serviceAccount && serviceAccount.project_id) {
        process.env.GOOGLE_CLOUD_PROJECT = serviceAccount.project_id;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
          storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
        });
      } else {
        admin.initializeApp({
          storageBucket: `ong-store.firebasestorage.app`
        });
      }
    }

    const app = admin.app();
    _db = app.firestore();
    _auth = app.auth();
    _bucket = admin.storage().bucket();
    return { db: _db, auth: _auth, bucket: _bucket };
  } catch (error) {
    console.error("❌ Firebase critical error:", error.message);
    throw error;
  }
}

module.exports = {
  admin,
  get db() { return getFirebase().db; },
  get auth() { return getFirebase().auth; },
  get bucket() { return getFirebase().bucket; }
};
