// Teacher aur Admin dono ke "manage" pages. Config badalna ho to sirf yahin badlo.
import CrudManager from '../../components/CrudManager';
import FileLink from '../../components/FileLink';
import { Badge } from '../../components/Common';
import { fmtDate } from '../../lib/utils';

const clsLabel = (c) => (c === 'all' ? 'All classes' : `Class ${c}`);
const byCol = { key: 'by', label: 'By', render: (x) => <span>{x.by}{x.byRole === 'admin' ? <Badge tone="info">Admin</Badge> : null}</span> };
const dateCol = { key: 'createdAt', label: 'Date', render: (x) => fmtDate(x.createdAt) };
const newestFirst = (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '');

export const NoticesManage = () => (
  <CrudManager collection="notices" title="Notices" noun="notice" sub="School ke zaroori notice. Student aur teacher dono ko dikhte hain." sortBy={newestFirst}
    defaults={{ classNo: 'all', pinned: false }}
    fields={[{ key: 'title', label: 'Title', required: true, full: true }, { key: 'body', label: 'Message', type: 'textarea', required: true }, { key: 'classNo', label: 'For', type: 'class' }, { key: 'pinned', label: 'Pin on top', type: 'check' }]}
    columns={[{ key: 'title', label: 'Title', render: (x) => <strong>{x.title}</strong> }, { key: 'classNo', label: 'For', render: (x) => clsLabel(x.classNo) }, { key: 'pinned', label: 'Pinned', render: (x) => (x.pinned ? <Badge tone="warn">Pinned</Badge> : '—') }, byCol, dateCol]} />
);

export const ExamsManage = () => (
  <CrudManager collection="exams" title="Exam details" noun="exam" sub="Exam ki date, time aur syllabus." sortBy={(a, b) => (a.date || '').localeCompare(b.date || '')}
    defaults={{ classNo: 'all' }}
    fields={[{ key: 'name', label: 'Exam name', required: true }, { key: 'classNo', label: 'Class', type: 'class' }, { key: 'subject', label: 'Subject' }, { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'time', label: 'Time', type: 'time' }, { key: 'syllabus', label: 'Syllabus / instructions', type: 'textarea' }]}
    columns={[{ key: 'name', label: 'Exam', render: (x) => <strong>{x.name}</strong> }, { key: 'classNo', label: 'Class', render: (x) => clsLabel(x.classNo) }, { key: 'subject', label: 'Subject' }, { key: 'date', label: 'Date', render: (x) => `${fmtDate(x.date)} ${x.time || ''}` }, { key: 'syllabus', label: 'Syllabus' }, byCol]} />
);

export const ResultsManage = () => (
  <CrudManager collection="results" title="Results" noun="result" sub="Student ke marks add ya update karein." sortBy={newestFirst}
    fields={[
      { key: 'studentRef', label: 'Student', type: 'select', required: true, full: true, options: (db) => db.students.filter((s) => s.status === 'active').map((s) => ({ value: s.id, label: `${s.name} — Class ${s.classNo} (${s.studentId})` })) },
      { key: 'exam', label: 'Exam', required: true }, { key: 'subject', label: 'Subject', required: true },
      { key: 'marks', label: 'Marks obtained', type: 'number', required: true }, { key: 'total', label: 'Total marks', type: 'number', required: true }]}
    defaults={{ total: 100 }}
    columns={[{ key: 'studentRef', label: 'Student', render: (x, db) => { const s = db.students.find((k) => k.id === x.studentRef); return s ? `${s.name} (Class ${s.classNo})` : '—'; } }, { key: 'exam', label: 'Exam' }, { key: 'subject', label: 'Subject' }, { key: 'marks', label: 'Marks', render: (x) => <strong>{x.marks} / {x.total}</strong> }, byCol]} />
);

