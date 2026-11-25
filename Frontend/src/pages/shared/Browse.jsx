// Class -> Subject -> Book -> Chapter -> (Video / Read / Exercise / Quiz). Student aur Teacher dono yahi use karte hain.
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import Icon from '../../components/Icon';
import { Empty, PageHead, Tabs, Badge } from '../../components/Common';
import VideoPlayer from '../../components/VideoPlayer';
import PdfReader from '../../components/PdfReader';
import QuizRunner from '../../components/QuizRunner';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { CLASS_LIST } from '../../config';
import { SAMPLE } from '../../services/files';
import { usePageTitle } from '../../lib/hooks';

const useBase = () => { const { role } = useAuth(); return `/${role}`; };
const Crumbs = ({ items }) => (
  <nav className="crumbs" aria-label="Breadcrumb">
    {items.map((it, i) => <span key={i}>{it.to ? <Link to={it.to}>{it.label}</Link> : <b>{it.label}</b>}{i < items.length - 1 && <Icon name="right" size={14} />}</span>)}
  </nav>
);
// Student/Teacher ko sirf published content dikhta hai
const useVisible = () => {
  const db = useDB(); const { role } = useAuth();
  return useMemo(() => {
    const books = db.books.filter((b) => role === 'admin' || b.published);
    const ok = new Set(books.map((b) => b.id));
    const chapters = db.chapters.filter((c) => ok.has(c.bookId) && (role === 'admin' || c.published));
    return { books, chapters, db };
  }, [db, role]);
};

/* ---------- Class 1..10 staircase ---------- */
export function ClassesPage() {
  const base = useBase(); const { user, role } = useAuth(); const { books, chapters } = useVisible();
  usePageTitle('Classes');
  return (
    <>
      <PageHead title="Choose your class" sub="Ghat ki seedhiyon ki tarah — ek ek class chadhte jaayein." />
      <ol className="steps">
        {CLASS_LIST.map((c) => {
          const n = chapters.filter((x) => x.classNo === c).length;
          const mine = role === 'student' && user.classNo === c;
          return (
            <li key={c} style={{ '--n': c - 1 }}>
              <Link to={`${base}/class/${c}`} className={`step ${mine ? 'mine' : ''}`}>
                <span className="step-no">{c}</span>
                <span className="step-txt"><b>Class {c}</b><small>{books.filter((b) => b.classNo === c).length} books · {n} chapters</small></span>
                {mine && <Badge tone="warn">Your class</Badge>}
              </Link>
            </li>);
        })}
      </ol>
    </>
  );
}

/* ---------- Subjects of a class ---------- */
export function ClassPage() {
  const { classNo } = useParams(); const c = Number(classNo); const base = useBase();
  const { books, chapters, db } = useVisible();
  const subs = db.subjects.filter((s) => s.classNo === c && books.some((b) => b.subjectId === s.id));
  usePageTitle(`Class ${c}`);
  return (
    <>
      <Crumbs items={[{ label: 'Classes', to: `${base}/classes` }, { label: `Class ${c}` }]} />
      <PageHead title={`Class ${c}`} sub="Subject chunein." />
      {subs.length === 0 ? <Empty icon="book" title="Is class ka content abhi publish nahi hua" text="Jaldi hi yahan subjects dikhenge." /> : (
        <div className="grid grid-3">
          {subs.map((s) => (
            <Link key={s.id} to={`${base}/class/${c}/${s.id}`} className={`subject tone-${s.tone}`}>
              <span className="subject-hi">{s.hindi}</span>
              <strong>{s.name}</strong>
              <small>{books.filter((b) => b.subjectId === s.id).length} book · {chapters.filter((x) => x.subjectId === s.id).length} chapters</small>
              <Icon name="arrow" size={18} />
            </Link>))}
        </div>)}
    </>
  );
}

/* ---------- Books of a subject ---------- */
export function SubjectPage() {
  const { classNo, subjectId } = useParams(); const base = useBase();
  const { books, chapters, db } = useVisible();
  const s = db.subjects.find((x) => x.id === subjectId);
  const list = books.filter((b) => b.subjectId === subjectId);
  usePageTitle(s?.name);
  if (!s) return <Empty title="Subject nahi mila" />;
  return (
    <>
      <Crumbs items={[{ label: 'Classes', to: `${base}/classes` }, { label: `Class ${classNo}`, to: `${base}/class/${classNo}` }, { label: s.name }]} />
      <PageHead title={s.name} sub={s.hindi} />
      <div className="grid grid-2">
        {list.map((b) => {
          const ch = chapters.filter((c) => c.bookId === b.id);
          return (
            <Link key={b.id} to={`${base}/book/${b.id}`} className="book">
              <div className={`book-cover tone-${s.tone}`}><Icon name="book" size={30} /><span>{s.name}</span><small>Class {b.classNo}</small></div>
              <div className="book-info">
                <h3>{b.title}</h3><p className="muted">{b.description}</p>
                <div className="chips"><span className="chip"><Icon name="video" size={14} /> {ch.reduce((n, c) => n + c.videos.length, 0)} videos</span><span className="chip"><Icon name="file" size={14} /> {ch.filter((c) => c.pdf).length} PDFs</span><span className="chip"><Icon name="edit" size={14} /> {ch.filter((c) => c.exercise).length} exercises</span></div>
              </div>
            </Link>);
        })}
      </div>
    </>
  );
}

