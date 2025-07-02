const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
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
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT no está definida');
    }

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
    await runMiddleware(req, res, cors);
    initFirebase();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Título y cuerpo requeridos' });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('tokens').get();

    const tokensSet = new Set();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.token && typeof data.token === 'string' && data.token.trim().length > 0) {
        tokensSet.add(data.token.trim());
      }
    });
    const tokens = Array.from(tokensSet);

    if (tokens.length === 0) {
      console.warn('No hay tokens válidos para enviar notificación.');
      return res.status(400).json({ error: 'No hay tokens válidos registrados' });
    }

    const messaging = getMessaging();

    const message = {
      tokens,
      notification: { title, body },
    };

    const response = await messaging.sendMulticast(message);

    const failed = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failed.push({
          token: tokens[idx],
          error: resp.error?.message || 'Error desconocido',
        });
      }
    });

    return res.status(200).json({
      message: 'Notificación enviada',
      successCount: response.successCount,
      failureCount: response.failureCount,
      failed,
    });

  } catch (error) {
    console.error('Error general al enviar notificación:', error.message, error.stack);
    return res.status(500).json({ error: 'Error enviando notificación', detail: error.message });
  }
};
