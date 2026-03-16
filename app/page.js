'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DaysBadge from '../components/DaysBadge';
import StatsRow from '../components/StatsRow';
import BreachTimeline from '../components/BreachTimeline';
import { CountryChart, AttackTypeChart } from '../components/Charts';
import DataTable from '../components/DataTable';

const FloatingBackground = dynamic(() => import('../components/FloatingBackground'), { ssr: false });

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, children, highlight = false }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '18px',
      padding: 'clamp(20px, 3vw, 32px)',
      boxShadow: highlight
        ? '0 4px 24px rgba(5,150,105,0.12), 0 1px 4px rgba(42,49,77,0.06)'
        : '0 2px 16px rgba(42,49,77,0.07), 0 1px 4px rgba(42,49,77,0.04)',
      border: highlight
        ? '1px solid rgba(5,150,105,0.2)'
        : '1px solid rgba(42,49,77,0.07)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top colour accent */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '3px',
        background: highlight
          ? 'linear-gradient(90deg, #059669, #34d399)'
          : 'linear-gradient(90deg, #e3051c, #f39200)',
        borderRadius: '18px 18px 0 0',
      }} />

      {title && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          marginTop: '4px',
        }}>
          <div style={{
            width: '3px',
            height: '18px',
            background: highlight ? '#059669' : '#e3051c',
            borderRadius: '2px',
            flexShrink: 0,
          }} />
          <h2 style={{
            fontFamily: "'PT Sans', sans-serif",
            fontSize: 'clamp(0.82rem, 2vw, 0.95rem)',
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: '#4a5568',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            {title}
          </h2>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── "Updated" badge ──────────────────────────────────────────────────────────
function UpdatedBadge() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(5,150,105,0.08)',
      border: '1px solid rgba(5,150,105,0.2)',
      borderRadius: '20px',
      padding: '4px 12px',
    }}>
      <span style={{
        width: '7px', height: '7px',
        borderRadius: '50%',
        background: '#059669',
        display: 'inline-block',
        animation: 'blink 2s ease-in-out infinite',
      }} />
      <span style={{
        fontFamily: "'PT Sans', sans-serif",
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: '#059669',
        textTransform: 'uppercase',
      }}>
        Live Data
      </span>
    </div>
  );
}

// ─── STL Logo ─────────────────────────────────────────────────────────────────
function STLLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
        <rect x="0"  y="0"  width="14" height="14" rx="2" fill="#e3051c" />
        <rect x="18" y="0"  width="14" height="14" rx="2" fill="#f39200" />
        <rect x="0"  y="18" width="14" height="14" rx="2" fill="#2a314d" />
        <rect x="18" y="18" width="14" height="14" rx="2" fill="#2a314d" opacity="0.4" />
      </svg>
      <div>
        <div style={{
          fontFamily: "'PT Sans', sans-serif",
          fontSize: '0.88rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#2a314d',
          textTransform: 'uppercase',
          lineHeight: 1.1,
        }}>
          STL Partners
        </div>
        <div style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: '0.58rem',
          color: '#8896b0',
          letterSpacing: '0.1em',
        }}>
          RESEARCH & ANALYSIS
        </div>
      </div>
    </div>
  );
}

