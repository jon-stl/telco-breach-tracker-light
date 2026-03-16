/**
 * update-data.js
 * ──────────────
 * Reads the "Telco breach tracker.xlsx" file and exports its data to
 * public/data/breaches.json for the Next.js visualisation.
 *
 * Usage:
 *   node scripts/update-data.js [path-to-xlsx]
 *
 * Default Excel path (relative to this script's location):
 *   ../../Telco breach tracker.xlsx
 *
 * Run this whenever the Excel is updated, then commit and push to redeploy.
 */

const path = require('path');
const fs   = require('fs');

// Try to load xlsx; install via: npm install xlsx --save-dev
let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('Error: xlsx package not found. Run: npm install xlsx --save-dev');
  process.exit(1);
}

// ─── Paths ──────────────────────────────────────────────────────────────────
const DEFAULT_XLSX = path.resolve(__dirname, '..', '..', 'Telco breach tracker.xlsx');
const xlsxPath     = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_XLSX;
const outputPath   = path.resolve(__dirname, '..', 'public', 'data', 'breaches.json');

console.log(`Reading: ${xlsxPath}`);
if (!fs.existsSync(xlsxPath)) {
  console.error(`Excel file not found: ${xlsxPath}`);
  console.error('Provide the path as an argument: node scripts/update-data.js "path/to/file.xlsx"');
  process.exit(1);
}

// ─── Read workbook ───────────────────────────────────────────────────────────
const wb = XLSX.readFile(xlsxPath, { cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'YYYY-MM-DD' });

// Identify header row (first row)
const [header, ...dataRows] = rows;

// Column indices (based on known structure: Telco | Country | AttackDate | DisclosureDate | Details | Type | Attacker | Consequences | LastUpdated | Link)
const COL = {
  telco:        0,
  country:      1,
  attackDate:   2,
  disclosureDate: 3,
  details:      4,
  attackType:   5,
  attacker:     6,
  consequences: 7,
  lastUpdated:  8,
  link:         9,
};

// ─── Attack category normaliser ─────────────────────────────────────────────
function categorise(raw, attacker) {
  if (!raw) return 'Cyberattack';
  const t = (raw + ' ' + (attacker || '')).toLowerCase();
  if (t.includes('ransomware') || t.includes('warlock')) return 'Ransomware';
  if (t.includes('unc3886') || t.includes('apt') || t.includes('espionage') || t.includes('rootkit') || t.includes('intelligence')) return 'APT / Espionage';
  if (t.includes('bpfdoor') || t.includes('malware') || t.includes('backdoor')) return 'Malware / BPFDoor';
  if (t.includes('data') || t.includes('exfiltrat') || t.includes('customer') || t.includes('breach')) return 'Data Breach';
  return 'Cyberattack';
}

// ─── Severity inferrer ───────────────────────────────────────────────────────
function inferSeverity(category, affected, attacker) {
  const a = (attacker || '').toLowerCase();
  if (a.includes('unc3886') || a.includes('china') || a.includes('north korea') || a.includes('nation')) return 'critical';
  if (category === 'APT / Espionage') return 'critical';
  if (affected && affected > 5000000) return 'high';
  if (category === 'Ransomware' && affected && affected > 1000000) return 'high';
  if (category === 'Ransomware') return 'medium';
  if (affected && affected > 500000) return 'high';
  if (affected && affected > 0) return 'medium';
  return 'medium';
}

// ─── Region mapper ───────────────────────────────────────────────────────────
function regionOf(country) {
  const map = {
    'Singapore': 'Asia-Pacific', 'South Korea': 'Asia-Pacific', 'Japan': 'Asia-Pacific',
    'Netherlands': 'Europe', 'UK': 'Europe', 'France': 'Europe', 'Belgium': 'Europe',
    'Germany': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
    'USA': 'Americas', 'Canada': 'Americas', 'Brazil': 'Americas',
    'Australia': 'Asia-Pacific', 'India': 'Asia-Pacific',
  };
  return map[country] || 'Other';
}

// ─── Parse date string ───────────────────────────────────────────────────────
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val).trim();
  if (!s) return null;
  // Excel may give "DD/MM/YYYY" or "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

// ─── Parse customer count ────────────────────────────────────────────────────
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
      if (/million/i.test(text.slice(text.indexOf(m[0]), text.indexOf(m[0]) + 20))) n *= 1000000;
      if (n > 100) return Math.round(n);
    }
  }
  return null;
}

// ─── Build breach records ─────────────────────────────────────────────────────
let lastUpdatedDate = new Date(0);
const breaches = [];
let id = 1;

for (const row of dataRows) {
  const telco = (row[COL.telco] || '').trim();
  if (!telco) continue; // skip empty rows

  const country      = (row[COL.country] || '').trim();
  const attackDate   = parseDate(row[COL.attackDate]);
  const disclosureDate = parseDate(row[COL.disclosureDate]);
  const details      = (row[COL.details] || '').trim();
  const attackTypeRaw = (row[COL.attackType] || '').trim();
  const attacker     = (row[COL.attacker] || '').trim() || null;
  const consequences = (row[COL.consequences] || '').trim() || null;
  const lastUpdated  = parseDate(row[COL.lastUpdated]);
  const link         = (row[COL.link] || '').trim() || null;

  if (!attackDate) continue; // need at least an attack date

  if (lastUpdated) {
    const d = new Date(lastUpdated);
    if (d > lastUpdatedDate) lastUpdatedDate = d;
  }

  const attackCategory = categorise(attackTypeRaw, attacker);
  const customersAffected = parseCustomers(details, consequences);
  const severity = inferSeverity(attackCategory, customersAffected, attacker);

  breaches.push({
    id: id++,
    telco,
    country,
    region: regionOf(country),
    attackDate,
    disclosureDate: disclosureDate || null,
    details: details || null,
    attackCategory,
    attacker: attacker || 'Unknown',
    customersAffected,
    consequences: consequences || null,
    lastUpdated,
    link: link || null,
    severity,
  });
}

// ─── Write output ────────────────────────────────────────────────────────────
const output = {
  lastUpdated: lastUpdatedDate > new Date(0)
    ? lastUpdatedDate.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10),
  breaches,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`✅ Exported ${breaches.length} breaches to: ${outputPath}`);
console.log(`   Last updated: ${output.lastUpdated}`);
