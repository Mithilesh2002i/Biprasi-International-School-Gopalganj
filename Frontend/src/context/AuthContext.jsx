import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useDB } from '../services/db';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const KEY = 'bis_session_v2';

export function AuthProvider({ children }) {
  const db = useDB();
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } });

  const login = useCallback((s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } setSession(s); }, []);
  const logout = useCallback(() => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setSession(null); }, []);

  const user = useMemo(() => {
    if (!session) return null;
    if (session.role === 'student' || session.role === 'parent') return db.students.find((s) => s.id === session.id) || null;
    if (session.role === 'teacher') return db.teachers.find((t) => t.id === session.id) || null;
    return { id: 'admin', name: db.admin.name };
  }, [session, db.students, db.teachers, db.admin]);

  const value = { session, user, role: session?.role || null, login, logout };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}