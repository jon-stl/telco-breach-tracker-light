'use client';
import { useEffect, useRef, useState } from 'react';

const CATEGORY_COLORS = {
  'APT / Espionage':   '#e3051c',
  'Ransomware':        '#f39200',
  'Data Breach':       '#7b6cf0',
  'Malware / BPFDoor': '#00a87a',
  'Cyberattack':       '#f39200',
};

function CountryFlag({ country }) {
  const flags = {
    'Netherlands': '🇳🇱', 'Singapore': '🇸🇬', 'South Korea': '🇰🇷',
    'UK': '🇬🇧', 'France': '🇫🇷', 'Belgium': '🇧🇪',
  };
  return <span>{flags[country] || '🌐'}</span>;
}

// ─── Country Bar Chart ────────────────────────────────────────────────────────
export function CountryChart({ breaches }) {
  const countMap = {};
  const impactMap = {};
  for (const b of breaches) {
    countMap[b.country] = (countMap[b.country] || 0) + 1;
    impactMap[b.country] = (impactMap[b.country] || 0) + (b.customersAffected || 0);
  }

  const sorted = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({ country, count, impact: impactMap[country] }));

  const max = sorted[0]?.count || 1;
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {sorted.map(({ country, count, impact }, i) => (
        <div key={country} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.85rem',
              color: '#2a314d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
            }}>
              <CountryFlag country={country} />
              {country}
            </span>
            <span style={{
              fontFamily: "'PT Sans', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#2a314d',
            }}>
              {count}
            </span>
          </div>
          <div style={{
            height: '8px',
            background: 'rgba(42,49,77,0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: animated ? `${(count / max) * 100}%` : '0%',
              background: count >= 3
                ? 'linear-gradient(90deg, #e3051c, #f39200)'
                : 'linear-gradient(90deg, #2a314d, #6b7a99)',
              borderRadius: '4px',
              transition: `width ${0.6 + i * 0.1}s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
            }} />
          </div>
          {impact > 0 && (
            <div style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.65rem',
              color: '#8896b0',
              marginTop: '3px',
            }}>
              {impact >= 1000000 ? (impact / 1000000).toFixed(1) + 'M' : (impact / 1000).toFixed(0) + 'k'} customers affected
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Attack Category Donut Chart ──────────────────────────────────────────────
export function AttackTypeChart({ breaches }) {
  const counts = {};
  for (const b of breaches) {
    counts[b.attackCategory] = (counts[b.attackCategory] || 0) + 1;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const data = Object.entries(counts).map(([name, value]) => ({
    name, value,
    pct: value / total,
    color: CATEGORY_COLORS[name] || '#8896b0',
  }));

  const [hovered, setHovered] = useState(null);
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setAnimated(true), 100); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const cx = 90, cy = 90, r = 65, innerR = 42;
  const circumference = 2 * Math.PI * r;
  let cumulativePct = 0;
  const gap = 0.015;

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(42,49,77,0.07)" strokeWidth="23" />
          {data.map((seg, i) => {
            const startPct = cumulativePct + gap / 2;
            const endPct   = cumulativePct + seg.pct - gap / 2;
            cumulativePct += seg.pct;
            const dashArray  = animated ? `${(endPct - startPct) * circumference} ${circumference}` : `0 ${circumference}`;
            const dashOffset = -startPct * circumference;
            const isHovered  = hovered === i;
            return (
              <circle
                key={seg.name}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? 27 : 23}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                style={{
                  transition: `stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s, stroke-width 0.2s`,
                  filter: isHovered ? `drop-shadow(0 2px 6px ${seg.color}80)` : 'none',
                  cursor: 'pointer',
                }}
                transform={`rotate(-90 ${cx} ${cy})`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#2a314d"
            style={{ fontFamily: "'PT Sans', sans-serif", fontWeight: 700, fontSize: '22px' }}>
            {hovered !== null ? data[hovered].value : total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#8896b0"
            style={{ fontFamily: "'Roboto', sans-serif", fontSize: '10px', letterSpacing: '0.08em' }}>
            {hovered !== null ? 'INCIDENTS' : 'TOTAL'}
          </text>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: '160px' }}>
        {data.map((seg, i) => (
          <div
            key={seg.name}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '8px',
              marginBottom: '4px',
              cursor: 'default',
              background: hovered === i ? 'rgba(42,49,77,0.05)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '3px',
              background: seg.color, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.78rem', color: '#2a314d', fontWeight: 500 }}>
                {seg.name}
              </div>
              <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.65rem', color: '#8896b0' }}>
                {seg.value} incident{seg.value > 1 ? 's' : ''} · {Math.round(seg.pct * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
