import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Badge } from '../../components/Common';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { fmtDate, fmtDuration, today } from '../../lib/utils';
import { buildChapterIndex, itemInfo } from '../../lib/analytics';

export default function StudentHome() {
  const db = useDB(); const { user } = useAuth(); usePageTitle('Home');
  const idx = buildChapterIndex(db);
  const first = user.name.split(' ')[0];
  const last = [...db.activity].filter((a) => a.uid === user.id && ['video', 'pdf', 'exercise'].includes(a.kind)).sort((a, b) => b.day.localeCompare(a.day))[0];
  const lastCh = last && idx[last.itemId.replace(/-(v\d+|pdf|ex)$/, '')];
  const todaySec = db.activity.filter((a) => a.uid === user.id && a.day === today()).reduce((s, a) => s + a.sec, 0);
  const notices = db.notices.filter((n) => n.classNo === 'all' || n.classNo === user.classNo).slice(0, 3);
  const exam = db.exams.filter((e) => (e.classNo === 'all' || e.classNo === user.classNo) && e.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const pendingTests = db.tests.filter((t) => t.published && t.classNo === user.classNo && !db.attempts.some((a) => a.testId === t.id && a.studentId === user.id));
  const live = db.settings.liveFeature && db.settings.live.isLive;
  return (
    <>
      <section className="s-hero">
        <div><p className="muted">Namaste,</p><h1>{first}</h1><p className="s-hero-sub">Class {user.classNo} · ID {user.studentId}</p></div>
        <Link to="/student/classes" className="btn btn-primary btn-lg">Open my classes <Icon name="arrow" size={18} /></Link>
      </section>
      {live && <Link to="/student/live" className="live-banner"><span className="live-dot"><i /> LIVE NOW</span><b>{db.settings.live.title || 'Live class'}</b><span>Join <Icon name="arrow" size={16} /></span></Link>}
      <div className="grid grid-3 quick">
        <Link to={`/student/class/${user.classNo}`} className="quick-card"><Icon name="layers" /><b>Class {user.classNo} subjects</b><small>Video, book, exercise</small></Link>
        <Link to="/student/tests" className="quick-card"><Icon name="test" /><b>Tests</b><small>{pendingTests.length ? `${pendingTests.length} pending` : 'All done'}</small></Link>
        <Link to="/student/doubts" className="quick-card"><Icon name="doubt" /><b>Ask a doubt</b><small>Teachers jawab denge</small></Link>
      </div>
      <div className="grid grid-2">
        <section className="card"><h2 className="h2">Continue learning</h2>
          {lastCh ? <><p className="muted">{itemInfo(db, idx, last).sub}</p><h3>{lastCh.title}</h3><Link className="btn btn-primary" to={`/student/learn/${lastCh.id}`}>Resume chapter</Link></> : <p className="muted">Abhi tak kuch nahi dekha. Apni class kholkar pehla chapter shuru karein.</p>}
          <p className="muted today"><Icon name="clock" size={15} /> Aaj padhai: {fmtDuration(todaySec)}</p></section>
        <section className="card"><h2 className="h2">Next exam</h2>
          {exam ? <><h3>{exam.name}</h3><p className="muted">{fmtDate(exam.date)} {exam.time} · {exam.subject}</p><Link className="btn btn-ghost" to="/student/exams">Syllabus dekhein</Link></> : <p className="muted">Abhi koi exam schedule nahi hai.</p>}</section>
      </div>
      <section className="card"><div className="row-between"><h2 className="h2">Notices</h2><Link to="/student/notices" className="link-btn">View all</Link></div>
        {notices.map((n) => <div key={n.id} className="notice-line"><strong>{n.title}</strong>{n.pinned && <Badge tone="warn">Pinned</Badge>}<small className="muted">{fmtDate(n.createdAt)}</small></div>)}</section>
    </>
  );
}
