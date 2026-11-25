export const cn = (...a) => a.filter(Boolean).join(' ');

const p2 = (n) => String(n).padStart(2, '0');
export const fmtDay = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const today = () => fmtDay(new Date());

export function lastDays(n, end = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(fmtDay(d));
  }
  return out;
}

export function fmtDate(day) {
  if (!day) return '—';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function fmtShort(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function fmtDuration(sec = 0) {
  sec = Math.round(sec);
  if (sec <= 0) return '0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${p2(m)}m`;
  if (m) return s && m < 10 ? `${m}m ${p2(s)}s` : `${m}m`;
  return `${s}s`;
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return { text: 'Good morning', icon: 'sun' };
  if (h < 17) return { text: 'Good afternoon', icon: 'sunset' };
  return { text: 'Good evening', icon: 'moon' };
}

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const pad = p2;
export const daysBack = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() - n); return fmtDay(d); };
export const monthsBack = (n, from = new Date()) => fmtDay(new Date(from.getFullYear(), from.getMonth() - n, from.getDate()));
export const fmtWeekday = (day) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short' }); };
export const isImageName = (n = '') => /\.(png|jpe?g|gif|webp|svg)$/i.test(n);