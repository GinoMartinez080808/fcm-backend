const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

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
  // 👇 Esto se aplica a TODAS las solicitudes (incluso OPTIONS)
  res.setHeader('Access-Control-Allow-Origin', '*'); // o reemplaza con 'http://localhost:4200' si prefieres
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 👇 Responder a la preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    initFirebase();

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
