import { useMemo } from 'react';
import Icon from '../../components/Icon';
import { Badge, Empty, PageHead, Stat } from '../../components/Common';
import { HBars, LineArea } from '../../components/Charts';
import { useDB } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../lib/hooks';
import { tally, toneFor } from '../../lib/diary';
import { fmtDate, monthsBack } from '../../lib/utils';

const pct = (m, t) => (t ? Math.round((m / t) * 100) : 0);

// Progress report: exam-wise marks, subject-wise average, trend, aur exercise/attendance ka saar (pichhle 6 mahine)
export default function ProgressReport() {
  const db = useDB(); const { user: child } = useAuth(); usePageTitle('Progress report');
  const res = useMemo(() => db.results.filter((r) => r.studentRef === child.id), [db.results, child.id]);
  const subjects = useMemo(() => db.subjects.filter((s) => s.classNo === child.classNo).map((s) => s.name), [db.subjects, child.classNo]);
  const exams = useMemo(() => {
    const map = new Map();
    res.forEach((r) => { const k = `${r.exam}|${r.createdAt}`; if (!map.has(k)) map.set(k, { key: k, exam: r.exam, date: r.createdAt, rows: [] }); map.get(k).rows.push(r); });
    return [...map.values()].map((e) => { const o = e.rows.reduce((s, r) => s + r.marks, 0); const t = e.rows.reduce((s, r) => s + r.total, 0); return { ...e, obtained: o, total: t, pct: pct(o, t) }; }).sort((a, b) => a.date.localeCompare(b.date));
  }, [res]);
  const subjAvg = subjects.map((name) => { const rows = res.filter((r) => r.subject === name); const o = rows.reduce((s, r) => s + r.marks, 0); const t = rows.reduce((s, r) => s + r.total, 0); return { name, pct: rows.length ? pct(o, t) : null }; }).filter((x) => x.pct != null);
  const overall = res.length ? pct(res.reduce((s, r) => s + r.marks, 0), res.reduce((s, r) => s + r.total, 0)) : null;
  const best = [...subjAvg].sort((a, b) => b.pct - a.pct)[0]; const weak = [...subjAvg].sort((a, b) => a.pct - b.pct)[0];
  const last = exams[exams.length - 1]; const before = exams[exams.length - 2];
  const delta = last && before ? last.pct - before.pct : null;
  const dia = tally(db.diary.filter((d) => d.classNo === child.classNo && d.date >= monthsBack(6)), child.id);
  const attempts = db.attempts.filter((a) => a.studentId === child.id);

  return (
    <>
      <PageHead title="Progress report" sub={`${child.name} · Class ${child.classNo} · ID ${child.studentId}`} actions={<button className="btn btn-ghost" onClick={() => window.print()}><Icon name="download" size={17} /> Print / PDF</button>} />
      {res.length === 0 ? <Empty icon="chart" title="Abhi koi result upload nahi hua" text="Teacher marks daalenge to yahan report dikhegi." /> : (
        <>
          <div className="grid grid-4">
            <Stat icon="award" label="Overall marks" value={`${overall}%`} note={delta == null ? `${exams.length} exam` : `Pichhle exam se ${delta >= 0 ? '+' : ''}${delta}%`} />
            <Stat icon="check" label="Exercise completion" value={dia.pct == null ? '—' : `${dia.pct}%`} note="pichhle 6 mahine" />
            <Stat icon="user" label="Attendance (period)" value={dia.attPct == null ? '—' : `${dia.attPct}%`} note={`${dia.absent} period absent`} />
            <Stat icon="test" label="Online tests" value={attempts.length} note={attempts.length ? `avg ${Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length)}%` : 'abhi koi nahi'} />
          </div>
          {best && weak && <p className="remark"><Icon name="award" size={18} /> <span><b>{best.name}</b> sabse accha ({best.pct}%).{weak.pct < 70 ? <> <b>{weak.name}</b> mein ({weak.pct}%) thodi mehnat ki zaroorat hai.</> : ' Sabhi subjects mein achha pradarshan.'}</span></p>}

          <div className="grid grid-2">
            <section className="card"><h2 className="h2"><Icon name="chart" size={19} /> Exam-wise trend (%)</h2>
              {exams.length < 2 ? <p className="muted">Trend ke liye kam se kam 2 exam chahiye.</p> : <LineArea data={exams.map((e) => ({ day: e.date, value: e.pct }))} unit="%" height={200} />}</section>
            <section className="card"><h2 className="h2"><Icon name="layers" size={19} /> Subject-wise average</h2>
              <HBars items={subjAvg.map((s) => ({ label: s.name, value: s.pct, display: `${s.pct}%` }))} /></section>
          </div>

          <h2 className="h2"><Icon name="file" size={19} /> Marks table (subject × exam)</h2>
          <div className="table-wrap"><table className="table marks-table">
            <thead><tr><th>Subject</th>{exams.map((e) => <th key={e.key}>{e.exam}<div className="muted">{fmtDate(e.date)}</div></th>)}</tr></thead>
            <tbody>{subjects.map((name) => (
              <tr key={name}><td data-label="Subject"><strong>{name}</strong></td>
                {exams.map((e) => { const r = e.rows.find((x) => x.subject === name); return <td key={e.key} data-label={e.exam}>{r ? <><b>{r.marks}/{r.total}</b> <Badge tone={toneFor(pct(r.marks, r.total))}>{pct(r.marks, r.total)}%</Badge></> : '—'}</td>; })}</tr>))}
              <tr className="total-row"><td data-label="Subject"><strong>Total</strong></td>{exams.map((e) => <td key={e.key} data-label={e.exam}><b>{e.obtained}/{e.total}</b> <Badge tone={toneFor(e.pct)}>{e.pct}%</Badge></td>)}</tr></tbody></table></div>
          {attempts.length > 0 && (<><h2 className="h2"><Icon name="test" size={19} /> Online tests</h2>
            <div className="table-wrap"><table className="table"><thead><tr><th>Test</th><th>Score</th><th>Date</th></tr></thead><tbody>{attempts.map((a) => <tr key={a.id}><td data-label="Test">{db.tests.find((t) => t.id === a.testId)?.title}</td><td data-label="Score"><strong>{a.score} / {a.total}</strong></td><td data-label="Date">{fmtDate(a.date)}</td></tr>)}</tbody></table></div></>)}
        </>)}
    </>
  );
}