import { useActivityTracker, useCanDownload } from '../lib/hooks';
import { resolveUrl, SAMPLE } from '../services/files';
import { isImageName } from '../lib/utils';
import Icon from './Icon';

// Reader: PDF/image ko page ke andar dikhata hai aur padhne ka time track karta hai.
export default function PdfReader({ file, kind = 'pdf', itemId, cls, fallback = SAMPLE.pdf }) {
  const canDownload = useCanDownload();
  const { markOpen } = useActivityTracker({ kind, itemId, cls }, true);
  const url = resolveUrl(file.url, fallback);
  const isImg = isImageName(file.name);
  // markOpen once when the reader mounts
  useOnce(markOpen);

  return (
    <div className="reader">
      <div className="reader-bar">
        <span className="muted"><Icon name="file" size={16} /> {file.name}</span>
        {canDownload
          ? <a className="btn btn-ghost btn-sm" href={url} download={file.name}><Icon name="download" size={16} /> Download</a>
          : <span className="muted"><Icon name="lock" size={15} /> Download off</span>}
      </div>
      {isImg
        ? <div className="reader-img"><img src={url} alt={file.name} onContextMenu={(e) => !canDownload && e.preventDefault()} /></div>
        : <iframe title={file.name} src={canDownload ? `${url}#navpanes=0` : `${url}#toolbar=0&navpanes=0`} />}
    </div>
  );
}
import { useEffect } from 'react';
function useOnce(fn) { useEffect(() => { fn(); }, []); } // eslint-disable-line react-hooks/exhaustive-deps
