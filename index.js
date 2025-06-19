// Backend para notificaciones con Firebase Cloud Messaging (FCM)
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// Cargar tu clave de servicio (reemplaza con tu archivo correcto)
const serviceAccount = require('./api-rifa-c10aa-firebase-adminsdk-fbsvc-605adf8bed.json');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: '*',  // Aceptar todos los orígenes, para pruebas. En producción restringir a tu frontend real.
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Ruta para guardar un token (dummy)
app.post('/api/save-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  // Aquí podrías guardar el token en Firestore o base de datos real
  console.log('Token recibido:', token);

  return res.status(200).json({ message: 'Token guardado correctamente' });
});

// Ruta para suscribirse al topic "admin"
app.post('/subscribe', async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'Token requerido' });

  try {
    await admin.messaging().subscribeToTopic(token, 'admin');
    return res.status(200).json({ message: 'Suscrito al topic admin' });
  } catch (error) {
    console.error('Error al suscribirse al topic:', error);
    return res.status(500).json({ error: 'Error al suscribirse al topic' });
  }
});

// Ruta para enviar notificación al topic "admin"
app.post('/send-notification', async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Título y cuerpo requeridos' });
  }

  try {
    const message = {
      notification: { title, body },
      topic: 'admin'
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ message: 'Notificación enviada', response });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return res.status(500).json({ error: 'Error enviando notificación' });
  }
});

// Exportar la app para que Vercel la use como Serverless Function
module.exports = app;
