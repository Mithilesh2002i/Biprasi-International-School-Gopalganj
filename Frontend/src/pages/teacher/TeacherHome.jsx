import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Stat } from '../../components/Common';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { fmtDuration, greetingFor, today } from '../../lib/utils';
import { userDay } from '../../lib/analytics';

// Greeting din mein sirf ek baar dikhti hai (login ke waqt ke hisaab se Morning / Afternoon / Evening)
function Greeting({ name, uid }) {
  const key = `bis_greeted_${uid}_${today()}`;
  const [show, setShow] = useState(() => !localStorage.getItem(key));
  const g = greetingFor();
  useEffect(() => { if (show) { localStorage.setItem(key, '1'); const t = setTimeout(() => setShow(false), 9000); return () => clearTimeout(t); } return undefined; }, [show, key]);
  if (!show) return null;
  return (
    <div className="greet" role="status">
      <span className="greet-ico"><Icon name={g.icon} size={30} /></span>
      <div><h2>{g.text}, {name}</h2><p>Aapka din shubh ho. Aaj ki classes ke liye taiyaar?</p></div>
      <button className="icon-btn" onClick={() => setShow(false)} aria-label="Dismiss"><Icon name="x" /></button>
    </div>
  );
}

export default function TeacherHome() {
  const db = useDB(); const { user } = useAuth(); usePageTitle('Dashboard');
  const t = userDay(db, user.id, today());
  const myDoubts = db.doubts.filter((d) => d.status === 'open' && (!user.classes?.length || user.classes.includes(d.classNo))).length;
  const myTests = db.tests.filter((x) => x.by === user.name);
  const links = [['diary', 'Fill class diary', 'book'], ['tests', 'Create a test', 'test'], ['results', 'Update results', 'award'], ['notices', 'Post a notice', 'bell'], ['notes', 'Upload notes', 'upload']].filter(([k]) => user.perms?.[k]);
  return (
    <>
      <Greeting name={user.name} uid={user.id} />
      <div className="page-head"><div><h1>Dashboard</h1><p className="muted">{user.subject} · Classes {user.classes?.join(', ') || 'all'}</p></div></div>
      <div className="grid grid-4">
        <Stat icon="video" label="Video time today" value={fmtDuration(t.videoSec)} note={`${t.videosPlayed} videos played`} />
        <Stat icon="file" label="PDF time today" value={fmtDuration(t.pdfSec)} note={`${t.pdfCount} PDFs opened`} />
        <Stat icon="doubt" label="Open doubts" value={myDoubts} />
        <Stat icon="test" label="My tests" value={myTests.length} />
      </div>
      <div className="grid grid-2">
        <section className="card"><h2 className="h2">Quick actions</h2><div className="stack tight">{links.map(([to, label, icon]) => <Link key={to} to={`/teacher/${to}`} className="action-link"><Icon name={icon} size={18} />{label}<Icon name="right" size={16} /></Link>)}
          <Link to="/teacher/classes" className="action-link"><Icon name="layers" size={18} />Open class content<Icon name="right" size={16} /></Link></div></section>
        <section className="card"><h2 className="h2">Good to know</h2><ul className="plain"><li>Aapki video aur PDF activity school ke records mein dikhti hai.</li><li>Content school admin upload karta hai — aap use dekh sakte hain.</li><li>Notes, tests aur results aap khud bana aur update kar sakte hain.</li></ul></section>
      </div>
    </>
  );
}