const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET all classes for teacher
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM classes WHERE teacher_id = $1 ORDER BY created_at', [req.teacher.id]);
  res.json(rows);
});

// CREATE class
router.post('/', auth, async (req, res) => {
  const { name, subject, year, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await db.query(
    'INSERT INTO classes (teacher_id, name, subject, year, color) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.teacher.id, name, subject, year, color]
  );
  res.json(rows[0]);
});

// UPDATE class
router.put('/:id', auth, async (req, res) => {
  const { name, subject, year, color } = req.body;
  const { rows } = await db.query(
    'UPDATE classes SET name=$1, subject=$2, year=$3, color=$4 WHERE id=$5 AND teacher_id=$6 RETURNING *',
    [name, subject, year, color, req.params.id, req.teacher.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE class
router.delete('/:id', auth, async (req, res) => {
  await db.query('DELETE FROM classes WHERE id=$1 AND teacher_id=$2', [req.params.id, req.teacher.id]);
  res.json({ ok: true });
});

module.exports = router;
