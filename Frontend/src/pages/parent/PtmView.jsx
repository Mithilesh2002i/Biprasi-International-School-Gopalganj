import { Badge, Empty, PageHead } from '../../components/Common';
import Icon from '../../components/Icon';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { fmtDate, today } from '../../lib/utils';

export const useMyPtm = () => {
  const db = useDB(); const { user } = useAuth();
  return db.ptm.filter((p) => p.classNo === 'all' || p.classNo === user.classNo);
};

// PTM (Parent-Teacher Meeting) ki notification
export default function PtmView() {
  const list = useMyPtm(); usePageTitle('PTM');
  const upcoming = list.filter((p) => p.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
  const past = list.filter((p) => p.date < today()).sort((a, b) => b.date.localeCompare(a.date));
  const card = (p, old) => (
    <article key={p.id} className={`card exam ${old ? 'past' : ''}`}>
      <div className="exam-date"><b>{fmtDate(p.date).split(' ')[0]}</b><span>{fmtDate(p.date).split(' ').slice(1).join(' ')}</span></div>
      <div><h3>{p.title} {!old && <Badge tone="warn">Aane wala</Badge>}</h3>
        <p className="muted"><Icon name="clock" size={14} /> {p.time || 'Time baad mein'} · <Icon name="pin" size={14} /> {p.venue || 'School'} · {p.classNo === 'all' ? 'All classes' : `Class ${p.classNo}`}</p>
        {p.note && <p>{p.note}</p>}<small className="muted">{p.by}</small></div>
    </article>);
  return (
    <>
      <PageHead title="PTM — Parent Teacher Meeting" sub="School ki meeting ki date aur jaankari." />
      <h2 className="h2"><Icon name="bell" size={19} /> Aane wali meeting</h2>
      {upcoming.length === 0 ? <Empty icon="calendar" title="Abhi koi PTM schedule nahi" /> : <div className="stack">{upcoming.map((p) => card(p, false))}</div>}
      {past.length > 0 && (<><h2 className="h2">Pichhli meetings</h2><div className="stack">{past.map((p) => card(p, true))}</div></>)}
    </>
  );
}