export const MarksheetsManage = () => (
  <CrudManager collection="marksheets" title="Marksheets" noun="marksheet" sub="Marksheet PDF upload karein — poori class ke liye ya kisi ek student ke liye." sortBy={newestFirst}
    defaults={{ classNo: 6 }}
    fields={[{ key: 'title', label: 'Title', required: true, full: true }, { key: 'classNo', label: 'Class', type: 'class', allowAll: false }, { key: 'studentRef', label: 'Only for student (optional)', type: 'select', hint: 'Khali chhodein to poori class ko dikhega.', options: (db, f) => db.students.filter((s) => s.status === 'active' && (!f || s.classNo === f.classNo)).map((s) => ({ value: s.id, label: `${s.name} (${s.studentId})` })) }, { key: 'file', label: 'Marksheet file (PDF/image)', type: 'file', required: true }]}
    columns={[{ key: 'title', label: 'Title', render: (x) => <strong>{x.title}</strong> }, { key: 'classNo', label: 'Class', render: (x) => clsLabel(x.classNo) }, { key: 'studentRef', label: 'Student', render: (x, db) => db.students.find((s) => s.id === x.studentRef)?.name || 'Whole class' }, { key: 'file', label: 'File', render: (x) => <FileLink file={x.file} itemId={x.id} cls={x.classNo} /> }, dateCol]} />
);

export const CollegeManage = () => (
  <CrudManager collection="college" title="College courses" noun="course" sub="12th ke baad ke college courses ki jaankari." sortBy={newestFirst}
    fields={[{ key: 'title', label: 'Course name', required: true, full: true }, { key: 'stream', label: 'Stream (Engineering, Medical…)' }, { key: 'duration', label: 'Duration' }, { key: 'eligibility', label: 'Eligibility' }, { key: 'description', label: 'Details', type: 'textarea' }, { key: 'file', label: 'Guide PDF (optional)', type: 'file' }]}
    columns={[{ key: 'title', label: 'Course', render: (x) => <strong>{x.title}</strong> }, { key: 'stream', label: 'Stream' }, { key: 'duration', label: 'Duration' }, { key: 'eligibility', label: 'Eligibility' }, { key: 'file', label: 'Guide', render: (x) => <FileLink file={x.file} itemId={x.id} /> }]} />
);

export const NotesManage = () => (
  <CrudManager collection="notes" title="Notes & PDFs" noun="PDF" sub="Chhote notes, formulas ya worksheets upload karein." sortBy={newestFirst}
    defaults={{ classNo: 6 }}
    fields={[{ key: 'title', label: 'Title', required: true, full: true }, { key: 'classNo', label: 'Class', type: 'class', allowAll: false }, { key: 'subject', label: 'Subject' }, { key: 'file', label: 'PDF / image', type: 'file', required: true }]}
    columns={[{ key: 'title', label: 'Title', render: (x) => <strong>{x.title}</strong> }, { key: 'classNo', label: 'Class', render: (x) => clsLabel(x.classNo) }, { key: 'subject', label: 'Subject' }, { key: 'file', label: 'File', render: (x) => <FileLink file={x.file} itemId={x.id} kind="note" cls={x.classNo} /> }, byCol]} />
);

export const PtmManage = () => (
  <CrudManager collection="ptm" title="PTM meetings" noun="PTM" sub="Parent-Teacher Meeting ki date, time aur jagah. Parents ko apne panel mein notification dikhta hai." sortBy={(a, b) => (b.date || '').localeCompare(a.date || '')}
    defaults={{ classNo: 'all' }}
    fields={[{ key: 'title', label: 'Title', required: true, full: true }, { key: 'classNo', label: 'Class', type: 'class' }, { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'time', label: 'Time', type: 'time' }, { key: 'venue', label: 'Jagah (venue)' }, { key: 'note', label: 'Parents ke liye message', type: 'textarea' }]}
    columns={[{ key: 'title', label: 'PTM', render: (x) => <strong>{x.title}</strong> }, { key: 'classNo', label: 'Class', render: (x) => clsLabel(x.classNo) }, { key: 'date', label: 'Date', render: (x) => `${fmtDate(x.date)} ${x.time || ''}` }, { key: 'venue', label: 'Venue' }, byCol]} />
);