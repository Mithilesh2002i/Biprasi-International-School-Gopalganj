import { useState } from 'react';
import { useActivityTracker } from '../lib/hooks';
import Icon from './Icon';

// Practice quiz: har sawal ke baad turant sahi/galat dikhata hai.
export default function QuizRunner({ questions, itemId, cls }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { markOpen } = useActivityTracker({ kind: 'quiz', itemId, cls }, !done);
  const q = questions[i];

  const check = () => { markOpen(); setChecked(true); if (sel === q.answer) setScore((s) => s + 1); };
  const next = () => { if (i + 1 >= questions.length) setDone(true); else { setI(i + 1); setSel(null); setChecked(false); } };
  const restart = () => { setI(0); setSel(null); setChecked(false); setScore(0); setDone(false); };

  if (done) return (
    <div className="quiz-done card">
      <Icon name="award" size={40} />
      <h2>{score} / {questions.length}</h2>
      <p className="muted">{score === questions.length ? 'Shandaar! Sab sahi.' : score >= questions.length / 2 ? 'Achha prayas! Thoda aur practice karein.' : 'Chapter dobara dekhein aur phir try karein.'}</p>
      <button className="btn btn-primary" onClick={restart}>Try again</button>
    </div>
  );
  return (
    <div className="quiz card">
      <div className="quiz-meta"><span>Question {i + 1} of {questions.length}</span><div className="progress"><div style={{ width: `${(i / questions.length) * 100}%` }} /></div></div>
      <h3 className="quiz-q">{q.q}</h3>
      <div className="options">
        {q.options.map((o, idx) => {
          const state = checked ? (idx === q.answer ? 'right' : idx === sel ? 'wrong' : '') : (idx === sel ? 'picked' : '');
          return <button key={idx} className={`option ${state}`} disabled={checked} onClick={() => setSel(idx)}><span className="opt-key">{String.fromCharCode(65 + idx)}</span>{o}{state === 'right' && <Icon name="check" size={18} />}{state === 'wrong' && <Icon name="x" size={18} />}</button>;
        })}
      </div>
      <div className="quiz-foot">
        {!checked ? <button className="btn btn-primary" disabled={sel == null} onClick={check}>Check answer</button>
          : <button className="btn btn-primary" onClick={next}>{i + 1 >= questions.length ? 'See score' : 'Next question'}</button>}
      </div>
    </div>
  );
}
