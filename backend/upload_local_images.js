const f = require('./src/config/firebase');
const fs = require('fs');
const path = require('path');

const localPath = path.join(__dirname, '../frontend/public/products');

async function uploadAndGetSignedUrl(fileName) {
  const filePath = path.join(localPath, fileName);
  if (!fs.existsSync(filePath)) return null;

  const destination = `images/${Date.now()}_${fileName}`;
  const bucket = f.admin.storage().bucket();
  
  try {
    // 1. Subir el archivo
    await bucket.upload(filePath, {
      destination: destination,
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    // 2. Generar una URL firmada a súper largo plazo (50 años)
    const [url] = await bucket.file(destination).getSignedUrl({
      action: 'read',
      expires: '03-09-2075' // Fecha lejana en el futuro
    });

    return { originalName: fileName, signedUrl: url };
  } catch (err) {
    console.error(`Error procesando ${fileName}:`, err.message);
    return null;
  }
}

async function run() {
  const db = f.db;
  const localFiles = fs.readdirSync(localPath);
  console.log(`🚀 Sincronizando ${localFiles.length} archivos con URLs Firmadas (Seguro para Vercel y Local)...`);
  
  const uploadedMap = {};
  for (const file of localFiles) {
    const res = await uploadAndGetSignedUrl(file);
    if (res) {
      uploadedMap[file] = res.signedUrl;
      console.log(`✅ ${file} -> Subido y Firmado`);
    }
  }

  const productsSnapshot = await db.collection('products').get();
  let syncCount = 0;

  for (const doc of productsSnapshot.docs) {
    const data = doc.data();
    const currentImg = data.image || '';
    
    // Decodificar la URL para buscar el nombre de archivo dentro
    const decodedUrl = decodeURIComponent(currentImg);
    
    let found = false;
    for (const localFile of Object.keys(uploadedMap)) {
       // Buscar si el nombre del archivo local está en cualquier parte de la URL guardada
       if (decodedUrl.includes(localFile)) {
          await doc.ref.update({ image: uploadedMap[localFile] });
          console.log(`✨ ${data.name}: Actualizado con URL Firmada.`);
          syncCount++;
          found = true;
          break;
       }
    }

    // Forzados manuales por si acaso el nombre cambió o no hay imagen previa
    if (!found) {
        if (data.name.includes('Patria y Vida') && uploadedMap['tshirt_patriayvida_v2.png']) {
           await doc.ref.update({ image: uploadedMap['tshirt_patriayvida_v2.png'] });
           syncCount++;
        } else if (data.name.includes('Singao') && uploadedMap['cap_singao_v2.png']) {
           await doc.ref.update({ image: uploadedMap['cap_singao_v2.png'] });
           syncCount++;
        }
    }
  }

  console.log(`\n🎉 ¡Sincronización Terminada! ${syncCount} productos ahora tienen fotos visibles en LOCAL y VERCEL.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
