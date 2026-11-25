import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useDB } from '../services/db';
import { initials } from '../lib/utils';
import { useTheme } from '../lib/hooks';

export function Brand({ small }) {
  const db = useDB();
  const { schoolName, city } = db.settings;
  return (
    <Link to="/" className={`brand ${small ? 'brand-sm' : ''}`}>
      <span className="brand-mark"><Logo alt="" /></span>
      <span className="brand-name">{schoolName}{city && <small>{city}</small>}</span>
    </Link>
  );
}

// Route guard: sahi role ke bina andar nahi jane dega; maintenance mode mein student/parent/teacher ko rok deta hai.
export function RequireRole({ role, children }) {
  const { session, logout } = useAuth(); const db = useDB(); const loc = useLocation();
  useTheme(role);
  if (!session || session.role !== role) return <Navigate to={`/${role}/login`} state={{ from: loc.pathname }} replace />;
  if (db.settings.maintenance && role !== 'admin') {
    return (
      <div className="maint" data-theme={role}>
        <Icon name="power" size={44} /><h1>Portal abhi band hai</h1>
        <p className="muted">{db.settings.schoolName} ka portal thodi der ke liye band hai. Kripya baad mein aayein.</p>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </div>);
  }
  return children;
}

/* ---------------- Student shell: top navigation ---------------- */
export function StudentLayout() {
  const { user, logout } = useAuth(); const db = useDB(); const nav = useNavigate(); const loc = useLocation();
  const live = db.settings.liveFeature && db.settings.live.isLive;
  useTheme('student');
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const main = [['/student', 'Home', 'home', true], ['/student/classes', 'Classes', 'layers'], ['/student/tests', 'Tests', 'test'], ['/student/doubts', 'Doubts', 'doubt'], ['/student/notices', 'Notices', 'bell']];
  const more = [['/student/exams', 'Exam details', 'calendar'], ['/student/results', 'Results', 'award'], ['/student/notes', 'Notes & PDFs', 'file'], ['/student/college', 'College courses', 'grad'], ['/student/live', 'Live class', 'live'], ['/student/support', 'Support', 'support'], ['/student/profile', 'My profile', 'user']];
  return (
    <div className="app" data-theme="student">
      <header className="topbar">
        <div className="topbar-in">
          <Brand small />
          <nav className="topnav" aria-label="Main">
            {main.map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end} className="toplink"><Icon name={icon} size={18} /><span>{label}</span></NavLink>)}
            <details className="more" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && (e.currentTarget.open = false)}>
              <summary className="toplink"><Icon name="more" size={18} /><span>More</span></summary>
              <div className="more-menu">{more.filter(([to]) => db.settings.liveFeature || !to.endsWith('live')).map(([to, label, icon]) => <Link key={to} to={to} onClick={(e) => (e.currentTarget.closest('details').open = false)}><Icon name={icon} size={17} />{label}</Link>)}</div>
            </details>
          </nav>
          <div className="topuser">
            {live && <Link to="/student/live" className="live-pill"><i /> Live</Link>}
            <button className="avatar" onClick={() => nav('/student/profile')} aria-label="My profile">{initials(user.name)}</button>
            <button className="icon-btn" onClick={() => { logout(); nav('/'); }} aria-label="Log out"><Icon name="logout" /></button>
          </div>
        </div>
      </header>
      <main className="container"><div key={loc.pathname} className="page-in"><Outlet /></div></main>
    </div>
  );
}

/* ---------------- Parent shell: top navigation (sirf dekhne ke liye) ---------------- */
export function ParentLayout() {
  const { user, logout } = useAuth(); const db = useDB(); const nav = useNavigate(); const loc = useLocation();
  const live = db.settings.liveFeature && db.settings.live.isLive;
  useTheme('parent');
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const main = [['/parent', 'Home', 'home', true], ['/parent/daily', 'Daily report', 'book'], ['/parent/subjects', 'Subjects', 'layers'], ['/parent/progress', 'Progress', 'chart'], ['/parent/ptm', 'PTM', 'users']];
  const more = [['/parent/exams', 'Exams', 'calendar'], ['/parent/notices', 'Notices', 'bell'], ['/parent/results', 'Marksheets', 'award'], ['/parent/live', 'Live class', 'live'], ['/parent/support', 'Support', 'support'], ['/parent/profile', 'My profile', 'user']];
  return (
    <div className="app" data-theme="parent">
      <header className="topbar">
        <div className="topbar-in">
          <Brand small />
          <nav className="topnav" aria-label="Main">
            {main.map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end} className="toplink"><Icon name={icon} size={18} /><span>{label}</span></NavLink>)}
            <details className="more" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && (e.currentTarget.open = false)}>
              <summary className="toplink"><Icon name="more" size={18} /><span>More</span></summary>
              <div className="more-menu">{more.filter(([to]) => db.settings.liveFeature || !to.endsWith('live')).map(([to, label, icon]) => <Link key={to} to={to} onClick={(e) => (e.currentTarget.closest('details').open = false)}><Icon name={icon} size={17} />{label}</Link>)}</div>
            </details>
          </nav>
          <div className="topuser">
            {live && <Link to="/parent/live" className="live-pill"><i /> Live</Link>}
            <button className="avatar" onClick={() => nav('/parent/profile')} aria-label="My profile">{initials(user.fatherName || user.name)}</button>
            <button className="icon-btn" onClick={() => { logout(); nav('/'); }} aria-label="Log out"><Icon name="logout" /></button>
          </div>
        </div>
      </header>
      <main className="container"><div key={loc.pathname} className="page-in"><Outlet /></div></main>
    </div>
  );
}

/* ---------------- Teacher / Admin shell: sidebar ---------------- */
export function StaffLayout({ theme, groups, subtitle }) {
  const { user, logout } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [open, setOpen] = useState(false);
  useTheme(theme);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <div className={`app staff ${open ? 'side-open' : ''}`} data-theme={theme}>
      <aside className="side">
        <Brand small />
        <span className="side-sub">{subtitle}</span>
        <nav aria-label="Sidebar">
          {groups.map((g, gi) => (
            <div key={gi} className="side-group">
              {g.title && <span className="side-title">{g.title}</span>}
              {g.items.map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end} className="sidelink"><Icon name={icon} size={18} />{label}</NavLink>)}
            </div>))}
        </nav>
        <div className="side-foot"><div className="avatar">{initials(user.name)}</div><div className="side-user"><b>{user.name}</b><small>{theme === 'admin' ? 'Owner' : user.subject}</small></div>
          <button className="icon-btn" onClick={() => { logout(); nav('/'); }} aria-label="Log out"><Icon name="logout" /></button></div>
      </aside>
      <div className="side-scrim" onClick={() => setOpen(false)} />
      <div className="staff-main">
        <div className="mobilebar"><button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button><Brand small /></div>
        <main className="container"><div key={loc.pathname} className="page-in"><Outlet /></div></main>
      </div>
    </div>
  );
}