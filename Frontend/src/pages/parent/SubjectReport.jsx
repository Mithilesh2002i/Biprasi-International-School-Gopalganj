import { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { Badge, Empty, PageHead, Tabs } from '../../components/Common';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { lastMonthKeys, monthLabel, tally, teacherName, toneFor } from '../../lib/diary';
import { fmtShort, monthsBack } from '../../lib/utils';

// Subject-wise report: har subject mein kitne period hue, teacher kaun hai, aur bachche ne kitna exercise kiya.
export default function SubjectReport() {
  const db = useDB(); const { user: child } = useAuth(); usePageTitle('Subject-wise report');
  const [range, setRange] = useState(6);
  const classSubjects = useMemo(() => db.subjects.filter((s) => s.classNo === child.classNo), [db.subjects, child.classNo]);
  const six = useMemo(() => db.diary.filter((d) => d.classNo === child.classNo && d.date >= monthsBack(6)), [db.diary, child.classNo]);
  const from = monthsBack(range);
  const months = lastMonthKeys(6);
  const weeks = Math.max(1, range * 4.33);

  const cards = classSubjects.map((sub) => {
    const list = six.filter((d) => d.subject === sub.name && d.date >= from);
    const t = tally(list, child.id);
    return {
      sub, list, t,
      teachers: [...new Set(list.map((d) => teacherName(db, d)))],
      monthly: months.map((m) => ({ m, pct: tally(six.filter((d) => d.subject === sub.name && d.date.startsWith(m)), child.id).pct })),
      missed: list.filter((d) => ['n', 'p'].includes(d.entries?.[child.id])).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    };
  });
  const weakest = [...cards].filter((c) => c.t.pct != null).sort((a, b) => a.t.pct - b.t.pct)[0];

  return (
    <>
      <PageHead title="Subject-wise report" sub={`${child.name} · Class ${child.classNo} — har subject ka exercise aur period record`} />
      <Tabs value={range} onChange={setRange} tabs={[{ value: 1, label: '1 mahina' }, { value: 3, label: '3 mahine' }, { value: 6, label: '6 mahine' }]} />
      {weakest && weakest.t.pct < 80 && <p className="alert" style={{ marginBottom: 16 }}><Icon name="doubt" size={16} /> {weakest.sub.name} mein exercise sirf {weakest.t.pct}% hua hai — is par dhyan dein.</p>}
      {six.length === 0 ? <Empty icon="layers" title="Abhi koi record nahi" /> : (
        <div className="grid grid-2">
          {cards.map(({ sub, list, t, teachers, monthly, missed }) => {
            const a = t.assigned || 1;
            return (
              <article key={sub.id} className={`card subj-card tone-${sub.tone}`}>
                <div className="row-between"><div><h3>{sub.name}</h3><small className="muted">{teachers.join(', ') || 'Teacher record nahi'}</small></div>
                  <Badge tone={toneFor(t.pct)}>{t.pct == null ? 'No exercise' : `${t.pct}% exercise`}</Badge></div>
                <div className="seg" role="img" aria-label={`${t.done} poora, ${t.partial} adhura, ${t.notdone} nahi kiya`}>
                  <span className="seg-d" style={{ width: `${(t.done / a) * 100}%` }} /><span className="seg-p" style={{ width: `${(t.partial / a) * 100}%` }} /><span className="seg-n" style={{ width: `${(t.notdone / a) * 100}%` }} />
                </div>
                <ul className="seg-legend"><li><i className="seg-d" /> Poora {t.done}</li><li><i className="seg-p" /> Adhura {t.partial}</li><li><i className="seg-n" /> Nahi kiya {t.notdone}</li></ul>
                <dl className="mini-stats">
                  <div><dt>Period hue</dt><dd>{list.length}</dd></div>
                  <div><dt>Hafte mein</dt><dd>{(list.length / weeks).toFixed(1)}</dd></div>
                  <div><dt>Present</dt><dd>{t.present}</dd></div>
                  <div><dt>Absent</dt><dd>{t.absent}</dd></div>
                </dl>
                <div className="mini-bars" aria-label="Mahine ke hisaab se exercise %">
                  {monthly.map(({ m, pct }) => <div key={m} title={`${monthLabel(m)}: ${pct == null ? '—' : `${pct}%`}`}><span className={`lv-${toneFor(pct)}`} style={{ height: `${Math.max(6, pct ?? 0)}%` }} /><small>{monthLabel(m)}</small></div>)}
                </div>
                {missed.length > 0 && (
                  <details className="missed"><summary>Baaki / adhura exercise ({missed.length})</summary>
                    <ul>{missed.map((d) => <li key={d.id}><b>{fmtShort(d.date)}</b> · P{d.period} · {d.exercise || d.topic} <Badge tone={d.entries[child.id] === 'n' ? 'bad' : 'warn'}>{d.entries[child.id] === 'n' ? 'Nahi kiya' : 'Adhura'}</Badge></li>)}</ul></details>)}
              </article>);
          })}
        </div>)}
    </>
  );
}