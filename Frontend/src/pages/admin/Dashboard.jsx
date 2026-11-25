import { Link } from 'react-router-dom';
import { Stat, PageHead, Badge } from '../../components/Common';
import { StackedBars, HBars, LineArea } from '../../components/Charts';
import { useDB } from '../../services/db';
import { activeSet, buildChapterIndex, dauSeries, joinsSeries, loggedInSet, itemInfo } from '../../lib/analytics';
import { fmtDuration, lastDays, today } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

export default function Dashboard() {
  const db = useDB(); usePageTitle('Dashboard');
  const day = today();
  const joined = loggedInSet(db);
  const stu = db.students, tea = db.teachers;
  const stuJoined = stu.filter((s) => joined.has(s.id)).length;
  const stuPending = stu.filter((s) => s.status === 'pending').length;
  const stuNotJoined = stu.filter((s) => s.status === 'active' && !joined.has(s.id)).length;
  const teaJoined = tea.filter((t) => joined.has(t.id)).length;
  const dau = dauSeries(db, 14);
  const week = new Set(lastDays(7));
  const newThisWeek = stu.filter((s) => week.has(s.joinedAt)).length;
  const idx = buildChapterIndex(db);

  // Top videos (last 7 days) by total watch time
  const byItem = {};
  db.activity.filter((a) => a.kind === 'video' && week.has(a.day)).forEach((a) => { byItem[a.itemId] = byItem[a.itemId] || { ...a, sec: 0, users: new Set() }; byItem[a.itemId].sec += a.sec; byItem[a.itemId].users.add(a.uid); });
  const top = Object.values(byItem).sort((a, b) => b.sec - a.sec).slice(0, 6).map((a) => ({ label: itemInfo(db, idx, a).title.replace(' — Video', ''), sub: `Class ${a.cls} · ${a.users.size} viewers`, value: a.sec, display: fmtDuration(a.sec) }));

  const joins = joinsSeries(db, 14).map((d) => ({ day: d.day, value: d.students + d.teachers }));
  const pubBooks = db.books.filter((b) => b.published).length;
  const openDoubts = db.doubts.filter((d) => d.status === 'open').length;
  const openSupport = db.support.filter((s) => s.status === 'open').length;

  return (
    <>
      <PageHead title="Overview" sub="School ka poora haal — aaj ka din." />
      <div className="grid grid-4">
        <Stat icon="users" label="Students" value={stu.length} note={`${stuJoined} joined · ${stuNotJoined} not joined yet · ${stuPending} pending`} />
        <Stat icon="user" label="Teachers" value={tea.length} note={`${teaJoined} joined · ${tea.length - teaJoined} not joined yet`} />
        <Stat icon="chart" label="Active today" value={activeSet(db, day).size} note={`${activeSet(db, day, 'student').size} students · ${activeSet(db, day, 'teacher').size} teachers`} />
        <Stat icon="plus" label="New students (7 days)" value={newThisWeek} />
      </div>
      <div className="grid grid-2">
        <section className="card"><h2 className="h2">Daily active users</h2><p className="muted">Pichhle 14 din — kitne log roz login hue.</p><StackedBars data={dau} /></section>
        <section className="card"><h2 className="h2">New joins per day</h2><p className="muted">Students + teachers jo us din school mein jude.</p><LineArea data={joins} /></section>
      </div>
      <div className="grid grid-2">
        <section className="card"><h2 className="h2">Most watched videos (7 days)</h2>{top.length ? <HBars items={top} /> : <p className="muted">Abhi koi video activity nahi.</p>}</section>
        <section className="card"><h2 className="h2">Needs attention</h2>
          <ul className="attn">
            <li><Link to="/admin/students"><b>{stuPending}</b> students verification pending</Link></li>
            <li><Link to="/admin/students"><b>{stuNotJoined}</b> students ne abhi tak login nahi kiya</Link></li>
            <li><Link to="/admin/doubts"><b>{openDoubts}</b> open doubts</Link></li>
            <li><Link to="/admin/support"><b>{openSupport}</b> support messages</Link></li>
            <li><Link to="/admin/courses"><b>{pubBooks}</b> / {db.books.length} books published <Badge tone={pubBooks === db.books.length ? 'ok' : 'warn'}>{db.books.length - pubBooks} unpublished</Badge></Link></li>
          </ul></section>
      </div>
    </>
  );
}
