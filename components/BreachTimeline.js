'use client';
import { useState } from 'react';

// Known categories get specific colours; anything else gets a deterministic fallback.
const KNOWN_COLORS = {
  'APT / Espionage':   '#e3051c',
  'Ransomware':        '#f39200',
  'Data Breach':       '#7b6cf0',
  'Malware / BPFDoor': '#00a87a',
  'Cyberattack':       '#4a9eff',
};
const FALLBACK_PALETTE = ['#6366f1', '#0891b2', '#d97706', '#9333ea', '#059669', '#dc2626'];

function categoryColor(name) {
  if (KNOWN_COLORS[name]) return KNOWN_COLORS[name];
  let hash = 0;
  for (const c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

// Generate quarterly date ticks between two dates
function quarterlyTicks(earliest, latest) {
  const ticks = [];
  const d = new Date(earliest);
  d.setDate(1);
  // Snap to next quarter start
  const m = d.getMonth();
  const nextQuarterMonth = Math.ceil((m + 1) / 3) * 3;
  if (nextQuarterMonth >= 12) { d.setFullYear(d.getFullYear() + 1); d.setMonth(0); }
  else d.setMonth(nextQuarterMonth);

  while (d <= latest) {
    ticks.push(new Date(d));
    d.setMonth(d.getMonth() + 3);
  }
  return ticks;
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BreachTimeline({ breaches }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, breach }

  const sorted = [...breaches].sort((a, b) => new Date(a.attackDate) - new Date(b.attackDate));
  const earliest = new Date(sorted[0].attackDate);
  const latest   = new Date(sorted[sorted.length - 1].attackDate);
  const range    = latest - earliest || 1;

  function pct(date) {
    return ((new Date(date) - earliest) / range) * 90 + 5;
  }

  const AXIS_Y      = 36;
  const NUM_ROWS    = 7;
  const ROW_STEP    = 42;
  const STEMS       = Array.from({ length: NUM_ROWS }, (_, i) => 28 + i * ROW_STEP);
  const NODE_TOP    = STEMS.map(s => AXIS_Y + 2 + s);
  const LABEL_TOP   = NODE_TOP.map(t => t + 14 + 6);
  const CONTAINER_H = LABEL_TOP[NUM_ROWS - 1] + 32;

  // Same-date grouping to spread clusters horizontally
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

  // Greedy row assignment — picks the row with the most horizontal clearance
  // from the previous item in that row, giving each label room to breathe.
  const rowLastLeft = Array(NUM_ROWS).fill(null);
  const rowOf = {};
  for (const b of sorted) {
    const left = leftPct(b);
    let bestRow = 0, bestGap = -Infinity;
    for (let r = 0; r < NUM_ROWS; r++) {
      const gap = rowLastLeft[r] === null ? Infinity : left - rowLastLeft[r];
      if (gap > bestGap) { bestGap = gap; bestRow = r; }
    }
    rowOf[b.id] = bestRow;
    rowLastLeft[bestRow] = left;
  }

  const ticks = quarterlyTicks(earliest, latest);

  function handleNodeEnter(e, breach) {
    setTooltip({ x: e.clientX, y: e.clientY, breach });
  }
  function handleNodeLeave() {
    setTooltip(null);
  }
  function handleNodeMove(e) {
    if (tooltip) setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }));
  }

  return (
    <div>
      <div style={{ position: 'relative', height: `${CONTAINER_H}px` }}>

        {/* Dynamic date labels above the axis */}
        {ticks.map(tick => (
          <div key={tick.toISOString()} style={{
            position: 'absolute',
            top: '4px',
            left: `${pct(tick)}%`,
            fontFamily: "'Roboto', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#4a5568',
            letterSpacing: '0.06em',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}>
            {MONTH_SHORT[tick.getMonth()]} {tick.getFullYear()}
          </div>
        ))}

        {/* Axis line */}
        <div style={{
          position: 'absolute',
          top: `${AXIS_Y}px`,
          left: '5%',
          right: '5%',
          height: '2px',
          background: 'linear-gradient(90deg, rgba(42,49,77,0.1), rgba(42,49,77,0.35), rgba(42,49,77,0.1))',
          borderRadius: '2px',
        }}>
          <div style={{
            position: 'absolute', top: '-1px', left: 0,
            width: '60px', height: '4px',
            background: 'linear-gradient(90deg, transparent, rgba(42,49,77,0.5), transparent)',
            animation: 'scan 5s linear infinite',
          }} />
        </div>

        {/* Tick marks on axis */}
        {ticks.map(tick => (
          <div key={'tick-' + tick.toISOString()} style={{
            position: 'absolute',
            top: `${AXIS_Y - 4}px`,
            left: `${pct(tick)}%`,
            width: '1px',
            height: '10px',
            background: 'rgba(42,49,77,0.3)',
            transform: 'translateX(-50%)',
          }} />
        ))}

        {/* Breach nodes */}
        {sorted.map((breach) => {
          const left  = leftPct(breach);
          const color = categoryColor(breach.attackCategory);
          const row   = rowOf[breach.id];
          const nTop  = NODE_TOP[row];
          const lTop  = LABEL_TOP[row];
          const stemH = STEMS[row];

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
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${nTop}px`,
                  transform: 'translate(-50%, 0)',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: `2px solid ${color}`,
                  cursor: 'default',
                  boxShadow: '0 1px 4px rgba(42,49,77,0.15)',
                  transition: 'all 0.15s ease',
                  zIndex: 2,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translate(-50%, 0) scale(1.5)';
                  e.currentTarget.style.background = color;
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${color}25, 0 2px 8px ${color}50`;
                  handleNodeEnter(e, breach);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(-50%, 0) scale(1)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(42,49,77,0.15)';
                  handleNodeLeave();
                }}
                onMouseMove={handleNodeMove}
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
                fontWeight: 500,
                color: '#374151',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                {breach.telco}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16,
          top: tooltip.y - 20,
          background: 'white',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 6px 28px rgba(42,49,77,0.18)',
          border: '1px solid rgba(42,49,77,0.08)',
          borderTop: `4px solid ${categoryColor(tooltip.breach.attackCategory)}`,
          pointerEvents: 'none',
          zIndex: 9999,
          maxWidth: '320px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
          }}>
            <span style={{
              background: `${categoryColor(tooltip.breach.attackCategory)}18`,
              border: `1px solid ${categoryColor(tooltip.breach.attackCategory)}30`,
              borderRadius: '5px',
              padding: '2px 8px',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: categoryColor(tooltip.breach.attackCategory),
              textTransform: 'uppercase',
            }}>
              {tooltip.breach.attackCategory}
            </span>
          </div>
          <div style={{
            fontFamily: "'PT Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 700,
            color: '#2a314d',
            marginBottom: '2px',
          }}>
            {tooltip.breach.telco}
          </div>
          <div style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '12px',
            color: '#8896b0',
            marginBottom: '10px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(42,49,77,0.08)',
          }}>
            {tooltip.breach.country} · {new Date(tooltip.breach.attackDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {tooltip.breach.details && (
            <div style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '12px',
              color: '#4a5568',
              lineHeight: 1.6,
            }}>
              {tooltip.breach.details.length > 220
                ? tooltip.breach.details.slice(0, 220) + '…'
                : tooltip.breach.details}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
