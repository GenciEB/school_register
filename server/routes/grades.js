const router = require('express').Router({ mergeParams: true });
const db = require('../db');
const auth = require('../middleware/auth');

async function verifyClass(classId, teacherId) {
  const { rows } = await db.query('SELECT id FROM classes WHERE id=$1 AND teacher_id=$2', [classId, teacherId]);
  return rows.length > 0;
}

// GET all grades for a class
router.get('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query(
    `SELECT g.* FROM grades g
     JOIN topics t ON g.topic_id = t.id
     WHERE t.class_id = $1`,
    [req.params.classId]
  );
  res.json(rows);
});

// GET grades for a specific topic
router.get('/topic/:topicId', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await db.query('SELECT * FROM grades WHERE topic_id=$1', [req.params.topicId]);
  res.json(rows);
});

// UPSERT grade for a student/topic
router.post('/', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { topic_id, student_id, score, grade, notes, max_score } = req.body;
  const { rows } = await db.query(
    `INSERT INTO grades (topic_id, student_id, score, grade, notes, max_score)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (topic_id, student_id)
     DO UPDATE SET score=$3, grade=$4, notes=$5, max_score=$6
     RETURNING *`,
    [topic_id, student_id, score, grade, notes, max_score || 100]
  );
  res.json(rows[0]);
});

// BULK upsert grades for a topic
router.post('/bulk', auth, async (req, res) => {
  if (!await verifyClass(req.params.classId, req.teacher.id)) return res.status(403).json({ error: 'Forbidden' });
  const { topic_id, max_score, grades } = req.body; // grades: [{student_id, score, grade, notes}]
  const results = [];
  for (const g of grades) {
    const { rows } = await db.query(
      `INSERT INTO grades (topic_id, student_id, score, grade, notes, max_score)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (topic_id, student_id)
       DO UPDATE SET score=$3, grade=$4, notes=$5, max_score=$6
       RETURNING *`,
      [topic_id, g.student_id, g.score, g.grade, g.notes, max_score || 100]
    );
    results.push(rows[0]);
  }
  res.json(results);
});

module.exports = router;
