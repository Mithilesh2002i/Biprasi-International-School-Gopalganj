// ============================================================================
// API LAYER — frontend ke saare "writes" yahin se jaate hain.
// Abhi ye localStorage database use karta hai. Backend jodte waqt sirf in
// functions ke andar fetch/axios calls likhni hain (signature same rahega).
// ============================================================================
import { getDb, mutate, lastPersistOk } from './db';
import { DEMO_OTP } from '../config';
import { today, uid } from '../lib/utils';

const wait = (v) => Promise.resolve(v);
const coll = (name, fn) => mutate((db) => { db[name] = fn(db[name]); });

// ---------------- AUTH ----------------
export const auth = {
  // Step 1: ID + mobile check karke OTP bhejo
  async requestOtp(role, { loginId, mobile }) {
    const db = getDb();
    if (db.settings.maintenance) return { ok: false, error: 'Portal abhi band hai. Kuch der baad try karein.' };
    const list = role === 'teacher' ? db.teachers : db.students; // parent bhi bachche ke record se login karta hai
    const key = role === 'teacher' ? 'regNo' : 'studentId';
    const phone = role === 'parent' ? 'parentMobile' : 'mobile'; // parent apne alag mobile number se
    const u = list.find((x) => x[key] && x[key].toLowerCase() === loginId.trim().toLowerCase() && x[phone] === mobile.trim());
    if (!u) return { ok: false, error: role === 'teacher' ? 'Registration number ya mobile number galat hai.' : role === 'parent' ? 'Student ID ya parent ka registered mobile number galat hai.' : 'Student ID ya mobile number galat hai.' };
    if (u.status === 'blocked') return { ok: false, error: 'Aapka account band hai. School se sampark karein.' };
    if (u.status === 'pending') return { ok: false, error: 'Aapka ID abhi verify nahi hua hai.' };
    return wait({ ok: true, userId: u.id }); // real backend: SMS OTP bhejega
  },
  // Step 2: OTP verify
  async verifyOtp(role, userId, otp) {
    if (otp.trim() !== DEMO_OTP) return { ok: false, error: 'OTP galat hai.' };
    // parent ka activity bachche ke activity se alag rakhne ke liye uid prefix
    await trackActivity({ uid: role === 'parent' ? `parent:${userId}` : userId, role, kind: 'login', itemId: 'login', cls: null, sec: 0, open: true });
    return { ok: true, session: { role, id: userId } };
  },
  // Student ke liye: OTP ke bina seedha login (ID + mobile match hone ke baad)
  async loginWithoutOtp(role, userId) {
    await trackActivity({ uid: userId, role, kind: 'login', itemId: 'login', cls: null, sec: 0, open: true });
    return { ok: true, session: { role, id: userId } };
  },
  async adminLogin(username, password) {
    const a = getDb().admin;
    if (username.trim() === a.username && password === a.password) return { ok: true, session: { role: 'admin', id: 'admin' } };
    return { ok: false, error: 'Username ya password galat hai.' };
  },
};

// ---------------- ACTIVITY TRACKING ----------------
export async function trackActivity({ uid: u, role, kind, itemId, cls, sec = 0, open = false }) {
  if (!u || role === 'admin') return;
  const day = today();
  mutate((db) => {
    const list = db.activity;
    const i = list.findIndex((a) => a.uid === u && a.kind === kind && a.itemId === itemId && a.day === day);
    if (i >= 0) {
      const next = list.slice();
      next[i] = { ...list[i], sec: list[i].sec + sec, opens: list[i].opens + (open ? 1 : 0) };
      db.activity = next;
    } else {
      db.activity = [...list, { uid: u, role, kind, itemId, cls, day, sec, opens: open ? 1 : 0 }];
    }
  });
}

// ---------------- SETTINGS ----------------
export const settings = {
  update: (patch) => wait(mutate((db) => { db.settings = { ...db.settings, ...patch }; })),
};

// ---------------- GENERIC RECORDS (notices, exams, results, ...) ----------------
export const crud = {
  add: (name, item) => { const rec = { id: uid(name.slice(0, 2)), createdAt: today(), ...item }; coll(name, (a) => [rec, ...a]); return wait(rec); },
  update: (name, id, patch) => wait(coll(name, (a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)))),
  remove: (name, id) => wait(coll(name, (a) => a.filter((x) => x.id !== id))),
};

