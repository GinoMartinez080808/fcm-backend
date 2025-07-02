const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const Cors = require('cors');
const cors = Cors({ origin: true }); // Permitir cualquier origen (ajusta en producción si es necesario)

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
      console.error('FIREBASE_SERVICE_ACCOUNT inválida:', e.message);
      throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

module.exports = async (req, res) => {
  try {
    // Aplica CORS con middleware
    await runMiddleware(req, res, cors);

    // Maneja solicitud OPTIONS para CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    initFirebase();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'Token requerido y debe ser una cadena válida' });
    }

    const messaging = getMessaging();
    const response = await messaging.subscribeToTopic([token.trim()], 'admin');

    console.log('📩 Respuesta de suscripción:', response);

    return res.status(200).json({
      message: 'Suscrito al topic admin exitosamente',
      response,
    });

  } catch (error) {
    console.error('❌ Error al suscribirse al topic:', error.message, error.stack);
    return res.status(500).json({
      error: 'Error al suscribirse al topic',
      detail: error.message || 'Error desconocido',
    });
  }
};
