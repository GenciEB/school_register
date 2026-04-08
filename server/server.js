require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── AUTO JWT SECRET ────────────────────────────────────────
// If JWT_SECRET isn't in .env, generate one and persist it so
// sessions survive server restarts without any manual setup.
if (!process.env.JWT_SECRET) {
  const secretFile = path.join(__dirname, '.jwt_secret');
  if (fs.existsSync(secretFile)) {
    process.env.JWT_SECRET = fs.readFileSync(secretFile, 'utf8').trim();
  } else {
    process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, process.env.JWT_SECRET);
    console.log('🔑 Generated JWT secret saved to .jwt_secret');
  }
}

const app = express();

// ── MIDDLEWARE ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ── DB INIT ────────────────────────────────────────────────
const db = require('./db');

async function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('✅ Database ready');
}

// ── ROUTES ─────────────────────────────────────────────────
const { notesRouter, commRouter, ttRouter } = require('./routes/extras');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/classes/:classId/students', require('./routes/students'));
app.use('/api/classes/:classId/topics', require('./routes/topics'));
app.use('/api/classes/:classId/grades', require('./routes/grades'));
app.use('/api/classes/:classId/attendance', require('./routes/attendance'));
app.use('/api/classes/:classId/notes', notesRouter);
app.use('/api/classes/:classId/commlog', commRouter);
app.use('/api/classes/:classId/timetable', ttRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ── START ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
