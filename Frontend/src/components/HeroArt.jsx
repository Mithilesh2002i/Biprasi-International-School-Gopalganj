import Icon from './Icon';

// Peeche tairte hue padhai ke icons (sirf sajaavat; screen reader ke liye chhupa hai)
const ITEMS = [
  ['book', 45, 9, 46, 7, 0], ['grad', 88, 7, 54, 9, 1.2], ['edit', 3, 90, 38, 8, 2.1], ['quiz', 94, 60, 44, 10, 0.6],
  ['award', 54, 87, 40, 8, 1.8], ['video', 72, 36, 32, 9, 2.6], ['layers', 47, 52, 30, 11, 0.9], ['test', 62, 6, 34, 7.5, 3.2], ['doubt', 28, 91, 30, 9.5, 1.5],
];
export default function HeroArt() {
  return (
    <div className="floaters" aria-hidden="true">
      <i className="blob b1" /><i className="blob b2" />
      {ITEMS.map(([name, x, y, size, dur, dl]) => (
        <span key={name} className="floater" style={{ left: `${x}%`, top: `${y}%`, '--dur': `${dur}s`, '--dl': `${dl}s` }}><Icon name={name} size={size} strokeWidth={1.4} /></span>
      ))}
    </div>
  );
}
