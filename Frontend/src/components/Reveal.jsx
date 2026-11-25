import { createElement, useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Element screen par aate hi `true` ho jata hai (ek hi baar)
export function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced() || !('IntersectionObserver' in window)) { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

// Scroll karne par neeche se halke se upar aata hai. `plain` = sirf `in` class lagao (custom animation ke liye)
export function Reveal({ as = 'div', delay = 0, plain = false, className = '', style, children, ...rest }) {
  const [ref, seen] = useInView();
  const cls = `${plain ? '' : 'reveal'} ${seen ? 'in' : ''} ${className}`.trim();
  return createElement(as, { ref, className: cls, style: { '--rd': `${delay}ms`, ...style }, ...rest }, children);
}

// Number 0 se ginti shuru karke upar tak chadhta hai
export function CountUp({ to = 0, duration = 1100 }) {
  const [ref, seen] = useInView(0.3);
  const [n, setN] = useState(reduced() ? to : 0);
  useEffect(() => {
    if (!seen) return undefined;
    if (reduced()) { setN(to); return undefined; }
    let raf; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref}>{n}</span>;
}
