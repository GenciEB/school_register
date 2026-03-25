-- TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  year TEXT,
  color TEXT DEFAULT 'bg-indigo-500',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  first TEXT NOT NULL,
  last TEXT NOT NULL,
  sid TEXT,
  dob DATE,
  parent TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOPICS
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  date DATE,
  graded BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'Classwork',
  weight NUMERIC DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GRADES
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  score NUMERIC,
  grade TEXT,
  notes TEXT,
  max_score NUMERIC DEFAULT 100,
  UNIQUE(topic_id, student_id)
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Present',
  note TEXT,
  UNIQUE(class_id, student_id, date)
);

-- NOTES
CREATE TABLE IF NOT EXISTS student_notes (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  date DATE,
  category TEXT DEFAULT 'General',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMUNICATION LOG
CREATE TABLE IF NOT EXISTS comm_log (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  date DATE,
  method TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TIMETABLE
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  period TEXT NOT NULL,
  room TEXT,
  notes TEXT,
  UNIQUE(class_id, day, period)
);
