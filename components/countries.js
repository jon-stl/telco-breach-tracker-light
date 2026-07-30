// Single source of truth for per-country display data.
// Add a country here once and it gets a flag in the lists and a dot on the map.
// `coords` are [longitude, latitude] as expected by react-simple-maps.
export const COUNTRIES = {
  // Europe
  'Netherlands':  { flag: '🇳🇱', coords: [   5.3,  52.3 ] },
  'UK':           { flag: '🇬🇧', coords: [  -3.4,  55.4 ] },
  'France':       { flag: '🇫🇷', coords: [   2.2,  46.2 ] },
  'Belgium':      { flag: '🇧🇪', coords: [   4.5,  50.85] },
  'Germany':      { flag: '🇩🇪', coords: [  10.4,  51.2 ] },
  'Spain':        { flag: '🇪🇸', coords: [  -3.7,  40.4 ] },
  'Italy':        { flag: '🇮🇹', coords: [  12.6,  42.5 ] },
  'Sweden':       { flag: '🇸🇪', coords: [  18.6,  59.3 ] },
  'Norway':       { flag: '🇳🇴', coords: [  10.7,  59.9 ] },
  'Denmark':      { flag: '🇩🇰', coords: [  10.0,  56.0 ] },
  'Finland':      { flag: '🇫🇮', coords: [  27.0,  61.9 ] },
  'Portugal':     { flag: '🇵🇹', coords: [  -8.2,  39.4 ] },
  'Switzerland':  { flag: '🇨🇭', coords: [   8.2,  46.8 ] },
  'Austria':      { flag: '🇦🇹', coords: [  14.5,  47.5 ] },

  // Americas
  'USA':          { flag: '🇺🇸', coords: [ -98.6,  39.8 ] },
  'Canada':       { flag: '🇨🇦', coords: [ -96.8,  56.1 ] },
  'Brazil':       { flag: '🇧🇷', coords: [ -51.9, -14.2 ] },
  'Mexico':       { flag: '🇲🇽', coords: [-102.6,  23.6 ] },

  // Asia-Pacific
  'Singapore':    { flag: '🇸🇬', coords: [ 103.8,   1.35] },
  'South Korea':  { flag: '🇰🇷', coords: [ 127.9,  37.5 ] },
  'Japan':        { flag: '🇯🇵', coords: [ 138.2,  36.2 ] },
  'Australia':    { flag: '🇦🇺', coords: [ 133.8, -25.3 ] },
  'India':        { flag: '🇮🇳', coords: [  78.7,  22.2 ] },
  'Indonesia':    { flag: '🇮🇩', coords: [ 113.9,  -0.8 ] },
  'Thailand':     { flag: '🇹🇭', coords: [ 101.0,  15.9 ] },
  'Vietnam':      { flag: '🇻🇳', coords: [ 108.0,  16.2 ] },

  // Middle East
  'UAE':          { flag: '🇦🇪', coords: [  54.4,  24.0 ] },
  'Saudi Arabia': { flag: '🇸🇦', coords: [  45.1,  24.7 ] },

  // Africa
  'South Africa': { flag: '🇿🇦', coords: [  25.1, -29.0 ] },
  'Nigeria':      { flag: '🇳🇬', coords: [   8.7,   9.1 ] },
  'Kenya':        { flag: '🇰🇪', coords: [  37.9,  -0.1 ] },
  'Angola':       { flag: '🇦🇴', coords: [  17.9, -12.3 ] },
};

// Falls back to a globe for placeholder values such as "Unclear".
export function countryFlag(country) {
  return COUNTRIES[country]?.flag || '🌐';
}

// Returns null for countries with no known location, which the map skips.
export function countryCoords(country) {
  return COUNTRIES[country]?.coords || null;
}

export function CountryFlag({ country }) {
  return <span>{countryFlag(country)}</span>;
}
