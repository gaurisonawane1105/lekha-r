require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/test', async (req, res) => {
  try {
    const db = require('./config/db');
    const [rows] = await db.query('SELECT user_id, full_name, email, role_id FROM users');
    res.json({ success: true, message: 'DB connected!', users: rows });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

const routes = require('./routes');
app.use('/api', routes);

app.get('/', (req, res) => res.json({ message: 'Lekha API Running', version: '1.0.0' }));

app.use((err, req, res, next) => {
  console.error('=== ERROR ===', err.message);
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Lekha server running on http://localhost:${PORT}`);
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`JWT_SECRET set: ${!!process.env.JWT_SECRET}`);
});