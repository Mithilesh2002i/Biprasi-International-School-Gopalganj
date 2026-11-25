// Local "database" (localStorage). Backend aane par is file ki jagah API calls aayengi.
import { useSyncExternalStore } from 'react';
import { buildSeed } from './seed';

const KEY = 'bis_school_db_v4';
let state = null;
const listeners = new Set();

let persistOk = true;
export const lastPersistOk = () => persistOk; // false = browser storage full (photos zyada ho gayi)
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); persistOk = true; } catch (e) { persistOk = false; console.warn('Storage full', e); }
}
function init() {
  if (state) return;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch { /* ignore */ }
  if (!state) { state = buildSeed(); persist(); }
}
export const getDb = () => { init(); return state; };
export function mutate(fn) {
  init();
  const next = { ...state };
  fn(next); // fn must replace arrays/objects immutably
  state = next;
  persist();
  listeners.forEach((l) => l());
}
export const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const useDB = () => useSyncExternalStore(subscribe, getDb);
export function resetDemo() {
  localStorage.removeItem(KEY);
  localStorage.removeItem('bis_session_v2');
  state = null;
  init();
  listeners.forEach((l) => l());
}