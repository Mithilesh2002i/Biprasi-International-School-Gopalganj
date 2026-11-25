import { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import { Badge, Empty, PageHead, Stat } from '../../components/Common';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { STATUS, tally, teacherName, toneFor } from '../../lib/diary';
import { fmtDate, fmtShort, fmtWeekday, monthsBack, today } from '../../lib/utils';

// Parent ka "Daily report": us din kitne period hue, kaun sa teacher aaya, kya exercise mila aur bachche ne kiya ya nahi.
export default function DailyReport() {
  const db = useDB(); const { user: child } = useAuth(); usePageTitle('Daily report');
  const mine = useMemo(() => db.diary.filter((d) => d.classNo === child.classNo), [db.diary, child.classNo]);
  const dates = useMemo(() => [...new Set(mine.map((d) => d.date))].sort(), [mine]);
  const [date, setDate] = useState(() => dates[dates.length - 1] || today());
  const [zoom, setZoom] = useState(null);
  const list = useMemo(() => mine.filter((d) => d.date === date).sort((a, b) => a.period - b.period), [mine, date]);
  const t = tally(list, child.id);
  const prev = [...dates].reverse().find((d) => d < date);
  const next = dates.find((d) => d > date);
  const chips = dates.slice(-7).map((d) => ({ d, pct: tally(mine.filter((x) => x.date === d), child.id).pct }));

  return (
    <>
      <PageHead title="Daily report" sub={`${child.name} · Class ${child.classNo} — roz ke period, exercise aur status (pichhle 6 mahine tak dekh sakte hain)`} />

      <div className="day-nav card">
        <div className="day-chips">
          {chips.map(({ d, pct }) => (
            <button key={d} className={`daychip ${d === date ? 'on' : ''} lv-${toneFor(pct)}`} onClick={() => setDate(d)}>
              <small>{fmtWeekday(d)}</small><b>{fmtShort(d)}</b><i aria-hidden="true" />
            </button>))}
        </div>
        <div className="day-pick">
          <button className="btn btn-ghost btn-sm" disabled={!prev} onClick={() => setDate(prev)}><Icon name="left" size={16} /> Pichhla din</button>
          <input className="input" type="date" min={monthsBack(6)} max={today()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date chunein" />
          <button className="btn btn-ghost btn-sm" disabled={!next} onClick={() => setDate(next)}>Agla din <Icon name="right" size={16} /></button>
        </div>
      </div>

      <h2 className="h2"><Icon name="calendar" size={19} /> {fmtWeekday(date)}, {fmtDate(date)}</h2>
      {list.length === 0 ? <Empty icon="calendar" title="Is din ka koi record nahi" text="Sunday, chhutti ya teacher ne abhi diary nahi bhari. Doosri date chunein." /> : (
        <>
          <div className="grid grid-4">
            <Stat icon="book" label="Period hue" value={list.length} note="us din class mein" />
            <Stat icon="check" label="Exercise poora" value={t.done} note={`${t.assigned} mein se`} />
            <Stat icon="x" label="Nahi / adhura" value={t.notdone + t.partial} note={`${t.notdone} nahi · ${t.partial} adhura`} />
            <Stat icon="user" label="Absent" value={t.absent} note={`${t.present} period mein present`} />
          </div>

          <div className="stack">
            {list.map((p) => {
              const code = p.entries?.[child.id]; const st = STATUS[code]; const note = p.notes?.[child.id];
              return (
                <article key={p.id} className="card period-card">
                  <div className="p-head">
                    <span className="p-no">P{p.period}</span>
                    <div className="p-title"><h3>{p.subject}</h3><small className="muted"><Icon name="user" size={13} /> {teacherName(db, p)}{p.topic ? ` · ${p.topic}` : ''}</small></div>
                    {st ? <Badge tone={st.tone}>{st.label}</Badge> : <Badge>Status nahi bhara</Badge>}
                  </div>
                  {p.exercise ? <p className="p-ex"><Icon name="file" size={16} /> <span><b>Exercise:</b> {p.exercise}</span></p> : <p className="muted p-ex">Is period mein koi exercise nahi diya gaya.</p>}
                  {note && <p className="p-note"><Icon name="doubt" size={15} /> Teacher ka note: {note}</p>}
                  {p.photos?.length > 0 && <div className="photo-grid">{p.photos.map((src, i) => <button key={i} className="photo-thumb" onClick={() => setZoom(src)} aria-label="Photo bada karein"><img src={src} alt={`${p.subject} photo ${i + 1}`} /></button>)}</div>}
                </article>);
            })}
          </div>
        </>)}
      {zoom && <Modal title="Class photo" size="lg" onClose={() => setZoom(null)}><img src={zoom} alt="Class work" style={{ width: '100%', borderRadius: 12 }} /></Modal>}
    </>
  );
}