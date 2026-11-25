import { useState } from 'react';
import { fmtShort } from '../lib/utils';

// Fixed colours (validated for colour-blind safety): students = indigo, teachers = sage.
export const SERIES = { students: '#4B4FA6', teachers: '#3FA58A' };

// Stacked bar chart: data = [{ day, students, teachers }]
export function StackedBars({ data, height = 220, a = 'students', b = 'teachers', labelA = 'Students', labelB = 'Teachers' }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = height, L = 30, B = 26, T = 10;
  const max = Math.max(4, ...data.map((d) => d[a] + d[b]));
  const top = Math.ceil(max / 4) * 4;
  const bw = (W - L) / data.length;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  return (
    <div className="chart">
      <div className="legend">
        <span><i style={{ background: SERIES.students }} />{labelA}</span>
        <span><i style={{ background: SERIES.teachers }} />{labelB}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily active users chart">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (top / 4) * i;
          return <g key={i}><line x1={L} x2={W} y1={y(v)} y2={y(v)} className="gl" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="axis">{v}</text></g>;
        })}
        {data.map((d, i) => {
          const x = L + i * bw + bw * 0.18, w = bw * 0.64;
          const ha = (H - T - B) * (d[a] / top), hb = (H - T - B) * (d[b] / top);
          const gap = d[a] && d[b] ? 2 : 0;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              <rect className="bar" style={{ animationDelay: `${i * 35}ms` }} x={x} y={H - B - ha} width={w} height={ha} fill={SERIES.students} rx={d[b] ? 0 : 4} />
              <rect className="bar" style={{ animationDelay: `${i * 35 + 120}ms` }} x={x} y={H - B - ha - hb - gap} width={w} height={hb} fill={SERIES.teachers} rx={4} />
              {(i % 2 === 0 || data.length < 9) && <text x={x + w / 2} y={H - 8} textAnchor="middle" className="axis">{fmtShort(d.day)}</text>}
            </g>
          );
        })}
        {hover != null && (() => {
          const d = data[hover]; const cx = L + hover * bw + bw / 2; const tx = Math.min(Math.max(cx, 80), W - 80);
          return (
            <g pointerEvents="none">
              <rect x={tx - 72} y={4} width={144} height={46} rx={8} className="tip" />
              <text x={tx} y={22} textAnchor="middle" className="tip-t">{fmtShort(d.day)}</text>
              <text x={tx} y={40} textAnchor="middle" className="tip-t">{labelA} {d[a]} · {labelB} {d[b]}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// Single series line/area chart: data = [{ day, value }]
export function LineArea({ data, height = 180, unit = '', color = SERIES.students }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = height, L = 34, B = 26, T = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = Math.ceil(max / 4) * 4 || 4;
  const step = (W - L - 10) / Math.max(1, data.length - 1);
  const x = (i) => L + i * step;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart" onMouseLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((i) => { const v = (top / 4) * i; return <g key={i}><line x1={L} x2={W} y1={y(v)} y2={y(v)} className="gl" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="axis">{Math.round(v)}</text></g>; })}
        <polygon className="area" points={`${x(0)},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`} fill={color} opacity="0.12" />
        <polyline className="draw" pathLength="1" points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.day} onMouseEnter={() => setHover(i)}>
            <rect x={x(i) - step / 2} y={T} width={step} height={H - T - B} fill="transparent" />
            {(hover === i) && <circle cx={x(i)} cy={y(d.value)} r={5} fill={color} stroke="var(--surface)" strokeWidth="2" />}
            {(i % 2 === 0) && <text x={x(i)} y={H - 8} textAnchor="middle" className="axis">{fmtShort(d.day)}</text>}
          </g>
        ))}
        {hover != null && (() => { const d = data[hover]; const tx = Math.min(Math.max(x(hover), 70), W - 70); return (
          <g pointerEvents="none"><rect x={tx - 62} y={2} width={124} height={26} rx={7} className="tip" /><text x={tx} y={20} textAnchor="middle" className="tip-t">{fmtShort(d.day)}: {d.value}{unit}</text></g>
        ); })()}
      </svg>
    </div>
  );
}

// Horizontal bars: items = [{ label, sub, value, display }]
export function HBars({ items, color = SERIES.students }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="hbars">
      {items.map((it) => (
        <li key={it.label}>
          <div className="hb-top"><span className="hb-label">{it.label}{it.sub && <small>{it.sub}</small>}</span><span className="hb-val">{it.display ?? it.value}</span></div>
          <div className="hb-track"><div className="hb-fill" style={{ width: `${(it.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}
