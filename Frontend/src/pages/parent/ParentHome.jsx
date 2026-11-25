import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Badge, Empty, Stat } from '../../components/Common';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { fmtDate, fmtShort, monthsBack, today } from '../../lib/utils';
import { STATUS, tally, toneFor } from '../../lib/diary';
import { useMyPtm } from './PtmView';

// Parent ka home: bachche ki details, PTM/exam, 6 mahine ka exercise-attendance-marks saar, aaj ka snapshot
export default function ParentHome() {
  const db = useDB(); const { user: child } = useAuth(); usePageTitle('Home');
  const mine = db.diary.filter((d) => d.classNo === child.classNo);
  const six = mine.filter((d) => d.date >= monthsBack(6));
  const t6 = tally(six, child.id);
  const lastDay = [...new Set(mine.map((d) => d.date))].sort().pop();
  const dayList = mine.filter((d) => d.date === lastDay).sort((a, b) => a.period - b.period);
  const results = db.results.filter((r) => r.studentRef === child.id);
  const avg = results.length ? Math.round((results.reduce((s, r) => s + r.marks, 0) / results.reduce((s, r) => s + r.total, 0)) * 100) : null;
  const ptm = useMyPtm().filter((p) => p.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const exam = db.exams.filter((e) => (e.classNo === 'all' || e.classNo === child.classNo) && e.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const notices = db.notices.filter((n) => n.classNo === 'all' || n.classNo === child.classNo).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const live = db.settings.liveFeature && db.settings.live.isLive;
  const subjects = db.subjects.filter((s) => s.classNo === child.classNo).map((s) => ({ s, t: tally(six.filter((d) => d.subject === s.name), child.id) }));

  return (
    <>
      <section className="s-hero">
        <div>
          <p className="muted">Namaste,</p>
          <h1>{child.fatherName || 'Parent'}</h1>
          <p className="s-hero-sub">{child.name} · Class {child.classNo} · Roll {child.roll ?? '—'} · ID {child.studentId}</p>
          <p className="today"><Icon name="calendar" size={16} /> {fmtDate(today())}</p>
        </div>
        <Link to="/parent/daily" className="btn btn-primary btn-lg">Aaj ki report <Icon name="arrow" size={18} /></Link>
      </section>

      {live && <Link to="/parent/live" className="live-banner"><span className="live-dot"><i /> LIVE NOW</span><b>{db.settings.live.title || 'Live class'}</b><span>Details <Icon name="arrow" size={16} /></span></Link>}
      {ptm && <Link to="/parent/ptm" className="banner-line"><Icon name="users" size={20} /> PTM: {ptm.title} — {fmtDate(ptm.date)}, {ptm.time} · {ptm.venue}<Icon name="arrow" size={16} /></Link>}
      {exam && <Link to="/parent/exams" className="banner-line"><Icon name="calendar" size={20} /> Agla exam: {exam.name} ({exam.subject}) — {fmtDate(exam.date)} {exam.time}<Icon name="arrow" size={16} /></Link>}

      <div className="grid grid-4">
        <Stat icon="check" label="Exercise completion" value={t6.pct == null ? '—' : `${t6.pct}%`} note="pichhle 6 mahine" />
        <Stat icon="user" label="Period attendance" value={t6.attPct == null ? '—' : `${t6.attPct}%`} note={`${t6.absent} period absent`} />
        <Stat icon="award" label="Average marks" value={avg == null ? '—' : `${avg}%`} note={`${results.length} result`} />
        <Stat icon="book" label="Aakhri school din" value={dayList.length} note={lastDay ? `${fmtShort(lastDay)} ko period hue` : 'record nahi'} />
      </div>

      <section className="card">
        <div className="row-between"><h2 className="h2"><Icon name="book" size={19} /> {lastDay ? `${fmtDate(lastDay)} ka snapshot` : 'Aaj ka snapshot'}</h2><Link to="/parent/daily" className="link-btn">Poori report</Link></div>
        {dayList.length === 0 ? <Empty icon="calendar" title="Abhi koi diary record nahi" /> : (
          <div className="snap">{dayList.map((p) => { const st = STATUS[p.entries?.[child.id]]; return (
            <div key={p.id} className="snap-item"><small>Period {p.period}</small><b>{p.subject}</b>{st ? <Badge tone={st.tone}>{st.short}</Badge> : <Badge>—</Badge>}</div>); })}</div>)}
      </section>

      <section className="card">
        <div className="row-between"><h2 className="h2"><Icon name="layers" size={19} /> Subject-wise exercise (6 mahine)</h2><Link to="/parent/subjects" className="link-btn">Details</Link></div>
        <div className="snap">{subjects.map(({ s, t }) => <div key={s.id} className="snap-item"><b>{s.name}</b><Badge tone={toneFor(t.pct)}>{t.pct == null ? '—' : `${t.pct}%`}</Badge><small>{t.periods} period</small></div>)}</div>
      </section>

      <div className="grid grid-2">
        <section className="card">
          <div className="row-between"><h2 className="h2">Latest marks</h2><Link to="/parent/progress" className="link-btn">Progress report</Link></div>
          {results.length === 0 ? <p className="muted">Abhi koi result upload nahi hua.</p> : (
            <ul className="attn">{[...results].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((r) => <li key={r.id}><span><b>{r.marks}/{r.total}</b> {r.subject} · {r.exam}</span></li>)}</ul>)}
        </section>
        <section className="card">
          <div className="row-between"><h2 className="h2">Notices</h2><Link to="/parent/notices" className="link-btn">Sab dekhein</Link></div>
          {notices.length === 0 ? <Empty icon="bell" title="Koi notice nahi" /> : notices.map((n) => (
            <div key={n.id} className="notice-line"><strong>{n.title}</strong>{n.pinned && <Badge tone="warn">Pinned</Badge>}<small className="muted">{fmtDate(n.createdAt)}</small></div>))}
        </section>
      </div>
    </>
  );
}