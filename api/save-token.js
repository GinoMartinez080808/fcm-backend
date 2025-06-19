const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const serviceAccount = require('./api-rifa-c10aa-firebase-adminsdk-fbsvc-605adf8bed.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = async (req, res) => {
  await cors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  console.log('Token recibido:', token);

  return res.status(200).json({ message: 'Token guardado correctamente' });
};
