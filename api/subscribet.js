// api/subscribet.js
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const Cors = require('micro-cors');

// CORS config
const cors = Cors({
  origin: '*',
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
});

// Firebase init
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

// Main handler
async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // Preflight CORS
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
    const response = await messaging.subscribeToTopic([token.trim()], 'admin');

    return res.status(200).json({
      message: 'Suscrito al topic admin exitosamente',
      response,
    });

  } catch (error) {
    console.error('❌ Error al suscribirse al topic:', error);
    return res.status(500).json({
      error: 'Error al suscribirse al topic',
      detail: error.message || 'Error desconocido',
    });
  }
}

// Export wrapped in CORS
module.exports = cors(handler);
