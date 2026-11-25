// Analytics helpers: activity records se admin dashboard ke numbers nikalte hain.
import { lastDays } from './utils';

export function buildChapterIndex(db) {
  const map = {};
  db.chapters.forEach((c) => { map[c.id] = c; });
  return map;
}
// activity itemId -> readable info
export function itemInfo(db, chIndex, a) {
  if (a.kind === 'login') return { title: 'Login', sub: '' };
  if (a.kind === 'note') { const n = db.notes.find((x) => x.id === a.itemId); return { title: n ? n.title : 'Notes PDF', sub: n ? `${n.subject || ''}` : '' }; }
  if (a.kind === 'file') return { title: 'Uploaded file', sub: '' };
  if (a.kind === 'quiz' || a.kind === 'test') { const t = db.tests.find((x) => x.id === a.itemId); return { title: t ? t.title : 'Quiz', sub: t ? t.subject : '' }; }
  const chId = a.itemId.replace(/-(v\d+|pdf|ex)$/, '');
  const ch = chIndex[chId];
  if (!ch) return { title: a.itemId, sub: '' };
  const sub = db.subjects.find((s) => s.id === ch.subjectId);
  const label = a.kind === 'video' ? 'Video' : a.kind === 'exercise' ? 'Exercise' : 'Book PDF';
  return { title: `${ch.title} — ${label}`, sub: `${sub ? sub.name : ''} · Ch ${ch.no}` };
}

export const activeSet = (db, day, role) => new Set(db.activity.filter((a) => a.day === day && (!role || a.role === role)).map((a) => a.uid));

export function dauSeries(db, n = 14) {
  return lastDays(n).map((day) => ({ day, students: activeSet(db, day, 'student').size, teachers: activeSet(db, day, 'teacher').size }));
}
export function joinsSeries(db, n = 14) {
  return lastDays(n).map((day) => ({
    day,
    students: db.students.filter((s) => s.joinedAt === day).length,
    teachers: db.teachers.filter((t) => t.joinedAt === day).length,
  }));
}
export function loggedInSet(db) {
  return new Set(db.activity.filter((a) => a.kind === 'login').map((a) => a.uid));
}
export function userDay(db, uidv, day) {
  const rows = db.activity.filter((a) => a.uid === uidv && a.day === day && a.kind !== 'login');
  const sum = (k) => rows.filter((a) => a.kind === k).reduce((s, a) => s + a.sec, 0);
  const cnt = (k) => rows.filter((a) => a.kind === k && a.opens > 0).length;
  return {
    rows,
    videoSec: sum('video'), videosPlayed: cnt('video'),
    pdfSec: sum('pdf') + sum('exercise') + sum('note'), pdfCount: cnt('pdf') + cnt('exercise') + cnt('note'),
    loggedIn: db.activity.some((a) => a.uid === uidv && a.day === day && a.kind === 'login'),
  };
}
export function lastSeen(db, uidv) {
  let d = '';
  db.activity.forEach((a) => { if (a.uid === uidv && a.day > d) d = a.day; });
  return d;
}