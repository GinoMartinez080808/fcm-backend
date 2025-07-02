const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const Cors = require('cors');
const cors = Cors({ origin: true }); // Permite cualquier origen

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      return result instanceof Error ? reject(result) : resolve(result);
    });
  });
}

function initFirebase() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT no está definida');

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
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
    await runMiddleware(req, res, cors); // Usar solo esto para CORS
    initFirebase();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'Token requerido y debe ser una cadena válida' });
    }

    const messaging = getMessaging();
    await messaging.subscribeToTopic([token], 'admin');

    return res.status(200).json({ message: 'Suscrito al topic admin' });

  } catch (error) {
    console.error('Error al suscribirse al topic:', error);
    return res.status(500).json({
      error: 'Error al suscribirse al topic',
      detail: error.message || 'Error desconocido',
    });
  }
};
