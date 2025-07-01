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
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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

    // Guardar token en Firestore
    const db = admin.firestore();
    await db.collection('tokens').doc(token).set({
      token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Suscribirse al topic 'admin'
    await admin.messaging().subscribeToTopic(token, 'admin');

    console.log('Token guardado y suscrito:', token);
    return res.status(200).json({ message: 'Token guardado y suscrito correctamente' });

  } catch (error) {
    console.error('Error en save-token:', error);
    return res.status(500).json({ error: error.message });
  }
};
