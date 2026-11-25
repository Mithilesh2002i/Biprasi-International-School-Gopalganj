import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import Logo from '../../components/Logo';
import HeroArt from '../../components/HeroArt';
import { Brand } from '../../components/Layouts';
import { Reveal, CountUp } from '../../components/Reveal';
import { useDB } from '../../services/db';
import { CLASS_LIST } from '../../config';
import { usePageTitle, useTheme } from '../../lib/hooks';
import { fmtDate } from '../../lib/utils';

const ORBIT = ['book', 'grad', 'quiz', 'video', 'award', 'edit'];

export default function Landing() {
  const db = useDB(); const s = db.settings; usePageTitle(); useTheme('school');
  const notices = db.notices.filter((n) => n.classNo === 'all').slice(0, 3);
  const videos = db.chapters.reduce((n, c) => n + c.videos.length, 0);
  const words = s.schoolName.split(' ');
  const stats = [['Classes', CLASS_LIST.length], ['Books', db.books.length], ['Chapters', db.chapters.length], ['Video lectures', videos]];
  const tel = (p) => `tel:${p.replace(/[^\d+]/g, '')}`;

  return (
    <div className="landing" data-theme="school">
      <header className="land-top"><div className="land-top-in"><Brand /><nav><Link className="btn btn-ghost" to="/teacher/login">Teacher login</Link><Link className="btn btn-ghost" to="/parent/login">Parent login</Link><Link className="btn btn-primary" to="/student/login">Student login</Link></nav></div></header>

      <section className="lhero">
        <HeroArt />
        <div className="lhero-in">
          <div className="lhero-txt">
            <h1>{words.map((w, i) => <span key={i} className="w" style={{ '--d': `${200 + i * 140}ms` }}>{w}&nbsp;</span>)}</h1>
            {s.city && <p className="lhero-city">{s.city}, Bihar</p>}
            <p className="lhero-tag">{s.tagline}</p>
            <p className="lhero-intro">{s.intro}</p>
            <div className="hero-cta"><Link className="btn btn-gold btn-lg" to="/student/login"><Icon name="user" size={19} /> Student login</Link><Link className="btn btn-outline-light btn-lg" to="/teacher/login"><Icon name="book" size={19} /> Teacher login</Link><Link className="btn btn-outline-light btn-lg" to="/parent/login"><Icon name="users" size={19} /> Parent login</Link></div>
          </div>
          <div className="crest" aria-hidden="true">
            <span className="crest-ring" />
            <div className="orbit">{ORBIT.map((n, i) => <span key={n} className="orbit-chip" style={{ '--a': `${i * 60}deg` }}><span><Icon name={n} size={20} /></span></span>)}</div>
            <div className="crest-badge"><Logo alt={s.schoolName} /></div>
          </div>
        </div>
      </section>

      <div className="lstats">{stats.map(([label, n], i) => <Reveal key={label} className="lstat" delay={i * 90}><b><CountUp to={n} /></b><span>{label}</span></Reveal>)}</div>

      <section className="land-sec">
        <Reveal><h2>Class 1 se Class 10 tak</h2><p className="muted sec-sub">Har class ke subject, kitaaben, video lectures, exercises aur quiz — chapter ke hisaab se.</p></Reveal>
        <Reveal as="ol" plain className="steps steps-static">{CLASS_LIST.map((c) => <li key={c} style={{ '--n': c - 1 }}><div className="step"><span className="step-no">{c}</span><span className="step-txt"><b>Class {c}</b></span></div></li>)}</Reveal>
      </section>

      <section className="land-sec two">
        <Reveal><h2>Students ke liye</h2><ul className="ticks"><li><Icon name="video" size={18} /> Video lectures dekhein</li><li><Icon name="book" size={18} /> Book aur exercise PDF padhein</li><li><Icon name="test" size={18} /> Quiz aur online test dein</li><li><Icon name="doubt" size={18} /> Doubt poochhein</li></ul></Reveal>
        <Reveal delay={120}><h2>Teachers ke liye</h2><ul className="ticks"><li><Icon name="test" size={18} /> Test banayein, result update karein</li><li><Icon name="bell" size={18} /> Notice aur exam details daalein</li><li><Icon name="file" size={18} /> Notes aur marksheet upload karein</li><li><Icon name="doubt" size={18} /> Students ke doubts solve karein</li></ul></Reveal>
      </section>

      {notices.length > 0 && <section className="land-sec"><Reveal><h2>Latest notices</h2></Reveal><div className="stack">{notices.map((n, i) => <Reveal key={n.id} className="card" delay={i * 100}><strong>{n.title}</strong><p className="muted">{n.body}</p><small className="muted">{fmtDate(n.createdAt)}</small></Reveal>)}</div></section>}

      <section className="land-sec about"><Reveal><h2>About us</h2><p>{s.about}</p></Reveal></section>

      <footer className="contact">
        <div className="contact-in">
          <Reveal>
            <h2>Get in touch</h2>
            <p className="contact-name">{s.schoolName} {s.city}</p>
            <ul className="contact-list">
              <li><span className="contact-ico"><Icon name="pin" size={20} /></span><span>{s.address}</span></li>
              <li><span className="contact-ico"><Icon name="phone" size={20} /></span><a href={tel(s.phone)}>{s.phone}</a></li>
              {s.phone2 && <li><span className="contact-ico"><Icon name="phone" size={20} /></span><a href={tel(s.phone2)}>{s.phone2}</a></li>}
              <li><span className="contact-ico"><Icon name="mail" size={20} /></span><a href={`mailto:${s.email}`}>{s.email}</a></li>
            </ul>
          </Reveal>
          <Reveal delay={140} className="contact-cta"><div className="logo-badge sm"><Logo alt="" /></div><p>{s.tagline}</p><div className="hero-cta"><Link className="btn btn-gold" to="/student/login">Student login</Link><Link className="btn btn-outline-light" to="/parent/login">Parent login</Link><Link className="btn btn-outline-light" to="/teacher/login">Teacher login</Link></div></Reveal>
        </div>
        <div className="contact-bar"><span>© {new Date().getFullYear()} {s.schoolName}, {s.city}</span><Link to="/admin/login">Admin</Link></div>
      </footer>
    </div>
  );
}