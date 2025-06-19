const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

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
    initFirebase();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  await cors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  try {
    await admin.messaging().subscribeToTopic(token, 'admin');
    return res.status(200).json({ message: 'Suscrito al topic admin' });
  } catch (error) {
    console.error('Error al suscribirse al topic:', error);
    return res.status(500).json({ error: 'Error al suscribirse al topic' });
  }
};
