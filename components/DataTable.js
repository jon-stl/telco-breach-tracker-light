'use client';
import { useState, useMemo } from 'react';

const CATEGORY_COLORS = {
  'APT / Espionage':   '#e3051c',
  'Ransomware':        '#f39200',
  'Data Breach':       '#7b6cf0',
  'Malware / BPFDoor': '#00a87a',
  'Cyberattack':       '#f39200',
};

export default function DataTable({ breaches }) {
  const [search, setSearch]               = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortKey, setSortKey]             = useState('attackDate');
  const [sortDir, setSortDir]             = useState('desc');
  const [expandedId, setExpandedId]       = useState(null);

  const countries  = ['All', ...Array.from(new Set(breaches.map(b => b.country))).sort()];
  const categories = ['All', ...Array.from(new Set(breaches.map(b => b.attackCategory))).sort()];

  const filtered = useMemo(() => {
    let result = breaches;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.telco.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q) ||
        b.attacker?.toLowerCase().includes(q) ||
        b.attackCategory.toLowerCase().includes(q)
      );
    }
    if (filterCountry !== 'All')   result = result.filter(b => b.country === filterCountry);
    if (filterCategory !== 'All')  result = result.filter(b => b.attackCategory === filterCategory);

    return [...result].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'attackDate')        { av = new Date(av); bv = new Date(bv); }
      else if (sortKey === 'customersAffected') { av = av || 0; bv = bv || 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [breaches, search, filterCountry, filterCategory, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const SortArrow = ({ col }) => (
    <span style={{ marginLeft: '4px', opacity: sortKey === col ? 1 : 0.3, fontSize: '0.7rem' }}>
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const inputStyle = {
    background: '#ffffff',
    border: '1px solid rgba(42,49,77,0.15)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#2a314d',
    fontFamily: "'Roboto', sans-serif",
    fontSize: '0.85rem',
    outline: 'none',
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8896b0', fontSize: '0.9rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Search telco, country, attacker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(42,49,77,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(42,49,77,0.15)'}
          />
        </div>

        <Select value={filterCountry}  options={countries}  onChange={setFilterCountry}  label="Country" />
        <Select value={filterCategory} options={categories} onChange={setFilterCategory} label="Attack Type" />

        <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', color: '#8896b0', whiteSpace: 'nowrap', alignSelf: 'center' }}>
          {filtered.length} of {breaches.length} incidents
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(42,49,77,0.1)', boxShadow: '0 1px 6px rgba(42,49,77,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Roboto', sans-serif", fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fc' }}>
              {[
                { key: 'telco',             label: 'Telco' },
                { key: 'country',           label: 'Country' },
                { key: 'attackDate',        label: 'Attack Date' },
                { key: 'attackCategory',    label: 'Attack Type' },
                { key: 'attacker',          label: 'Threat Actor' },
                { key: 'customersAffected', label: 'Customers' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    color: '#8896b0',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(42,49,77,0.1)',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    background: sortKey === col.key ? 'rgba(42,49,77,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#2a314d'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8896b0'}
                >
                  {col.label}<SortArrow col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((breach, i) => {
              const isExpanded = expandedId === breach.id;
              return [
                <tr
                  key={breach.id}
                  onClick={() => setExpandedId(isExpanded ? null : breach.id)}
                  style={{
                    background: isExpanded
                      ? 'rgba(42,49,77,0.04)'
                      : i % 2 === 0 ? '#ffffff' : '#fafbfd',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    borderBottom: isExpanded ? 'none' : '1px solid rgba(42,49,77,0.06)',
                  }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(42,49,77,0.03)'; }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#fafbfd'; }}
                >
                  <td style={{ padding: '12px 14px', color: '#2a314d', fontWeight: 600 }}>
                    {breach.telco}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#374151' }}>
                    <CountryFlag country={breach.country} /> {breach.country}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                    {new Date(breach.attackDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: `${CATEGORY_COLORS[breach.attackCategory] || '#8896b0'}15`,
                      color: CATEGORY_COLORS[breach.attackCategory] || '#8896b0',
                      border: `1px solid ${CATEGORY_COLORS[breach.attackCategory] || '#8896b0'}30`,
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      {breach.attackCategory}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: breach.attacker ? '#f39200' : '#c0c8dc', fontWeight: breach.attacker ? 500 : 400 }}>
                    {breach.attacker || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: breach.customersAffected ? '#2a314d' : '#c0c8dc', fontWeight: breach.customersAffected ? 600 : 400 }}>
                    {breach.customersAffected
                      ? (breach.customersAffected >= 1000000
                          ? (breach.customersAffected / 1000000).toFixed(1) + 'M'
                          : (breach.customersAffected / 1000).toFixed(0) + 'k')
                      : '—'}
                  </td>
                </tr>,
                isExpanded && (
                  <tr key={`${breach.id}-detail`} style={{
                    background: 'rgba(42,49,77,0.02)',
                    borderBottom: '1px solid rgba(42,49,77,0.06)',
                  }}>
                    <td colSpan={6} style={{ padding: '16px 14px 16px 20px' }}>
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '2 1 300px' }}>
                          <div style={{
                            fontFamily: "'PT Sans', sans-serif",
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            color: '#8896b0',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                          }}>
                            Incident Details
                          </div>
                          <p style={{ color: '#4a5568', lineHeight: 1.65, margin: 0, fontSize: '0.82rem' }}>
                            {breach.details}
                          </p>
                          {breach.consequences && (
                            <p style={{ color: '#6b7a99', lineHeight: 1.6, margin: '8px 0 0', fontSize: '0.78rem', fontStyle: 'italic' }}>
                              <strong style={{ color: '#f39200', fontStyle: 'normal' }}>Consequences: </strong>
                              {breach.consequences}
                            </p>
                          )}
                        </div>
                        {breach.link && breach.link.startsWith('http') && (
                          <div style={{ alignSelf: 'flex-start' }}>
                            <a
                              href={breach.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(42,49,77,0.06)',
                                border: '1px solid rgba(42,49,77,0.15)',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                color: '#2a314d',
                                textDecoration: 'none',
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: '0.78rem',
                                fontWeight: 500,
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(42,49,77,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(42,49,77,0.06)'}
                            >
                              View Source ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({ value, options, onChange, label }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(42,49,77,0.15)',
        borderRadius: '8px',
        padding: '10px 12px',
        color: value !== 'All' ? '#2a314d' : '#8896b0',
        fontFamily: "'Roboto', sans-serif",
        fontSize: '0.82rem',
        cursor: 'pointer',
        outline: 'none',
        minWidth: '130px',
        fontWeight: value !== 'All' ? 600 : 400,
      }}
    >
      {options.map(o => (
        <option key={o} value={o}>{o === 'All' ? `All ${label}s` : o}</option>
      ))}
    </select>
  );
}

function CountryFlag({ country }) {
  const flags = {
    'Netherlands': '🇳🇱', 'Singapore': '🇸🇬', 'South Korea': '🇰🇷',
    'UK': '🇬🇧', 'France': '🇫🇷', 'Belgium': '🇧🇪',
  };
  return flags[country] || '🌐';
}
