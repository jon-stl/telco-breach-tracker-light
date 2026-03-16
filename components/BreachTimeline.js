'use client';
import { useState } from 'react';

const CATEGORY_COLORS = {
  'APT / Espionage':   '#e3051c',
  'Ransomware':        '#f39200',
  'Data Breach':       '#7b6cf0',
  'Malware / BPFDoor': '#00a87a',
  'Cyberattack':       '#f39200',
};

export default function BreachTimeline({ breaches }) {
  const [activeId, setActiveId] = useState(null);

  const sorted = [...breaches].sort((a, b) => new Date(a.attackDate) - new Date(b.attackDate));
  const earliest = new Date(sorted[0].attackDate);
  const latest   = new Date(sorted[sorted.length - 1].attackDate);
  const range    = latest - earliest || 1;

  function pct(date) {
    return ((new Date(date) - earliest) / range) * 92 + 4;
  }

  const AXIS_Y      = 36;
  const STEMS       = [28, 65, 102, 139];
  const NODE_TOP    = STEMS.map(s => AXIS_Y + 2 + s);
  const LABEL_TOP   = NODE_TOP.map(t => t + 14 + 6);
  const CONTAINER_H = LABEL_TOP[3] + 28;

  const dateGroups = {};
  for (const b of sorted) {
    dateGroups[b.attackDate] = dateGroups[b.attackDate] || [];
    dateGroups[b.attackDate].push(b.id);
  }
  function leftPct(breach) {
    const base  = pct(breach.attackDate);
    const group = dateGroups[breach.attackDate];
    if (group.length === 1) return base;
    const idx    = group.indexOf(breach.id);
    const spread = Math.min(group.length * 2.5, 10);
    const step   = spread / (group.length - 1);
    return base + (idx - (group.length - 1) / 2) * step;
  }

  const rowLastLeft = [null, null, null, null];
  const rowOf = {};
  for (const b of sorted) {
    const left = leftPct(b);
    let bestRow = 0, bestGap = -Infinity;
    for (let r = 0; r < 4; r++) {
      const gap = rowLastLeft[r] === null ? Infinity : left - rowLastLeft[r];
      if (gap > bestGap) { bestGap = gap; bestRow = r; }
    }
    rowOf[b.id] = bestRow;
    rowLastLeft[bestRow] = left;
  }

  const activeBrech = sorted.find(b => b.id === activeId);

  return (
    <div>
      <div style={{ position: 'relative', height: `${CONTAINER_H}px` }}>

        {/* Date labels */}
        {['Apr 2025', 'Jul 2025', 'Oct 2025', 'Jan 2026', 'Mar 2026'].map((label, i) => (
          <div key={label} style={{
            position: 'absolute',
            top: '4px',
            left: `${4 + i * 23}%`,
            fontFamily: "'Roboto', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#4a5568',
            letterSpacing: '0.06em',
            transform: 'translateX(-50%)',
          }}>
            {label}
          </div>
        ))}

        {/* Timeline axis */}
        <div style={{
          position: 'absolute',
          top: `${AXIS_Y}px`,
          left: '4%',
          right: '4%',
          height: '2px',
          background: 'linear-gradient(90deg, rgba(42,49,77,0.1), rgba(42,49,77,0.35), rgba(42,49,77,0.1))',
          borderRadius: '2px',
        }}>
          {/* Animated scan highlight */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            left: 0,
            width: '60px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, rgba(42,49,77,0.5), transparent)',
            animation: 'scan 5s linear infinite',
          }} />
        </div>

        {/* Breach nodes */}
        {sorted.map((breach) => {
          const left    = leftPct(breach);
          const isActive = breach.id === activeId;
          const color   = CATEGORY_COLORS[breach.attackCategory] || '#8896b0';
          const row     = rowOf[breach.id];
          const nTop    = NODE_TOP[row];
          const lTop    = LABEL_TOP[row];
          const stemH   = STEMS[row];

          return (
            <div key={breach.id}>
              {/* Stem */}
              <div style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${AXIS_Y + 2}px`,
                width: '1px',
                height: `${stemH}px`,
                background: `linear-gradient(180deg, ${color}80, ${color}20)`,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }} />

              {/* Node */}
              <button
                onClick={() => setActiveId(isActive ? null : breach.id)}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${nTop}px`,
                  transform: 'translate(-50%, 0)',
                  width: isActive ? '18px' : '13px',
                  height: isActive ? '18px' : '13px',
                  borderRadius: '50%',
                  background: isActive ? color : '#ffffff',
                  border: `2px solid ${color}`,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? `0 0 0 4px ${color}25, 0 2px 8px ${color}50`
                    : `0 1px 4px rgba(42,49,77,0.15)`,
                  transition: 'all 0.2s ease',
                  zIndex: isActive ? 10 : 2,
                }}
                title={`${breach.telco} — ${breach.attackDate}`}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translate(-50%, 0) scale(1.35)';
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${color}25, 0 2px 8px ${color}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(-50%, 0) scale(1)';
                  e.currentTarget.style.boxShadow = isActive
                    ? `0 0 0 4px ${color}25, 0 2px 8px ${color}50`
                    : `0 1px 4px rgba(42,49,77,0.15)`;
                }}
              />

              {/* Label */}
              <div style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${lTop}px`,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.75rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? color : '#374151',
                textAlign: 'center',
                transition: 'color 0.2s',
                pointerEvents: 'none',
              }}>
                {breach.telco}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {activeBrech && (
        <div style={{
          marginTop: '24px',
          background: '#ffffff',
          border: `1px solid ${CATEGORY_COLORS[activeBrech.attackCategory] || '#dde2ef'}`,
          borderLeft: `4px solid ${CATEGORY_COLORS[activeBrech.attackCategory] || '#2a314d'}`,
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(42,49,77,0.08)',
          animation: 'fadeIn 0.2s ease',
          position: 'relative',
        }}>
          <button
            onClick={() => setActiveId(null)}
            style={{
              position: 'absolute', top: '12px', right: '16px',
              background: 'none', border: 'none', color: '#8896b0',
              fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1,
              padding: '4px 8px', borderRadius: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f3f8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >×</button>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  background: `${CATEGORY_COLORS[activeBrech.attackCategory] || '#2a314d'}18`,
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: CATEGORY_COLORS[activeBrech.attackCategory] || '#2a314d',
                  textTransform: 'uppercase',
                  border: `1px solid ${CATEGORY_COLORS[activeBrech.attackCategory] || '#2a314d'}30`,
                }}>
                  {activeBrech.attackCategory}
                </span>
              </div>
              <h3 style={{
                fontFamily: "'PT Sans', sans-serif",
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#2a314d',
                margin: '0 0 4px',
              }}>
                {activeBrech.telco}
              </h3>
              <div style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.8rem',
                color: '#8896b0',
                marginBottom: '12px',
              }}>
                {activeBrech.country} · {new Date(activeBrech.attackDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {activeBrech.attacker && ' · Attacker: '}
                {activeBrech.attacker && <span style={{ color: '#f39200', fontWeight: 600 }}>{activeBrech.attacker}</span>}
              </div>
              <p style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.82rem',
                color: '#4a5568',
                lineHeight: 1.65,
                margin: 0,
              }}>
                {activeBrech.details}
              </p>
              {activeBrech.consequences && (
                <p style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.78rem',
                  color: '#6b7a99',
                  lineHeight: 1.6,
                  margin: '8px 0 0',
                  fontStyle: 'italic',
                }}>
                  <strong style={{ color: '#f39200', fontStyle: 'normal' }}>Consequences: </strong>
                  {activeBrech.consequences}
                </p>
              )}
            </div>
            {activeBrech.customersAffected && (
              <div style={{
                background: 'rgba(42,49,77,0.04)',
                border: '1px solid rgba(42,49,77,0.1)',
                borderRadius: '10px',
                padding: '16px 20px',
                textAlign: 'center',
                minWidth: '140px',
              }}>
                <div style={{
                  fontFamily: "'PT Sans', sans-serif",
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: '#2a314d',
                }}>
                  {activeBrech.customersAffected >= 1000000
                    ? (activeBrech.customersAffected / 1000000).toFixed(1) + 'M'
                    : activeBrech.customersAffected >= 1000
                    ? (activeBrech.customersAffected / 1000).toFixed(0) + 'k'
                    : activeBrech.customersAffected.toLocaleString()}
                </div>
                <div style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.7rem',
                  color: '#8896b0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginTop: '4px',
                }}>
                  Customers<br />Affected
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        marginTop: '16px',
        justifyContent: 'center',
      }}>
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'Cyberattack').map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, border: '2px solid ' + color + '40' }} />
            <span style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.72rem',
              color: '#8896b0',
            }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