/* ---------- Chapters of a book ---------- */
export function BookPage() {
  const { bookId } = useParams(); const base = useBase();
  const { books, chapters, db } = useVisible();
  const b = books.find((x) => x.id === bookId);
  usePageTitle(b?.title);
  if (!b) return <Empty icon="lock" title="Ye book available nahi hai" text="Ya to ise abhi publish nahi kiya gaya, ya hata diya gaya hai." />;
  const s = db.subjects.find((x) => x.id === b.subjectId);
  const list = chapters.filter((c) => c.bookId === b.id).sort((a, c) => a.no - c.no);
  return (
    <>
      <Crumbs items={[{ label: 'Classes', to: `${base}/classes` }, { label: `Class ${b.classNo}`, to: `${base}/class/${b.classNo}` }, { label: s.name, to: `${base}/class/${b.classNo}/${s.id}` }, { label: b.title }]} />
      <div className={`book-hero tone-${s.tone}`}><Icon name="book" size={34} /><div><h1>{b.title}</h1><p>{list.length} chapters</p></div></div>
      <div className="chapters">
        {list.length === 0 && <Empty title="Chapters abhi add nahi hue" />}
        {list.map((c) => (
          <div key={c.id} className="chapter">
            <span className="chapter-no">{c.no}</span>
            <div className="chapter-main">
              <h3>{c.title}</h3>
              <div className="chapter-links">
                <Link className={`pill ${c.videos.length ? '' : 'off'}`} to={`${base}/learn/${c.id}?tab=video`}><Icon name="video" size={15} /> Watch</Link>
                <Link className={`pill ${c.pdf ? '' : 'off'}`} to={`${base}/learn/${c.id}?tab=read`}><Icon name="book" size={15} /> Read</Link>
                <Link className={`pill ${c.exercise ? '' : 'off'}`} to={`${base}/learn/${c.id}?tab=exercise`}><Icon name="edit" size={15} /> Exercise</Link>
                <Link className={`pill ${c.quiz.length ? '' : 'off'}`} to={`${base}/learn/${c.id}?tab=quiz`}><Icon name="quiz" size={15} /> Quiz</Link>
              </div>
            </div>
            <Link to={`${base}/learn/${c.id}`} className="icon-btn" aria-label={`Open ${c.title}`}><Icon name="right" /></Link>
          </div>))}
      </div>
    </>
  );
}

/* ---------- Learning screen ---------- */
export function LearnPage() {
  const { chapterId } = useParams(); const [sp, setSp] = useSearchParams(); const base = useBase();
  const { books, chapters, db } = useVisible();
  const ch = chapters.find((c) => c.id === chapterId);
  usePageTitle(ch?.title);
  const firstTab = ch ? (ch.videos.length ? 'video' : ch.pdf ? 'read' : ch.exercise ? 'exercise' : 'quiz') : 'video';
  const tab = sp.get('tab') || firstTab;
  const vi = Number(sp.get('v') || 0);
  if (!ch) return <Empty icon="lock" title="Ye chapter available nahi hai" />;
  const b = books.find((x) => x.id === ch.bookId); const s = db.subjects.find((x) => x.id === ch.subjectId);
  const siblings = chapters.filter((c) => c.bookId === ch.bookId).sort((a, c) => a.no - c.no);
  const idx = siblings.findIndex((c) => c.id === ch.id);
  const prev = siblings[idx - 1], next = siblings[idx + 1];
  const video = ch.videos[vi] || ch.videos[0];
  return (
    <>
      <Crumbs items={[{ label: `Class ${ch.classNo}`, to: `${base}/class/${ch.classNo}` }, { label: s.name, to: `${base}/class/${ch.classNo}/${s.id}` }, { label: b.title, to: `${base}/book/${b.id}` }, { label: `Ch ${ch.no}` }]} />
      <PageHead title={`${ch.no}. ${ch.title}`} sub={`${s.name} · Class ${ch.classNo}`} />
      <Tabs value={tab} onChange={(v) => setSp({ tab: v })} tabs={[
        { value: 'video', label: 'Watch', icon: 'video', count: ch.videos.length || null, disabled: !ch.videos.length },
        { value: 'read', label: 'Read book', icon: 'book', disabled: !ch.pdf },
        { value: 'exercise', label: 'Exercise', icon: 'edit', disabled: !ch.exercise },
        { value: 'quiz', label: 'Quiz', icon: 'quiz', count: ch.quiz.length || null, disabled: !ch.quiz.length }]} />
      <div className="learn-body">
        {tab === 'video' && video && (<>
          <VideoPlayer video={video} cls={ch.classNo} />
          {ch.videos.length > 1 && <div className="chips" style={{ marginTop: 12 }}>{ch.videos.map((v, i) => <button key={v.id} className={`chip btn-chip ${i === vi ? 'on' : ''}`} onClick={() => setSp({ tab: 'video', v: i })}>{i + 1}. {v.title}</button>)}</div>}
        </>)}
        {tab === 'read' && ch.pdf && <PdfReader file={ch.pdf} kind="pdf" itemId={`${ch.id}-pdf`} cls={ch.classNo} fallback={SAMPLE.pdf} />}
        {tab === 'exercise' && ch.exercise && <PdfReader file={ch.exercise} kind="exercise" itemId={`${ch.id}-ex`} cls={ch.classNo} fallback={SAMPLE.exercise} />}
        {tab === 'quiz' && ch.quiz.length > 0 && <QuizRunner questions={ch.quiz} itemId={`${ch.id}-quiz`} cls={ch.classNo} />}
      </div>
      <div className="pager">
        {prev ? <Link className="btn btn-ghost" to={`${base}/learn/${prev.id}`}><Icon name="left" size={17} /> {prev.title}</Link> : <span />}
        {next ? <Link className="btn btn-primary" to={`${base}/learn/${next.id}`}>{next.title} <Icon name="right" size={17} /></Link> : <span />}
      </div>
    </>
  );
}
