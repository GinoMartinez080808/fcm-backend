const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const serviceAccount = require('./api-rifa-c10aa-firebase-adminsdk-fbsvc-605adf8bed.json'); // Aquí va tu JSON de cuenta de servicio

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).send('Missing token, title, or body');
  }

  const message = {
    notification: {
      title,
      body
    },
    token
  };

  try {
    const response = await admin.messaging().send(message);
    res.send({ success: true, response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
