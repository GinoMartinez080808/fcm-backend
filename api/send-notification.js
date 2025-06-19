const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = async (req, res) => {
  await cors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Título y cuerpo requeridos' });
  }

  try {
    const message = {
      notification: { title, body },
      topic: 'admin',
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ message: 'Notificación enviada', response });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return res.status(500).json({ error: 'Error enviando notificación' });
  }
};
