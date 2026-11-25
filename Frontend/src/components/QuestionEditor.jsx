import Icon from './Icon';

// Quiz / Test ke sawal add-edit karne ka form
export default function QuestionEditor({ value, onChange }) {
  const set = (i, patch) => onChange(value.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const setOpt = (i, j, text) => set(i, { options: value[i].options.map((o, k) => (k === j ? text : o)) });
  return (
    <div className="qeditor">
      {value.map((q, i) => (
        <div key={i} className="qcard">
          <div className="qcard-head"><strong>Question {i + 1}</strong>
            <button type="button" className="icon-btn" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove question"><Icon name="trash" size={17} /></button></div>
          <input className="input" placeholder="Sawal likhein" value={q.q} onChange={(e) => set(i, { q: e.target.value })} />
          {q.options.map((o, j) => (
            <div key={j} className="qopt">
              <input type="radio" name={`ans-${i}`} checked={q.answer === j} onChange={() => set(i, { answer: j })} aria-label={`Option ${j + 1} is correct`} />
              <input className="input" placeholder={`Option ${String.fromCharCode(65 + j)}`} value={o} onChange={(e) => setOpt(i, j, e.target.value)} />
            </div>
          ))}
          <small className="muted">Sahi jawab ke saamne wale circle ko chunein.</small>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={() => onChange([...value, { q: '', options: ['', '', '', ''], answer: 0 }])}><Icon name="plus" size={17} /> Add question</button>
    </div>
  );
}
