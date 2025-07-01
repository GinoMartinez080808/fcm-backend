const admin = require('firebase-admin');
const Cors = require('cors');
const cors = Cors({ origin: true });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      return result instanceof Error ? reject(result) : resolve(result);
    });
  });
}

function initFirebase() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT no está definida');
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

module.exports = async (req, res) => {
  try {
    await runMiddleware(req, res, cors);
    initFirebase();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const db = admin.firestore();
    await db.collection('tokens').doc(token).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Token guardado en Firestore:', token);
    return res.status(200).json({ message: 'Token guardado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
