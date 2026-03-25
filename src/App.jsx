import { useState, useEffect, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────
const GRADE_COLORS = { A: "bg-emerald-100 text-emerald-800", B: "bg-sky-100 text-sky-800", C: "bg-amber-100 text-amber-800", D: "bg-orange-100 text-orange-700", F: "bg-red-100 text-red-700", "": "bg-gray-100 text-gray-400" };
const ATT_COLORS = { Present: "bg-emerald-100 text-emerald-800", Absent: "bg-red-100 text-red-700", Late: "bg-orange-100 text-orange-700", Excused: "bg-sky-100 text-sky-700", "": "bg-gray-100 text-gray-400" };
const NOTE_COLORS = { Behaviour: "bg-orange-100 text-orange-700", Achievement: "bg-emerald-100 text-emerald-700", Concern: "bg-red-100 text-red-700", "Parent Contact": "bg-violet-100 text-violet-700", General: "bg-gray-100 text-gray-600" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6", "Period 7", "Period 8"];
const GRADE_CATS = ["Exam", "Quiz", "Homework", "Classwork", "Project", "Participation"];
const ABSENCE_THRESHOLD = 3;

function scoreToGrade(score, max) {
  const p = (score / max) * 100;
  if (p >= 90) return "A"; if (p >= 80) return "B"; if (p >= 70) return "C"; if (p >= 60) return "D"; return "F";
}
function initials(s) { return ((s.first || "")[0] || "") + ((s.last || "")[0] || ""); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function uid() { return Date.now() + Math.random().toString(36).slice(2, 6); }
function pct(score, max) { return max ? Math.round((score / max) * 100) : 0; }

// ─── UI ATOMS ────────────────────────────────────────────
function Badge({ label, colorClass = "bg-gray-100 text-gray-500" }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{label ?? "—"}</span>;
}
function Avatar({ s, size = "sm" }) {
  const sz = size === "lg" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";
  return <span className={`${sz} rounded-full bg-slate-800 text-white font-bold flex items-center justify-center flex-shrink-0`}>{initials(s)}</span>;
}
function Btn({ children, onClick, variant = "primary", size = "md", disabled, className = "" }) {
  const sz = { sm: "px-2.5 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  const v = {
    primary: "bg-indigo-700 hover:bg-indigo-800 text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    ghost: "border border-gray-300 hover:bg-gray-100 text-gray-700",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    outline: "border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50",
  };
  return <button onClick={onClick} disabled={disabled}
    className={`rounded-lg font-semibold transition-all ${sz[size]} ${v[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
    {children}
  </button>;
}
function Input({ label, type = "text", value, onChange, placeholder, className = "", min, max }) {
  return <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} max={max}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
  </div>;
}
function Sel({ label, value, onChange, options, className = "" }) {
  return <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition">
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>;
}
function Card({ title, subtitle, children, action }) {
  return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
    {title && <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
      <div>
        <div className="font-semibold text-gray-800 text-sm">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>}
    <div className="p-5">{children}</div>
  </div>;
}
function THead({ cols }) {
  return <thead><tr className="bg-gray-50 border-b border-gray-200">
    {cols.map((c, i) => <th key={i} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{c}</th>)}
  </tr></thead>;
}
function Empty({ msg = "Nothing here yet." }) {
  return <div className="py-12 text-center text-gray-300 text-sm italic">{msg}</div>;
}
function StatBox({ label, value, color = "text-indigo-700", sub }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1 min-w-28">
    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
    <div className={`text-3xl font-black leading-none ${color}`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>;
}
function Alert({ children, variant = "warning" }) {
  const v = { warning: "bg-amber-50 border-amber-400 text-amber-800", danger: "bg-red-50 border-red-400 text-red-800", info: "bg-sky-50 border-sky-400 text-sky-800" };
  return <div className={`border-l-4 rounded-r-lg px-4 py-3 text-sm mb-4 ${v[variant]}`}>{children}</div>;
}
function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>;
}

// ─── DATA DEFAULTS ───────────────────────────────────────
const DEFAULT = {
  classes: [],       // [{id, name, subject, teacher, year, color}]
  students: {},      // {classId: [{id,first,last,sid,dob,parent,contact}]}
  topics: {},        // {classId: [{id,name,unit,date,graded,category,weight,desc}]}
  grades: {},        // {classId: {topicId: {max, records:{sid:{score,grade,notes}}}}}
  attendance: {},    // {classId: {'YYYY-MM-DD': {topicId, records:{sid:{status,note}}}}}
  notes: {},         // {classId: [{id,sid,date,cat,text}]}
  timetable: {},     // {classId: {day: {period: {room, notes}}}}
  commLog: {},       // {classId: [{id,sid,date,method,outcome,notes}]}
};

const CLASS_COLORS = ["bg-indigo-500","bg-rose-500","bg-emerald-500","bg-amber-500","bg-violet-500","bg-sky-500","bg-pink-500","bg-teal-500"];

// ─── LOAD / SAVE ─────────────────────────────────────────
function loadData() {
  try { const s = localStorage.getItem("srv2"); return s ? JSON.parse(s) : DEFAULT; } catch { return DEFAULT; }
}

// ─── CLASS SELECTOR SIDEBAR ──────────────────────────────
function ClassPill({ cls, active, onClick }) {
  return <button onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all ${active ? "bg-indigo-700 text-white font-semibold" : "hover:bg-gray-100 text-gray-600"}`}>
    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cls.color || "bg-indigo-500"}`} />
    <span className="truncate">{cls.name}</span>
  </button>;
}

// ════════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ════════════════════════════════════════════════════════════
function Dashboard({ data, setData, classId }) {
  const cls = data.classes.find(c => c.id === classId);
  const students = data.students[classId] || [];
  const topics = data.topics[classId] || [];
  const grades = data.grades[classId] || {};
  const attendance = data.attendance[classId] || {};
  const notes = data.notes[classId] || [];

  // Absence alerts
  const absenceAlerts = useMemo(() => {
    return students.filter(s => {
      const count = Object.values(attendance).filter(day =>
        day.records?.[s.id]?.status === "Absent"
      ).length;
      return count >= ABSENCE_THRESHOLD;
    }).map(s => ({
      student: s,
      count: Object.values(attendance).filter(d => d.records?.[s.id]?.status === "Absent").length
    }));
  }, [students, attendance]);

  // Class average
  let totalScore = 0, totalCount = 0;
  for (const tid in grades) {
    for (const sid in grades[tid].records || {}) {
      const r = grades[tid].records[sid];
      if (r.score !== "" && !isNaN(r.score)) {
        totalScore += (parseFloat(r.score) / grades[tid].max) * 100;
        totalCount++;
      }
    }
  }

  // Today attendance
  const todayAtt = attendance[todayStr()];
  const presentToday = todayAtt ? Object.values(todayAtt.records || {}).filter(r => r.status === "Present").length : null;

  // Recent grades
  const recentGrades = [];
  for (const tid in grades) {
    const topic = topics.find(t => t.id === tid);
    if (!topic) continue;
    for (const sid in grades[tid].records || {}) {
      const r = grades[tid].records[sid];
      const student = students.find(s => s.id === sid);
      if (!student || r.score === "") continue;
      recentGrades.push({ student, topic, ...r, max: grades[tid].max });
    }
  }

  if (!cls) return <Empty msg="Select or create a class." />;

  return <div>
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">{cls.name}</h2>
        <p className="text-gray-400 text-sm">{cls.subject} · {cls.teacher} · {cls.year}</p>
      </div>
    </div>

    {absenceAlerts.length > 0 && <Alert variant="danger">
      ⚠️ <strong>Absence Alerts:</strong> {absenceAlerts.map(a => `${a.student.first} ${a.student.last} (${a.count} absences)`).join(", ")} — exceeded {ABSENCE_THRESHOLD}-day threshold.
    </Alert>}

    <div className="flex gap-3 flex-wrap mb-6">
      <StatBox label="Students" value={students.length} color="text-indigo-700" />
      <StatBox label="Topics" value={topics.length} color="text-gray-700" />
      <StatBox label="Today Present" value={presentToday !== null ? `${presentToday}/${students.length}` : "—"} color="text-emerald-600" />
      <StatBox label="Class Average" value={totalCount ? (totalScore / totalCount).toFixed(1) + "%" : "—"} color="text-rose-600" />
      <StatBox label="Notes" value={notes.length} color="text-violet-600" />
    </div>

    <Card title="Recent Grades">
      {recentGrades.length === 0 ? <Empty msg="No grades yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Student", "Topic", "Category", "Grade", "Score"]} />
            <tbody>{recentGrades.slice(-8).reverse().map((r, i) =>
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={r.student} />{r.student.last}, {r.student.first}</div></td>
                <td className="px-4 py-2.5 text-gray-600">{r.topic.name}</td>
                <td className="px-4 py-2.5"><Badge label={r.topic.category} colorClass="bg-indigo-50 text-indigo-600" /></td>
                <td className="px-4 py-2.5"><Badge label={r.grade || "—"} colorClass={GRADE_COLORS[r.grade] || GRADE_COLORS[""]} /></td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.score}/{r.max}</td>
              </tr>)}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: CLASSES MANAGER
// ════════════════════════════════════════════════════════════
function ClassesPage({ data, setData, setClassId }) {
  const [form, setForm] = useState({ name: "", subject: "", teacher: "", year: new Date().getFullYear() + "–" + (new Date().getFullYear() + 1) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = () => {
    if (!form.name) return alert("Enter a class name.");
    const id = uid();
    const color = CLASS_COLORS[data.classes.length % CLASS_COLORS.length];
    setData(d => ({
      ...d,
      classes: [...d.classes, { ...form, id, color }],
      students: { ...d.students, [id]: [] },
      topics: { ...d.topics, [id]: [] },
      grades: { ...d.grades, [id]: {} },
      attendance: { ...d.attendance, [id]: {} },
      notes: { ...d.notes, [id]: [] },
      timetable: { ...d.timetable, [id]: {} },
      commLog: { ...d.commLog, [id]: [] },
    }));
    setForm({ name: "", subject: "", teacher: "", year: form.year });
  };

  const del = id => {
    if (!confirm("Delete this class and ALL its data?")) return;
    setData(d => {
      const next = { ...d, classes: d.classes.filter(c => c.id !== id) };
      ["students","topics","grades","attendance","notes","timetable","commLog"].forEach(k => { const obj = { ...next[k] }; delete obj[id]; next[k] = obj; });
      return next;
    });
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Classes</h2>
    <p className="text-gray-400 text-sm mb-5">Manage all your classes / groups</p>

    <Card title="New Class">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Class Name" value={form.name} onChange={v => set("name", v)} placeholder="10A, Year 5, Group B…" />
        <Input label="Subject" value={form.subject} onChange={v => set("subject", v)} placeholder="English, Maths…" />
        <Input label="Teacher" value={form.teacher} onChange={v => set("teacher", v)} placeholder="Your name" />
        <Input label="School Year" value={form.year} onChange={v => set("year", v)} placeholder="2025–2026" />
      </div>
      <Btn onClick={add}>➕ Create Class</Btn>
    </Card>

    <div className="grid grid-cols-1 gap-3">
      {data.classes.length === 0 && <Empty msg="No classes yet. Create one above." />}
      {data.classes.map(cls => {
        const studentCount = (data.students[cls.id] || []).length;
        const topicCount = (data.topics[cls.id] || []).length;
        return <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <span className={`w-3 h-10 rounded-full ${cls.color}`} />
          <div className="flex-1">
            <div className="font-bold text-gray-800">{cls.name}</div>
            <div className="text-xs text-gray-400">{cls.subject} · {cls.teacher} · {cls.year}</div>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-gray-400">👤 {studentCount} students</span>
              <span className="text-xs text-gray-400">📚 {topicCount} topics</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn size="sm" variant="outline" onClick={() => setClassId(cls.id)}>Open</Btn>
            <Btn size="sm" variant="danger" onClick={() => del(cls.id)}>🗑</Btn>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: STUDENTS
// ════════════════════════════════════════════════════════════
function Students({ data, setData, classId }) {
  const [form, setForm] = useState({ first: "", last: "", sid: "", dob: "", parent: "", contact: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const students = data.students[classId] || [];
  const attendance = data.attendance[classId] || {};

  const absenceCount = (sid) => Object.values(attendance).filter(d => d.records?.[sid]?.status === "Absent").length;

  const add = () => {
    if (!form.first && !form.last) return alert("Enter a name.");
    const s = { ...form, id: uid() };
    setData(d => ({ ...d, students: { ...d.students, [classId]: [...(d.students[classId] || []), s] } }));
    setForm({ first: "", last: "", sid: "", dob: "", parent: "", contact: "" });
  };
  const del = id => {
    if (!confirm("Delete student?")) return;
    setData(d => ({ ...d, students: { ...d.students, [classId]: (d.students[classId] || []).filter(s => s.id !== id) } }));
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Students</h2>
    <p className="text-gray-400 text-sm mb-5">Class roster · {students.length} students</p>

    <Card title="Add Student">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="First Name" value={form.first} onChange={v => set("first", v)} placeholder="First name" />
        <Input label="Last Name" value={form.last} onChange={v => set("last", v)} placeholder="Last name" />
        <Input label="Student ID" value={form.sid} onChange={v => set("sid", v)} placeholder="01" />
        <Input label="Date of Birth" type="date" value={form.dob} onChange={v => set("dob", v)} />
        <Input label="Parent / Guardian" value={form.parent} onChange={v => set("parent", v)} placeholder="Parent name" />
        <Input label="Contact" value={form.contact} onChange={v => set("contact", v)} placeholder="Phone or email" />
      </div>
      <Btn onClick={add}>➕ Add Student</Btn>
    </Card>

    <Card title={`Roster (${students.length})`}>
      {students.length === 0 ? <Empty msg="No students yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["#", "Name", "ID", "DOB", "Parent", "Contact", "Absences", ""]} />
            <tbody>{students.map((s, i) => {
              const abs = absenceCount(s.id);
              return <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 ${abs >= ABSENCE_THRESHOLD ? "bg-red-50" : ""}`}>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s} /><span className="font-medium">{s.last}, {s.first}</span></div></td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{s.sid || "—"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{s.dob || "—"}</td>
                <td className="px-4 py-2.5 text-xs">{s.parent || "—"}</td>
                <td className="px-4 py-2.5 text-xs">{s.contact || "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge label={abs} colorClass={abs >= ABSENCE_THRESHOLD ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"} />
                  {abs >= ABSENCE_THRESHOLD && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                </td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(s.id)}>🗑</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: TOPICS
// ════════════════════════════════════════════════════════════
function Topics({ data, setData, classId }) {
  const [form, setForm] = useState({ name: "", unit: "", date: todayStr(), graded: "yes", category: "Classwork", weight: "1", desc: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const topics = data.topics[classId] || [];

  const add = () => {
    if (!form.name) return alert("Enter a topic name.");
    setData(d => ({ ...d, topics: { ...d.topics, [classId]: [...(d.topics[classId] || []), { ...form, id: uid() }] } }));
    setForm({ name: "", unit: "", date: todayStr(), graded: "yes", category: "Classwork", weight: "1", desc: "" });
  };
  const del = id => {
    if (!confirm("Delete topic?")) return;
    setData(d => ({ ...d, topics: { ...d.topics, [classId]: (d.topics[classId] || []).filter(t => t.id !== id) } }));
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Topics</h2>
    <p className="text-gray-400 text-sm mb-5">Lesson topics, units, and assessments</p>

    <Card title="Add Topic">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Topic Name" value={form.name} onChange={v => set("name", v)} placeholder="Present Simple, Chapter 3…" className="col-span-2" />
        <Input label="Unit / Chapter" value={form.unit} onChange={v => set("unit", v)} placeholder="Unit 1" />
        <Input label="Date Taught" type="date" value={form.date} onChange={v => set("date", v)} />
        <Sel label="Graded?" value={form.graded} onChange={v => set("graded", v)} options={[{ value: "yes", label: "Yes — graded" }, { value: "no", label: "Not graded" }]} />
        <Sel label="Category" value={form.category} onChange={v => set("category", v)} options={GRADE_CATS} />
        <Input label="Weight (for avg)" type="number" value={form.weight} onChange={v => set("weight", v)} min="0.1" />
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
        <textarea value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Learning objectives…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-14" />
      </div>
      <Btn onClick={add}>➕ Add Topic</Btn>
    </Card>

    <Card title={`Topics (${topics.length})`}>
      {topics.length === 0 ? <Empty msg="No topics yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["#", "Topic", "Unit", "Date", "Category", "Weight", "Graded", ""]} />
            <tbody>{topics.map((t, i) => <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2.5 font-medium">{t.name}</td>
              <td className="px-4 py-2.5 text-xs text-gray-500">{t.unit || "—"}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{t.date || "—"}</td>
              <td className="px-4 py-2.5"><Badge label={t.category || "—"} colorClass="bg-indigo-50 text-indigo-600" /></td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-500">×{t.weight || 1}</td>
              <td className="px-4 py-2.5"><Badge label={t.graded === "yes" ? "Yes" : "No"} colorClass={t.graded === "yes" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"} /></td>
              <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(t.id)}>🗑</Btn></td>
            </tr>)}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: ATTENDANCE
// ════════════════════════════════════════════════════════════
function Attendance({ data, setData, classId }) {
  const [date, setDate] = useState(todayStr());
  const [topicId, setTopicId] = useState("");
  const [sheet, setSheet] = useState(null);

  const students = data.students[classId] || [];
  const topics = data.topics[classId] || [];
  const attendance = data.attendance[classId] || {};

  const load = () => {
    if (!students.length) return alert("Add students first.");
    const existing = attendance[date]?.records || {};
    const records = {};
    students.forEach(s => { records[s.id] = existing[s.id] || { status: "Present", note: "" }; });
    setSheet({ records });
  };

  const save = () => {
    setData(d => ({
      ...d, attendance: {
        ...d.attendance, [classId]: { ...(d.attendance[classId] || {}), [date]: { topicId, records: sheet.records } }
      }
    }));
    alert("Attendance saved!");
  };

  const update = (sid, field, val) => setSheet(sh => ({ records: { ...sh.records, [sid]: { ...sh.records[sid], [field]: val } } }));
  const markAll = status => { const r = {}; students.forEach(s => { r[s.id] = { ...sheet?.records?.[s.id], status }; }); setSheet({ records: r }); };

  const history = Object.entries(attendance).sort((a, b) => b[0].localeCompare(a[0]));

  // Absence summary per student
  const absMap = {};
  students.forEach(s => { absMap[s.id] = Object.values(attendance).filter(d => d.records?.[s.id]?.status === "Absent").length; });

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Attendance</h2>
    <p className="text-gray-400 text-sm mb-5">Track daily presence</p>

    {students.filter(s => absMap[s.id] >= ABSENCE_THRESHOLD).length > 0 &&
      <Alert variant="danger">⚠️ Students with {ABSENCE_THRESHOLD}+ absences: {students.filter(s => absMap[s.id] >= ABSENCE_THRESHOLD).map(s => `${s.first} ${s.last} (${absMap[s.id]})`).join(", ")}</Alert>}

    <Card title="Load Sheet">
      <div className="flex flex-wrap gap-3 items-end">
        <Input label="Date" type="date" value={date} onChange={setDate} />
        <Sel label="Linked Topic" value={topicId} onChange={setTopicId}
          options={[{ value: "", label: "— no topic —" }, ...topics.map(t => ({ value: t.id, label: t.name }))]} />
        <Btn onClick={load}>📋 Load</Btn>
        {sheet && <><Btn variant="success" onClick={() => markAll("Present")}>✅ All Present</Btn>
          <Btn variant="danger" onClick={() => markAll("Absent")}>❌ All Absent</Btn></>}
      </div>
    </Card>

    {sheet && <Card title={`Sheet — ${date}`} action={<Btn onClick={save}>💾 Save</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <THead cols={["#", "Student", "Absences", "Status", "Note"]} />
          <tbody>{students.map((s, i) => {
            const r = sheet.records[s.id] || { status: "Present", note: "" };
            return <tr key={s.id} className={`border-b border-gray-50 ${r.status === "Absent" ? "bg-red-50" : "hover:bg-gray-50"}`}>
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s} />{s.last}, {s.first}</div></td>
              <td className="px-4 py-2.5"><Badge label={absMap[s.id]} colorClass={absMap[s.id] >= ABSENCE_THRESHOLD ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"} /></td>
              <td className="px-4 py-2.5">
                <select value={r.status} onChange={e => update(s.id, "status", e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                  {["Present", "Absent", "Late", "Excused"].map(v => <option key={v}>{v}</option>)}
                </select>
              </td>
              <td className="px-4 py-2.5">
                <input value={r.note} onChange={e => update(s.id, "note", e.target.value)}
                  placeholder="note…" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-36" />
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>}

    <Card title="History">
      {history.length === 0 ? <Empty msg="No records yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Date", "Topic", "Present", "Absent", "Late", "Excused", ""]} />
            <tbody>{history.map(([d, rec]) => {
              const vals = Object.values(rec.records || {});
              const topic = topics.find(t => t.id === rec.topicId);
              const cnt = st => vals.filter(r => r.status === st).length;
              return <tr key={d} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs">{d}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{topic?.name || "—"}</td>
                <td className="px-4 py-2.5"><Badge label={cnt("Present")} colorClass="bg-emerald-100 text-emerald-700" /></td>
                <td className="px-4 py-2.5"><Badge label={cnt("Absent")} colorClass="bg-red-100 text-red-700" /></td>
                <td className="px-4 py-2.5"><Badge label={cnt("Late")} colorClass="bg-orange-100 text-orange-700" /></td>
                <td className="px-4 py-2.5"><Badge label={cnt("Excused")} colorClass="bg-sky-100 text-sky-700" /></td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="ghost" onClick={() => { setDate(d); load(); }}>View</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: GRADES
// ════════════════════════════════════════════════════════════
function Grades({ data, setData, classId }) {
  const [topicId, setTopicId] = useState("");
  const [max, setMax] = useState("100");
  const [entries, setEntries] = useState({});

  const students = data.students[classId] || [];
  const topics = (data.topics[classId] || []).filter(t => t.graded === "yes");

  const loadTopic = (tid) => {
    setTopicId(tid);
    if (!tid) return;
    const existing = data.grades[classId]?.[tid]?.records || {};
    const e = {};
    students.forEach(s => { e[s.id] = existing[s.id] || { score: "", grade: "", notes: "" }; });
    setMax(String(data.grades[classId]?.[tid]?.max || 100));
    setEntries(e);
  };

  const update = (sid, field, val) => {
    setEntries(e => {
      const updated = { ...e[sid], [field]: val };
      if (field === "score" && val !== "" && !isNaN(val)) updated.grade = scoreToGrade(parseFloat(val), parseFloat(max) || 100);
      return { ...e, [sid]: updated };
    });
  };

  const save = () => {
    if (!topicId) return;
    setData(d => ({
      ...d, grades: {
        ...d.grades, [classId]: {
          ...(d.grades[classId] || {}),
          [topicId]: { max: parseFloat(max) || 100, records: entries }
        }
      }
    }));
    alert("Grades saved!");
  };

  const topic = topics.find(t => t.id === topicId);

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Enter Grades</h2>
    <p className="text-gray-400 text-sm mb-5">Record grades by topic</p>

    <Card title="Select Topic">
      <div className="flex flex-wrap gap-3 items-end">
        <Sel label="Graded Topic" value={topicId} onChange={loadTopic}
          options={[{ value: "", label: "— select —" }, ...topics.map(t => ({ value: t.id, label: `${t.name} [${t.category}]` }))]} className="flex-1" />
        <Input label="Max Score" type="number" value={max} onChange={setMax} className="w-28" />
      </div>
    </Card>

    {topicId && students.length > 0 && <Card title={`${topic?.name || ""} · max ${max}`} action={<Btn onClick={save}>💾 Save Grades</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <THead cols={["#", "Student", `Score /${max}`, "Grade", "Notes"]} />
          <tbody>{students.map((s, i) => {
            const r = entries[s.id] || { score: "", grade: "", notes: "" };
            return <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s} />{s.last}, {s.first}</div></td>
              <td className="px-4 py-2.5">
                <input type="number" value={r.score} onChange={e => update(s.id, "score", e.target.value)}
                  min="0" max={max} placeholder="—"
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-mono w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <select value={r.grade} onChange={e => update(s.id, "grade", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-16 focus:outline-none">
                    {["", "A", "B", "C", "D", "F"].map(g => <option key={g} value={g}>{g || "—"}</option>)}
                  </select>
                  {r.grade && <Badge label={r.grade} colorClass={GRADE_COLORS[r.grade]} />}
                </div>
              </td>
              <td className="px-4 py-2.5">
                <input value={r.notes} onChange={e => update(s.id, "notes", e.target.value)}
                  placeholder="note…" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none" />
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>}
    {!topicId && <Empty msg="Select a graded topic above." />}
    {topicId && !students.length && <Empty msg="Add students first." />}
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: GRADEBOOK (weighted)
// ════════════════════════════════════════════════════════════
function Gradebook({ data, classId }) {
  const students = data.students[classId] || [];
  const topics = (data.topics[classId] || []).filter(t => t.graded === "yes");
  const grades = data.grades[classId] || {};

  const weightedAvg = (sid) => {
    let totalWeighted = 0, totalWeight = 0;
    topics.forEach(t => {
      const r = grades[t.id]?.records?.[sid];
      if (!r || r.score === "" || isNaN(r.score)) return;
      const w = parseFloat(t.weight) || 1;
      totalWeighted += (parseFloat(r.score) / grades[t.id].max) * 100 * w;
      totalWeight += w;
    });
    return totalWeight ? (totalWeighted / totalWeight).toFixed(1) : null;
  };

  if (!students.length || !topics.length) return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Gradebook</h2>
    <Empty msg="Add students and graded topics first." />
  </div>;

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Gradebook</h2>
    <p className="text-gray-400 text-sm mb-5">Weighted averages by category</p>
    <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
      <table className="text-sm w-full">
        <thead><tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400 sticky left-0 bg-gray-50">#</th>
          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Student</th>
          {topics.map(t => <th key={t.id} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
            <div title={t.name} className="max-w-20 truncate">{t.name.length > 10 ? t.name.slice(0, 9) + "…" : t.name}</div>
            <div className="font-normal text-gray-300 normal-case tracking-normal">×{t.weight || 1}</div>
          </th>)}
          <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-indigo-400">Weighted Avg</th>
        </tr></thead>
        <tbody>{students.map((s, i) => {
          const avg = weightedAvg(s.id);
          const avgGrade = avg ? scoreToGrade(parseFloat(avg), 100) : null;
          return <tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50/30">
            <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
            <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s} /><span className="font-medium">{s.last}, {s.first}</span></div></td>
            {topics.map(t => {
              const gr = grades[t.id]?.records?.[s.id];
              if (!gr || gr.score === "") return <td key={t.id} className="px-3 py-2.5 text-center text-gray-200 text-xs">—</td>;
              return <td key={t.id} className="px-3 py-2.5 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  {gr.grade && <Badge label={gr.grade} colorClass={GRADE_COLORS[gr.grade]} />}
                  <span className="text-xs font-mono text-gray-400">{gr.score}/{grades[t.id].max}</span>
                </div>
              </td>;
            })}
            <td className="px-4 py-2.5 text-center">
              {avg ? <div className="flex flex-col items-center gap-0.5">
                <Badge label={avgGrade} colorClass={GRADE_COLORS[avgGrade]} />
                <span className="text-xs font-mono text-indigo-500 font-bold">{avg}%</span>
              </div> : <span className="text-gray-300 text-xs">—</span>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: TIMETABLE
// ════════════════════════════════════════════════════════════
function Timetable({ data, setData, classId }) {
  const tt = data.timetable[classId] || {};
  const [editing, setEditing] = useState(null); // {day, period}
  const [form, setForm] = useState({ room: "", notes: "" });

  const getCell = (day, period) => tt[day]?.[period] || null;

  const openEdit = (day, period) => {
    const cell = getCell(day, period);
    setForm({ room: cell?.room || "", notes: cell?.notes || "" });
    setEditing({ day, period });
  };

  const saveCell = () => {
    const { day, period } = editing;
    setData(d => ({
      ...d, timetable: {
        ...d.timetable, [classId]: {
          ...(d.timetable[classId] || {}),
          [day]: { ...(d.timetable[classId]?.[day] || {}), [period]: form }
        }
      }
    }));
    setEditing(null);
  };

  const clearCell = (day, period) => {
    setData(d => {
      const dayObj = { ...(d.timetable[classId]?.[day] || {}) };
      delete dayObj[period];
      return { ...d, timetable: { ...d.timetable, [classId]: { ...(d.timetable[classId] || {}), [day]: dayObj } } };
    });
  };

  const cls = data.classes.find(c => c.id === classId);

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Timetable</h2>
    <p className="text-gray-400 text-sm mb-5">Weekly schedule for {cls?.name}</p>

    {editing && <Modal title={`${editing.day} · ${editing.period}`} onClose={() => setEditing(null)}>
      <div className="flex flex-col gap-3">
        <Input label="Room / Location" value={form.room} onChange={v => setForm(f => ({ ...f, room: v }))} placeholder="Room 101, Lab B…" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any notes for this session…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-20" />
        </div>
        <div className="flex gap-2">
          <Btn onClick={saveCell}>💾 Save</Btn>
          <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
        </div>
      </div>
    </Modal>}

    <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 w-28">Period</th>
          {DAYS.map(d => <th key={d} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400">{d}</th>)}
        </tr></thead>
        <tbody>{PERIODS.map(period => <tr key={period} className="border-b border-gray-50">
          <td className="px-4 py-3 text-xs font-bold text-gray-400 bg-gray-50">{period}</td>
          {DAYS.map(day => {
            const cell = getCell(day, period);
            return <td key={day} className="px-3 py-2 align-top">
              {cell ? <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 cursor-pointer hover:bg-indigo-100 transition" onClick={() => openEdit(day, period)}>
                <div className={`w-2 h-2 rounded-full mb-1 ${cls?.color || "bg-indigo-500"}`} />
                {cell.room && <div className="text-xs font-semibold text-indigo-700">{cell.room}</div>}
                {cell.notes && <div className="text-xs text-gray-500 truncate mt-0.5">{cell.notes}</div>}
                <button className="text-xs text-rose-400 hover:text-rose-600 mt-1" onClick={e => { e.stopPropagation(); clearCell(day, period); }}>✕ clear</button>
              </div> :
                <button onClick={() => openEdit(day, period)}
                  className="w-full h-12 rounded-lg border border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50 transition text-xs">
                  + add
                </button>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: PARENT COMMUNICATION LOG
// ════════════════════════════════════════════════════════════
function CommLog({ data, setData, classId }) {
  const students = data.students[classId] || [];
  const log = data.commLog[classId] || [];
  const [form, setForm] = useState({ sid: "", date: todayStr(), method: "Phone Call", outcome: "Positive", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [filterSid, setFilterSid] = useState("");

  const add = () => {
    if (!form.sid) return alert("Select a student.");
    if (!form.notes.trim()) return alert("Add notes.");
    setData(d => ({ ...d, commLog: { ...d.commLog, [classId]: [...(d.commLog[classId] || []), { ...form, id: uid() }] } }));
    setForm(f => ({ ...f, notes: "" }));
  };
  const del = id => { if (!confirm("Delete entry?")) return; setData(d => ({ ...d, commLog: { ...d.commLog, [classId]: (d.commLog[classId] || []).filter(e => e.id !== id) } })); };

  const filtered = log.filter(e => !filterSid || e.sid === filterSid).slice().reverse();
  const METHODS = ["Phone Call", "Email", "In Person", "SMS", "Letter", "Video Call"];
  const OUTCOMES = ["Positive", "Neutral", "Negative", "No Response", "Follow-up Needed"];
  const OUTCOME_COLORS = { Positive: "bg-emerald-100 text-emerald-700", Neutral: "bg-gray-100 text-gray-600", Negative: "bg-red-100 text-red-700", "No Response": "bg-amber-100 text-amber-700", "Follow-up Needed": "bg-violet-100 text-violet-700" };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Parent Communication</h2>
    <p className="text-gray-400 text-sm mb-5">Log all contact with parents and guardians</p>

    <Card title="Log Contact">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Sel label="Student" value={form.sid} onChange={v => set("sid", v)}
          options={[{ value: "", label: "— select student —" }, ...students.map(s => ({ value: s.id, label: `${s.last}, ${s.first}` }))]} />
        <Input label="Date" type="date" value={form.date} onChange={v => set("date", v)} />
        <Sel label="Method" value={form.method} onChange={v => set("method", v)} options={METHODS} />
        <Sel label="Outcome" value={form.outcome} onChange={v => set("outcome", v)} options={OUTCOMES} />
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="What was discussed…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-20" />
      </div>
      <Btn onClick={add}>➕ Log Contact</Btn>
    </Card>

    <Card title={`Log (${filtered.length})`} action={
      <Sel value={filterSid} onChange={setFilterSid}
        options={[{ value: "", label: "All students" }, ...students.map(s => ({ value: s.id, label: `${s.last}, ${s.first}` }))]} />
    }>
      {filtered.length === 0 ? <Empty msg="No communication logged yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Date", "Student", "Method", "Outcome", "Notes", ""]} />
            <tbody>{filtered.map(e => {
              const s = students.find(st => st.id === e.sid);
              return <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{e.date}</td>
                <td className="px-4 py-2.5">{s ? `${s.last}, ${s.first}` : "—"}</td>
                <td className="px-4 py-2.5"><Badge label={e.method} colorClass="bg-indigo-50 text-indigo-600" /></td>
                <td className="px-4 py-2.5"><Badge label={e.outcome} colorClass={OUTCOME_COLORS[e.outcome] || "bg-gray-100 text-gray-500"} /></td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs">{e.notes}</td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(e.id)}>🗑</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: NOTES
// ════════════════════════════════════════════════════════════
function Notes({ data, setData, classId }) {
  const students = data.students[classId] || [];
  const notes = data.notes[classId] || [];
  const [form, setForm] = useState({ sid: "", date: todayStr(), cat: "General", text: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [filterSid, setFilterSid] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const CATS = ["General", "Behaviour", "Achievement", "Concern", "Parent Contact"];

  const add = () => {
    if (!form.sid) return alert("Select a student.");
    if (!form.text.trim()) return alert("Write a note.");
    setData(d => ({ ...d, notes: { ...d.notes, [classId]: [...(d.notes[classId] || []), { ...form, id: uid() }] } }));
    setForm(f => ({ ...f, text: "" }));
  };
  const del = id => { if (!confirm("Delete?")) return; setData(d => ({ ...d, notes: { ...d.notes, [classId]: (d.notes[classId] || []).filter(n => n.id !== id) } })); };

  const filtered = notes.filter(n => (!filterSid || n.sid === filterSid) && (!filterCat || n.cat === filterCat)).slice().reverse();

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Student Notes</h2>
    <p className="text-gray-400 text-sm mb-5">Behaviour, achievements, concerns</p>

    <Card title="Add Note">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Sel label="Student" value={form.sid} onChange={v => set("sid", v)}
          options={[{ value: "", label: "— select —" }, ...students.map(s => ({ value: s.id, label: `${s.last}, ${s.first}` }))]} />
        <Input label="Date" type="date" value={form.date} onChange={v => set("date", v)} />
        <Sel label="Category" value={form.cat} onChange={v => set("cat", v)} options={CATS} className="col-span-2" />
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Note</label>
        <textarea value={form.text} onChange={e => set("text", e.target.value)} placeholder="Write your note…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-20" />
      </div>
      <Btn onClick={add}>➕ Add Note</Btn>
    </Card>

    <Card title="Notes Log" action={
      <div className="flex gap-2">
        <Sel value={filterSid} onChange={setFilterSid} options={[{ value: "", label: "All students" }, ...students.map(s => ({ value: s.id, label: `${s.last}, ${s.first}` }))]} />
        <Sel value={filterCat} onChange={setFilterCat} options={[{ value: "", label: "All categories" }, ...CATS]} />
      </div>
    }>
      {filtered.length === 0 ? <Empty msg="No notes yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Date", "Student", "Category", "Note", ""]} />
            <tbody>{filtered.map(n => {
              const s = students.find(st => st.id === n.sid);
              return <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{n.date}</td>
                <td className="px-4 py-2.5 font-medium">{s ? `${s.last}, ${s.first}` : "—"}</td>
                <td className="px-4 py-2.5"><Badge label={n.cat} colorClass={NOTE_COLORS[n.cat] || "bg-gray-100 text-gray-500"} /></td>
                <td className="px-4 py-2.5 text-gray-700 text-xs max-w-xs">{n.text}</td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(n.id)}>🗑</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════
// PAGE: REPORT CARD (printable)
// ════════════════════════════════════════════════════════════
function ReportCards({ data, classId }) {
  const cls = data.classes.find(c => c.id === classId);
  const students = data.students[classId] || [];
  const topics = (data.topics[classId] || []).filter(t => t.graded === "yes");
  const grades = data.grades[classId] || {};
  const attendance = data.attendance[classId] || {};
  const notes = data.notes[classId] || [];
  const [selectedSid, setSelectedSid] = useState("");
  const [comment, setComment] = useState("");

  const weightedAvg = (sid) => {
    let tw = 0, totalW = 0;
    topics.forEach(t => {
      const r = grades[t.id]?.records?.[sid];
      if (!r || r.score === "" || isNaN(r.score)) return;
      const w = parseFloat(t.weight) || 1;
      tw += (parseFloat(r.score) / grades[t.id].max) * 100 * w;
      totalW += w;
    });
    return totalW ? (tw / totalW).toFixed(1) : null;
  };

  const absCount = (sid) => Object.values(attendance).filter(d => d.records?.[sid]?.status === "Absent").length;
  const presentCount = (sid) => Object.values(attendance).filter(d => d.records?.[sid]?.status === "Present").length;
  const studentNotes = (sid) => notes.filter(n => n.sid === sid);

  const student = students.find(s => s.id === selectedSid);
  const avg = student ? weightedAvg(student.id) : null;
  const avgGrade = avg ? scoreToGrade(parseFloat(avg), 100) : null;

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Report Cards</h2>
    <p className="text-gray-400 text-sm mb-5">Generate printable student reports</p>

    <Card title="Select Student">
      <div className="flex flex-wrap gap-3 items-end mb-2">
        <Sel label="Student" value={selectedSid} onChange={setSelectedSid}
          options={[{ value: "", label: "— select student —" }, ...students.map(s => ({ value: s.id, label: `${s.last}, ${s.first}` }))]} className="flex-1" />
        {selectedSid && <Btn onClick={() => window.print()}>🖨 Print Report</Btn>}
      </div>
      {selectedSid && <div className="flex flex-col gap-1 mt-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Teacher Comment</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Overall performance comment for this student…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-20" />
      </div>}
    </Card>

    {student && <div id="report-card" className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{cls?.name} · {cls?.subject}</div>
            <h3 className="text-2xl font-black">{student.first} {student.last}</h3>
            <div className="text-gray-400 text-sm mt-0.5">Student ID: {student.sid || "—"} · {cls?.year}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Overall Grade</div>
            <div className={`text-4xl font-black ${avgGrade ? "text-white" : "text-gray-500"}`}>{avgGrade || "—"}</div>
            <div className="text-gray-400 text-sm">{avg ? avg + "%" : ""}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Attendance summary */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Attendance</h4>
          <div className="flex gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 flex-1 text-center">
              <div className="text-2xl font-black text-emerald-700">{presentCount(student.id)}</div>
              <div className="text-xs text-emerald-600">Present</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 flex-1 text-center">
              <div className="text-2xl font-black text-red-700">{absCount(student.id)}</div>
              <div className="text-xs text-red-600">Absent</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex-1 text-center">
              <div className="text-2xl font-black text-gray-700">{Object.keys(attendance).length}</div>
              <div className="text-xs text-gray-500">Total Sessions</div>
            </div>
          </div>
        </div>

        {/* Grades by topic */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Grades by Topic</h4>
          {topics.length === 0 ? <div className="text-gray-300 text-sm italic">No graded topics.</div> :
            <table className="w-full text-sm">
              <THead cols={["Topic", "Category", "Weight", "Score", "Grade"]} />
              <tbody>{topics.map(t => {
                const r = grades[t.id]?.records?.[student.id];
                return <tr key={t.id} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 font-medium">{t.name}</td>
                  <td className="px-4 py-2.5"><Badge label={t.category} colorClass="bg-indigo-50 text-indigo-600" /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">×{t.weight || 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r && r.score !== "" ? `${r.score}/${grades[t.id].max} (${pct(r.score, grades[t.id].max)}%)` : "—"}</td>
                  <td className="px-4 py-2.5">{r?.grade ? <Badge label={r.grade} colorClass={GRADE_COLORS[r.grade]} /> : <span className="text-gray-300 text-xs">—</span>}</td>
                </tr>;
              })}</tbody>
            </table>}
        </div>

        {/* Notes */}
        {studentNotes(student.id).length > 0 && <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Teacher Notes</h4>
          <div className="flex flex-col gap-2">
            {studentNotes(student.id).slice(-5).map(n => <div key={n.id} className="flex gap-3 text-sm">
              <span className="font-mono text-xs text-gray-400 flex-shrink-0 mt-0.5">{n.date}</span>
              <Badge label={n.cat} colorClass={NOTE_COLORS[n.cat]} />
              <span className="text-gray-700">{n.text}</span>
            </div>)}
          </div>
        </div>}

        {/* Teacher comment */}
        {comment && <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Teacher's Comment</h4>
          <p className="text-sm text-gray-700 italic">"{comment}"</p>
          <div className="mt-4 flex gap-8">
            <div><div className="text-xs text-gray-400 mb-1">Teacher</div><div className="border-b border-gray-300 w-40 pb-1 text-sm text-gray-600">{cls?.teacher}</div></div>
            <div><div className="text-xs text-gray-400 mb-1">Date</div><div className="border-b border-gray-300 w-32 pb-1 text-sm text-gray-600">{todayStr()}</div></div>
          </div>
        </div>}
      </div>
    </div>}

    {!selectedSid && students.length === 0 && <Empty msg="Add students first." />}
  </div>;
}

// ════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════
const CLASS_PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "students", label: "Students", icon: "👤" },
  { id: "attendance", label: "Attendance", icon: "📅" },
  { id: "topics", label: "Topics", icon: "📚" },
  { id: "grades", label: "Grades", icon: "✏️" },
  { id: "gradebook", label: "Gradebook", icon: "📋" },
  { id: "timetable", label: "Timetable", icon: "🗓" },
  { id: "commlog", label: "Parent Comms", icon: "📞" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "reports", label: "Report Cards", icon: "🎓" },
];

export default function App() {
  const [data, setDataRaw] = useState(loadData);
  const [classId, setClassId] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const setData = fn => setDataRaw(prev => {
    const next = typeof fn === "function" ? fn(prev) : fn;
    try { localStorage.setItem("srv2", JSON.stringify(next)); } catch {}
    return next;
  });

  // Auto-select first class
  useEffect(() => {
    if (!classId && data.classes.length > 0) setClassId(data.classes[0].id);
  }, [data.classes]);

  const cls = data.classes.find(c => c.id === classId);
  const props = { data, setData, classId };

  const pageComponents = {
    dashboard: <Dashboard {...props} />,
    students: <Students {...props} />,
    attendance: <Attendance {...props} />,
    topics: <Topics {...props} />,
    grades: <Grades {...props} />,
    gradebook: <Gradebook {...props} />,
    timetable: <Timetable {...props} />,
    commlog: <CommLog {...props} />,
    notes: <Notes {...props} />,
    reports: <ReportCards {...props} />,
  };

  // Absence alert count
  const alertCount = classId ? (data.students[classId] || []).filter(s => {
    const count = Object.values(data.attendance[classId] || {}).filter(d => d.records?.[s.id]?.status === "Absent").length;
    return count >= ABSENCE_THRESHOLD;
  }).length : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* TOP BAR */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm z-20">
        <button onClick={() => setSidebarOpen(o => !o)} className="text-gray-400 hover:text-gray-700 text-lg leading-none p-1">☰</button>
        <span className="text-lg">📒</span>
        <span className="font-black text-gray-800 text-base">School Register</span>
        {cls && <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${cls.color || "bg-indigo-500"}`}>{cls.name}</span>}
        {alertCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">⚠️ {alertCount} absence alert{alertCount > 1 ? "s" : ""}</span>}
        <div className="flex-1" />
        <span className="text-xs text-gray-400 hidden sm:block">{cls?.subject} · {cls?.year}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        {sidebarOpen && <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto z-10">
          {/* Classes */}
          <div className="px-3 pt-4 pb-2">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Classes</div>
            {data.classes.map(c => <ClassPill key={c.id} cls={c} active={classId === c.id} onClick={() => { setClassId(c.id); setPage("dashboard"); }} />)}
            <button onClick={() => { setClassId(null); setPage("classes"); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all mt-1 ${page === "classes" && !classId ? "bg-indigo-700 text-white font-semibold" : "hover:bg-gray-100 text-gray-500"}`}>
              <span>⚙️</span> Manage Classes
            </button>
          </div>

          {/* Class pages */}
          {classId && <>
            <div className="border-t border-gray-100 mx-3 my-2" />
            <div className="px-3 pb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Register</div>
              {CLASS_PAGES.map(p => {
                const isAlert = p.id === "attendance" && alertCount > 0;
                return <button key={p.id} onClick={() => setPage(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all ${page === p.id ? "bg-indigo-700 text-white font-semibold" : "hover:bg-gray-100 text-gray-600"}`}>
                  <span>{p.icon}</span>
                  <span className="flex-1">{p.label}</span>
                  {isAlert && <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{alertCount}</span>}
                </button>;
              })}
            </div>
          </>}
        </aside>}

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-6">
          {page === "classes" || !classId
            ? <ClassesPage data={data} setData={setData} setClassId={id => { setClassId(id); setPage("dashboard"); }} />
            : pageComponents[page] || <Empty msg="Page not found." />}
        </main>
      </div>
    </div>
  );
}
