import { useState } from 'react';
import Modal from './Modal';
import PdfReader from './PdfReader';
import Icon from './Icon';
import { useCanDownload } from '../lib/hooks';
import { resolveUrl } from '../services/files';

// "View" button: file in-app khulti hai (track hoti hai). Download tabhi dikhega jab admin ne on kiya ho.
export default function FileLink({ file, itemId, kind = 'file', cls, label = 'View' }) {
  const [open, setOpen] = useState(false);
  const canDownload = useCanDownload();
  if (!file) return <span className="muted">—</span>;
  return (
    <>
      <div className="row-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}><Icon name="eye" size={16} /> {label}</button>
        {canDownload && <a className="btn btn-ghost btn-sm" href={resolveUrl(file.url)} download={file.name}><Icon name="download" size={16} /></a>}
      </div>
      {open && <Modal title={file.name} onClose={() => setOpen(false)} size="lg"><PdfReader file={file} kind={kind} itemId={itemId} cls={cls} /></Modal>}
    </>
  );
}
