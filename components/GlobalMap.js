'use client';
import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_COORDS = {
  'Netherlands': [5.3,   52.3 ],
  'Singapore':   [103.8,  1.35],
  'South Korea': [127.9, 37.5 ],
  'UK':          [-3.4,  55.4 ],
  'France':      [2.2,   46.2 ],
  'Belgium':     [4.5,   50.85],
};

const LABEL_OFFSETS = {
  'UK':          { dx: -10, dy: -16, anchor: 'middle' },
  'France':      { dx: -10, dy: 24,  anchor: 'middle' },
  'Belgium':     { dx: 20,  dy: -12, anchor: 'start'  },
  'Netherlands': { dx: 20,  dy: 8,   anchor: 'start'  },
  'Singapore':   { dx: 14,  dy: 16,  anchor: 'start'  },
  'South Korea': { dx: 14,  dy: -14, anchor: 'start'  },
};

function getColor(count) {
  if (count >= 4) return '#e3051c';
  if (count >= 3) return '#d44000';
  if (count >= 2) return '#f39200';
  return '#2a7dc9';
}

export function GlobalMap({ breaches }) {
  const [tooltip, setTooltip] = useState(null);

  // Aggregate incidents by country
  const countryData = {};
  for (const b of breaches) {
    if (!countryData[b.country]) countryData[b.country] = { count: 0, telcos: [] };
    countryData[b.country].count++;
    if (!countryData[b.country].telcos.includes(b.telco)) {
      countryData[b.country].telcos.push(b.telco);
    }
  }

  const markers = Object.entries(countryData).map(([country, data]) => {
    const coords = COUNTRY_COORDS[country];
    if (!coords) return null;
    return { country, ...data, coords };
  }).filter(Boolean);

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @keyframes markerPulse {
          0%   { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(4);  opacity: 0; }
        }
      `}</style>

      {/* Ocean background */}
      <div style={{
        background: 'linear-gradient(180deg, #ddeef8 0%, #c5daf0 100%)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        <ComposableMap
          projectionConfig={{ scale: 147, center: [20, 10] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#d4dde8"
                  stroke="#b8c8d8"
                  strokeWidth={0.4}
                  style={{
                    default:  { outline: 'none' },
                    hover:    { outline: 'none', fill: '#c8d4e2' },
                    pressed:  { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {markers.map(({ country, count, telcos, coords }) => {
            const baseR = 6 + count * 3;
            const color  = getColor(count);
            const offset = LABEL_OFFSETS[country] || { dx: 14, dy: -10, anchor: 'start' };

            return (
              <Marker key={country} coordinates={coords}>
                {/* Pulse rings — one per incident */}
                {Array.from({ length: count }).map((_, i) => (
                  <circle
                    key={i}
                    r={baseR}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      animation: `markerPulse 2.4s ease-out infinite`,
                      animationDelay: `${i * 0.65}s`,
                    }}
                  />
                ))}

                {/* Glow halo */}
                <circle r={baseR + 5} fill={color} opacity={0.15} />

                {/* Main dot */}
                <circle
                  r={baseR}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => setTooltip({ country, count, telcos, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                />

                {/* Incident count badge */}
                {count > 1 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    style={{
                      fontFamily: "'PT Sans', sans-serif",
                      fontSize: '9px',
                      fontWeight: 700,
                      pointerEvents: 'none',
                    }}
                  >
                    {count}
                  </text>
                )}

                {/* Country label */}
                <text
                  x={offset.dx}
                  y={offset.dy}
                  textAnchor={offset.anchor}
                  fill="#1e2840"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: '10px',
                    fontWeight: 600,
                    pointerEvents: 'none',
                    paintOrder: 'stroke',
                    stroke: 'rgba(220,235,248,0.9)',
                    strokeWidth: '3px',
                  }}
                >
                  {country}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* Floating tooltip — larger and easier to read */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16,
          top: tooltip.y - 20,
          background: 'white',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 6px 28px rgba(42,49,77,0.22)',
          border: '1px solid rgba(42,49,77,0.1)',
          borderTop: `4px solid ${getColor(tooltip.count)}`,
          pointerEvents: 'none',
          zIndex: 9999,
          minWidth: '200px',
        }}>
          <div style={{
            fontFamily: "'PT Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 700,
            color: '#2a314d',
            marginBottom: '4px',
          }}>
            {tooltip.country}
          </div>
          <div style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '13px',
            color: getColor(tooltip.count),
            fontWeight: 600,
            marginBottom: '10px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(42,49,77,0.08)',
          }}>
            {tooltip.count} incident{tooltip.count > 1 ? 's' : ''}
          </div>
          <div style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '11px',
            color: '#8896b0',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Operators targeted
          </div>
          {tooltip.telcos.map(t => (
            <div key={t} style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '13px',
              color: '#4a5568',
              lineHeight: 1.8,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ color: getColor(tooltip.count), fontWeight: 700 }}>·</span> {t}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '20px', marginTop: '14px',
        flexWrap: 'wrap', alignItems: 'center',
        fontFamily: "'Roboto', sans-serif", fontSize: '0.72rem', color: '#6b7a99',
      }}>
        {[
          { color: '#2a7dc9', label: '1 incident' },
          { color: '#f39200', label: '2 incidents' },
          { color: '#d44000', label: '3 incidents' },
          { color: '#e3051c', label: '4+ incidents' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', color: '#aab4c8', fontStyle: 'italic' }}>
          Hover markers for details
        </div>
      </div>
    </div>
  );
}
