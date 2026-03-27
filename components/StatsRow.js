'use client';
import { useState, useEffect, useRef } from 'react';

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRun.current) {
        hasRun.current = true;
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
          else setValue(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [value, ref];
}

function StatCard({ value, label, suffix = '', icon, color, bgColor, delay = 0 }) {
  const [shown, setShown] = useState(false);
  const [countedVal, countRef] = useCountUp(value);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const display = value >= 1000000
    ? (countedVal / 1000000).toFixed(1) + 'M'
    : value >= 1000
    ? (countedVal / 1000).toFixed(0) + 'k'
    : countedVal;

  return (
    <div
      ref={countRef}
      style={{
        flex: '1 1 170px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px 20px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(42,49,77,0.08), 0 1px 3px rgba(42,49,77,0.05)',
        border: '1px solid rgba(42,49,77,0.08)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow 0.25s ease`,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(42,49,77,0.14), 0 2px 6px rgba(42,49,77,0.08)`;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,49,77,0.08), 0 1px 3px rgba(42,49,77,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top colour bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '3px',
        background: color,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Icon bubble */}
      <div style={{
        width: '44px', height: '44px',
        borderRadius: '12px',
        background: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem',
        margin: '0 auto 12px',
      }}>
        {icon}
      </div>

      <div style={{
        fontFamily: "'PT Sans', sans-serif",
        fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
        fontWeight: 700,
        color: '#2a314d',
        lineHeight: 1,
        marginBottom: '6px',
      }}>
        {display}{suffix}
      </div>
      <div style={{
        fontFamily: "'Roboto', sans-serif",
        fontSize: '0.72rem',
        fontWeight: 500,
        letterSpacing: '0.1em',
        color: '#8896b0',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

export default function StatsRow({ breaches }) {
  const totalIncidents = breaches.length;
  const operators = new Set(breaches.map(b => b.telco)).size;
  const attackTypes = new Set(
    breaches.map(b => b.attackClassification).filter(Boolean)
  ).size;
  const countries = new Set(breaches.map(b => b.country)).size;

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <StatCard value={totalIncidents} label="Total Incidents" icon="📋" color="#e3051c" bgColor="rgba(227,5,28,0.08)" delay={0} />
      <StatCard value={operators} label="Telecom Operators Attacked" icon="📡" color="#059669" bgColor="rgba(5,150,105,0.08)" delay={100} />
      <StatCard value={attackTypes} label="Attack Classifications" icon="🎯" color="#2a314d" bgColor="rgba(42,49,77,0.07)" delay={200} />
      <StatCard value={countries} label="Countries Affected" icon="🌍" color="#f39200" bgColor="rgba(243,146,0,0.08)" delay={300} />
    </div>
  );
}
