const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');

async function verifyClass(classId, teacherId) {
  const { rows } = await db.query('SELECT id FROM classes WHERE id=$1 AND teacher_id=$2', [classId, teacherId]);
  return rows.length > 0;
}

// ── NOTES ──────────────────────────────────────────────────

const notesRouter = require('express').Router({ mergeParams: true });

notesRouter.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query('SELECT * FROM student_notes WHERE class_id=$1 ORDER BY date DESC, created_at DESC', [req.params.classId]);
  res.json(rows);
});

notesRouter.post('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { student_id, date, category, text } = req.body;
  const { rows } = await db.query(
    'INSERT INTO student_notes (class_id, student_id, date, category, text) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.params.classId, student_id, date || null, category, text]
  );
  res.json(rows[0]);
});

notesRouter.delete('/:id', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  await db.query('DELETE FROM student_notes WHERE id=$1 AND class_id=$2', [req.params.id, req.params.classId]);
  res.json({ ok: true });
});

// ── COMM LOG ───────────────────────────────────────────────

const commRouter = require('express').Router({ mergeParams: true });

commRouter.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query('SELECT * FROM comm_log WHERE class_id=$1 ORDER BY date DESC, created_at DESC', [req.params.classId]);
  res.json(rows);
});

commRouter.post('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { student_id, date, method, outcome, notes } = req.body;
  const { rows } = await db.query(
    'INSERT INTO comm_log (class_id, student_id, date, method, outcome, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.params.classId, student_id, date || null, method, outcome, notes]
  );
  res.json(rows[0]);
});

commRouter.delete('/:id', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  await db.query('DELETE FROM comm_log WHERE id=$1 AND class_id=$2', [req.params.id, req.params.classId]);
  res.json({ ok: true });
});

// ── TIMETABLE ──────────────────────────────────────────────

const ttRouter = require('express').Router({ mergeParams: true });

ttRouter.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query('SELECT * FROM timetable WHERE class_id=$1', [req.params.classId]);
  res.json(rows);
});

ttRouter.post('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { day, period, room, notes } = req.body;
  const { rows } = await db.query(
    `INSERT INTO timetable (class_id, day, period, room, notes)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (class_id, day, period)
     DO UPDATE SET room=$4, notes=$5
     RETURNING *`,
    [req.params.classId, day, period, room, notes]
  );
  res.json(rows[0]);
});

ttRouter.delete('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { day, period } = req.body;
  await db.query('DELETE FROM timetable WHERE class_id=$1 AND day=$2 AND period=$3', [req.params.classId, day, period]);
  res.json({ ok: true });
});

module.exports = { notesRouter, commRouter, ttRouter };
