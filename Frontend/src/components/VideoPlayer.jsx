import { useState } from 'react';
import { resolveUrl, SAMPLE } from '../services/files';
import { useActivityTracker, useCanDownload } from '../lib/hooks';
import { fmtDuration } from '../lib/utils';
import Icon from './Icon';

export default function VideoPlayer({ video, cls }) {
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(0);
  const canDownload = useCanDownload();
  const { markOpen } = useActivityTracker({ kind: 'video', itemId: video.id, cls }, playing);
  const url = resolveUrl(video.url, SAMPLE.video);

  return (
    <div className="player">
      <video key={url} src={url} controls playsInline preload="metadata"
        controlsList={canDownload ? undefined : 'nodownload noremoteplayback'} disablePictureInPicture={!canDownload}
        onContextMenu={(e) => !canDownload && e.preventDefault()}
        onPlay={() => { setPlaying(true); markOpen(); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setWatched(Math.max(watched, e.currentTarget.currentTime))} />
      <div className="player-bar">
        <span className="muted"><Icon name="clock" size={15} /> Watched {fmtDuration(watched)}</span>
        {canDownload
          ? <a className="btn btn-ghost btn-sm" href={url} download={`${video.title}.mp4`}><Icon name="download" size={16} /> Download</a>
          : <span className="muted"><Icon name="lock" size={15} /> Download off</span>}
      </div>
    </div>
  );
}
