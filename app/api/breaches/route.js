import { NextResponse } from 'next/server';

// ── Data source ───────────────────────────────────────────────────────────────
// SharePoint is used when AZURE_TENANT_ID is set in Vercel environment variables.
// Falls back to the Google Sheet CSV while SharePoint is being set up.
//
// Required Vercel env vars for SharePoint:
//   AZURE_TENANT_ID          – Azure AD tenant ID
//   AZURE_CLIENT_ID          – App registration client ID
//   AZURE_CLIENT_SECRET      – App registration client secret
//   SHAREPOINT_DRIVE_ID      – Drive ID of the document library
//   SHAREPOINT_FILE_ID       – Item ID of the Excel file (stable even if file is moved/renamed)
//   SHAREPOINT_WORKSHEET     – Sheet tab name (defaults to Sheet1)

const GOOGLE_SHEET_ID = '1unWQy9_C2nXV8RnPXunFF4pmqIhkBmXFoC52ZdUF8nY';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

export const revalidate = 300;

// ── Microsoft Graph: get access token ────────────────────────────────────────
async function getMsToken() {
  const body = new URLSearchParams({
    client_id:     process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope:         'https://graph.microsoft.com/.default',
    grant_type:    'client_credentials',
  });
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const json = await res.json();
  if (!json.access_token) throw new Error(`MS token error: ${json.error_description || json.error}`);
  return json.access_token;
}

// ── Microsoft Graph: read Excel worksheet as 2-D array ───────────────────────
async function fetchSharePointRows() {
  const token     = await getMsToken();
  const driveId   = process.env.SHAREPOINT_DRIVE_ID;
  const fileId    = process.env.SHAREPOINT_FILE_ID;
  const sheetName = process.env.SHAREPOINT_WORKSHEET || 'Sheet1';

  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets('${sheetName}')/usedRange(valuesOnly=true)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SharePoint Graph API ${res.status}: ${err}`);
  }
  const { values } = await res.json();
  return values; // 2-D array; row 0 is headers
}

// ── Google Sheets CSV fetch → 2-D array ──────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
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

async function fetchGoogleRows() {
  const res = await fetch(CSV_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Google Sheets returned ${res.status}`);
  return parseCSV(await res.text());
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function categorise(raw) {
  // Use the value from the Type column as-is; fall back only when blank.
  const cleaned = (raw || '').trim();
  return cleaned || 'Cyberattack';
}

function inferSeverity(category, affected, attacker) {
  const a = (attacker || '').toLowerCase();
  if (a.includes('unc3886') || a.includes('china') || a.includes('north korea') || a.includes('nation')) return 'critical';
  const c = category.toLowerCase();
  if (c.includes('apt') || c.includes('espionage') || c.includes('nation')) return 'critical';
  if (affected && affected > 5_000_000)                                      return 'high';
  if (c.includes('ransomware') && affected && affected > 1_000_000)         return 'high';
  if (c.includes('ransomware'))                                              return 'medium';
  if (affected && affected > 500_000)                                        return 'high';
  if (affected && affected > 0)                                              return 'medium';
  return 'medium';
}

function regionOf(country) {
  const map = {
    'Singapore': 'Asia-Pacific', 'South Korea': 'Asia-Pacific', 'Japan': 'Asia-Pacific',
    'Netherlands': 'Europe',     'UK': 'Europe',                'France': 'Europe',
    'Belgium': 'Europe',         'Germany': 'Europe',           'Italy': 'Europe',
    'Spain': 'Europe',           'Portugal': 'Europe',          'Sweden': 'Europe',
    'Norway': 'Europe',          'Denmark': 'Europe',           'Finland': 'Europe',
    'USA': 'Americas',           'Canada': 'Americas',          'Brazil': 'Americas',
    'Mexico': 'Americas',        'Australia': 'Asia-Pacific',   'India': 'Asia-Pacific',
    'Indonesia': 'Asia-Pacific', 'Thailand': 'Asia-Pacific',    'Vietnam': 'Asia-Pacific',
  };
  return map[country] || 'Other';
}

function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Excel serial number (Graph API may return these)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    if (n > 40000 && n < 60000) {
      const d = new Date((n - 25569) * 86400 * 1000);
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
    }
  }
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

function buildBreaches(dataRows) {
  const COL = {
    telco: 0, country: 1, attackDate: 2, disclosureDate: 3,
    attackType: 4, details: 5, attacker: 6, consequences: 7,
    lastUpdated: 8, link: 9,
  };

  let lastUpdatedDate = new Date(0);
  const breaches = [];
  let id = 1;

  for (const row of dataRows) {
    const telco = (row[COL.telco] || '').trim();
    if (!telco || telco.toLowerCase() === 'unclear') continue;

    const country        = (row[COL.country]       || '').trim();
    const attackDate     = parseDate(row[COL.attackDate]);
    const disclosureDate = parseDate(row[COL.disclosureDate]);
    const details        = (row[COL.details]       || '').trim();
    const attackTypeRaw  = (row[COL.attackType]    || '').trim();
    const attacker       = (row[COL.attacker]      || '').trim() || null;
    const consequences   = (row[COL.consequences]  || '').trim() || null;
    const lastUpdated    = parseDate(row[COL.lastUpdated]);
    const link           = (row[COL.link]          || '').trim() || null;

    if (!attackDate) continue;

    if (lastUpdated) {
      const d = new Date(lastUpdated);
      if (d > lastUpdatedDate) lastUpdatedDate = d;
    }

    const attackCategory    = categorise(attackTypeRaw);
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

  // Sort chronologically (oldest first)
  breaches.sort((a, b) => new Date(a.attackDate) - new Date(b.attackDate));

  return {
    lastUpdated: lastUpdatedDate > new Date(0)
      ? lastUpdatedDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    breaches,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    let rows;

    if (process.env.AZURE_TENANT_ID) {
      // SharePoint path
      const allRows = await fetchSharePointRows();
      const [, ...dataRows] = allRows; // drop header row
      rows = dataRows;
    } else {
      // Google Sheets fallback
      const allRows = await fetchGoogleRows();
      const [, ...dataRows] = allRows; // drop header row
      rows = dataRows;
    }

    const output = buildBreaches(rows);

    return NextResponse.json(output, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[/api/breaches]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
