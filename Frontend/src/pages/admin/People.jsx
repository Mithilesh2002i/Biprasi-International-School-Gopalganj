import { useState } from 'react';
import { Badge, Empty, Field, PageHead, Tabs, Switch } from '../../components/Common';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import { useDB } from '../../services/db';
import { useUI } from '../../context/UIContext';
import { people } from '../../services/api';
import { DEMO_MODE, DEMO_OTP } from '../../config';
import { loggedInSet, lastSeen } from '../../lib/analytics';
import { fmtDate } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

const PERM_LABELS = { tests: 'Create & manage tests', results: 'Update results', notices: 'Post notices', exams: 'Exam details', marksheets: 'Upload marksheets', college: 'College courses', notes: 'Upload notes & PDFs', doubts: 'Answer doubts', diary: 'Class diary (period-wise exercise & photos)', ptm: 'PTM notifications' };

/* ---------- Verify dialog (mobile + email OTP -> unique ID) ---------- */
function VerifyModal({ person, kind, onClose }) {
  const { toast } = useUI(); const [m, setM] = useState(''); const [e, setE] = useState(''); const [err, setErr] = useState(''); const [done, setDone] = useState(null);
  const go = async () => {
    const r = kind === 'student' ? await people.verifyStudent(person.id, { mobileOtp: m, emailOtp: e }) : await people.verifyTeacher(person.id, { mobileOtp: m });
    if (!r.ok) return setErr(r.error); setDone(r); toast('Verified — ID ban gayi');
  };
  return (
    <Modal title={`Verify ${person.name}`} onClose={onClose} size="sm" footer={done ? <button className="btn btn-primary" onClick={onClose}>Done</button> : <><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={go}>Verify & generate ID</button></>}>
      {done ? (
        <div className="idcard"><Icon name="check" size={30} />
          {kind === 'student' ? <><p className="muted">Student ID</p><h2>{done.studentId}</h2></> : <><p className="muted">Registration number (login ke liye)</p><h2>{done.regNo}</h2><p className="muted">Teacher ID: {done.teacherId}</p></>}
          <p className="muted">Ye ID student/teacher ko dein. Student login = ID + mobile number. Parent login = ID + parent ka mobile + OTP.</p></div>
      ) : (<>
        <p className="muted">{kind === 'student' ? `OTP ${person.mobile} aur ${person.email} par bheje gaye.` : `OTP ${person.mobile} par bheja gaya.`}{DEMO_MODE && ` (Demo OTP: ${DEMO_OTP})`}</p>
        <div className="form-grid">
          <Field label="Mobile OTP"><input className="input otp" maxLength={6} value={m} onChange={(x) => setM(x.target.value)} /></Field>
          {kind === 'student' && <Field label="Email OTP"><input className="input otp" maxLength={6} value={e} onChange={(x) => setE(x.target.value)} /></Field>}
        </div>{err && <p className="form-err">{err}</p>}</>)}
    </Modal>);
}

