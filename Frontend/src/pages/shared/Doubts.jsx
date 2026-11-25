import { useMemo, useState } from 'react';
import { Badge, Empty, PageHead, Tabs, Field } from '../../components/Common';
import Icon from '../../components/Icon';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { doubts as api } from '../../services/api';
import { fmtDate } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

const tone = { open: 'warn', answered: 'info', resolved: 'ok' };

// Student: sawal pucho. Teacher/Admin: jawab do.
export default function DoubtsPage() {
  const db = useDB(); const { user, role } = useAuth(); const { toast } = useUI();
  const [filter, setFilter] = useState('all');
  const [text, setText] = useState(''); const [subject, setSubject] = useState('');
  const [reply, setReply] = useState({});
  usePageTitle('Doubts');

  const list = useMemo(() => {
    let l = db.doubts;
    if (role === 'student') l = l.filter((d) => d.studentRef === user.id);
    if (role === 'teacher') l = l.filter((d) => !user.classes?.length || user.classes.includes(d.classNo));
    if (filter !== 'all') l = l.filter((d) => d.status === filter);
    return l;
  }, [db.doubts, role, user, filter]);
  const subjects = role === 'student' ? db.subjects.filter((s) => s.classNo === user.classNo) : [];

  const ask = async (e) => {
    e.preventDefault();
    if (!text.trim() || !subject) return toast('Subject aur sawal dono likhein', 'err');
    await api.ask({ studentRef: user.id, classNo: user.classNo, subject, text: text.trim() });
    setText(''); toast('Doubt bhej diya gaya'); };
  const send = async (d) => {
    const t = (reply[d.id] || '').trim(); if (!t) return;
    await api.reply(d.id, { by: user.name, byRole: role, text: t });
    setReply({ ...reply, [d.id]: '' }); toast('Reply bhej diya'); };

  return (
    <>
      <PageHead title="Doubts" sub={role === 'student' ? 'Koi bhi sawal puchhein — teacher jawab denge.' : 'Students ke sawalon ka jawab dein.'} />
      {role === 'student' && (
        <form className="card ask" onSubmit={ask}>
          <div className="form-grid">
            <Field label="Subject"><select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Select subject</option>{subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></Field>
            <Field label="Aapka sawal" full><textarea className="input" rows={3} placeholder="Sawal ko saaf-saaf likhein…" value={text} onChange={(e) => setText(e.target.value)} /></Field>
          </div>
          <button className="btn btn-primary" type="submit"><Icon name="send" size={17} /> Send doubt</button>
        </form>)}
      <Tabs value={filter} onChange={setFilter} tabs={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'answered', label: 'Answered' }, { value: 'resolved', label: 'Resolved' }]} />
      {list.length === 0 ? <Empty icon="doubt" title="Koi doubt nahi" text={role === 'student' ? 'Upar form se apna pehla sawal puchhein.' : 'Abhi koi naya doubt nahi aaya.'} /> : (
        <div className="stack">{list.map((d) => {
          const s = db.students.find((x) => x.id === d.studentRef);
          return (
            <article key={d.id} className="card thread">
              <header><div><strong>{role === 'student' ? d.subject : `${s?.name || 'Student'} · Class ${d.classNo} · ${d.subject}`}</strong><small className="muted"> {fmtDate(d.createdAt)}</small></div><Badge tone={tone[d.status]}>{d.status}</Badge></header>
              <p>{d.text}</p>
              {d.replies.map((r, i) => <div key={i} className="reply"><b>{r.by}</b> <small className="muted">{fmtDate(r.date)}</small><p>{r.text}</p></div>)}
              {role !== 'student' && (
                <div className="reply-box">
                  <input className="input" placeholder="Jawab likhein…" value={reply[d.id] || ''} onChange={(e) => setReply({ ...reply, [d.id]: e.target.value })} />
                  <button className="btn btn-primary" onClick={() => send(d)}>Reply</button>
                  {d.status !== 'resolved' && <button className="btn btn-ghost" onClick={() => api.setStatus(d.id, 'resolved')}>Mark resolved</button>}
                </div>)}
            </article>);
        })}</div>)}
    </>
  );
}
