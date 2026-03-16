'use client';
import { useState, useEffect } from 'react';

function getDaysSince(fromDate) {
  const now = new Date();
  const then = new Date(fromDate);
  return Math.max(0, Math.floor((now - then) / 86400000));
}

export default function DaysBadge({ lastBreachDate, lastBreachTelco, lastBreachCountry }) {
  const [days, setDays] = useState(getDaysSince(lastBreachDate));

  // Update at midnight
  useEffect(() => {
    const interval = setInterval(() => setDays(getDaysSince(lastBreachDate)), 60000);
    return () => clearInterval(interval);
  }, [lastBreachDate]);

  const formattedDate = new Date(lastBreachDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '8px 0',
    }}>
      {/* Outer glow ring + badge */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated pulse ring */}
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '2px solid rgba(5, 150, 105, 0.3)',
          animation: 'ringPulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          border: '1px solid rgba(5, 150, 105, 0.15)',
          animation: 'ringPulse 3s ease-in-out infinite 1.5s',
        }} />

        {/* Main badge circle */}
        <div style={{
          width: '172px',
          height: '172px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '3px solid rgba(5, 150, 105, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(5, 150, 105, 0.18), 0 2px 8px rgba(5, 150, 105, 0.1)',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Tick icon */}
          <div style={{
            fontSize: '1.4rem',
            marginBottom: '2px',
            lineHeight: 1,
          }}>✓</div>
          <div style={{
            fontFamily: "'PT Sans', sans-serif",
            fontSize: 'clamp(3rem, 7vw, 4.5rem)',
            fontWeight: 700,
            color: '#065f46',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {days}
          </div>
          <div style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#059669',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}>
            DAYS
          </div>
        </div>
      </div>

      {/* Title + sub-label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'PT Sans', sans-serif",
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
          fontWeight: 700,
          color: '#065f46',
          marginBottom: '6px',
          letterSpacing: '0.02em',
        }}>
          Days Without a Reported Breach
        </div>
        <div style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: '0.82rem',
          color: '#6b7a99',
          lineHeight: 1.5,
        }}>
          Last reported breach:{' '}
          <span style={{ color: '#2a314d', fontWeight: 600 }}>
            {lastBreachTelco} ({lastBreachCountry})
          </span>
          {' '}on{' '}
          <span style={{ color: '#2a314d', fontWeight: 500 }}>
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
