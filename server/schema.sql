-- TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  year TEXT,
  color TEXT DEFAULT 'bg-indigo-500',
  created_at TEXT DEFAULT (datetime('now'))
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  first TEXT NOT NULL,
  last TEXT NOT NULL,
  sid TEXT,
  dob TEXT,
  parent TEXT,
  contact TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- TOPICS
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  date TEXT,
  graded INTEGER DEFAULT 1,
  category TEXT DEFAULT 'Classwork',
  weight REAL DEFAULT 1,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- GRADES
CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  score REAL,
  grade TEXT,
  notes TEXT,
  max_score REAL DEFAULT 100,
  UNIQUE(topic_id, student_id)
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Present',
  note TEXT,
  UNIQUE(class_id, student_id, date)
);

-- NOTES
CREATE TABLE IF NOT EXISTS student_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  date TEXT,
  category TEXT DEFAULT 'General',
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- COMMUNICATION LOG
CREATE TABLE IF NOT EXISTS comm_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  date TEXT,
  method TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- TIMETABLE
CREATE TABLE IF NOT EXISTS timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  period TEXT NOT NULL,
  room TEXT,
  notes TEXT,
  UNIQUE(class_id, day, period)
);
