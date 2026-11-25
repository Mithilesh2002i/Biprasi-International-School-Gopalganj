import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Empty, PageHead, Field, Switch } from '../../components/Common';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import QuestionEditor from '../../components/QuestionEditor';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { crud, tests as testApi } from '../../services/api';
import { useActivityTracker, usePageTitle } from '../../lib/hooks';
import { fmtDate } from '../../lib/utils';

/* ================= STUDENT: test list ================= */
export function StudentTests() {
  const db = useDB(); const { user } = useAuth(); usePageTitle('Tests');
  const list = db.tests.filter((t) => t.published && t.classNo === user.classNo);
  return (<><PageHead title="Tests" sub="Teachers ke banaye hue online tests." />
    {list.length === 0 ? <Empty icon="test" title="Abhi koi test available nahi" text="Naya test aate hi yahan dikhega." /> : (
      <div className="grid grid-2">{list.map((t) => {
        const at = db.attempts.find((a) => a.testId === t.id && a.studentId === user.id);
        return (<article key={t.id} className="card"><div className="row-between"><Badge tone="info">{t.subject}</Badge>{at ? <Badge tone="ok">Done</Badge> : <Badge tone="warn">Pending</Badge>}</div>
          <h3>{t.title}</h3><p className="muted"><Icon name="clock" size={15} /> {t.duration} min · {t.questions.length} questions</p>
          {at ? <p><strong>Score: {at.score} / {at.total}</strong> <Link className="btn btn-ghost btn-sm" to={t.id}>View result</Link></p> : <Link className="btn btn-primary" to={t.id}>Start test</Link>}
        </article>);
      })}</div>)}</>);
}

