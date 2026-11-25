import { useState } from 'react';
import { Badge, Empty, Field, PageHead, Toggle } from '../../components/Common';
import Icon from '../../components/Icon';
import { useDB, resetDemo } from '../../services/db';
import { useUI } from '../../context/UIContext';
import { settings as sApi, support as supApi } from '../../services/api';
import { fmtDate } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

const PERM_LABELS = { tests: 'Teachers can create tests', results: 'Teachers can update results', notices: 'Teachers can post notices', exams: 'Teachers can add exam details', marksheets: 'Teachers can upload marksheets', college: 'Teachers can add college courses', notes: 'Teachers can upload notes', doubts: 'Teachers can answer doubts' };

/* ---------- Live class control ---------- */
export function LiveAdmin() {
  const db = useDB(); const { toast } = useUI(); const s = db.settings; usePageTitle('Live class');
  const [f, setF] = useState({ ...s.live });
  const save = async () => { await sApi.update({ live: f }); toast('Live class details saved'); };
  return (
    <>
      <PageHead title="Live class" sub="Jab chahein on karein, jab chahein off." />
      <div className="card">
        <Toggle title="Live class feature" text="On karne par students aur teachers ko 'Live class' ka menu dikhega." checked={s.liveFeature} onChange={(v) => sApi.update({ liveFeature: v })} />
        <Toggle title="Abhi live hai" text="On karte hi students ko 'LIVE NOW' banner aur Join button dikhega." checked={s.live.isLive} onChange={(v) => { setF({ ...f, isLive: v }); sApi.update({ live: { ...s.live, isLive: v } }); toast(v ? 'Live class shuru' : 'Live class band'); }} />
      </div>
      <div className="card"><h2 className="h2">Class details</h2>
        <div className="form-grid">
          <Field label="Title" full><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Maths — Algebra revision" /></Field>
          <Field label="Subject"><input className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
          <Field label="For class"><select className="input" value={f.classNo} onChange={(e) => setF({ ...f, classNo: e.target.value === 'all' ? 'all' : Number(e.target.value) })}><option value="all">All classes</option>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <option key={c} value={c}>Class {c}</option>)}</select></Field>
          <Field label="Meeting link (Zoom / Meet / YouTube Live)" full><input className="input" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" /></Field>
        </div>
        <button className="btn btn-primary" onClick={save}>Save details</button></div>
    </>
  );
}

/* ---------- Support inbox ---------- */
export function SupportAdmin() {
  const db = useDB(); const { toast } = useUI(); const [reply, setReply] = useState({}); usePageTitle('Support');
  const send = async (m) => { await supApi.update(m.id, { reply: reply[m.id], status: 'resolved' }); toast('Reply bhej diya'); };
  return (
    <>
      <PageHead title="Support inbox" sub="Students aur teachers ke messages." />
      {db.support.length === 0 ? <Empty icon="inbox" title="Koi message nahi" /> : <div className="stack">{db.support.map((m) => (
        <article key={m.id} className="card thread"><header><div><strong>{m.subject}</strong><small className="muted"> {m.name} ({m.role}) · {fmtDate(m.createdAt)}</small></div><Badge tone={m.status === 'open' ? 'warn' : 'ok'}>{m.status}</Badge></header>
          <p>{m.message}</p>{m.reply && <div className="reply"><b>Your reply</b><p>{m.reply}</p></div>}
          {m.status === 'open' && <div className="reply-box"><input className="input" placeholder="Reply likhein…" value={reply[m.id] || ''} onChange={(e) => setReply({ ...reply, [m.id]: e.target.value })} /><button className="btn btn-primary" onClick={() => send(m)} disabled={!reply[m.id]}>Reply & resolve</button></div>}</article>))}</div>}
    </>
  );
}

/* ---------- Settings & switches ---------- */
export function SettingsAdmin() {
  const db = useDB(); const { toast, confirm } = useUI(); const s = db.settings; usePageTitle('Settings');
  const [p, setP] = useState({ schoolName: s.schoolName, city: s.city || '', tagline: s.tagline, intro: s.intro || '', about: s.about, address: s.address, phone: s.phone, phone2: s.phone2 || '', email: s.email });
  const saveProfile = async () => { await sApi.update(p); toast('School profile saved'); };
  const reset = async () => { if (await confirm({ title: 'Reset demo data?', message: 'Saara demo data wapas shuru jaisa ho jayega. Aapke add kiye hue records hat jayenge.', danger: true, confirmText: 'Reset' })) { resetDemo(); toast('Reset ho gaya'); } };
  const maint = async (v) => { if (v && !(await confirm({ title: 'Portal band karein?', message: 'Students aur teachers login nahi kar payenge jab tak aap ise wapas on na karein.', danger: true, confirmText: 'Band karein' }))) return; sApi.update({ maintenance: v }); toast(v ? 'Portal band' : 'Portal chalu'); };
  return (
    <>
      <PageHead title="Settings" sub="School ka naam, download on/off aur baaki switches." />
      <div className="card"><h2 className="h2">School profile</h2>
        <div className="form-grid">
          <Field label="School name" full hint="Final naam yahan se kabhi bhi badal sakte hain."><input className="input" value={p.schoolName} onChange={(e) => setP({ ...p, schoolName: e.target.value })} /></Field>
          <Field label="City / place"><input className="input" value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} /></Field>
          <Field label="Tagline (logo ke neeche wali line)"><input className="input" value={p.tagline} onChange={(e) => setP({ ...p, tagline: e.target.value })} /></Field>
          <Field label="Home page intro line" full><input className="input" value={p.intro} onChange={(e) => setP({ ...p, intro: e.target.value })} /></Field>
          <Field label="About" full><textarea className="input" rows={3} value={p.about} onChange={(e) => setP({ ...p, about: e.target.value })} /></Field>
          <Field label="Address"><input className="input" value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
          <Field label="Second phone"><input className="input" value={p.phone2} onChange={(e) => setP({ ...p, phone2: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></Field>
        </div><button className="btn btn-primary" onClick={saveProfile}>Save profile</button></div>

      <div className="card"><h2 className="h2">Downloads</h2><p className="muted">Off hone par PDF aur video sirf website ke andar dekhe ja sakte hain, download ka button nahi dikhega.</p>
        <Toggle title="Students can download" checked={s.downloads.student} onChange={(v) => sApi.update({ downloads: { ...s.downloads, student: v } })} />
        <Toggle title="Teachers can download" checked={s.downloads.teacher} onChange={(v) => sApi.update({ downloads: { ...s.downloads, teacher: v } })} /></div>

      <div className="card"><h2 className="h2">Default teacher permissions</h2><p className="muted">Naye teacher ko ye permissions milengi. Har teacher ki permission alag se Teachers page par badal sakte hain.</p>
        {Object.entries(PERM_LABELS).map(([k, label]) => <Toggle key={k} title={label} checked={!!s.defaultPerms[k]} onChange={(v) => sApi.update({ defaultPerms: { ...s.defaultPerms, [k]: v } })} />)}</div>

      <div className="card"><h2 className="h2">Portal</h2>
        <Toggle title="Portal band karein (maintenance)" text="On karne par students aur teachers ko 'Portal band hai' dikhega. Admin chalta rahega." checked={s.maintenance} onChange={maint} /></div>

      <div className="card"><h2 className="h2">Demo data</h2><p className="muted">Ye data sirf is browser mein hai. Backend jodne par ye hata dena.</p><button className="btn btn-ghost" onClick={reset}><Icon name="power" size={17} /> Reset demo data</button></div>
    </>
  );
}
