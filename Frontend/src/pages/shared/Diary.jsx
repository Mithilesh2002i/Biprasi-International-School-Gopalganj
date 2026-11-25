// Class diary: teacher har period ke baad subject, topic, exercise, photo aur har bachche ka status (done / partial / not done / absent) bharta hai.
// Parent ko ye data apne bachche ke "Daily report" aur "Subject-wise report" mein dikhta hai.
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { Badge, Empty, Field, PageHead } from '../../components/Common';
import { getDb, useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { diary as diaryApi } from '../../services/api';
import { CLASS_LIST } from '../../config';
import { compressImage } from '../../lib/images';
import { PERIOD_NUMBERS, STATUS, teacherName } from '../../lib/diary';
import { daysBack, fmtDate, monthsBack, today } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

const PICK = ['d', 'p', 'n', 'a'];

export default function DiaryManage() {
  const db = useDB(); const { user, role } = useAuth(); const { toast, confirm } = useUI(); usePageTitle('Class diary');
  const isAdmin = role === 'admin';
  const classes = isAdmin || !user.classes?.length ? CLASS_LIST : user.classes;
  const minDate = isAdmin ? monthsBack(6) : daysBack(30); // teacher pichhle 30 din tak ka record badal sakta hai

  const [date, setDate] = useState(today());
  const [classNo, setClassNo] = useState(classes[0]);
  const [period, setPeriod] = useState(1);
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [topic, setTopic] = useState('');
  const [exercise, setExercise] = useState('');
  const [photos, setPhotos] = useState([]);
  const [rows, setRows] = useState({}); // { studentId: { st, note } }
  const [busy, setBusy] = useState(false);

  const students = useMemo(() => db.students.filter((s) => s.classNo === classNo && s.status === 'active'), [db.students, classNo]);
  const subjects = useMemo(() => db.subjects.filter((s) => s.classNo === classNo).map((s) => s.name), [db.subjects, classNo]);
  const id = `${date}_${classNo}_${period}`;
  const existing = useMemo(() => db.diary.find((d) => d.id === id), [db.diary, id]);
  const dayList = useMemo(() => db.diary.filter((d) => d.date === date && d.classNo === classNo).sort((a, b) => a.period - b.period), [db.diary, date, classNo]);
  const canTouch = (rec) => isAdmin || rec.teacherId === user.id;
  const locked = !!existing && !canTouch(existing);
  const teacherFor = (subj) => db.teachers.find((t) => t.subject === subj && t.classes.includes(classNo))?.id || '';

  // Date / class / period badalte hi form mein us period ka purana record (ya khali form) aa jata hai
  useEffect(() => {
    const ex = getDb().diary.find((d) => d.id === id);
    const base = Object.fromEntries(students.map((s) => [s.id, { st: 'd', note: '' }]));
    if (ex) {
      students.forEach((s) => { const c = ex.entries?.[s.id]; base[s.id] = { st: !c || c === 'x' ? 'd' : c, note: ex.notes?.[s.id] || '' }; });
      setSubject(ex.subject); setTeacherId(ex.teacherId || ''); setTopic(ex.topic || ''); setExercise(ex.exercise || ''); setPhotos(ex.photos || []);
    } else {
      const mine = subjects.includes(user.subject) ? user.subject : subjects[0] || '';
      setSubject(mine); setTeacherId(isAdmin ? teacherFor(mine) : user.id); setTopic(''); setExercise(''); setPhotos([]);
    }
    setRows(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, students]);

  const setSt = (sid, st) => setRows((r) => ({ ...r, [sid]: { ...r[sid], st } }));
  const setNote = (sid, note) => setRows((r) => ({ ...r, [sid]: { ...r[sid], note } }));
  const markAll = (st) => setRows((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, st: v.st === 'a' && st !== 'a' ? 'a' : st }])));
  const count = (k) => students.filter((s) => rows[s.id]?.st === k).length;

  const addPhotos = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const room = 4 - photos.length;
    if (room <= 0) return toast('Ek period ke liye 4 photo tak', 'err');
    try { const out = await Promise.all(files.slice(0, room).map((f) => compressImage(f))); setPhotos((p) => [...p, ...out]); } catch (err) { toast(err.message, 'err'); }
  };

  const save = async () => {
    if (!subject) return toast('Subject chunein', 'err');
    if (!students.length) return toast('Is class mein koi active student nahi hai', 'err');
    if (isAdmin && !teacherId) return toast('Teacher chunein', 'err');
    const hasEx = exercise.trim() !== '';
    const entries = {}; const notes = {};
    students.forEach((s) => {
      const r = rows[s.id] || { st: 'd', note: '' };
      entries[s.id] = r.st === 'a' ? 'a' : hasEx ? r.st : 'x'; // exercise nahi diya to sirf present/absent
      if (r.note?.trim()) notes[s.id] = r.note.trim();
    });
    const rec = { date, classNo, period, subject, teacherId: teacherId || user.id, topic: topic.trim(), exercise: exercise.trim(), entries };
    if (Object.keys(notes).length) rec.notes = notes;
    if (photos.length) rec.photos = photos;
    setBusy(true); const r = await diaryApi.save(rec, { role, id: user.id }); setBusy(false);
    if (!r.ok) return toast(r.error, 'err');
    toast(existing ? 'Period record update ho gaya' : 'Period record save ho gaya');
    if (!existing) { const used = new Set([...dayList.map((d) => d.period), period]); const next = PERIOD_NUMBERS.find((p) => !used.has(p)); if (next) setPeriod(next); }
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Ye period record delete karein?', message: 'Parents ko ye period dikhna band ho jayega.', danger: true, confirmText: 'Delete' }))) return;
    await diaryApi.remove(id); toast('Deleted');
  };
  const sum = (rec) => { const v = Object.values(rec.entries || {}); const c = (k) => v.filter((x) => x === k).length; return `${c('d')} done · ${c('p')} partial · ${c('n')} not done · ${c('a')} absent`; };

  return (
    <>
      <PageHead title="Class diary" sub="Har period ke baad exercise aur bachchon ka status bharein. Parents ko ye roz dikhta hai." />
      <section className="card">
        <div className="diary-top">
          <Field label="Date"><input className="input" type="date" min={minDate} max={today()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
          <Field label="Class"><select className="input" value={classNo} onChange={(e) => setClassNo(Number(e.target.value))}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></Field>
          <Field label="Period"><select className="input" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>{PERIOD_NUMBERS.map((p) => <option key={p} value={p}>Period {p}{dayList.some((d) => d.period === p) ? ' ✓' : ''}</option>)}</select></Field>
          <Field label="Subject"><select className="input" value={subject} disabled={locked} onChange={(e) => { setSubject(e.target.value); if (isAdmin) setTeacherId(teacherFor(e.target.value)); }}>{subjects.map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
          {isAdmin && <Field label="Teacher"><select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}><option value="">Select…</option>{db.teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}</select></Field>}
        </div>
        {existing && <p className="diary-note"><Icon name="check" size={16} /> Is period ka record pehle se hai ({teacherName(db, existing)}). Badal kar dobara save kar sakte hain.</p>}
        {locked && <p className="alert">Ye record kisi aur teacher ka hai, aap ise badal nahi sakte.</p>}

        <div className="form-grid" style={{ marginTop: 14 }}>
          <Field label="Aaj kya padhaya (topic)" full><input className="input" disabled={locked} value={topic} placeholder="jaise: Addition & Subtraction" onChange={(e) => setTopic(e.target.value)} /></Field>
          <Field label="Exercise / classwork / homework" full hint="Khali chhodein to is period mein exercise nahi tha — sirf present/absent save hoga."><textarea className="input" rows={2} disabled={locked} value={exercise} placeholder="jaise: Page 24, Q1 se Q10 tak" onChange={(e) => setExercise(e.target.value)} /></Field>
        </div>

        <div className="field"><span className="field-label">Board / copy ki photo (4 tak)</span>
          <div className="photo-grid">
            {photos.map((src, i) => (
              <div key={i} className="photo-thumb"><img src={src} alt={`Photo ${i + 1}`} />{!locked && <button type="button" className="photo-x" onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))} aria-label="Remove photo"><Icon name="x" size={14} /></button>}</div>))}
            {!locked && photos.length < 4 && <label className="photo-add"><Icon name="plus" size={20} /><span>Photo jodein</span><input type="file" accept="image/*" multiple onChange={addPhotos} hidden /></label>}
          </div>
        </div>

        <div className="row-between" style={{ marginTop: 18 }}>
          <h2 className="h2" style={{ margin: 0 }}>Bachchon ka status <small className="muted">({students.length} students)</small></h2>
          {!locked && <div className="row-actions"><button type="button" className="btn btn-ghost btn-sm" onClick={() => markAll('d')}>Sab ne kiya</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => markAll('n')}>Kisi ne nahi kiya</button></div>}
        </div>
        <div className="chips" style={{ marginTop: 8 }}>{PICK.map((k) => <Badge key={k} tone={STATUS[k].tone}>{STATUS[k].short}: {count(k)}</Badge>)}</div>
        {students.length === 0 ? <Empty icon="users" title="Is class mein abhi koi active student nahi" /> : (
          <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>Status</th><th>Note (optional)</th></tr></thead>
            <tbody>{students.map((s) => (
              <tr key={s.id}><td data-label="Student"><strong>{s.name}</strong><div className="muted">{s.studentId}</div></td>
                <td data-label="Status"><div className="st-group">{PICK.map((k) => <button type="button" key={k} disabled={locked} className={`st-btn st-${STATUS[k].tone} ${rows[s.id]?.st === k ? 'on' : ''}`} onClick={() => setSt(s.id, k)} aria-pressed={rows[s.id]?.st === k}>{STATUS[k].short}</button>)}</div></td>
                <td data-label="Note"><input className="input" disabled={locked} value={rows[s.id]?.note || ''} placeholder="Parent ke liye chhota note" onChange={(e) => setNote(s.id, e.target.value)} /></td></tr>))}</tbody></table></div>)}

        <div className="row-between">
          <span className="muted">{fmtDate(date)} · Class {classNo} · Period {period}</span>
          <div className="row-actions">
            {existing && !locked && <button type="button" className="btn btn-ghost" onClick={remove}><Icon name="trash" size={17} /> Delete</button>}
            <button type="button" className="btn btn-primary btn-lg" disabled={busy || locked} onClick={save}><Icon name="check" size={18} /> {existing ? 'Update period' : 'Save period'}</button>
          </div>
        </div>
      </section>

      <h2 className="h2"><Icon name="calendar" size={19} /> {fmtDate(date)} · Class {classNo} ke period</h2>
      {dayList.length === 0 ? <Empty icon="book" title="Is din abhi koi period record nahi" text="Upar form bharkar pehla period save karein." /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Period</th><th>Subject</th><th>Teacher</th><th>Exercise</th><th>Status</th><th className="right">Open</th></tr></thead>
          <tbody>{dayList.map((d) => (
            <tr key={d.id}><td data-label="Period"><strong>P{d.period}</strong></td><td data-label="Subject">{d.subject}<div className="muted">{d.topic}</div></td><td data-label="Teacher">{teacherName(db, d)}</td>
              <td data-label="Exercise">{d.exercise || <span className="muted">—</span>}</td><td data-label="Status"><small>{sum(d)}</small></td>
              <td className="right"><button className="btn btn-ghost btn-sm" onClick={() => setPeriod(d.period)}><Icon name="edit" size={15} /> {canTouch(d) ? 'Edit' : 'View'}</button></td></tr>))}</tbody></table></div>)}
    </>
  );
}