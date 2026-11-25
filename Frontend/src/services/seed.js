import { CLASS_LIST, DEFAULT_SCHOOL_NAME } from '../config';
import { SAMPLE } from './files';
import { daysBack, fmtDay, lastDays, monthsBack } from '../lib/utils';

// Demo data. Ye sirf pehli baar browser mein bharta hai. Backend aane par ye poora file hata sakte ho.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SUBJECT_META = {
  hindi: { en: 'Hindi', hi: 'हिन्दी', tone: 0 },
  english: { en: 'English', hi: 'अंग्रेज़ी', tone: 1 },
  maths: { en: 'Maths', hi: 'गणित', tone: 2 },
  evs: { en: 'EVS', hi: 'पर्यावरण अध्ययन', tone: 3 },
  science: { en: 'Science', hi: 'विज्ञान', tone: 3 },
  sst: { en: 'Social Science', hi: 'सामाजिक विज्ञान', tone: 4 },
  sanskrit: { en: 'Sanskrit', hi: 'संस्कृत', tone: 5 },
  computer: { en: 'Computer', hi: 'कंप्यूटर', tone: 1 },
};

const subjectsFor = (c) =>
  c <= 2 ? ['hindi', 'english', 'maths', 'evs']
    : c <= 5 ? ['hindi', 'english', 'maths', 'evs', 'computer']
      : c <= 8 ? ['hindi', 'english', 'maths', 'science', 'sst', 'sanskrit', 'computer']
        : ['hindi', 'english', 'maths', 'science', 'sst', 'computer'];

const POOL = {
  hindi: ['वर्णमाला और शब्द', 'कहानी', 'कविता', 'पत्र लेखन', 'व्याकरण'],
  english: ['Letters & Sounds', 'Story Time', 'Poem', 'Grammar Basics', 'Letter Writing'],
  maths: ['Numbers', 'Addition & Subtraction', 'Multiplication', 'Shapes', 'Measurement'],
  evs: ['Our Family', 'Plants Around Us', 'Animals', 'Water', 'Food We Eat'],
  science: ['Matter', 'Motion', 'Light', 'Living World', 'Force and Energy'],
  sst: ['Early Times', 'Our Earth', 'Our Government', 'Economics Basics', 'Maps'],
  sanskrit: ['वर्णमाला', 'शब्द रूप', 'धातु रूप', 'सुभाषित', 'अनुवाद'],
  computer: ['Parts of a Computer', 'Keyboard & Mouse', 'MS Paint', 'Internet Safety', 'Typing'],
};

const FIRST = ['Aarav', 'Ananya', 'Vihaan', 'Diya', 'Aditya', 'Ishita', 'Rohan', 'Kavya', 'Arjun', 'Meera', 'Kabir', 'Riya', 'Yash', 'Sneha', 'Harsh', 'Pooja', 'Nikhil', 'Anjali', 'Sahil', 'Neha', 'Rahul', 'Priya', 'Ayush', 'Simran'];
const LAST = ['Kumar', 'Singh', 'Sharma', 'Verma', 'Yadav', 'Prasad', 'Mishra', 'Gupta', 'Jha', 'Roy'];

const TEACHERS = [
  ['Sunita Sharma', 'Maths', [6, 7, 8, 9, 10]],
  ['Rajesh Kumar', 'Science', [6, 7, 8, 9, 10]],
  ['Anita Verma', 'English', [3, 4, 5, 6, 7, 8]],
  ['Manoj Mishra', 'Hindi', [1, 2, 3, 4, 5]],
  ['Pooja Singh', 'Social Science', [6, 7, 8, 9, 10]],
  ['Vikash Jha', 'Computer', [3, 4, 5, 6, 7, 8, 9, 10]],
  // Baaki classes/subjects ke teachers (class diary mein har period ka teacher dikhane ke liye)
  ['Kavita Kumari', 'Maths', [1, 2, 3, 4, 5]],
  ['Amit Prasad', 'English', [1, 2, 9, 10]],
  ['Neelam Singh', 'EVS', [1, 2, 3, 4, 5]],
  ['Sudha Mishra', 'Hindi', [6, 7, 8, 9, 10]],
  ['Ravi Shankar', 'Sanskrit', [6, 7, 8]],
];

export const DEFAULT_PERMS = { tests: true, results: true, notices: true, exams: true, marksheets: true, college: true, notes: true, doubts: true, diary: true, ptm: true };

