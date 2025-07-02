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

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Título y cuerpo requeridos' });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('tokens').get();

    const tokens = snapshot.docs
      .map(doc => doc.data().token)
      .filter(token => typeof token === 'string' && token.length > 0);

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No hay tokens válidos registrados' });
    }

    const message = {
      notification: { title, body },
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Multicast response:', JSON.stringify(response, null, 2));

    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({ token: tokens[idx], error: resp.error });
        }
      });
      console.error('Errores al enviar a algunos tokens:', failedTokens);
    }

    return res.status(200).json({ message: 'Notificación enviada', response });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return res.status(500).json({ error: 'Error enviando notificación' });
  }
};
