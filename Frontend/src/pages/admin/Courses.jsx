import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Empty, Field, PageHead, Switch } from '../../components/Common';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import QuestionEditor from '../../components/QuestionEditor';
import { useDB } from '../../services/db';
import { useUI } from '../../context/UIContext';
import { courses } from '../../services/api';
import { registerFile } from '../../services/files';
import { uid } from '../../lib/utils';
import { usePageTitle } from '../../lib/hooks';

/* ---------- Class-wise course list ---------- */
export function CourseManager() {
  const db = useDB(); const { toast, confirm } = useUI(); usePageTitle('Courses');
  const [cls, setCls] = useState(6); const [bookForm, setBookForm] = useState(null); const [subForm, setSubForm] = useState(null);
  const subs = db.subjects.filter((s) => s.classNo === cls);

  const saveBook = async () => {
    if (!bookForm.title?.trim() || !bookForm.subjectId) return toast('Subject aur book ka naam zaroori hai', 'err');
    if (bookForm.id) await courses.updateBook(bookForm.id, bookForm); else await courses.addBook({ ...bookForm, classNo: cls });
    toast('Saved'); setBookForm(null);
  };
  const saveSub = async () => {
    if (!subForm.name?.trim()) return toast('Subject ka naam likhein', 'err');
    await courses.addSubject({ ...subForm, classNo: cls, tone: subs.length % 6 }); toast('Subject add hua'); setSubForm(null);
  };
  const delBook = async (b) => { if (await confirm({ title: 'Delete book?', message: `"${b.title}" aur uske saare chapters, videos aur PDFs hat jayenge.`, danger: true, confirmText: 'Delete' })) { await courses.removeBook(b.id); toast('Deleted'); } };

  return (
    <>
      <PageHead title="Courses" sub="Class → Subject → Book → Chapter. Videos, PDFs aur quiz yahin se upload hote hain." actions={<><button className="btn btn-ghost" onClick={() => setSubForm({ name: '', hindi: '' })}><Icon name="plus" size={17} /> Add subject</button><button className="btn btn-primary" onClick={() => setBookForm({ subjectId: subs[0]?.id || '', title: '', description: '' })}><Icon name="plus" size={17} /> Add book</button></>} />
      <div className="chips scroll-x">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <button key={c} className={`chip btn-chip ${c === cls ? 'on' : ''}`} onClick={() => setCls(c)}>Class {c}</button>)}</div>
      {subs.length === 0 ? <Empty icon="layers" title={`Class ${cls} mein abhi koi subject nahi`} text="'Add subject' se shuru karein." /> : subs.map((s) => {
        const books = db.books.filter((b) => b.subjectId === s.id);
        return (
          <section key={s.id} className="card course-sub">
            <div className="row-between"><h2 className="h2"><span className={`dot tone-${s.tone}`} /> {s.name} <small className="muted">{s.hindi}</small></h2></div>
            {books.length === 0 ? <p className="muted">Is subject mein abhi koi book nahi.</p> : (
              <div className="table-wrap flat"><table className="table"><tbody>{books.map((b) => { const ch = db.chapters.filter((c) => c.bookId === b.id); return (
                <tr key={b.id}><td data-label="Book"><strong>{b.title}</strong><div className="muted">{ch.length} chapters · {ch.reduce((n, c) => n + c.videos.length, 0)} videos</div></td>
                  <td data-label="Status">{b.published ? <Badge tone="ok">Published</Badge> : <Badge tone="warn">Hidden</Badge>}</td>
                  <td data-label="Publish"><Switch checked={b.published} label={`Publish ${b.title}`} onChange={(v) => { courses.updateBook(b.id, { published: v }); toast(v ? 'Published — students ko dikhega' : 'Unpublished — students se chhup gaya'); }} /></td>
                  <td className="right"><div className="row-actions"><Link className="btn btn-primary btn-sm" to={`/admin/courses/${b.id}`}>Manage chapters</Link><button className="icon-btn" onClick={() => setBookForm({ ...b })} aria-label="Edit book"><Icon name="edit" size={17} /></button><button className="icon-btn danger" onClick={() => delBook(b)} aria-label="Delete book"><Icon name="trash" size={17} /></button></div></td></tr>); })}</tbody></table></div>)}
          </section>);
      })}
      {bookForm && <Modal title={bookForm.id ? 'Edit book' : `Add book — Class ${cls}`} size="sm" onClose={() => setBookForm(null)} footer={<><button className="btn btn-ghost" onClick={() => setBookForm(null)}>Cancel</button><button className="btn btn-primary" onClick={saveBook}>Save</button></>}>
        <div className="form-grid one">
          <Field label="Subject *"><select className="input" value={bookForm.subjectId} onChange={(e) => setBookForm({ ...bookForm, subjectId: e.target.value })}><option value="">Select…</option>{subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Book name *"><input className="input" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></Field>
          <Field label="Short description"><textarea className="input" rows={2} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} /></Field>
        </div></Modal>}
      {subForm && <Modal title={`Add subject — Class ${cls}`} size="sm" onClose={() => setSubForm(null)} footer={<><button className="btn btn-ghost" onClick={() => setSubForm(null)}>Cancel</button><button className="btn btn-primary" onClick={saveSub}>Add subject</button></>}>
        <div className="form-grid one"><Field label="Subject name *"><input className="input" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} /></Field><Field label="Hindi name (optional)"><input className="input" value={subForm.hindi} onChange={(e) => setSubForm({ ...subForm, hindi: e.target.value })} /></Field></div></Modal>}
    </>
  );
}

