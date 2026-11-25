import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Empty, PageHead, Stat, Tabs } from '../../components/Common';
import { LineArea } from '../../components/Charts';
import { useDB } from '../../services/db';
import { buildChapterIndex, itemInfo, lastSeen, userDay } from '../../lib/analytics';
import { fmtDate, fmtDuration, lastDays, today } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

/* ---------- List: teachers / students / class-wise ---------- */
export default function Activity() {
  const db = useDB(); const [tab, setTab] = useState('teacher'); const [day, setDay] = useState(today()); const [cls, setCls] = useState('all');
  usePageTitle('Activity');
  const people = (tab === 'teacher' ? db.teachers : db.students.filter((s) => s.status === 'active')).filter((p) => cls === 'all' || tab === 'teacher' || p.classNo === Number(cls));
  const rows = useMemo(() => people.map((p) => ({ p, d: userDay(db, p.id, day), seen: lastSeen(db, p.id) })), [people, db, day]);

  const classRows = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1).map((c) => {
    const a = db.activity.filter((x) => x.day === day && x.cls === c && x.kind !== 'login');
    const sum = (k) => a.filter((x) => x.kind === k).reduce((s, x) => s + x.sec, 0);
    return { c, videoSec: sum('video'), pdfSec: sum('pdf') + sum('exercise'), opens: a.reduce((s, x) => s + x.opens, 0), users: new Set(a.map((x) => x.uid)).size };
  }), [db.activity, day]);

  return (
    <>
      <PageHead title="Activity" sub="Kaun kitna aur kya padh / dekh raha hai — din ke hisaab se." />
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'teacher', label: 'Teachers' }, { value: 'student', label: 'Students' }, { value: 'class', label: 'Class-wise' }]} />
        <label className="inline-field">Date <input className="input" type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value)} /></label>
        {tab === 'student' && <label className="inline-field">Class <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}><option value="all">All</option>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <option key={c} value={c}>Class {c}</option>)}</select></label>}
      </div>
      {tab === 'class' ? (
        <div className="table-wrap"><table className="table"><thead><tr><th>Class</th><th>Active learners</th><th>Video time</th><th>PDF / exercise time</th><th>Items opened</th></tr></thead>
          <tbody>{classRows.map((r) => <tr key={r.c}><td data-label="Class"><strong>Class {r.c}</strong></td><td data-label="Active learners">{r.users}</td><td data-label="Video time">{fmtDuration(r.videoSec)}</td><td data-label="PDF time">{fmtDuration(r.pdfSec)}</td><td data-label="Opened">{r.opens}</td></tr>)}</tbody></table></div>
      ) : rows.length === 0 ? <Empty title="Koi record nahi" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>{tab === 'teacher' ? 'Teacher' : 'Student'}</th><th>Login</th><th>Videos played</th><th>Video time</th><th>PDFs opened</th><th>PDF time</th><th>Last seen</th></tr></thead>
          <tbody>{rows.map(({ p, d, seen }) => (
            <tr key={p.id}>
              <td data-label="Name"><Link className="name-link" to={`/admin/activity/${p.id}?day=${day}`}><strong>{p.name}</strong></Link><div className="muted">{tab === 'teacher' ? p.subject : `Class ${p.classNo}`}</div></td>
              <td data-label="Login">{d.loggedIn ? <Badge tone="ok">Yes</Badge> : <Badge>No</Badge>}</td>
              <td data-label="Videos played">{d.videosPlayed}</td><td data-label="Video time"><strong>{fmtDuration(d.videoSec)}</strong></td>
              <td data-label="PDFs opened">{d.pdfCount}</td><td data-label="PDF time">{fmtDuration(d.pdfSec)}</td>
              <td data-label="Last seen">{seen ? fmtDate(seen) : 'Never'}</td></tr>))}</tbody></table></div>)}
    </>
  );
}

/* ---------- One person, one day: which videos played / not played ---------- */
export function UserActivity() {
  const { uid } = useParams(); const db = useDB(); const [sp] = useSearchParams();
  const [day, setDay] = useState(sp.get('day') || today());
  const person = db.teachers.find((t) => t.id === uid) || db.students.find((s) => s.id === uid);
  const isTeacher = !!db.teachers.find((t) => t.id === uid);
  const classes = isTeacher ? (person?.classes?.length ? person.classes : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) : [person?.classNo];
  const [cls, setCls] = useState(classes[0]);
  usePageTitle(person?.name);
  const idx = useMemo(() => buildChapterIndex(db), [db]);
  if (!person) return <Empty title="User nahi mila" />;

  const d = userDay(db, uid, day);
  const playedMap = {}; d.rows.filter((r) => r.kind === 'video').forEach((r) => { playedMap[r.itemId] = r; });
  const videos = db.chapters.filter((c) => c.classNo === Number(cls)).flatMap((c) => c.videos.map((v) => ({ v, c })));
  const pdfs = d.rows.filter((r) => r.kind !== 'video');
  const trend = lastDays(14).map((x) => ({ day: x, value: Math.round(userDay(db, uid, x).videoSec / 60) }));
  const subName = (c) => db.subjects.find((s) => s.id === c.subjectId)?.name;

  return (
    <>
      <PageHead title={person.name} sub={isTeacher ? `Teacher · ${person.subject} · ${person.teacherId}` : `Student · Class ${person.classNo} · ${person.studentId}`} actions={<Link className="btn btn-ghost" to="/admin/activity">Back</Link>} />
      <div className="toolbar">
        <label className="inline-field">Date <input className="input" type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value)} /></label>
        {isTeacher && <label className="inline-field">Class <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></label>}
      </div>
      <div className="grid grid-4">
        <Stat icon="video" label="Videos played" value={d.videosPlayed} />
        <Stat icon="clock" label="Video time" value={fmtDuration(d.videoSec)} />
        <Stat icon="file" label="PDFs opened" value={d.pdfCount} />
        <Stat icon="clock" label="PDF time" value={fmtDuration(d.pdfSec)} />
      </div>
      <section className="card"><h2 className="h2">Video minutes — last 14 days</h2><LineArea data={trend} unit=" min" /></section>
      <h2 className="h2">Class {cls} videos on {fmtDate(day)}</h2>
      <div className="table-wrap"><table className="table"><thead><tr><th>Video</th><th>Subject</th><th>Status</th><th>Time watched</th></tr></thead>
        <tbody>{videos.map(({ v, c }) => { const r = playedMap[v.id]; return (
          <tr key={v.id}><td data-label="Video">{c.no}. {c.title}</td><td data-label="Subject">{subName(c)}</td>
            <td data-label="Status">{r ? <Badge tone="ok">Played</Badge> : <Badge>Not played</Badge>}</td><td data-label="Time">{r ? fmtDuration(r.sec) : '—'}</td></tr>); })}</tbody></table></div>
      <h2 className="h2">PDFs & exercises opened</h2>
      {pdfs.length === 0 ? <Empty icon="file" title="Is din koi PDF nahi khola" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Item</th><th>Class</th><th>Time read</th></tr></thead><tbody>{pdfs.map((r, i) => { const info = itemInfo(db, idx, r); return <tr key={i}><td data-label="Item">{info.title}<div className="muted">{info.sub}</div></td><td data-label="Class">{r.cls ? `Class ${r.cls}` : '—'}</td><td data-label="Time">{fmtDuration(r.sec)}</td></tr>; })}</tbody></table></div>)}
    </>
  );
}
