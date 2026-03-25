const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');

async function verifyClass(classId, teacherId) {
  const { rows } = await db.query('SELECT id FROM classes WHERE id=$1 AND teacher_id=$2', [classId, teacherId]);
  return rows.length > 0;
}

router.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query('SELECT * FROM topics WHERE class_id=$1 ORDER BY date, created_at', [req.params.classId]);
  res.json(rows);
});

router.post('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { name, unit, date, graded, category, weight, description } = req.body;
  const { rows } = await db.query(
    'INSERT INTO topics (class_id, name, unit, date, graded, category, weight, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [req.params.classId, name, unit, date || null, graded !== false, category, weight || 1, description]
  );
  res.json(rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { name, unit, date, graded, category, weight, description } = req.body;
  const { rows } = await db.query(
    'UPDATE topics SET name=$1, unit=$2, date=$3, graded=$4, category=$5, weight=$6, description=$7 WHERE id=$8 AND class_id=$9 RETURNING *',
    [name, unit, date || null, graded !== false, category, weight || 1, description, req.params.id, req.params.classId]
  );
  res.json(rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  await db.query('DELETE FROM topics WHERE id=$1 AND class_id=$2', [req.params.id, req.params.classId]);
  res.json({ ok: true });
});

module.exports = router;
