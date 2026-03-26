import { NextResponse } from 'next/server';

// ── Google Sheet source ───────────────────────────────────────────────────────
// To change the source sheet: update SHEET_ID to the new spreadsheet's ID
// (the long string in the Google Sheets URL after /spreadsheets/d/)
// The sheet must be shared as "Anyone with the link → Viewer"
const SHEET_ID = '1r90TePTD5DUiHkTAax9AAGMd-p9MzHXEO7NjX-mo0KU';
const CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// ── Next.js route-segment cache: revalidate every 5 minutes ──────────────────
export const revalidate = 300;

// ── CSV parser (handles quoted fields / embedded commas) ─────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch   = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"')            { inQuotes = false; }
      else                            { field += ch; }
    } else {
      if      (ch === '"')  { inQuotes = true; }
      else if (ch === ',')  { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else                  { field += ch; }
    }
  }
  if (field || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// ── Logic ported from scripts/update-data.js ─────────────────────────────────
function categorise(raw, attacker) {
  if (!raw) return 'Cyberattack';
  const t = (raw + ' ' + (attacker || '')).toLowerCase();
  if (t.includes('ransomware') || t.includes('warlock'))                                          return 'Ransomware';
  if (t.includes('unc3886') || t.includes('apt') || t.includes('espionage') ||
      t.includes('rootkit') || t.includes('intelligence'))                                        return 'APT / Espionage';
  if (t.includes('bpfdoor') || t.includes('malware') || t.includes('backdoor'))                  return 'Malware / BPFDoor';
  if (t.includes('data') || t.includes('exfiltrat') || t.includes('customer') ||
      t.includes('breach'))                                                                        return 'Data Breach';
  return 'Cyberattack';
}

function inferSeverity(category, affected, attacker) {
  const a = (attacker || '').toLowerCase();
  if (a.includes('unc3886') || a.includes('china') || a.includes('north korea') ||
      a.includes('nation'))                                                        return 'critical';
  if (category === 'APT / Espionage')                                             return 'critical';
  if (affected && affected > 5_000_000)                                           return 'high';
  if (category === 'Ransomware' && affected && affected > 1_000_000)              return 'high';
  if (category === 'Ransomware')                                                  return 'medium';
  if (affected && affected > 500_000)                                             return 'high';
  if (affected && affected > 0)                                                   return 'medium';
  return 'medium';
}

function regionOf(country) {
  const map = {
    'Singapore': 'Asia-Pacific', 'South Korea': 'Asia-Pacific', 'Japan': 'Asia-Pacific',
    'Netherlands': 'Europe',     'UK': 'Europe',                'France': 'Europe',
    'Belgium': 'Europe',         'Germany': 'Europe',           'Italy': 'Europe',
    'Spain': 'Europe',           'USA': 'Americas',             'Canada': 'Americas',
    'Brazil': 'Americas',        'Australia': 'Asia-Pacific',   'India': 'Asia-Pacific',
  };
  return map[country] || 'Other';
}

function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

function parseCustomers(details, consequences) {
  const text = [details, consequences].filter(Boolean).join(' ');
  const patterns = [
    /(\d+(?:\.\d+)?)\s*million/i,
    /(\d[\d,]*)\s*customers/i,
    /(\d[\d,]*)\s*subscribers/i,
    /(\d[\d,]*)\s*users/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      let n = parseFloat(m[1].replace(/,/g, ''));
      if (/million/i.test(text.slice(text.indexOf(m[0]), text.indexOf(m[0]) + 20))) n *= 1_000_000;
      if (n > 100) return Math.round(n);
    }
  }
  return null;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 300 } });

    if (!res.ok) {
      throw new Error(
        `Google Sheets returned ${res.status}. ` +
        `Make sure the sheet is shared as "Anyone with the link → Viewer".`
      );
    }

    const csv      = await res.text();
    const rows     = parseCSV(csv);
    const [, ...dataRows] = rows; // drop header row

    const COL = {
      telco: 0, country: 1, attackDate: 2, disclosureDate: 3,
      details: 4, attackType: 5, attacker: 6, consequences: 7,
      lastUpdated: 8, link: 9,
    };

    let lastUpdatedDate = new Date(0);
    const breaches = [];
    let id = 1;

    for (const row of dataRows) {
      const telco = (row[COL.telco] || '').trim();
      if (!telco) continue;

      const country        = (row[COL.country]        || '').trim();
      const attackDate     = parseDate(row[COL.attackDate]);
      const disclosureDate = parseDate(row[COL.disclosureDate]);
      const details        = (row[COL.details]        || '').trim();
      const attackTypeRaw  = (row[COL.attackType]     || '').trim();
      const attacker       = (row[COL.attacker]       || '').trim() || null;
      const consequences   = (row[COL.consequences]   || '').trim() || null;
      const lastUpdated    = parseDate(row[COL.lastUpdated]);
      const link           = (row[COL.link]           || '').trim() || null;

      if (!attackDate) continue;

      if (lastUpdated) {
        const d = new Date(lastUpdated);
        if (d > lastUpdatedDate) lastUpdatedDate = d;
      }

      const attackCategory    = categorise(attackTypeRaw, attacker);
      const customersAffected = parseCustomers(details, consequences);
      const severity          = inferSeverity(attackCategory, customersAffected, attacker);

      breaches.push({
        id: id++,
        telco,
        country,
        region:          regionOf(country),
        attackDate,
        disclosureDate:  disclosureDate || null,
        details:         details || null,
        attackCategory,
        attacker:        attacker || 'Unknown',
        customersAffected,
        consequences:    consequences || null,
        lastUpdated,
        link:            link || null,
        severity,
      });
    }

    const output = {
      lastUpdated: lastUpdatedDate > new Date(0)
        ? lastUpdatedDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      breaches,
    };

    return NextResponse.json(output, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[/api/breaches]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
