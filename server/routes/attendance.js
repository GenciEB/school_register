const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');

async function verifyClass(classId, teacherId) {
  const { rows } = await db.query('SELECT id FROM classes WHERE id=$1 AND teacher_id=$2', [classId, teacherId]);
  return rows.length > 0;
}

// GET all attendance for a class
router.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query(
    'SELECT * FROM attendance WHERE class_id=$1 ORDER BY date DESC',
    [req.params.classId]
  );
  res.json(rows);
});

// GET attendance for a specific date
router.get('/:date', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query(
    'SELECT * FROM attendance WHERE class_id=$1 AND date=$2',
    [req.params.classId, req.params.date]
  );
  res.json(rows);
});

// BULK upsert attendance for a date
router.post('/bulk', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { date, topic_id, records } = req.body; // records: [{student_id, status, note}]
  const results = [];
  for (const r of records) {
    const { rows } = await db.query(
      `INSERT INTO attendance (class_id, student_id, topic_id, date, status, note)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (class_id, student_id, date)
       DO UPDATE SET status=$5, note=$6, topic_id=$3
       RETURNING *`,
      [req.params.classId, r.student_id, topic_id || null, date, r.status, r.note]
    );
    results.push(rows[0]);
  }
  res.json(results);
});

module.exports = router;
