const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Inicializar Firebase Admin SDK una sola vez
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = async (req, res) => {
  await cors(req, res);

  const { url = '', method } = req;

  // Asegúrate de que sea método POST
  if (method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Leer el cuerpo
  const body = req.body;

  // Ruta: /api/save-token
  if (url.endsWith('/save-token')) {
    const { token } = body;
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    console.log('Token recibido:', token);
    return res.status(200).json({ message: 'Token guardado correctamente' });
  }

  // Ruta: /api/subscribe
  if (url.endsWith('/subscribe')) {
    const { token } = body;
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
  }

  // Ruta: /api/send-notification
  if (url.endsWith('/send-notification')) {
    const { title, body: notificationBody } = body;
    if (!title || !notificationBody) {
      return res.status(400).json({ error: 'Título y cuerpo requeridos' });
    }

    try {
      const message = {
        notification: { title, body: notificationBody },
        topic: 'admin'
      };

      const response = await admin.messaging().send(message);
      return res.status(200).json({ message: 'Notificación enviada', response });
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return res.status(500).json({ error: 'Error enviando notificación' });
    }
  }

  // Ruta no encontrada
  return res.status(404).json({ error: 'Ruta no encontrada' });
};
