import { useMemo, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { Empty, PageHead, Field } from './Common';
import { useDB } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { crud } from '../services/api';
import { registerFile } from '../services/files';
import { cn } from '../lib/utils';

// Ek hi component se Notices / Exams / Results / Marksheets / College / Notes — sab Add, Edit, Delete.
// fields: [{key,label,type:'text'|'textarea'|'number'|'date'|'time'|'select'|'class'|'file'|'check', options, required, full}]
export default function CrudManager({ collection, title, sub, noun, fields, columns, defaults = {}, rowFilter, sortBy, accept = '.pdf,image/*' }) {
  const db = useDB();
  const { user, role } = useAuth();
  const { toast, confirm } = useUI();
  const [form, setForm] = useState(null); // null | {id?, ...values}
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    let r = db[collection];
    if (rowFilter) r = r.filter((x) => rowFilter(x, db));
    if (q) r = r.filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
    return sortBy ? [...r].sort(sortBy) : r;
  }, [db, collection, rowFilter, q, sortBy]);

  // Teacher sirf apne banaye records edit/delete kar sakta hai; Admin sab.
  const canTouch = (x) => role === 'admin' || x.by === user.name;
  const optionsOf = (f) => (typeof f.options === 'function' ? f.options(db, form) : f.options || []);

  const open = (item) => setForm(item ? { ...item } : { ...defaults });
  const save = async () => {
    const missing = fields.find((f) => f.required && (form[f.key] === undefined || form[f.key] === '' || form[f.key] === null));
    if (missing) return toast(`${missing.label} bharna zaroori hai`, 'err');
    if (form.id) { await crud.update(collection, form.id, form); toast('Updated'); }
    else { await crud.add(collection, { ...form, by: user.name, byRole: role }); toast('Added'); }
    setForm(null);
  };
  const remove = async (x) => {
    if (await confirm({ title: `Delete ${noun}?`, message: 'Ye wapas nahi aa sakta.', danger: true, confirmText: 'Delete' })) { await crud.remove(collection, x.id); toast('Deleted'); }
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const renderInput = (f) => {
    const v = form[f.key] ?? '';
    switch (f.type) {
      case 'textarea': return <textarea className="input" rows={3} value={v} onChange={(e) => set(f.key, e.target.value)} />;
      case 'select': return <select className="input" value={v} onChange={(e) => set(f.key, e.target.value)}><option value="">Select…</option>{optionsOf(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case 'class': return <select className="input" value={v} onChange={(e) => set(f.key, e.target.value === 'all' ? 'all' : Number(e.target.value))}>{f.allowAll !== false && <option value="all">All classes</option>}{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => <option key={c} value={c}>Class {c}</option>)}</select>;
      case 'file': return (
        <div className="filepick">
          <input type="file" accept={accept} onChange={(e) => { const file = e.target.files[0]; if (file) set(f.key, registerFile(file)); }} />
          {form[f.key] && <span className="muted"><Icon name="file" size={15} /> {form[f.key].name}</span>}
        </div>);
      case 'check': return <input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(f.key, e.target.checked)} />;
      default: return <input className="input" type={f.type || 'text'} value={v} onChange={(e) => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} />;
    }
  };

  return (
    <>
      <PageHead title={title} sub={sub} actions={<button className="btn btn-primary" onClick={() => open()}><Icon name="plus" size={18} /> Add {noun}</button>} />
      <div className="toolbar"><div className="search"><Icon name="search" size={17} /><input placeholder={`Search ${title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      {rows.length === 0 ? <Empty title={`No ${title.toLowerCase()} yet`} text={`"Add ${noun}" dabakar pehla record banayein.`} /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th className="right">Actions</th></tr></thead>
          <tbody>{rows.map((x) => (
            <tr key={x.id}>
              {columns.map((c) => <td key={c.key} data-label={c.label}>{c.render ? c.render(x, db) : x[c.key] ?? '—'}</td>)}
              <td className="right"><div className="row-actions">
                {canTouch(x) ? <>
                  <button className="icon-btn" onClick={() => open(x)} aria-label="Edit"><Icon name="edit" size={17} /></button>
                  <button className="icon-btn danger" onClick={() => remove(x)} aria-label="Delete"><Icon name="trash" size={17} /></button>
                </> : <span className="muted" title="Sirf banane wala edit kar sakta hai"><Icon name="lock" size={15} /></span>}
              </div></td>
            </tr>))}</tbody>
        </table></div>)}
      {form && (
        <Modal title={form.id ? `Edit ${noun}` : `Add ${noun}`} onClose={() => setForm(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>{form.id ? 'Save changes' : `Add ${noun}`}</button></>}>
          <div className="form-grid">
            {fields.map((f) => <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`} full={f.full || f.type === 'textarea'} hint={f.hint}><div className={cn('field-ctl')}>{renderInput(f)}</div></Field>)}
          </div>
        </Modal>)}
    </>
  );
}
