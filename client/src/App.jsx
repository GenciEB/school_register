import { useState, useEffect, useMemo } from "react";
import { api } from "./api";

// ─── CONSTANTS ────────────────────────────────────────────
const GRADE_COLORS = { A: "bg-emerald-100 text-emerald-800", B: "bg-sky-100 text-sky-800", C: "bg-amber-100 text-amber-800", D: "bg-orange-100 text-orange-700", F: "bg-red-100 text-red-700", "": "bg-gray-100 text-gray-400" };
const ATT_COLORS = { Present: "bg-emerald-100 text-emerald-800", Absent: "bg-red-100 text-red-700", Late: "bg-orange-100 text-orange-700", Excused: "bg-sky-100 text-sky-700" };
const NOTE_COLORS = { Behaviour: "bg-orange-100 text-orange-700", Achievement: "bg-emerald-100 text-emerald-700", Concern: "bg-red-100 text-red-700", "Parent Contact": "bg-violet-100 text-violet-700", General: "bg-gray-100 text-gray-600" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6", "Period 7", "Period 8"];
const GRADE_CATS = ["Exam", "Quiz", "Homework", "Classwork", "Project", "Participation"];
const ABSENCE_THRESHOLD = 3;
const CLASS_COLORS = ["bg-indigo-500","bg-rose-500","bg-emerald-500","bg-amber-500","bg-violet-500","bg-sky-500","bg-pink-500","bg-teal-500"];

function scoreToGrade(score, max) {
  const p = (score / max) * 100;
  if (p >= 90) return "A"; if (p >= 80) return "B"; if (p >= 70) return "C"; if (p >= 60) return "D"; return "F";
}
function initials(s) { return ((s.first || "")[0] || "") + ((s.last || "")[0] || ""); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

// ─── UI ATOMS ─────────────────────────────────────────────
function Badge({ label, colorClass = "bg-gray-100 text-gray-500" }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{label ?? "—"}</span>;
}
function Avatar({ s }) {
  return <span className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{initials(s)}</span>;
}
function Btn({ children, onClick, variant = "primary", size = "md", disabled, className = "" }) {
  const sz = { sm: "px-2.5 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  const v = { primary: "bg-indigo-700 hover:bg-indigo-800 text-white", danger: "bg-rose-600 hover:bg-rose-700 text-white", success: "bg-emerald-600 hover:bg-emerald-700 text-white", ghost: "border border-gray-300 hover:bg-gray-100 text-gray-700", warning: "bg-amber-500 hover:bg-amber-600 text-white", outline: "border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50" };
  return <button onClick={onClick} disabled={disabled} className={`rounded-lg font-semibold transition-all ${sz[size]} ${v[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}>{children}</button>;
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
      <div><div className="font-semibold text-gray-800 text-sm">{title}</div>{subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}</div>
      {action}
    </div>}
    <div className="p-5">{children}</div>
  </div>;
}
function THead({ cols }) {
  return <thead><tr className="bg-gray-50 border-b border-gray-200">{cols.map((c, i) => <th key={i} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{c}</th>)}</tr></thead>;
}
function Empty({ msg = "Nothing here yet." }) { return <div className="py-12 text-center text-gray-300 text-sm italic">{msg}</div>; }
function StatBox({ label, value, color = "text-indigo-700" }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1 min-w-28">
    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
    <div className={`text-3xl font-black leading-none ${color}`}>{value}</div>
  </div>;
}
function AlertBox({ children, variant = "warning" }) {
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
function Spinner() { return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>; }

// ─── AUTH PAGES ───────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const data = mode === "login"
        ? await api.auth.login({ email: form.email, password: form.password })
        : await api.auth.register({ name: form.name, email: form.email, password: form.password });
      onAuth(data.teacher);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-sm p-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">📒</div>
        <h1 className="text-2xl font-black text-gray-800">School Register</h1>
        <p className="text-gray-400 text-sm mt-1">{mode === "login" ? "Sign in to your account" : "Create your teacher account"}</p>
      </div>
      {error && <AlertBox variant="danger">{error}</AlertBox>}
      <div className="flex flex-col gap-3 mb-4">
        {mode === "register" && <Input label="Full Name" value={form.name} onChange={v => set("name", v)} placeholder="Your name" />}
        <Input label="Email" type="email" value={form.email} onChange={v => set("email", v)} placeholder="you@school.com" />
        <Input label="Password" type="password" value={form.password} onChange={v => set("password", v)} placeholder="••••••••" />
      </div>
      <Btn onClick={submit} disabled={loading} className="w-full justify-center">{loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}</Btn>
      <p className="text-center text-sm text-gray-400 mt-4">
        {mode === "login" ? "No account? " : "Already registered? "}
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-indigo-600 hover:underline font-semibold">
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  </div>;
}

// ─── HOOK: load class data ────────────────────────────────
function useClassData(classId) {
  const [students, setStudents] = useState([]);
  const [topics, setTopics] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notes, setNotes] = useState([]);
  const [commlog, setCommlog] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [s, t, g, a, n, c, tt] = await Promise.all([
        api.students.list(classId),
        api.topics.list(classId),
        api.grades.list(classId),
        api.attendance.list(classId),
        api.notes.list(classId),
        api.commlog.list(classId),
        api.timetable.list(classId),
      ]);
      setStudents(s); setTopics(t); setGrades(g); setAttendance(a);
      setNotes(n); setCommlog(c); setTimetable(tt);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { reload(); }, [classId]);

  return { students, setStudents, topics, setTopics, grades, setGrades, attendance, setAttendance, notes, setNotes, commlog, setCommlog, timetable, setTimetable, loading, reload };
}

// ─── DASHBOARD ────────────────────────────────────────────
function Dashboard({ cls, students, topics, grades, attendance, notes }) {
  const absenceAlerts = students.filter(s => {
    return attendance.filter(a => a.student_id === s.id && a.status === "Absent").length >= ABSENCE_THRESHOLD;
  });

  const todayAtt = attendance.filter(a => a.date?.slice(0, 10) === todayStr());
  const presentToday = todayAtt.filter(a => a.status === "Present").length;

  const gradedTopics = topics.filter(t => t.graded);
  let totalScore = 0, totalCount = 0;
  grades.forEach(g => {
    if (g.score !== null && g.score !== "") { totalScore += (parseFloat(g.score) / g.max_score) * 100; totalCount++; }
  });

  return <div>
    <div className="mb-6">
      <h2 className="text-2xl font-black text-gray-800">{cls.name}</h2>
      <p className="text-gray-400 text-sm">{cls.subject} · {cls.year}</p>
    </div>
    {absenceAlerts.length > 0 && <AlertBox variant="danger">⚠️ <strong>Absence Alerts:</strong> {absenceAlerts.map(s => `${s.first} ${s.last}`).join(", ")} — {ABSENCE_THRESHOLD}+ absences</AlertBox>}
    <div className="flex gap-3 flex-wrap mb-6">
      <StatBox label="Students" value={students.length} color="text-indigo-700" />
      <StatBox label="Topics" value={topics.length} color="text-gray-700" />
      <StatBox label="Today Present" value={todayAtt.length ? `${presentToday}/${students.length}` : "—"} color="text-emerald-600" />
      <StatBox label="Class Average" value={totalCount ? (totalScore / totalCount).toFixed(1) + "%" : "—"} color="text-rose-600" />
      <StatBox label="Notes" value={notes.length} color="text-violet-600" />
    </div>
    <Card title="Recent Grades">
      {grades.length === 0 ? <Empty msg="No grades yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Student", "Topic", "Grade", "Score"]} />
            <tbody>{grades.slice(-8).reverse().map((g, i) => {
              const s = students.find(st => st.id === g.student_id);
              const t = topics.find(tp => tp.id === g.topic_id);
              return <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5">{s ? <div className="flex items-center gap-2"><Avatar s={s} />{s.last}, {s.first}</div> : "—"}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{t?.name || "—"}</td>
                <td className="px-4 py-2.5"><Badge label={g.grade || "—"} colorClass={GRADE_COLORS[g.grade] || GRADE_COLORS[""]} /></td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{g.score !== null ? `${g.score}/${g.max_score}` : "—"}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ─── STUDENTS ─────────────────────────────────────────────
function Students({ classId, students, setStudents, attendance }) {
  const [form, setForm] = useState({ first: "", last: "", sid: "", dob: "", parent: "", contact: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const absCount = sid => attendance.filter(a => a.student_id === sid && a.status === "Absent").length;

  const add = async () => {
    if (!form.first && !form.last) return alert("Enter a name.");
    try {
      const s = await api.students.create(classId, form);
      setStudents(prev => [...prev, s]);
      setForm({ first: "", last: "", sid: "", dob: "", parent: "", contact: "" });
    } catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete student?")) return;
    await api.students.delete(classId, id);
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Students</h2>
    <p className="text-gray-400 text-sm mb-5">{students.length} students</p>
    <Card title="Add Student">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="First Name" value={form.first} onChange={v => set("first", v)} placeholder="First" />
        <Input label="Last Name" value={form.last} onChange={v => set("last", v)} placeholder="Last" />
        <Input label="Student ID" value={form.sid} onChange={v => set("sid", v)} placeholder="01" />
        <Input label="Date of Birth" type="date" value={form.dob} onChange={v => set("dob", v)} />
        <Input label="Parent / Guardian" value={form.parent} onChange={v => set("parent", v)} placeholder="Parent name" />
        <Input label="Contact" value={form.contact} onChange={v => set("contact", v)} placeholder="Phone or email" />
      </div>
      <Btn onClick={add}>➕ Add Student</Btn>
    </Card>
    <Card title={`Roster (${students.length})`}>
      {!students.length ? <Empty msg="No students yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["#", "Name", "ID", "DOB", "Parent", "Contact", "Absences", ""]} />
            <tbody>{students.map((s, i) => {
              const abs = absCount(s.id);
              return <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 ${abs >= ABSENCE_THRESHOLD ? "bg-red-50" : ""}`}>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s} /><span className="font-medium">{s.last}, {s.first}</span></div></td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{s.sid || "—"}</td>
                <td className="px-4 py-2.5 text-xs">{s.dob ? s.dob.slice(0,10) : "—"}</td>
                <td className="px-4 py-2.5 text-xs">{s.parent || "—"}</td>
                <td className="px-4 py-2.5 text-xs">{s.contact || "—"}</td>
                <td className="px-4 py-2.5"><Badge label={abs} colorClass={abs >= ABSENCE_THRESHOLD ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"} />{abs >= ABSENCE_THRESHOLD && " ⚠️"}</td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(s.id)}>🗑</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ─── TOPICS ───────────────────────────────────────────────
function Topics({ classId, topics, setTopics }) {
  const [form, setForm] = useState({ name: "", unit: "", date: todayStr(), graded: true, category: "Classwork", weight: "1", description: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.name) return alert("Enter a topic name.");
    try {
      const t = await api.topics.create(classId, form);
      setTopics(prev => [...prev, t]);
      setForm({ name: "", unit: "", date: todayStr(), graded: true, category: "Classwork", weight: "1", description: "" });
    } catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete topic?")) return;
    await api.topics.delete(classId, id);
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Topics</h2>
    <p className="text-gray-400 text-sm mb-5">Lesson topics and assessments</p>
    <Card title="Add Topic">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Topic Name" value={form.name} onChange={v => set("name", v)} placeholder="Present Simple…" className="col-span-2" />
        <Input label="Unit / Chapter" value={form.unit} onChange={v => set("unit", v)} placeholder="Unit 1" />
        <Input label="Date Taught" type="date" value={form.date} onChange={v => set("date", v)} />
        <Sel label="Graded?" value={form.graded ? "yes" : "no"} onChange={v => set("graded", v === "yes")} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        <Sel label="Category" value={form.category} onChange={v => set("category", v)} options={GRADE_CATS} />
        <Input label="Weight" type="number" value={form.weight} onChange={v => set("weight", v)} min="0.1" />
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Objectives…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-14" />
      </div>
      <Btn onClick={add}>➕ Add Topic</Btn>
    </Card>
    <Card title={`Topics (${topics.length})`}>
      {!topics.length ? <Empty msg="No topics yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["#", "Topic", "Unit", "Date", "Category", "Weight", "Graded", ""]} />
            <tbody>{topics.map((t, i) => <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2.5 font-medium">{t.name}</td>
              <td className="px-4 py-2.5 text-xs text-gray-500">{t.unit || "—"}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{t.date ? t.date.slice(0,10) : "—"}</td>
              <td className="px-4 py-2.5"><Badge label={t.category} colorClass="bg-indigo-50 text-indigo-600" /></td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-400">×{t.weight}</td>
              <td className="px-4 py-2.5"><Badge label={t.graded ? "Yes" : "No"} colorClass={t.graded ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"} /></td>
              <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(t.id)}>🗑</Btn></td>
            </tr>)}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ─── ATTENDANCE ───────────────────────────────────────────
function Attendance({ classId, students, topics, attendance, setAttendance }) {
  const [date, setDate] = useState(todayStr());
  const [topicId, setTopicId] = useState("");
  const [sheet, setSheet] = useState(null);

  const absMap = {};
  students.forEach(s => { absMap[s.id] = attendance.filter(a => a.student_id === s.id && a.status === "Absent").length; });

  const load = () => {
    if (!students.length) return alert("Add students first.");
    const existing = {};
    attendance.filter(a => a.date?.slice(0,10) === date).forEach(a => { existing[a.student_id] = { status: a.status, note: a.note || "" }; });
    const records = {};
    students.forEach(s => { records[s.id] = existing[s.id] || { status: "Present", note: "" }; });
    setSheet({ records });
  };

  const save = async () => {
    try {
      const records = students.map(s => ({ student_id: s.id, ...sheet.records[s.id] }));
      const saved = await api.attendance.bulk(classId, { date, topic_id: topicId || null, records });
      setAttendance(prev => {
        const filtered = prev.filter(a => a.date?.slice(0,10) !== date);
        return [...filtered, ...saved];
      });
      alert("Attendance saved!");
    } catch (e) { alert(e.message); }
  };

  const update = (sid, field, val) => setSheet(sh => ({ records: { ...sh.records, [sid]: { ...sh.records[sid], [field]: val } } }));
  const markAll = status => { const r = {}; students.forEach(s => { r[s.id] = { ...sheet?.records?.[s.id], status }; }); setSheet({ records: r }); };

  const history = [...new Set(attendance.map(a => a.date?.slice(0,10)))].sort((a,b) => b.localeCompare(a));

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Attendance</h2>
    <p className="text-gray-400 text-sm mb-5">Track daily presence</p>
    {students.filter(s => absMap[s.id] >= ABSENCE_THRESHOLD).length > 0 &&
      <AlertBox variant="danger">⚠️ {students.filter(s => absMap[s.id] >= ABSENCE_THRESHOLD).map(s => `${s.first} ${s.last} (${absMap[s.id]})`).join(", ")} — {ABSENCE_THRESHOLD}+ absences</AlertBox>}
    <Card title="Load Sheet">
      <div className="flex flex-wrap gap-3 items-end">
        <Input label="Date" type="date" value={date} onChange={setDate} />
        <Sel label="Linked Topic" value={topicId} onChange={setTopicId} options={[{ value: "", label: "— no topic —" }, ...topics.map(t => ({ value: t.id, label: t.name }))]} />
        <Btn onClick={load}>📋 Load</Btn>
        {sheet && <><Btn variant="success" onClick={() => markAll("Present")}>✅ All Present</Btn><Btn variant="danger" onClick={() => markAll("Absent")}>❌ All Absent</Btn></>}
      </div>
    </Card>
    {sheet && <Card title={`Sheet — ${date}`} action={<Btn onClick={save}>💾 Save</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <THead cols={["#", "Student", "Absences", "Status", "Note"]} />
          <tbody>{students.map((s, i) => {
            const r = sheet.records[s.id] || { status: "Present", note: "" };
            return <tr key={s.id} className={`border-b border-gray-50 ${r.status === "Absent" ? "bg-red-50" : "hover:bg-gray-50"}`}>
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i+1}</td>
              <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s}/>{s.last}, {s.first}</div></td>
              <td className="px-4 py-2.5"><Badge label={absMap[s.id]} colorClass={absMap[s.id] >= ABSENCE_THRESHOLD ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}/></td>
              <td className="px-4 py-2.5">
                <select value={r.status} onChange={e => update(s.id, "status", e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                  {["Present","Absent","Late","Excused"].map(v => <option key={v}>{v}</option>)}
                </select>
              </td>
              <td className="px-4 py-2.5"><input value={r.note} onChange={e => update(s.id, "note", e.target.value)} placeholder="note…" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-36"/></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>}
    <Card title="History">
      {!history.length ? <Empty msg="No records yet." /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Date", "Present", "Absent", "Late", "Excused"]} />
            <tbody>{history.map(d => {
              const recs = attendance.filter(a => a.date?.slice(0,10) === d);
              const cnt = st => recs.filter(r => r.status === st).length;
              return <tr key={d} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs">{d}</td>
                <td className="px-4 py-2.5"><Badge label={cnt("Present")} colorClass="bg-emerald-100 text-emerald-700"/></td>
                <td className="px-4 py-2.5"><Badge label={cnt("Absent")} colorClass="bg-red-100 text-red-700"/></td>
                <td className="px-4 py-2.5"><Badge label={cnt("Late")} colorClass="bg-orange-100 text-orange-700"/></td>
                <td className="px-4 py-2.5"><Badge label={cnt("Excused")} colorClass="bg-sky-100 text-sky-700"/></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ─── GRADES ───────────────────────────────────────────────
function Grades({ classId, students, topics, grades, setGrades }) {
  const [topicId, setTopicId] = useState("");
  const [max, setMax] = useState("100");
  const [entries, setEntries] = useState({});
  const gradedTopics = topics.filter(t => t.graded);

  const loadTopic = (tid) => {
    setTopicId(tid);
    if (!tid) return;
    const topicGrades = grades.filter(g => g.topic_id == tid);
    const e = {};
    students.forEach(s => {
      const g = topicGrades.find(g => g.student_id === s.id);
      e[s.id] = g ? { score: g.score ?? "", grade: g.grade || "", notes: g.notes || "" } : { score: "", grade: "", notes: "" };
    });
    const existing = grades.find(g => g.topic_id == tid);
    setMax(String(existing?.max_score || 100));
    setEntries(e);
  };

  const update = (sid, field, val) => {
    setEntries(e => {
      const updated = { ...e[sid], [field]: val };
      if (field === "score" && val !== "" && !isNaN(val)) updated.grade = scoreToGrade(parseFloat(val), parseFloat(max) || 100);
      return { ...e, [sid]: updated };
    });
  };

  const save = async () => {
    if (!topicId) return;
    try {
      const gradeList = students.map(s => ({ student_id: s.id, ...entries[s.id] }));
      const saved = await api.grades.bulk(classId, { topic_id: topicId, max_score: parseFloat(max) || 100, grades: gradeList });
      setGrades(prev => {
        const filtered = prev.filter(g => g.topic_id != topicId);
        return [...filtered, ...saved];
      });
      alert("Grades saved!");
    } catch (e) { alert(e.message); }
  };

  const topic = gradedTopics.find(t => t.id == topicId);

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Enter Grades</h2>
    <p className="text-gray-400 text-sm mb-5">Record grades by topic</p>
    <Card title="Select Topic">
      <div className="flex flex-wrap gap-3 items-end">
        <Sel label="Graded Topic" value={topicId} onChange={loadTopic} options={[{ value: "", label: "— select —" }, ...gradedTopics.map(t => ({ value: t.id, label: `${t.name} [${t.category}]` }))]} className="flex-1" />
        <Input label="Max Score" type="number" value={max} onChange={setMax} className="w-28" />
      </div>
    </Card>
    {topicId && students.length > 0 && <Card title={`${topic?.name} · max ${max}`} action={<Btn onClick={save}>💾 Save</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <THead cols={["#", "Student", `Score /${max}`, "Grade", "Notes"]} />
          <tbody>{students.map((s, i) => {
            const r = entries[s.id] || { score: "", grade: "", notes: "" };
            return <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i+1}</td>
              <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s}/>{s.last}, {s.first}</div></td>
              <td className="px-4 py-2.5"><input type="number" value={r.score} onChange={e => update(s.id, "score", e.target.value)} min="0" max={max} placeholder="—" className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-mono w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"/></td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <select value={r.grade} onChange={e => update(s.id, "grade", e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-16 focus:outline-none">
                    {["","A","B","C","D","F"].map(g => <option key={g} value={g}>{g||"—"}</option>)}
                  </select>
                  {r.grade && <Badge label={r.grade} colorClass={GRADE_COLORS[r.grade]}/>}
                </div>
              </td>
              <td className="px-4 py-2.5"><input value={r.notes} onChange={e => update(s.id, "notes", e.target.value)} placeholder="note…" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none"/></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>}
    {!topicId && <Empty msg="Select a graded topic above." />}
  </div>;
}

// ─── GRADEBOOK ────────────────────────────────────────────
function Gradebook({ students, topics, grades }) {
  const gradedTopics = topics.filter(t => t.graded);
  if (!students.length || !gradedTopics.length) return <div><h2 className="text-2xl font-black text-gray-800 mb-1">Gradebook</h2><Empty msg="Add students and graded topics first." /></div>;

  const weightedAvg = (sid) => {
    let tw = 0, totalW = 0;
    gradedTopics.forEach(t => {
      const g = grades.find(g => g.topic_id === t.id && g.student_id === sid);
      if (!g || g.score === null) return;
      const w = parseFloat(t.weight) || 1;
      tw += (parseFloat(g.score) / g.max_score) * 100 * w;
      totalW += w;
    });
    return totalW ? (tw / totalW).toFixed(1) : null;
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Gradebook</h2>
    <p className="text-gray-400 text-sm mb-5">Weighted averages</p>
    <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
      <table className="text-sm w-full">
        <thead><tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">#</th>
          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Student</th>
          {gradedTopics.map(t => <th key={t.id} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
            <div className="max-w-20 truncate" title={t.name}>{t.name.length > 10 ? t.name.slice(0,9)+"…" : t.name}</div>
            <div className="font-normal text-gray-300 normal-case">×{t.weight}</div>
          </th>)}
          <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-indigo-400">Avg</th>
        </tr></thead>
        <tbody>{students.map((s, i) => {
          const avg = weightedAvg(s.id);
          const avgGrade = avg ? scoreToGrade(parseFloat(avg), 100) : null;
          return <tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50/30">
            <td className="px-4 py-2.5 text-gray-400 text-xs">{i+1}</td>
            <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar s={s}/><span className="font-medium">{s.last}, {s.first}</span></div></td>
            {gradedTopics.map(t => {
              const g = grades.find(g => g.topic_id === t.id && g.student_id === s.id);
              if (!g || g.score === null) return <td key={t.id} className="px-3 py-2.5 text-center text-gray-200 text-xs">—</td>;
              return <td key={t.id} className="px-3 py-2.5 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  {g.grade && <Badge label={g.grade} colorClass={GRADE_COLORS[g.grade]}/>}
                  <span className="text-xs font-mono text-gray-400">{g.score}/{g.max_score}</span>
                </div>
              </td>;
            })}
            <td className="px-4 py-2.5 text-center">{avg ? <div className="flex flex-col items-center gap-0.5"><Badge label={avgGrade} colorClass={GRADE_COLORS[avgGrade]}/><span className="text-xs font-mono text-indigo-500 font-bold">{avg}%</span></div> : <span className="text-gray-300 text-xs">—</span>}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

// ─── TIMETABLE ────────────────────────────────────────────
function Timetable({ classId, cls, timetable, setTimetable }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ room: "", notes: "" });

  const getCell = (day, period) => timetable.find(t => t.day === day && t.period === period);

  const openEdit = (day, period) => {
    const cell = getCell(day, period);
    setForm({ room: cell?.room || "", notes: cell?.notes || "" });
    setEditing({ day, period });
  };

  const saveCell = async () => {
    const { day, period } = editing;
    try {
      const saved = await api.timetable.save(classId, { day, period, ...form });
      setTimetable(prev => { const f = prev.filter(t => !(t.day === day && t.period === period)); return [...f, saved]; });
      setEditing(null);
    } catch (e) { alert(e.message); }
  };

  const clearCell = async (day, period) => {
    await api.timetable.delete(classId, { day, period });
    setTimetable(prev => prev.filter(t => !(t.day === day && t.period === period)));
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Timetable</h2>
    <p className="text-gray-400 text-sm mb-5">Weekly schedule</p>
    {editing && <Modal title={`${editing.day} · ${editing.period}`} onClose={() => setEditing(null)}>
      <div className="flex flex-col gap-3">
        <Input label="Room" value={form.room} onChange={v => setForm(f => ({...f, room: v}))} placeholder="Room 101…" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Notes…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none h-20"/>
        </div>
        <div className="flex gap-2"><Btn onClick={saveCell}>💾 Save</Btn><Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn></div>
      </div>
    </Modal>}
    <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 w-24">Period</th>
          {DAYS.map(d => <th key={d} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400">{d}</th>)}
        </tr></thead>
        <tbody>{PERIODS.map(period => <tr key={period} className="border-b border-gray-50">
          <td className="px-4 py-3 text-xs font-bold text-gray-400 bg-gray-50">{period}</td>
          {DAYS.map(day => {
            const cell = getCell(day, period);
            return <td key={day} className="px-3 py-2 align-top">
              {cell ? <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 cursor-pointer hover:bg-indigo-100 transition" onClick={() => openEdit(day, period)}>
                <div className={`w-2 h-2 rounded-full mb-1 ${cls?.color || "bg-indigo-500"}`}/>
                {cell.room && <div className="text-xs font-semibold text-indigo-700">{cell.room}</div>}
                {cell.notes && <div className="text-xs text-gray-500 truncate">{cell.notes}</div>}
                <button className="text-xs text-rose-400 hover:text-rose-600 mt-1" onClick={e => { e.stopPropagation(); clearCell(day, period); }}>✕ clear</button>
              </div> :
                <button onClick={() => openEdit(day, period)} className="w-full h-12 rounded-lg border border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50 transition text-xs">+ add</button>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

// ─── COMM LOG ─────────────────────────────────────────────
function CommLog({ classId, students, commlog, setCommlog }) {
  const [form, setForm] = useState({ sid: "", date: todayStr(), method: "Phone Call", outcome: "Positive", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [filterSid, setFilterSid] = useState("");
  const METHODS = ["Phone Call","Email","In Person","SMS","Letter","Video Call"];
  const OUTCOMES = ["Positive","Neutral","Negative","No Response","Follow-up Needed"];
  const OUTCOME_COLORS = { Positive:"bg-emerald-100 text-emerald-700", Neutral:"bg-gray-100 text-gray-600", Negative:"bg-red-100 text-red-700", "No Response":"bg-amber-100 text-amber-700", "Follow-up Needed":"bg-violet-100 text-violet-700" };

  const add = async () => {
    if (!form.sid) return alert("Select a student.");
    if (!form.notes.trim()) return alert("Add notes.");
    try {
      const entry = await api.commlog.create(classId, { ...form, student_id: form.sid });
      setCommlog(prev => [...prev, entry]);
      setForm(f => ({ ...f, notes: "" }));
    } catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete entry?")) return;
    await api.commlog.delete(classId, id);
    setCommlog(prev => prev.filter(e => e.id !== id));
  };

  const filtered = commlog.filter(e => !filterSid || e.student_id == filterSid).slice().reverse();

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Parent Communication</h2>
    <p className="text-gray-400 text-sm mb-5">Log all contact with parents</p>
    <Card title="Log Contact">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Sel label="Student" value={form.sid} onChange={v => set("sid", v)} options={[{value:"",label:"— select —"},...students.map(s=>({value:s.id,label:`${s.last}, ${s.first}`}))]}/>
        <Input label="Date" type="date" value={form.date} onChange={v => set("date", v)}/>
        <Sel label="Method" value={form.method} onChange={v => set("method", v)} options={METHODS}/>
        <Sel label="Outcome" value={form.outcome} onChange={v => set("outcome", v)} options={OUTCOMES}/>
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="What was discussed…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none h-20"/>
      </div>
      <Btn onClick={add}>➕ Log Contact</Btn>
    </Card>
    <Card title={`Log (${filtered.length})`} action={<Sel value={filterSid} onChange={setFilterSid} options={[{value:"",label:"All students"},...students.map(s=>({value:s.id,label:`${s.last}, ${s.first}`}))]}/>}>
      {!filtered.length ? <Empty msg="No communication logged yet."/> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Date","Student","Method","Outcome","Notes",""]}/>
            <tbody>{filtered.map(e => {
              const s = students.find(st => st.id === e.student_id);
              return <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{e.date?.slice(0,10)}</td>
                <td className="px-4 py-2.5">{s ? `${s.last}, ${s.first}` : "—"}</td>
                <td className="px-4 py-2.5"><Badge label={e.method} colorClass="bg-indigo-50 text-indigo-600"/></td>
                <td className="px-4 py-2.5"><Badge label={e.outcome} colorClass={OUTCOME_COLORS[e.outcome]||"bg-gray-100 text-gray-500"}/></td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs">{e.notes}</td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(e.id)}>🗑</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ─── NOTES ────────────────────────────────────────────────
function Notes({ classId, students, notes, setNotes }) {
  const [form, setForm] = useState({ sid: "", date: todayStr(), cat: "General", text: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [filterSid, setFilterSid] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const CATS = ["General","Behaviour","Achievement","Concern","Parent Contact"];

  const add = async () => {
    if (!form.sid) return alert("Select a student.");
    if (!form.text.trim()) return alert("Write a note.");
    try {
      const n = await api.notes.create(classId, { student_id: form.sid, date: form.date, category: form.cat, text: form.text });
      setNotes(prev => [...prev, n]);
      setForm(f => ({ ...f, text: "" }));
    } catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    await api.notes.delete(classId, id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notes.filter(n => (!filterSid || n.student_id == filterSid) && (!filterCat || n.category === filterCat)).slice().reverse();

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Student Notes</h2>
    <p className="text-gray-400 text-sm mb-5">Behaviour, achievements, concerns</p>
    <Card title="Add Note">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Sel label="Student" value={form.sid} onChange={v => set("sid", v)} options={[{value:"",label:"— select —"},...students.map(s=>({value:s.id,label:`${s.last}, ${s.first}`}))]}/>
        <Input label="Date" type="date" value={form.date} onChange={v => set("date", v)}/>
        <Sel label="Category" value={form.cat} onChange={v => set("cat", v)} options={CATS} className="col-span-2"/>
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Note</label>
        <textarea value={form.text} onChange={e => set("text", e.target.value)} placeholder="Write your note…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none h-20"/>
      </div>
      <Btn onClick={add}>➕ Add Note</Btn>
    </Card>
    <Card title="Notes Log" action={
      <div className="flex gap-2">
        <Sel value={filterSid} onChange={setFilterSid} options={[{value:"",label:"All students"},...students.map(s=>({value:s.id,label:`${s.last}, ${s.first}`}))]}/>
        <Sel value={filterCat} onChange={setFilterCat} options={[{value:"",label:"All categories"},...CATS]}/>
      </div>}>
      {!filtered.length ? <Empty msg="No notes yet."/> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <THead cols={["Date","Student","Category","Note",""]}/>
            <tbody>{filtered.map(n => {
              const s = students.find(st => st.id === n.student_id);
              return <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{n.date?.slice(0,10)}</td>
                <td className="px-4 py-2.5 font-medium">{s ? `${s.last}, ${s.first}` : "—"}</td>
                <td className="px-4 py-2.5"><Badge label={n.category} colorClass={NOTE_COLORS[n.category]||"bg-gray-100 text-gray-500"}/></td>
                <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs">{n.text}</td>
                <td className="px-4 py-2.5"><Btn size="sm" variant="danger" onClick={() => del(n.id)}>🗑</Btn></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </Card>
  </div>;
}

// ─── CLASSES MANAGER ──────────────────────────────────────
function ClassesPage({ classes, setClasses, setClassId, setPage }) {
  const [form, setForm] = useState({ name: "", subject: "", year: new Date().getFullYear() + "–" + (new Date().getFullYear() + 1) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.name) return alert("Enter a class name.");
    try {
      const color = CLASS_COLORS[classes.length % CLASS_COLORS.length];
      const cls = await api.classes.create({ ...form, color });
      setClasses(prev => [...prev, cls]);
      setForm({ name: "", subject: "", year: form.year });
    } catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete this class and ALL its data?")) return;
    await api.classes.delete(id);
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  return <div>
    <h2 className="text-2xl font-black text-gray-800 mb-1">Classes</h2>
    <p className="text-gray-400 text-sm mb-5">Manage all your classes</p>
    <Card title="New Class">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Class Name" value={form.name} onChange={v => set("name", v)} placeholder="10A, Year 5…" />
        <Input label="Subject" value={form.subject} onChange={v => set("subject", v)} placeholder="English, Maths…" />
        <Input label="School Year" value={form.year} onChange={v => set("year", v)} placeholder="2025–2026" className="col-span-2" />
      </div>
      <Btn onClick={add}>➕ Create Class</Btn>
    </Card>
    <div className="flex flex-col gap-3">
      {!classes.length && <Empty msg="No classes yet." />}
      {classes.map(cls => <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <span className={`w-3 h-10 rounded-full ${cls.color || "bg-indigo-500"}`} />
        <div className="flex-1">
          <div className="font-bold text-gray-800">{cls.name}</div>
          <div className="text-xs text-gray-400">{cls.subject} · {cls.year}</div>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="outline" onClick={() => { setClassId(cls.id); setPage("dashboard"); }}>Open</Btn>
          <Btn size="sm" variant="danger" onClick={() => del(cls.id)}>🗑</Btn>
        </div>
      </div>)}
    </div>
  </div>;
}

// ─── ROOT APP ─────────────────────────────────────────────
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
];

export default function App() {
  const [teacher, setTeacher] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check session on mount
  useEffect(() => {
    api.auth.me().then(d => { setTeacher(d.teacher); }).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  // Load classes when logged in
  useEffect(() => {
    if (!teacher) return;
    api.classes.list().then(list => {
      setClasses(list);
      if (list.length > 0 && !classId) setClassId(list[0].id);
    });
  }, [teacher]);

  const { students, setStudents, topics, setTopics, grades, setGrades, attendance, setAttendance, notes, setNotes, commlog, setCommlog, timetable, setTimetable, loading } = useClassData(classId);

  const logout = async () => { await api.auth.logout(); setTeacher(null); setClasses([]); setClassId(null); };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!teacher) return <AuthPage onAuth={setTeacher} />;

  const cls = classes.find(c => c.id === classId);
  const alertCount = students.filter(s => attendance.filter(a => a.student_id === s.id && a.status === "Absent").length >= ABSENCE_THRESHOLD).length;

  const sharedProps = { classId, students, setStudents, topics, setTopics, grades, setGrades, attendance, setAttendance, notes, setNotes, commlog, setCommlog, timetable, setTimetable };

  const pageComponents = {
    dashboard: <Dashboard cls={cls || {}} students={students} topics={topics} grades={grades} attendance={attendance} notes={notes} />,
    students: <Students {...sharedProps} />,
    attendance: <Attendance {...sharedProps} />,
    topics: <Topics {...sharedProps} />,
    grades: <Grades {...sharedProps} />,
    gradebook: <Gradebook students={students} topics={topics} grades={grades} />,
    timetable: <Timetable classId={classId} cls={cls} timetable={timetable} setTimetable={setTimetable} />,
    commlog: <CommLog classId={classId} students={students} commlog={commlog} setCommlog={setCommlog} />,
    notes: <Notes classId={classId} students={students} notes={notes} setNotes={setNotes} />,
  };

  return <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
    {/* HEADER */}
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm z-20">
      <button onClick={() => setSidebarOpen(o => !o)} className="text-gray-400 hover:text-gray-700 p-1">☰</button>
      <span className="text-lg">📒</span>
      <span className="font-black text-gray-800">School Register</span>
      {cls && <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${cls.color || "bg-indigo-500"}`}>{cls.name}</span>}
      {alertCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">⚠️ {alertCount} alert{alertCount > 1 ? "s" : ""}</span>}
      <div className="flex-1" />
      <span className="text-xs text-gray-400 hidden sm:block">{teacher.name}</span>
      <Btn size="sm" variant="ghost" onClick={logout}>Sign out</Btn>
    </header>

    <div className="flex flex-1 overflow-hidden">
      {/* SIDEBAR */}
      {sidebarOpen && <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto z-10">
        <div className="px-3 pt-4 pb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Classes</div>
          {classes.map(c => <button key={c.id} onClick={() => { setClassId(c.id); setPage("dashboard"); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all ${classId === c.id && page !== "classes" ? "bg-indigo-700 text-white font-semibold" : "hover:bg-gray-100 text-gray-600"}`}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.color || "bg-indigo-500"}`} />
            <span className="truncate">{c.name}</span>
          </button>)}
          <button onClick={() => setPage("classes")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all mt-1 ${page === "classes" ? "bg-indigo-700 text-white font-semibold" : "hover:bg-gray-100 text-gray-500"}`}>
            <span>⚙️</span> Manage Classes
          </button>
        </div>
        {classId && <><div className="border-t border-gray-100 mx-3 my-2" />
          <div className="px-3 pb-3">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Register</div>
            {CLASS_PAGES.map(p => <button key={p.id} onClick={() => setPage(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all ${page === p.id ? "bg-indigo-700 text-white font-semibold" : "hover:bg-gray-100 text-gray-600"}`}>
              <span>{p.icon}</span>
              <span className="flex-1">{p.label}</span>
              {p.id === "attendance" && alertCount > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{alertCount}</span>}
            </button>)}
          </div>
        </>}
      </aside>}

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? <Spinner /> :
          page === "classes"
            ? <ClassesPage classes={classes} setClasses={setClasses} setClassId={setClassId} setPage={setPage} />
            : !classId ? <Empty msg="Create or select a class to get started." />
            : pageComponents[page] || <Empty msg="Page not found." />}
      </main>
    </div>
  </div>;
}