// ---------------- PEOPLE ----------------
const nextNum = (list, key, prefix, width, base = 0) => {
  const nums = list.map((x) => x[key]).filter(Boolean).map((v) => parseInt(String(v).split('-').pop(), 10) || 0);
  return `${prefix}${String(Math.max(base, ...nums) + 1).padStart(width, '0')}`;
};
export const people = {
  addStudent: (data) => { const rec = { id: uid('st'), studentId: null, status: 'pending', mobileVerified: false, emailVerified: false, joinedAt: today(), ...data }; coll('students', (a) => [rec, ...a]); return wait(rec); },
  // Mobile + email OTP verify hone par unique Student ID generate hota hai
  async verifyStudent(id, { mobileOtp, emailOtp }) {
    if (mobileOtp !== DEMO_OTP || emailOtp !== DEMO_OTP) return { ok: false, error: 'Mobile ya email OTP galat hai.' };
    let sid = '';
    coll('students', (a) => a.map((s) => { if (s.id !== id) return s; sid = s.studentId || nextNum(a, 'studentId', 'BIS26-', 4); return { ...s, studentId: sid, mobileVerified: true, emailVerified: true, status: 'active' }; }));
    return { ok: true, studentId: sid };
  },
  updateStudent: (id, patch) => wait(coll('students', (a) => a.map((s) => (s.id === id ? { ...s, ...patch } : s)))),
  removeStudent: (id) => wait(coll('students', (a) => a.filter((s) => s.id !== id))),

  addTeacher: (data) => { const rec = { id: uid('t'), teacherId: null, regNo: null, status: 'pending', mobileVerified: false, joinedAt: today(), perms: { ...getDb().settings.defaultPerms }, classes: [], ...data }; coll('teachers', (a) => [rec, ...a]); return wait(rec); },
  async verifyTeacher(id, { mobileOtp }) {
    if (mobileOtp !== DEMO_OTP) return { ok: false, error: 'Mobile OTP galat hai.' };
    let out = {};
    coll('teachers', (a) => a.map((t) => { if (t.id !== id) return t; out = { teacherId: t.teacherId || nextNum(a, 'teacherId', 'TCH26-', 3), regNo: t.regNo || nextNum(a, 'regNo', 'REG-', 4, 1000) }; return { ...t, ...out, mobileVerified: true, status: 'active' }; }));
    return { ok: true, ...out };
  },
  updateTeacher: (id, patch) => wait(coll('teachers', (a) => a.map((t) => (t.id === id ? { ...t, ...patch } : t)))),
  removeTeacher: (id) => wait(coll('teachers', (a) => a.filter((t) => t.id !== id))),
};

// ---------------- COURSES (subjects, books, chapters) ----------------
export const courses = {
  addSubject: (data) => { const rec = { id: uid('s'), tone: 0, hindi: '', ...data }; coll('subjects', (a) => [...a, rec]); return wait(rec); },
  addBook: (data) => { const rec = { id: uid('b'), published: false, ...data }; coll('books', (a) => [...a, rec]); return wait(rec); },
  updateBook: (id, patch) => wait(coll('books', (a) => a.map((b) => (b.id === id ? { ...b, ...patch } : b)))),
  removeBook: (id) => wait(mutate((db) => { db.books = db.books.filter((b) => b.id !== id); db.chapters = db.chapters.filter((c) => c.bookId !== id); })),
  addChapter: (data) => { const rec = { id: uid('ch'), published: false, videos: [], pdf: null, exercise: null, quiz: [], ...data }; coll('chapters', (a) => [...a, rec]); return wait(rec); },
  updateChapter: (id, patch) => wait(coll('chapters', (a) => a.map((c) => (c.id === id ? { ...c, ...patch } : c)))),
  removeChapter: (id) => wait(coll('chapters', (a) => a.filter((c) => c.id !== id))),
};

// ---------------- TESTS ----------------
export const tests = {
  submit: (testId, studentId, answers) => {
    const t = getDb().tests.find((x) => x.id === testId);
    const score = t.questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
    const rec = { id: uid('at'), testId, studentId, score, total: t.questions.length, answers, date: today() };
    coll('attempts', (a) => [...a, rec]);
    return wait(rec);
  },
};

// ---------------- DOUBTS & SUPPORT ----------------
export const doubts = {
  ask: (data) => { const rec = { id: uid('d'), status: 'open', createdAt: today(), replies: [], ...data }; coll('doubts', (a) => [rec, ...a]); return wait(rec); },
  reply: (id, reply) => wait(coll('doubts', (a) => a.map((d) => (d.id === id ? { ...d, status: 'answered', replies: [...d.replies, { ...reply, date: today() }] } : d)))),
  setStatus: (id, status) => wait(coll('doubts', (a) => a.map((d) => (d.id === id ? { ...d, status } : d)))),
};
export const support = {
  send: (data) => { const rec = { id: uid('sp'), status: 'open', createdAt: today(), reply: '', ...data }; coll('support', (a) => [rec, ...a]); return wait(rec); },
  update: (id, patch) => wait(coll('support', (a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)))),
};

// ---------------- CLASS DIARY (period-wise exercise record) ----------------
// Ek period ka record: date + class + period number. Teacher har student ka status (done / partial / not done / absent) bharta hai.
export const diary = {
  save(rec, actor) {
    const id = `${rec.date}_${rec.classNo}_${rec.period}`;
    const old = getDb().diary.find((d) => d.id === id);
    if (old && actor.role === 'teacher' && old.teacherId !== actor.id) return wait({ ok: false, error: 'Is period ka record kisi aur teacher ne bhara hai.' });
    const full = { ...rec, id, teacherId: rec.teacherId || actor.id, updatedAt: today() };
    coll('diary', (a) => (old ? a.map((x) => (x.id === id ? full : x)) : [...a, full]));
    if (!lastPersistOk()) { // storage full: purana wapas rakho
      coll('diary', (a) => (old ? a.map((x) => (x.id === id ? old : x)) : a.filter((x) => x.id !== id)));
      return wait({ ok: false, error: 'Browser ki storage full hai. Photos kam karein (demo mode).' });
    }
    return wait({ ok: true, rec: full });
  },
  remove: (id) => wait(coll('diary', (a) => a.filter((x) => x.id !== id))),
};