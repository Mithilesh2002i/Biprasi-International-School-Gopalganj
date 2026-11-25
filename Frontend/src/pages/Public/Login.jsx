import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import HeroArt from '../../components/HeroArt';
import Logo from '../../components/Logo';
import { Field } from '../../components/Common';
import { useAuth } from '../../context/AuthContext';
import { useDB } from '../../services/db';
import { auth } from '../../services/api';
import { DEMO_MODE, DEMO_OTP } from '../../config';
import { usePageTitle, useTheme } from '../../lib/hooks';

const CFG = {
  student: { title: 'Student login', blurb: 'Apni class ke videos, books aur tests yahan milenge.', idLabel: 'Student ID', idHint: 'School ne jo ID di hai (jaise BIS26-0006)', demo: 'ID: BIS26-0006 · Mobile: 9876540006' },
  parent: { title: 'Parent login', blurb: 'Bachche ki padhai, results aur notices ek jagah dekhein.', idLabel: 'Student ID (bachche ki ID)', idHint: 'School ne bachche ko jo ID di hai (jaise BIS26-0006)', demo: 'ID: BIS26-0006 · Parent mobile: 9700040006' },
  teacher: { title: 'Teacher login', blurb: 'Classes, tests aur results ek jagah manage karein.', idLabel: 'Registration number', idHint: 'School ne jo registration number diya hai (jaise REG-1001)', demo: 'Reg no: REG-1001 · Mobile: 9811000010' },
};

export default function Login({ role }) {
  const c = CFG[role]; const { session, login } = useAuth(); const db = useDB(); const nav = useNavigate();
  const [step, setStep] = useState(1); const [loginId, setLoginId] = useState(''); const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(''); const [uid, setUid] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  usePageTitle(c.title); useTheme(role);
  if (session?.role === role) return <Navigate to={`/${role}`} replace />;

  const sendOtp = async (e) => { e.preventDefault(); setErr(''); setBusy(true);
    const r = await auth.requestOtp(role, { loginId, mobile });
    if (!r.ok) { setBusy(false); return setErr(r.error); }
    if (role === 'student') { // student ko OTP nahi chahiye: seedha login
      const s = await auth.loginWithoutOtp(role, r.userId); setBusy(false);
      login(s.session); return nav(`/${role}`, { replace: true });
    }
    setBusy(false); setUid(r.userId); setStep(2); };
  const verify = async (e) => { e.preventDefault(); setErr(''); setBusy(true);
    const r = await auth.verifyOtp(role, uid, otp); setBusy(false);
    if (!r.ok) return setErr(r.error); login(r.session); nav(`/${role}`, { replace: true }); };

  return (
    <div className="login" data-theme={role}>
      <div className="login-art"><HeroArt /><div className="login-art-txt"><div className="logo-badge"><Logo alt="" /></div><p className="art-name">{db.settings.schoolName}{db.settings.city ? `, ${db.settings.city}` : ''}</p><h2>{c.blurb}</h2></div></div>
      <div className="login-panel">
        <Link to="/" className="back-link"><Icon name="left" size={16} /> Home</Link>
        <h1>{c.title}</h1>
        {db.settings.maintenance && <p className="alert">Portal abhi band hai. Kuch der baad try karein.</p>}
        {step === 1 ? (
          <form onSubmit={sendOtp} className="login-form">
            <Field label={c.idLabel} hint={c.idHint}><input className="input" value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required /></Field>
            <Field label={role === 'parent' ? 'Parent ka registered mobile number' : 'Registered mobile number'}><input className="input" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} required /></Field>
            {err && <p className="form-err" role="alert">{err}</p>}
            <button className="btn btn-primary btn-lg" disabled={busy}>{role === 'student' ? 'Login' : 'Send OTP'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="login-form">
            <p className="muted">OTP aapke mobile ****{mobile.slice(-4)} par bheja gaya hai.</p>
            <Field label="6-digit OTP"><input className="input otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus required /></Field>
            {err && <p className="form-err" role="alert">{err}</p>}
            <button className="btn btn-primary btn-lg" disabled={busy}>Verify & login</button>
            <button type="button" className="link-btn" onClick={() => { setStep(1); setOtp(''); setErr(''); }}>Number badlein</button>
          </form>)}
        {DEMO_MODE && <div className="demo-hint"><b>Demo:</b> {c.demo}{role !== 'student' ? ` · OTP: ${DEMO_OTP}` : ''}</div>}
        <p className="login-note muted">Login ID school deta hai. ID nahi hai? Apne school se sampark karein.</p>
      </div>
    </div>
  );
}

export function AdminLogin() {
  const { session, login } = useAuth(); const nav = useNavigate(); const db = useDB();
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');
  usePageTitle('Admin login'); useTheme('admin');
  if (session?.role === 'admin') return <Navigate to="/admin" replace />;
  const go = async (e) => { e.preventDefault(); const r = await auth.adminLogin(u, p); if (!r.ok) return setErr(r.error); login(r.session); nav('/admin', { replace: true }); };
  return (
    <div className="login" data-theme="admin">
      <div className="login-art"><HeroArt /><div className="login-art-txt"><div className="logo-badge"><Logo alt="" /></div><p className="art-name">{db.settings.schoolName}{db.settings.city ? `, ${db.settings.city}` : ''}</p><h2>School ka poora control — ek jagah.</h2></div></div>
      <div className="login-panel">
        <Link to="/" className="back-link"><Icon name="left" size={16} /> Home</Link>
        <h1>Admin login</h1>
        <form onSubmit={go} className="login-form">
          <Field label="Username"><input className="input" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required /></Field>
          <Field label="Password"><input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required /></Field>
          {err && <p className="form-err" role="alert">{err}</p>}
          <button className="btn btn-primary btn-lg">Login</button>
        </form>
        {DEMO_MODE && <div className="demo-hint"><b>Demo:</b> admin / admin123</div>}
      </div>
    </div>
  );
}