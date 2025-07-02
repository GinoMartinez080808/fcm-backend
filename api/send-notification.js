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

    const tokens = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return typeof data.token === 'string' ? data.token.trim() : null;
      })
      .filter(token => !!token && token.length > 0);

    if (tokens.length === 0) {
      console.warn('No hay tokens válidos para enviar notificación.');
      return res.status(400).json({ error: 'No hay tokens válidos registrados' });
    }

    const message = {
      notification: { title, body },
      tokens,
    };

    let response;
    try {
      response = await admin.messaging().sendMulticast(message);
    } catch (sendError) {
      console.error('Fallo en sendMulticast:', sendError.message);
      return res.status(500).json({ error: 'Error al enviar notificación', detail: sendError.message });
    }

    console.log('Multicast response:', JSON.stringify(response, null, 2));

    const failed = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        failed.push({
          token: tokens[index],
          error: resp.error?.message || 'Desconocido',
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
