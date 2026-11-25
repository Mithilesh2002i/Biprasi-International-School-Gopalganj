import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDB } from '../services/db';
import { trackActivity } from '../services/api';

// Download allowed? (Admin ke settings se on/off hota hai)
export function useCanDownload() {
  const { role } = useAuth();
  const db = useDB();
  if (role === 'admin') return true;
  return !!db.settings.downloads?.[role];
}

// Time tracker: jab `running` true ho aur tab visible ho, har second count karta hai
// aur har 10 second mein activity save karta hai. Admin ke analytics yahin se bante hain.
export function useActivityTracker({ kind, itemId, cls }, running) {
  const { user, role } = useAuth();
  const pending = useRef(0);
  const opened = useRef(false);
  const meta = useRef({});
  meta.current = { uid: user?.id, role, kind, itemId, cls };

  const flush = useCallback((open = false) => {
    const sec = pending.current;
    if (!sec && !open) return;
    pending.current = 0;
    trackActivity({ ...meta.current, sec, open });
  }, []);

  const markOpen = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    flush(true);
  }, [flush]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pending.current += 1;
        if (pending.current >= 10) flush();
      }
    }, 1000);
    return () => { clearInterval(t); flush(); };
  }, [running, flush]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); flush(); };
  }, [flush]);

  return { markOpen };
}

export function usePageTitle(t) {
  const db = useDB();
  useEffect(() => { document.title = t ? `${t} · ${db.settings.schoolName}` : db.settings.schoolName; }, [t, db.settings.schoolName]);
}

// Toast / confirm popups app ke bahar render hote hain, isliye theme <html> par bhi lagate hain.
export function useTheme(theme) {
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
}