/* ---------- Students ---------- */
export function StudentsAdmin() {
  const db = useDB(); const { toast, confirm } = useUI(); usePageTitle('Students');
  const [filter, setFilter] = useState('all'); const [q, setQ] = useState(''); const [cls, setCls] = useState('all');
  const [form, setForm] = useState(null); const [verify, setVerify] = useState(null);
  const joined = loggedInSet(db);
  const state = (s) => (s.status === 'pending' ? 'pending' : s.status === 'blocked' ? 'blocked' : joined.has(s.id) ? 'joined' : 'notjoined');
  const counts = { all: db.students.length, joined: 0, notjoined: 0, pending: 0, blocked: 0 };
  db.students.forEach((s) => { counts[state(s)] += 1; });
  const list = db.students.filter((s) => (filter === 'all' || state(s) === filter) && (cls === 'all' || s.classNo === Number(cls)) && (!q || `${s.name} ${s.studentId} ${s.mobile}`.toLowerCase().includes(q.toLowerCase())));

  const save = async () => {
    const need = ['name', 'classNo', 'mobile', 'email'].find((k) => !form[k]);
    if (need) return toast('Name, class, mobile aur email zaroori hain', 'err');
    if (!/^\d{10}$/.test(form.mobile)) return toast('Mobile number 10 digit ka hona chahiye', 'err');
    if (form.parentMobile && !/^\d{10}$/.test(form.parentMobile)) return toast('Parent ka mobile number 10 digit ka hona chahiye', 'err');
    if (form.id) await people.updateStudent(form.id, form); else { const r = await people.addStudent(form); setVerify(r); }
    toast(form.id ? 'Updated' : 'Student add hua — ab verify karein'); setForm(null);
  };
  const del = async (s) => { if (await confirm({ title: 'Delete student?', message: `${s.name} ka account hat jayega.`, danger: true, confirmText: 'Delete' })) { await people.removeStudent(s.id); toast('Deleted'); } };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <PageHead title="Students" sub="ID banane ke liye student add karein, phir mobile + email OTP se verify karein." actions={<button className="btn btn-primary" onClick={() => setForm({ classNo: 6 })}><Icon name="plus" size={18} /> Add student</button>} />
      <Tabs value={filter} onChange={setFilter} tabs={[{ value: 'all', label: 'All', count: counts.all }, { value: 'joined', label: 'Joined', count: counts.joined }, { value: 'notjoined', label: 'Not joined yet', count: counts.notjoined }, { value: 'pending', label: 'Pending verification', count: counts.pending }, { value: 'blocked', label: 'Blocked', count: counts.blocked }]} />
      <div className="toolbar"><div className="search"><Icon name="search" size={17} /><input placeholder="Name, ID or mobile" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <label className="inline-field">Class <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}><option value="all">All</option>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <option key={c} value={c}>Class {c}</option>)}</select></label></div>
      {list.length === 0 ? <Empty icon="users" title="Koi student nahi mila" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>ID</th><th>Class</th><th>Contact</th><th>Status</th><th>Last seen</th><th className="right">Actions</th></tr></thead>
          <tbody>{list.map((s) => { const st = state(s); return (
            <tr key={s.id}><td data-label="Student"><strong>{s.name}</strong><div className="muted">{s.fatherName}</div></td><td data-label="ID">{s.studentId || '—'}</td><td data-label="Class">{s.classNo}</td>
              <td data-label="Contact">{s.mobile}<div className="muted">Parent: {s.parentMobile || '—'}</div></td>
              <td data-label="Status"><Badge tone={{ joined: 'ok', notjoined: 'neutral', pending: 'warn', blocked: 'bad' }[st]}>{{ joined: 'Joined', notjoined: 'Not joined yet', pending: 'Verify pending', blocked: 'Blocked' }[st]}</Badge></td>
              <td data-label="Last seen">{lastSeen(db, s.id) ? fmtDate(lastSeen(db, s.id)) : 'Never'}</td>
              <td className="right"><div className="row-actions">
                {s.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => setVerify(s)}>Verify</button>}
                {s.status !== 'pending' && <button className="btn btn-ghost btn-sm" onClick={() => people.updateStudent(s.id, { status: s.status === 'blocked' ? 'active' : 'blocked' })}>{s.status === 'blocked' ? 'Unblock' : 'Block'}</button>}
                <button className="icon-btn" onClick={() => setForm({ ...s })} aria-label="Edit"><Icon name="edit" size={17} /></button>
                <button className="icon-btn danger" onClick={() => del(s)} aria-label="Delete"><Icon name="trash" size={17} /></button></div></td></tr>); })}</tbody></table></div>)}
      {form && <Modal title={form.id ? 'Edit student' : 'Add student'} onClose={() => setForm(null)} footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>{form.id ? 'Save' : 'Add & verify'}</button></>}>
        <div className="form-grid">
          <Field label="Student name *" full><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Class *"><select className="input" value={form.classNo} onChange={(e) => set('classNo', Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <option key={c} value={c}>Class {c}</option>)}</select></Field>
          <Field label="Father's name"><input className="input" value={form.fatherName || ''} onChange={(e) => set('fatherName', e.target.value)} /></Field>
          <Field label="Mobile number *"><input className="input" inputMode="numeric" maxLength={10} value={form.mobile || ''} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Parent ka mobile number" hint="Parent login isi number se hota hai"><input className="input" inputMode="numeric" maxLength={10} value={form.parentMobile || ''} onChange={(e) => set('parentMobile', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Email *"><input className="input" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        </div></Modal>}
      {verify && <VerifyModal person={verify} kind="student" onClose={() => setVerify(null)} />}
    </>
  );
}

