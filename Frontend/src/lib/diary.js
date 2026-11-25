// Class diary helpers: ek period ka status codes aur parent reports ke hisaab-kitaab.
import { monthsBack } from './utils';

// Har student ka status ek letter code mein save hota hai
export const STATUS = {
  d: { label: 'Exercise poora kiya', short: 'Done', tone: 'ok' },
  p: { label: 'Adhura kiya', short: 'Partial', tone: 'warn' },
  n: { label: 'Nahi kiya', short: 'Not done', tone: 'bad' },
  a: { label: 'Absent', short: 'Absent', tone: 'neutral' },
  x: { label: 'Aaj exercise nahi tha', short: 'No exercise', tone: 'info' },
};
export const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

// list = diary periods, id = student id
export function tally(list, id) {
  const t = { periods: list.length, marked: 0, present: 0, absent: 0, done: 0, partial: 0, notdone: 0, noex: 0 };
  list.forEach((p) => {
    const c = p.entries?.[id];
    if (!c) return;
    t.marked += 1;
    if (c === 'a') { t.absent += 1; return; }
    t.present += 1;
    if (c === 'd') t.done += 1; else if (c === 'p') t.partial += 1; else if (c === 'n') t.notdone += 1; else t.noex += 1;
  });
  t.assigned = t.done + t.partial + t.notdone; // jin periods mein exercise mila
  t.pct = t.assigned ? Math.round((t.done / t.assigned) * 100) : null; // exercise completion %
  t.attPct = t.marked ? Math.round((t.present / t.marked) * 100) : null; // attendance %
  return t;
}
export const toneFor = (pct) => (pct == null ? 'neutral' : pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'bad');

export const teacherName = (db, p) => db.teachers.find((t) => t.id === p.teacherId)?.name || p.by || 'Teacher';

// Pichhle 6 mahine ke (YYYY-MM) keys, purane se naye
export function lastMonthKeys(n = 6, from = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(from.getFullYear(), from.getMonth() - i, 1); out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }
  return out;
}
export const monthLabel = (key) => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' }); };
export const SIX_MONTHS_AGO = () => monthsBack(6);