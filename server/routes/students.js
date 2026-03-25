const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');

// Verify class belongs to teacher
async function verifyClass(classId, teacherId) {
  const { rows } = await db.query('SELECT id FROM classes WHERE id=$1 AND teacher_id=$2', [classId, teacherId]);
  return rows.length > 0;
}

// GET students
router.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query('SELECT * FROM students WHERE class_id=$1 ORDER BY last, first', [req.params.classId]);
  res.json(rows);
});

// CREATE student
router.post('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { first, last, sid, dob, parent, contact } = req.body;
  const { rows } = await db.query(
    'INSERT INTO students (class_id, first, last, sid, dob, parent, contact) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.params.classId, first, last, sid, dob || null, parent, contact]
  );
  res.json(rows[0]);
});

// UPDATE student
router.put('/:id', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { first, last, sid, dob, parent, contact } = req.body;
  const { rows } = await db.query(
    'UPDATE students SET first=$1, last=$2, sid=$3, dob=$4, parent=$5, contact=$6 WHERE id=$7 AND class_id=$8 RETURNING *',
    [first, last, sid, dob || null, parent, contact, req.params.id, req.params.classId]
  );
  res.json(rows[0]);
});

// DELETE student
router.delete('/:id', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  await db.query('DELETE FROM students WHERE id=$1 AND class_id=$2', [req.params.id, req.params.classId]);
  res.json({ ok: true });
});

module.exports = router;