// ─── Threat Actor Spotlight ───────────────────────────────────────────────────
function ThreatActors({ breaches }) {
  const actorMap = {};
  for (const b of breaches) {
    let actor = b.attacker && b.attacker !== 'Unknown' ? b.attacker : null;
    if (actor === 'Warlock?') actor = 'Warlock';
    if (actor) {
      if (!actorMap[actor]) actorMap[actor] = { count: 0, breaches: [], totalImpact: 0 };
      actorMap[actor].count++;
      if (!actorMap[actor].breaches.includes(b.telco)) actorMap[actor].breaches.push(b.telco);
      actorMap[actor].totalImpact += b.customersAffected || 0;
    }
  }

  const unknownCount = breaches.filter(b => !b.attacker || b.attacker === 'Unknown').length;
  const actors = Object.entries(actorMap).sort((a, b) => b[1].count - a[1].count);

  const profiles = {
    'UNC3886': {
      type: 'Nation-State APT',
      origin: 'China-nexus (suspected)',
      description: 'Sophisticated espionage group known for exploiting zero-day vulnerabilities in network devices. Targets telcos for long-term intelligence gathering using custom rootkits.',
      color: '#e3051c',
      icon: '🎯',
    },
    'Warlock': {
      type: 'Ransomware Group',
      origin: 'Unknown',
      description: 'Financially motivated ransomware operator targeting European telecoms. Employs double-extortion tactics — encrypting systems while threatening to publish stolen data.',
      color: '#f39200',
      icon: '🔒',
    },
    'Assumed China/North Korea': {
      type: 'Nation-State APT',
      origin: 'East Asia',
      description: 'Attribution assessed as China or North Korea-linked. Deployed BPFDoor malware — a sophisticated Linux backdoor that abuses Berkeley Packet Filter to evade detection.',
      color: '#e3051c',
      icon: '🎯',
    },
  };

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {actors.map(([name, info]) => {
        const profile = profiles[name] || { type: 'Unknown', origin: 'Unknown', description: 'Attribution details pending investigation.', color: '#8896b0', icon: '❓' };
        return (
          <div key={name} style={{
            flex: '1 1 260px',
            background: '#f8f9fc',
            border: `1px solid ${profile.color}25`,
            borderTop: `3px solid ${profile.color}`,
            borderRadius: '12px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${profile.color}12`,
                border: `1px solid ${profile.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
              }}>
                {profile.icon}
              </div>
              <div>
                <div style={{ fontFamily: "'PT Sans', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: '#2a314d', marginBottom: '2px' }}>
                  {name}
                </div>
                <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.68rem', color: profile.color, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {profile.type} · {profile.origin}
                </div>
              </div>
            </div>

            <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.78rem', color: '#6b7a99', lineHeight: 1.6, marginBottom: '12px' }}>
              {profile.description}
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: '#ffffff', border: '1px solid rgba(42,49,77,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'PT Sans', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: profile.color }}>{info.count}</div>
                <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.6rem', color: '#8896b0', letterSpacing: '0.1em' }}>INCIDENTS</div>
              </div>
              {info.totalImpact > 0 && (
                <div style={{ background: '#ffffff', border: '1px solid rgba(42,49,77,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'PT Sans', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: profile.color }}>
                    {info.totalImpact >= 1000000 ? (info.totalImpact / 1000000).toFixed(1) + 'M' : (info.totalImpact / 1000).toFixed(0) + 'k'}
                  </div>
                  <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.6rem', color: '#8896b0', letterSpacing: '0.1em' }}>CUSTOMERS</div>
                </div>
              )}
              <div style={{ background: '#ffffff', border: '1px solid rgba(42,49,77,0.1)', borderRadius: '8px', padding: '6px 12px' }}>
                <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.7rem', color: '#4a5568' }}>{info.breaches.join(', ')}</div>
                <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.6rem', color: '#8896b0', letterSpacing: '0.1em', marginTop: '2px' }}>TARGETS</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Unknown attribution card */}
      <div style={{
        flex: '1 1 160px',
        background: '#f8f9fc',
        border: '1px solid rgba(42,49,77,0.1)',
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '6px',
      }}>
        <div style={{ fontSize: '1.8rem' }}>❓</div>
        <div style={{ fontFamily: "'PT Sans', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#2a314d' }}>{unknownCount}</div>
        <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.72rem', color: '#8896b0', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.5 }}>
          Incidents with<br />Unknown Attribution
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data/breaches.json')
      .then(r => r.json())
      .then(setData)
      .catch(() => setError('Failed to load breach data'));
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e3051c', fontFamily: "'Roboto', sans-serif" }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          fontFamily: "'PT Sans', sans-serif",
          fontSize: '0.75rem',
          letterSpacing: '0.25em',
          color: '#8896b0',
          textTransform: 'uppercase',
        }}>
          Loading data...
        </div>
      </div>
    );
  }

  const breaches = data.breaches;
  const sorted   = [...breaches].sort((a, b) => new Date(b.attackDate) - new Date(a.attackDate));
  const latest   = sorted[0];

  return (
    <>
      <FloatingBackground />

      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        padding: 'clamp(16px, 3vw, 32px)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: 'clamp(24px, 4vw, 44px)',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(42,49,77,0.1)',
        }}>
          <STLLogo />

          <div style={{ textAlign: 'center', flex: '1' }}>
            <h1 style={{
              fontFamily: "'PT Sans', sans-serif",
              fontSize: 'clamp(1.3rem, 3vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#2a314d',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Telco Cyber Breach Tracker
            </h1>
            <div style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.88rem',
              color: '#374151',
              letterSpacing: '0.04em',
              marginTop: '6px',
            }}>
              Tracking major cybersecurity incidents in global telecommunications
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <UpdatedBadge />
            <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.72rem', color: '#8896b0' }}>
              Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* ── Days badge hero ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
          <Card highlight>
            <DaysBadge
              lastBreachDate={latest.attackDate}
              lastBreachTelco={latest.telco}
              lastBreachCountry={latest.country}
            />
          </Card>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
          <StatsRow breaches={breaches} />
        </div>

        {/* ── Timeline ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
          <Card title="Incident Timeline — Click nodes to explore">
            <BreachTimeline breaches={breaches} />
          </Card>
        </div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(12px, 2vw, 24px)',
          marginBottom: 'clamp(20px, 3vw, 36px)',
        }}>
          <Card title="Incidents by Country">
            <CountryChart breaches={breaches} />
          </Card>
          <Card title="Attack Type Distribution">
            <AttackTypeChart breaches={breaches} />
          </Card>
        </div>

        {/* ── Threat actor spotlight ────────────────────────────────────────── */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
          <Card title="Threat Actor Spotlight">
            <ThreatActors breaches={breaches} />
          </Card>
        </div>

        {/* ── Data table ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
          <Card title="Full Incident Database — Click any row for details">
            <DataTable breaches={breaches} />
          </Card>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid rgba(42,49,77,0.1)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.72rem', color: '#b0bbd0' }}>
            © STL Partners {new Date().getFullYear()} · Data sourced from public disclosures and threat intelligence reports
          </div>
          <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.72rem', color: '#b0bbd0' }}>
            {breaches.length} incidents tracked · {new Set(breaches.map(b => b.country)).size} countries
          </div>
        </footer>
      </div>
    </>
  );
}
