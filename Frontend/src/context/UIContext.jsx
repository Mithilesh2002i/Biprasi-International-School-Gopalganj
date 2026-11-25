import { createContext, useCallback, useContext, useState } from 'react';
import Modal from '../components/Modal';
import Icon from '../components/Icon';

const Ctx = createContext(null);
export const useUI = () => useContext(Ctx);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const toast = useCallback((message, type = 'ok') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
  const close = (v) => { dialog.resolve(v); setDialog(null); };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}><Icon name={t.type === 'err' ? 'x' : 'check'} size={18} />{t.message}</div>
        ))}
      </div>
      {dialog && (
        <Modal title={dialog.title || 'Are you sure?'} onClose={() => close(false)} size="sm"
          footer={<>
            <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
            <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>{dialog.confirmText || 'Confirm'}</button>
          </>}>
          <p>{dialog.message}</p>
        </Modal>
      )}
    </Ctx.Provider>
  );
}