export function buildSeed() {
  const r = rng(42);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const days = lastDays(14);
  const now = new Date();

  // ---------- Content tree ----------
  const subjects = [], books = [], chapters = [];
  CLASS_LIST.forEach((c) => {
    subjectsFor(c).forEach((key) => {
      const m = SUBJECT_META[key];
      const sid = `s-${c}-${key}`;
      subjects.push({ id: sid, classNo: c, name: m.en, hindi: m.hi, tone: m.tone });
      const bid = `b-${c}-${key}`;
      books.push({ id: bid, subjectId: sid, classNo: c, title: `${m.en} — Class ${c}`, description: `Class ${c} ${m.en} ki main kitab, videos aur exercises ke saath.`, published: true });
      POOL[key].forEach((t, i) => {
        const cid = `ch-${c}-${key}-${i + 1}`;
        let quiz = [];
        if (key === 'maths') {
          quiz = [0, 1, 2].map(() => {
            const a = 3 + Math.floor(r() * 9) * c, b = 2 + Math.floor(r() * 9);
            const ans = a + b;
            const opts = [ans, ans + 1, ans - 2, ans + 10].sort(() => r() - 0.5);
            return { q: `${a} + ${b} = ?`, options: opts.map(String), answer: opts.indexOf(ans) };
          });
        }
        chapters.push({
          id: cid, bookId: bid, subjectId: sid, classNo: c, no: i + 1, title: t, published: true,
          videos: [{ id: `${cid}-v1`, title: `${t} — Lecture`, url: SAMPLE.video }],
          pdf: { name: `${m.en}-C${c}-Ch${i + 1}.pdf`, url: SAMPLE.pdf },
          exercise: { name: `${m.en}-C${c}-Ch${i + 1}-Exercise.pdf`, url: SAMPLE.exercise },
          quiz,
        });
      });
    });
  });

  // ---------- People ----------
  const students = [];
  for (let i = 1; i <= 52; i++) {
    const classNo = ((i - 1) % 10) + 1;
    const name = `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
    const joined = new Date(now); joined.setDate(joined.getDate() - Math.floor(r() * 40));
    const pending = i > 48;
    students.push({
      id: `st${i}`, studentId: pending ? null : `BIS26-${String(i).padStart(4, '0')}`, name, classNo,
      fatherName: `${pick(['Ramesh', 'Suresh', 'Dinesh', 'Mahesh', 'Anil'])} ${LAST[(i * 3) % LAST.length]}`,
      mobile: `98765${String(40000 + i)}`, parentMobile: `97000${String(40000 + i)}`, email: `${name.split(' ')[0].toLowerCase()}${i}@example.com`,
      mobileVerified: true, emailVerified: !pending, status: pending ? 'pending' : 'active', joinedAt: fmtDay(joined),
    });
  }
  const teachers = TEACHERS.map(([name, subject, classes], i) => {
    const joined = new Date(now); joined.setDate(joined.getDate() - 30 - i * 3);
    return {
      id: `t${i + 1}`, teacherId: `TCH26-${String(i + 1).padStart(3, '0')}`, regNo: `REG-${1001 + i}`, name, subject, classes,
      mobile: `98110000${10 + i}`, email: `${name.split(' ')[0].toLowerCase()}@example.com`, status: 'active',
      mobileVerified: true, joinedAt: fmtDay(joined), perms: { ...DEFAULT_PERMS },
    };
  });

  // ---------- Activity (14 days, demo) ----------
  const activity = [];
  const add = (u, role, kind, itemId, cls, day, sec, opens = 1) => {
    const hit = activity.find((a) => a.uid === u && a.kind === kind && a.itemId === itemId && a.day === day);
    if (hit) { hit.sec += sec; hit.opens += opens; } else activity.push({ uid: u, role, kind, itemId, cls, day, sec, opens });
  };
  const chByClass = {}; chapters.forEach((c) => (chByClass[c.classNo] = chByClass[c.classNo] || []).push(c));
  const neverLoggedIn = new Set(['st45', 'st46', 'st47', 'st48']);
  const simulate = (u, role, classes, p, perDay) => {
    days.forEach((d, di) => {
      const dow = new Date(d).getDay();
      if (r() > (dow === 0 ? p * 0.4 : p)) return;
      add(u, role, 'login', 'login', null, d, 0, 1);
      const n = 1 + Math.floor(r() * perDay);
      for (let k = 0; k < n; k++) {
        const cls = pick(classes), ch = pick(chByClass[cls]), x = r();
        if (x < 0.6) add(u, role, 'video', ch.videos[0].id, cls, d, 120 + Math.floor(r() * 1500));
        else if (x < 0.9) add(u, role, 'pdf', `${ch.id}-pdf`, cls, d, 60 + Math.floor(r() * 900));
        else add(u, role, 'exercise', `${ch.id}-ex`, cls, d, 60 + Math.floor(r() * 600));
      }
    });
  };
  students.forEach((s) => { if (s.status === 'active' && !neverLoggedIn.has(s.id)) simulate(s.id, 'student', [s.classNo], 0.5, 3); });
  teachers.forEach((t) => simulate(t.id, 'teacher', t.classes, 0.88, 5));

  // ---------- Records ----------
  const d0 = fmtDay(now);
  const tests = [
    { id: 'tst1', title: 'Maths Unit Test 1', classNo: 6, subject: 'Maths', duration: 10, published: true, by: 'Sunita Sharma', createdAt: d0, questions: [
      { q: '12 + 15 = ?', options: ['25', '27', '28', '29'], answer: 1 },
      { q: 'Which is the smallest prime number?', options: ['0', '1', '2', '3'], answer: 2 },
      { q: '9 × 7 = ?', options: ['56', '63', '72', '54'], answer: 1 },
      { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
      { q: '100 − 37 = ?', options: ['53', '63', '73', '67'], answer: 1 },
    ] },
    { id: 'tst2', title: 'Science Quick Test — Light', classNo: 8, subject: 'Science', duration: 8, published: true, by: 'Rajesh Kumar', createdAt: d0, questions: [
      { q: 'Light travels fastest in…', options: ['Water', 'Glass', 'Vacuum', 'Air'], answer: 2 },
      { q: 'A mirror that curves inward is called…', options: ['Convex', 'Concave', 'Plane', 'Flat'], answer: 1 },
      { q: 'The splitting of white light into colours is…', options: ['Reflection', 'Dispersion', 'Refraction', 'Absorption'], answer: 1 },
    ] },
    { id: 'tst3', title: 'Class 10 Maths Practice', classNo: 10, subject: 'Maths', duration: 15, published: false, by: 'Sunita Sharma', createdAt: d0, questions: [
      { q: 'Value of sin 90° is…', options: ['0', '1/2', '1', '√3/2'], answer: 2 },
      { q: 'Roots of x² − 5x + 6 = 0 are…', options: ['2, 3', '1, 6', '−2, −3', '2, −3'], answer: 0 },
    ] },
  ];
  const attempts = [
    { id: 'at1', testId: 'tst1', studentId: 'st6', score: 4, total: 5, date: d0 },
    { id: 'at2', testId: 'tst1', studentId: 'st16', score: 3, total: 5, date: d0 },
  ];
  const notices = [
    { id: 'n1', title: 'Welcome to the new session', body: 'Naya satra shuru ho gaya hai. Sabhi students apni class ke videos aur books dekh sakte hain.', classNo: 'all', pinned: true, by: 'School Admin', byRole: 'admin', createdAt: d0 },
    { id: 'n2', title: 'Half-yearly exam time table', body: 'Time table Exams section mein upload kar diya gaya hai. Kripya dhyan se dekhein.', classNo: 'all', pinned: false, by: 'School Admin', byRole: 'admin', createdAt: d0 },
    { id: 'n3', title: 'Class 10: Maths doubt session', body: 'Class 10 ke students apne doubts Doubts section mein likh dein.', classNo: 10, pinned: false, by: 'Sunita Sharma', byRole: 'teacher', createdAt: d0 },
  ];
  const exams = [
    { id: 'e1', name: 'Half-Yearly Exam', classNo: 'all', date: fmtDay(new Date(now.getTime() + 20 * 864e5)), time: '10:00', subject: 'All subjects', syllabus: 'Chapters 1 to 3 of every subject', by: 'School Admin', createdAt: d0 },
    { id: 'e2', name: 'Maths Unit Test', classNo: 6, date: fmtDay(new Date(now.getTime() + 6 * 864e5)), time: '09:30', subject: 'Maths', syllabus: 'Chapter 1 and 2', by: 'Sunita Sharma', createdAt: d0 },
  ];
  // ---------- Results: pichhle 6 mahine ke 4 exams (har active student, har subject) ----------
  const r2 = rng(7); // alag random stream, taaki upar ka demo data na badle
  const teacherFor = (c, subj) => teachers.find((t) => t.subject === subj && t.classes.includes(c)) || teachers[0];
  const activeStudents = students.filter((s) => s.status === 'active');
  const ability = {}; activeStudents.forEach((s) => { ability[s.id] = 0.45 + r2() * 0.5; });
  const EXAMS = [['Unit Test 1', 150, 50], ['Unit Test 2', 100, 50], ['Half-Yearly Exam', 50, 100], ['Unit Test 3', 12, 50]];
  const results = [];
  activeStudents.forEach((s) => {
    subjectsFor(s.classNo).forEach((key) => {
      const m = SUBJECT_META[key];
      EXAMS.forEach(([exam, ago, total], ei) => {
        const pct = Math.max(0.25, Math.min(0.99, ability[s.id] + ei * 0.02 + (r2() - 0.5) * 0.3 - (key === 'maths' ? 0.04 : 0)));
        results.push({ id: `r-${s.id}-${ei}-${key}`, studentRef: s.id, exam, subject: m.en, marks: Math.round(pct * total), total, by: teacherFor(s.classNo, m.en).name, byRole: 'teacher', createdAt: daysBack(ago) });
      });
    });
  });

  // ---------- Class diary: pichhle 6 mahine, har class, roz 5 period (Sunday off) ----------
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const demoPhoto = (subject, topic, c) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><rect width='640' height='400' fill='#1f3d2f'/><rect x='14' y='14' width='612' height='372' rx='8' fill='none' stroke='#c9a66b' stroke-width='6'/><text x='40' y='90' font-family='Georgia,serif' font-size='34' fill='#f4f0e3'>${esc(subject)} - Class ${c}</text><text x='40' y='150' font-family='Georgia,serif' font-size='26' fill='#e8e2cc'>${esc(topic)}</text><text x='40' y='240' font-family='Georgia,serif' font-size='22' fill='#cfe6d6'>(Demo photo: board / notebook work)</text></svg>`)}`;
  const dow = (d) => { const [y, m, dn] = d.split('-').map(Number); return new Date(y, m - 1, dn).getDay(); };
  const fromDay = monthsBack(6);
  const schoolDays = []; for (let i = 0; ; i++) { const dd = daysBack(i); if (dd < fromDay) break; if (dow(dd) !== 0) schoolDays.push(dd); }
  schoolDays.reverse();
  const byClass = {}; activeStudents.forEach((s) => (byClass[s.classNo] = byClass[s.classNo] || []).push(s));
  const diligence = {}; activeStudents.forEach((s) => { diligence[s.id] = 0.5 + r2() * 0.47; });
  const diary = [];
  schoolDays.forEach((day, di) => {
    CLASS_LIST.forEach((c) => {
      const keys = subjectsFor(c);
      for (let p = 1; p <= 5; p++) {
        const key = keys[(di + p + c) % keys.length]; const m = SUBJECT_META[key];
        const topic = POOL[key][Math.floor(di / 12) % POOL[key].length];
        const hasEx = r2() < 0.8;
        const entries = {}; const notes = {};
        (byClass[c] || []).forEach((s) => {
          const d = Math.max(0.2, Math.min(0.99, diligence[s.id] + (((s.id.length + key.length + di) % 7) - 3) * 0.03));
          if (r2() < 0.04) { entries[s.id] = 'a'; return; }
          if (!hasEx) { entries[s.id] = 'x'; return; }
          const y = r2();
          entries[s.id] = y < d ? 'd' : y < d + (1 - d) * 0.4 ? 'p' : 'n';
          if (di > schoolDays.length - 30 && entries[s.id] !== 'd' && r2() < 0.35) notes[s.id] = entries[s.id] === 'p' ? 'Aadha kaam hua, baaki ghar par poora karein.' : 'Copy mein kaam nahi mila. Kal jama karein.';
        });
        const rec = { id: `${day}_${c}_${p}`, date: day, classNo: c, period: p, subject: m.en, teacherId: teacherFor(c, m.en).id, topic, exercise: hasEx ? `${topic} — Exercise ${1 + ((di + p) % 4)}` : '', entries };
        if (Object.keys(notes).length) rec.notes = notes;
        if (hasEx && di >= schoolDays.length - 2) rec.photos = [demoPhoto(m.en, topic, c)];
        diary.push(rec);
      }
    });
  });

  // ---------- PTM (parent-teacher meeting) ----------
  const ptm = [
    { id: 'ptm1', title: 'Parent-Teacher Meeting (Term result)', classNo: 'all', date: daysBack(-9), time: '10:00', venue: 'School hall', note: 'Sabhi parents bachche ke saath aayein. Report card diya jayega.', by: 'School Admin', byRole: 'admin', createdAt: d0 },
    { id: 'ptm2', title: 'PTM — Class 6 (Maths aur Science)', classNo: 6, date: daysBack(-3), time: '11:30', venue: 'Class 6 room', note: 'Exercise na karne wale bachchon ke parents zaroor aayein.', by: 'Sunita Sharma', byRole: 'teacher', createdAt: d0 },
    { id: 'ptm3', title: 'Parent-Teacher Meeting (Unit Test 2)', classNo: 'all', date: daysBack(45), time: '10:00', venue: 'School hall', note: 'Unit Test 2 ke marks par charcha.', by: 'School Admin', byRole: 'admin', createdAt: daysBack(52) },
  ];
  const marksheets = [
    { id: 'm1', title: 'Annual Marksheet 2025-26', classNo: 6, studentRef: '', file: { name: 'marksheet-class6.pdf', url: SAMPLE.pdf }, by: 'School Admin', createdAt: d0 },
  ];
  const college = [
    { id: 'c1', title: 'B.Tech (Computer Science)', stream: 'Engineering', duration: '4 years', eligibility: '12th with PCM', description: '12th ke baad engineering ka rasta. Entrance exam: JEE / state CET.', file: { name: 'btech-guide.pdf', url: SAMPLE.pdf }, by: 'School Admin', createdAt: d0 },
    { id: 'c2', title: 'B.Sc (Nursing)', stream: 'Medical', duration: '4 years', eligibility: '12th with PCB', description: 'Nursing college course ki jaankari aur admission process.', file: null, by: 'School Admin', createdAt: d0 },
  ];
  const notes = [
    { id: 'p1', title: 'Maths formulas — Class 9', classNo: 9, subject: 'Maths', file: { name: 'formulas.pdf', url: SAMPLE.pdf }, by: 'Sunita Sharma', byRole: 'teacher', createdAt: d0 },
    { id: 'p2', title: 'Hindi vyakaran notes', classNo: 5, subject: 'Hindi', file: { name: 'vyakaran.pdf', url: SAMPLE.pdf }, by: 'Manoj Mishra', byRole: 'teacher', createdAt: d0 },
  ];
  const doubts = [
    { id: 'd1', studentRef: 'st6', classNo: 6, subject: 'Maths', text: 'Prime number aur composite number mein kya fark hai?', status: 'open', createdAt: d0, replies: [] },
    { id: 'd2', studentRef: 'st8', classNo: 8, subject: 'Science', text: 'Concave aur convex mirror ka use kahan hota hai?', status: 'resolved', createdAt: d0, replies: [{ by: 'Rajesh Kumar', byRole: 'teacher', text: 'Concave: torch, dentist mirror. Convex: gaadi ke side mirror.', date: d0 }] },
  ];

  return {
    version: 1,
    admin: { username: 'admin', password: 'admin123', name: 'School Admin' },
    settings: {
      schoolName: DEFAULT_SCHOOL_NAME,
      city: 'Gopalganj',
      tagline: 'Indian Heritage – Global Excellence',
      intro: 'Class 1 se 10 tak ki padhai — video lectures, kitaaben, exercises aur tests, ek hi jagah.',
      about: 'Biprasi International School, Gopalganj ka ye online portal har bachche ko uski class ke hisaab se video lectures, kitaaben, exercises aur tests deta hai. Teachers aur school ek saath bachchon ki padhai par nazar rakhte hain.',
      address: 'Thawe Road, Gopalganj, Bihar - 841428', phone: '+91-9599295144', phone2: '+91-9955594588', email: 'biprasiinternational@gmail.com',
      downloads: { student: false, teacher: false },
      liveFeature: false,
      live: { isLive: false, title: '', classNo: 'all', subject: '', link: '', startsAt: '' },
      maintenance: false,
      defaultPerms: { ...DEFAULT_PERMS },
    },
    subjects, books, chapters, students, teachers, activity,
    tests, attempts, notices, exams, results, marksheets, college, notes, doubts, support: [], diary, ptm,
  };
}