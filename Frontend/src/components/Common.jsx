import Icon from './Icon';
import { CountUp } from './Reveal';

export function PageHead({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
export function Stat({ label, value, note, icon, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      {icon && <span className="stat-ico"><Icon name={icon} size={20} /></span>}
      <div className="stat-val">{typeof value === 'number' ? <CountUp to={value} /> : value}</div>
      <div className="stat-label">{label}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
export const Badge = ({ children, tone = 'neutral' }) => <span className={`badge badge-${tone}`}>{children}</span>;
export function Empty({ icon = 'inbox', title, text, action }) {
  return (
    <div className="empty">
      <Icon name={icon} size={34} />
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} disabled={t.disabled}
          className={`tab ${value === t.value ? 'on' : ''}`} onClick={() => onChange(t.value)}>
          {t.icon && <Icon name={t.icon} size={17} />}{t.label}{t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span /></button>
  );
}
export function Field({ label, hint, children, full }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
export function Toggle({ title, text, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div><strong>{title}</strong>{text && <p className="muted">{text}</p>}</div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