/* ---------- Chapters of one book ---------- */
const FileInput = ({ label, file, onPick, onClear, accept }) => (
  <Field label={label} full><div className="filepick"><input type="file" accept={accept} onChange={(e) => e.target.files[0] && onPick(registerFile(e.target.files[0]))} />
    {file && <span className="muted"><Icon name="file" size={15} /> {file.name} <button type="button" className="link-btn" onClick={onClear}>remove</button></span>}</div></Field>
);

export function BookManager() {
  const { bookId } = useParams(); const db = useDB(); const { toast, confirm } = useUI();
  const [form, setForm] = useState(null);
  const b = db.books.find((x) => x.id === bookId);
  usePageTitle(b?.title);
  if (!b) return <Empty title="Book nahi mili" action={<Link className="btn btn-ghost" to="/admin/courses">Back to courses</Link>} />;
  const s = db.subjects.find((x) => x.id === b.subjectId);
  const list = db.chapters.filter((c) => c.bookId === b.id).sort((a, c) => a.no - c.no);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setVideo = (i, patch) => set('videos', form.videos.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  const save = async () => {
    if (!form.title?.trim()) return toast('Chapter ka naam likhein', 'err');
    const quiz = form.quiz.filter((q) => q.q.trim() && q.options.every((o) => o.trim()));
    const data = { ...form, quiz, videos: form.videos.filter((v) => v.url) };
    if (form.id) await courses.updateChapter(form.id, data); else await courses.addChapter({ ...data, bookId: b.id, subjectId: b.subjectId, classNo: b.classNo });
    toast('Chapter saved'); setForm(null);
  };
  const del = async (c) => { if (await confirm({ title: 'Delete chapter?', message: `"${c.title}" ke videos aur PDFs hat jayenge.`, danger: true, confirmText: 'Delete' })) { await courses.removeChapter(c.id); toast('Deleted'); } };

  return (
    <>
      <nav className="crumbs"><Link to="/admin/courses">Courses</Link><Icon name="right" size={14} /><b>Class {b.classNo} · {s?.name}</b></nav>
      <PageHead title={b.title} sub={b.published ? 'Published — students ko dikh rahi hai' : 'Hidden — students ko nahi dikhegi'} actions={<><span className="inline-field">Publish <Switch checked={b.published} label="Publish book" onChange={(v) => courses.updateBook(b.id, { published: v })} /></span><button className="btn btn-primary" onClick={() => setForm({ no: list.length + 1, title: '', videos: [], pdf: null, exercise: null, quiz: [] })}><Icon name="plus" size={17} /> Add chapter</button></>} />
      {list.length === 0 ? <Empty icon="book" title="Abhi koi chapter nahi" text="'Add chapter' dabakar video aur PDF upload karein." /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>Chapter</th><th>Content</th><th>Publish</th><th className="right">Actions</th></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c.id}><td data-label="No.">{c.no}</td><td data-label="Chapter"><strong>{c.title}</strong></td>
              <td data-label="Content"><div className="chips"><span className={`chip ${c.videos.length ? '' : 'off'}`}><Icon name="video" size={13} /> {c.videos.length}</span><span className={`chip ${c.pdf ? '' : 'off'}`}><Icon name="book" size={13} /> Book</span><span className={`chip ${c.exercise ? '' : 'off'}`}><Icon name="edit" size={13} /> Exercise</span><span className={`chip ${c.quiz.length ? '' : 'off'}`}><Icon name="quiz" size={13} /> {c.quiz.length}</span></div></td>
              <td data-label="Publish"><Switch checked={c.published} label="Publish chapter" onChange={(v) => courses.updateChapter(c.id, { published: v })} /></td>
              <td className="right"><div className="row-actions"><Link className="icon-btn" to={`/admin/learn/${c.id}`} aria-label="Preview"><Icon name="eye" size={17} /></Link><button className="icon-btn" onClick={() => setForm(JSON.parse(JSON.stringify(c)))} aria-label="Edit"><Icon name="edit" size={17} /></button><button className="icon-btn danger" onClick={() => del(c)} aria-label="Delete"><Icon name="trash" size={17} /></button></div></td></tr>))}</tbody></table></div>)}

      {form && <Modal title={form.id ? 'Edit chapter' : 'Add chapter'} size="lg" onClose={() => setForm(null)} footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save chapter</button></>}>
        <div className="form-grid"><Field label="Chapter no."><input className="input" type="number" min="1" value={form.no} onChange={(e) => set('no', Number(e.target.value))} /></Field><Field label="Chapter name *"><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field></div>
        <h4 className="h2">Videos</h4>
        {form.videos.map((v, i) => (<div key={v.id} className="video-row"><input className="input" placeholder="Video title" value={v.title} onChange={(e) => setVideo(i, { title: e.target.value })} />
          <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = registerFile(f); setVideo(i, { url: r.url, fileName: r.name, title: v.title || f.name.replace(/\.[^.]+$/, '') }); } }} />
          <span className="muted">{v.fileName || (v.url ? 'Sample video' : 'No file')}</span><button type="button" className="icon-btn danger" onClick={() => set('videos', form.videos.filter((_, k) => k !== i))} aria-label="Remove video"><Icon name="trash" size={17} /></button></div>))}
        <button type="button" className="btn btn-ghost" onClick={() => set('videos', [...form.videos, { id: `${form.id || uid('new')}-v${form.videos.length + 1}-${uid('')}`, title: '', url: '' }])}><Icon name="plus" size={17} /> Add video</button>
        <div className="form-grid one" style={{ marginTop: 16 }}>
          <FileInput label="Book / chapter PDF" file={form.pdf} accept=".pdf,image/*" onPick={(f) => set('pdf', f)} onClear={() => set('pdf', null)} />
          <FileInput label="Exercise PDF" file={form.exercise} accept=".pdf,image/*" onPick={(f) => set('exercise', f)} onClear={() => set('exercise', null)} />
        </div>
        <h4 className="h2">Quiz (optional)</h4><QuestionEditor value={form.quiz} onChange={(v) => set('quiz', v)} />
      </Modal>}
    </>
  );
}
