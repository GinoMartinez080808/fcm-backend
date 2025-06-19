// Description: Backend for Firebase Cloud Messaging (FCM) to handle subscriptions and notifications
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

const serviceAccount = require('./api-rifa-c10aa-firebase-adminsdk-fbsvc-605adf8bed.json');

const app = express();
app.use(bodyParser.json());
app.use(cors());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ✅ Ruta para suscribir un token al topic "admin"
app.post('/subscribe', async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).send('Token requerido');

  try {
    await admin.messaging().subscribeToTopic(token, 'admin');
    res.status(200).send('Suscrito al topic admin');
  } catch (error) {
    console.error('Error al suscribirse:', error);
    res.status(500).send('Error al suscribirse');
  }
});

// ✅ Ruta para enviar notificación a topic "admin"
app.post('/send-notification', async (req, res) => {
  const { title, body } = req.body;

  try {
    const message = {
      notification: { title, body },
      topic: 'admin'
    };

    const response = await admin.messaging().send(message);
    res.status(200).send(`Notificación enviada: ${response}`);
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    res.status(500).send('Error enviando notificación');
  }
});

module.exports = app;