/* ---------- Teachers ---------- */
export function TeachersAdmin() {
  const db = useDB(); const { toast, confirm } = useUI(); usePageTitle('Teachers');
  const [form, setForm] = useState(null); const [verify, setVerify] = useState(null);
  const joined = loggedInSet(db);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    if (!form.name || !form.mobile || !form.subject) return toast('Name, subject aur mobile zaroori hain', 'err');
    if (!/^\d{10}$/.test(form.mobile)) return toast('Mobile number 10 digit ka hona chahiye', 'err');
    if (form.id) await people.updateTeacher(form.id, form); else { const r = await people.addTeacher(form); setVerify(r); }
    toast(form.id ? 'Updated' : 'Teacher add hua — ab verify karein'); setForm(null);
  };
  const del = async (t) => { if (await confirm({ title: 'Delete teacher?', message: `${t.name} ka account hat jayega.`, danger: true, confirmText: 'Delete' })) { await people.removeTeacher(t.id); toast('Deleted'); } };
  const toggleClass = (c) => set('classes', form.classes.includes(c) ? form.classes.filter((x) => x !== c) : [...form.classes, c].sort((a, b) => a - b));
  return (
    <>
      <PageHead title="Teachers" sub="Teacher add karein, mobile OTP se verify karein — registration number apne aap ban jayega." actions={<button className="btn btn-primary" onClick={() => setForm({ classes: [], perms: { ...db.settings.defaultPerms } })}><Icon name="plus" size={18} /> Add teacher</button>} />
      {db.teachers.length === 0 ? <Empty icon="user" title="Abhi koi teacher nahi" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Teacher</th><th>Registration no.</th><th>Classes</th><th>Mobile</th><th>Status</th><th>Last seen</th><th className="right">Actions</th></tr></thead>
          <tbody>{db.teachers.map((t) => (
            <tr key={t.id}><td data-label="Teacher"><strong>{t.name}</strong><div className="muted">{t.subject}</div></td><td data-label="Reg no.">{t.regNo || '—'}<div className="muted">{t.teacherId}</div></td><td data-label="Classes">{t.classes?.length ? t.classes.join(', ') : 'All'}</td><td data-label="Mobile">{t.mobile}</td>
              <td data-label="Status">{t.status === 'pending' ? <Badge tone="warn">Verify pending</Badge> : t.status === 'blocked' ? <Badge tone="bad">Blocked</Badge> : joined.has(t.id) ? <Badge tone="ok">Joined</Badge> : <Badge>Not joined yet</Badge>}</td>
              <td data-label="Last seen">{lastSeen(db, t.id) ? fmtDate(lastSeen(db, t.id)) : 'Never'}</td>
              <td className="right"><div className="row-actions">
                {t.status === 'pending' ? <button className="btn btn-primary btn-sm" onClick={() => setVerify(t)}>Verify</button> : <button className="btn btn-ghost btn-sm" onClick={() => people.updateTeacher(t.id, { status: t.status === 'blocked' ? 'active' : 'blocked' })}>{t.status === 'blocked' ? 'Unblock' : 'Block'}</button>}
                <button className="icon-btn" onClick={() => setForm({ ...t, perms: { ...t.perms } })} aria-label="Edit"><Icon name="edit" size={17} /></button>
                <button className="icon-btn danger" onClick={() => del(t)} aria-label="Delete"><Icon name="trash" size={17} /></button></div></td></tr>))}</tbody></table></div>)}
      {form && <Modal title={form.id ? 'Edit teacher' : 'Add teacher'} size="lg" onClose={() => setForm(null)} footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>{form.id ? 'Save' : 'Add & verify'}</button></>}>
        <div className="form-grid">
          <Field label="Teacher name *"><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Subject *"><input className="input" value={form.subject || ''} onChange={(e) => set('subject', e.target.value)} /></Field>
          <Field label="Mobile number *"><input className="input" inputMode="numeric" maxLength={10} value={form.mobile || ''} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Email"><input className="input" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        </div>
        <h4 className="h2">Classes he/she teaches</h4><div className="chips">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <button type="button" key={c} className={`chip btn-chip ${form.classes.includes(c) ? 'on' : ''}`} onClick={() => toggleClass(c)}>{c}</button>)}</div><small className="muted">Kuch na chunein to saari classes.</small>
        <h4 className="h2">Teacher kya kar sakta hai (permissions)</h4>
        <div className="perm-grid">{Object.entries(PERM_LABELS).map(([k, label]) => <div key={k} className="toggle-row"><span>{label}</span><Switch checked={!!form.perms[k]} label={label} onChange={(v) => set('perms', { ...form.perms, [k]: v })} /></div>)}</div>
      </Modal>}
      {verify && <VerifyModal person={verify} kind="teacher" onClose={() => setVerify(null)} />}
    </>
  );
}