/* ================= STUDENT: take a test ================= */
export function TestRunner() {
  const { testId } = useParams(); const nav = useNavigate();
  const db = useDB(); const { user } = useAuth(); const { toast } = useUI();
  const test = db.tests.find((t) => t.id === testId);
  const done = db.attempts.find((a) => a.testId === testId && a.studentId === user.id);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(0);
  const sent = useRef(false);
  const { markOpen } = useActivityTracker({ kind: 'test', itemId: testId, cls: test?.classNo }, started && !done);
  usePageTitle(test?.title);

  const submit = async (auto = false) => {
    if (sent.current) return; sent.current = true;
    await testApi.submit(testId, user.id, answers);
    toast(auto ? 'Time khatam — test submit ho gaya' : 'Test submit ho gaya');
  };
  useEffect(() => {
    if (!started || done) return undefined;
    const end = Date.now() + test.duration * 60000;
    const t = setInterval(() => { const l = Math.max(0, Math.round((end - Date.now()) / 1000)); setLeft(l); if (l === 0) { clearInterval(t); submit(true); } }, 500);
    return () => clearInterval(t);
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!test || !test.published || test.classNo !== user.classNo) return <Empty icon="lock" title="Ye test available nahi hai" action={<Link className="btn btn-ghost" to=".." relative="path">Back to tests</Link>} />;

  if (done) return (
    <>
      <PageHead title={test.title} sub="Aapka result" />
      <div className="card result-big"><Icon name="award" size={40} /><h2>{done.score} / {done.total}</h2><p className="muted">{fmtDate(done.date)}</p></div>
      {done.answers && <div className="stack">{test.questions.map((q, i) => (
        <div key={i} className="card"><strong>{i + 1}. {q.q}</strong><ul className="review">{q.options.map((o, j) => <li key={j} className={j === q.answer ? 'right' : done.answers[i] === j ? 'wrong' : ''}>{o}{j === q.answer && <Icon name="check" size={16} />}{done.answers[i] === j && j !== q.answer && <Icon name="x" size={16} />}</li>)}</ul></div>))}</div>}
      <p><button className="btn btn-ghost" onClick={() => nav('..', { relative: 'path' })}>Back to tests</button></p>
    </>);

  if (!started) return (
    <div className="card center-card"><Icon name="test" size={38} /><h2>{test.title}</h2>
      <p className="muted">{test.subject} · {test.questions.length} questions · {test.duration} minutes</p>
      <ul className="rules"><li>Timer shuru hone ke baad rukta nahi.</li><li>Time khatam hone par test apne aap submit ho jayega.</li><li>Test sirf ek baar diya ja sakta hai.</li></ul>
      <button className="btn btn-primary" onClick={() => { setLeft(test.duration * 60); setStarted(true); markOpen(); }}>Start test</button></div>);

  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  const answered = Object.keys(answers).length;
  return (<>
    <div className="timer-bar"><strong>{test.title}</strong><span className={`timer ${left < 60 ? 'low' : ''}`}><Icon name="clock" size={17} /> {mm}:{ss}</span><span className="muted">{answered}/{test.questions.length} answered</span></div>
    <div className="stack">{test.questions.map((q, i) => (
      <div key={i} className="card"><strong>{i + 1}. {q.q}</strong>
        <div className="options">{q.options.map((o, j) => <button key={j} className={`option ${answers[i] === j ? 'picked' : ''}`} onClick={() => setAnswers({ ...answers, [i]: j })}><span className="opt-key">{String.fromCharCode(65 + j)}</span>{o}</button>)}</div></div>))}</div>
    <p><button className="btn btn-primary" onClick={() => submit(false)}>Submit test</button></p></>);
}

/* ================= TEACHER / ADMIN: manage tests ================= */
const blank = { title: '', classNo: 6, subject: '', duration: 10, published: false, questions: [{ q: '', options: ['', '', '', ''], answer: 0 }] };
export function TestsManage() {
  const db = useDB(); const { user, role } = useAuth(); const { toast, confirm } = useUI();
  const [form, setForm] = useState(null); const [viewing, setViewing] = useState(null);
  usePageTitle('Tests');
  const list = useMemo(() => db.tests.filter((t) => role === 'admin' || t.by === user.name || !t.by), [db.tests, role, user]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    if (!form.title.trim()) return toast('Test ka title likhein', 'err');
    const qs = form.questions.filter((q) => q.q.trim() && q.options.every((o) => o.trim()));
    if (!qs.length) return toast('Kam se kam ek poora sawal (4 options ke saath) add karein', 'err');
    const data = { ...form, questions: qs };
    if (form.id) await crud.update('tests', form.id, data); else await crud.add('tests', { ...data, by: user.name, byRole: role });
    toast(form.id ? 'Test updated' : 'Test created'); setForm(null);
  };
  const remove = async (t) => { if (await confirm({ title: 'Delete test?', message: `"${t.title}" aur uske results hat jayenge.`, danger: true, confirmText: 'Delete' })) { await crud.remove('tests', t.id); toast('Deleted'); } };
  const attempts = (t) => db.attempts.filter((a) => a.testId === t.id);
  return (<>
    <PageHead title="Tests" sub="Online test banayein, publish karein aur results dekhein." actions={<button className="btn btn-primary" onClick={() => setForm({ ...blank, subject: user.subject || '' })}><Icon name="plus" size={18} /> Create test</button>} />
    {list.length === 0 ? <Empty icon="test" title="Abhi koi test nahi" text="'Create test' se pehla test banayein." /> : (
      <div className="table-wrap"><table className="table"><thead><tr><th>Test</th><th>Class</th><th>Questions</th><th>Attempts</th><th>Published</th><th className="right">Actions</th></tr></thead>
        <tbody>{list.map((t) => (<tr key={t.id}>
          <td data-label="Test"><strong>{t.title}</strong><div className="muted">{t.subject} · {t.duration} min</div></td><td data-label="Class">Class {t.classNo}</td><td data-label="Questions">{t.questions.length}</td>
          <td data-label="Attempts"><button className="link-btn" onClick={() => setViewing(t)}>{attempts(t).length} students</button></td>
          <td data-label="Published"><Switch checked={t.published} label="Publish test" onChange={(v) => crud.update('tests', t.id, { published: v })} /></td>
          <td className="right"><div className="row-actions"><button className="icon-btn" onClick={() => setForm({ ...t })} aria-label="Edit"><Icon name="edit" size={17} /></button><button className="icon-btn danger" onClick={() => remove(t)} aria-label="Delete"><Icon name="trash" size={17} /></button></div></td></tr>))}</tbody></table></div>)}
    {form && <Modal title={form.id ? 'Edit test' : 'Create test'} size="lg" onClose={() => setForm(null)} footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save test</button></>}>
      <div className="form-grid">
        <Field label="Title *" full><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Class"><select className="input" value={form.classNo} onChange={(e) => set('classNo', Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <option key={c} value={c}>Class {c}</option>)}</select></Field>
        <Field label="Subject"><input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} /></Field>
        <Field label="Duration (minutes)"><input className="input" type="number" min="1" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} /></Field>
        <Field label="Publish now"><Switch checked={form.published} onChange={(v) => set('published', v)} label="Publish" /></Field>
      </div>
      <h4 className="h2">Questions</h4><QuestionEditor value={form.questions} onChange={(v) => set('questions', v)} />
    </Modal>}
    {viewing && <Modal title={`${viewing.title} — results`} onClose={() => setViewing(null)}>
      {attempts(viewing).length === 0 ? <Empty title="Abhi kisi ne test nahi diya" /> : <table className="table"><thead><tr><th>Student</th><th>Score</th><th>Date</th></tr></thead><tbody>{attempts(viewing).map((a) => { const s = db.students.find((x) => x.id === a.studentId); return <tr key={a.id}><td>{s?.name || '—'}</td><td><strong>{a.score}/{a.total}</strong></td><td>{fmtDate(a.date)}</td></tr>; })}</tbody></table>}
    </Modal>}
  </>);
}
