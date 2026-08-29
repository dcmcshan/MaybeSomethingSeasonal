const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'public', 'MSS.ics');
const outputPath = path.join(__dirname, '..', 'dist', 'MSS.ics');

const source = fs.readFileSync(sourcePath, 'utf8');

// Burn Night is the Saturday immediately before U.S. Labor Day
// (the first Monday in September). This relationship cannot be expressed
// cleanly as a single portable RRULE, so publish future instances as RDATEs.
function burnNightForYear(year) {
  const septemberFirst = new Date(Date.UTC(year, 8, 1));
  const daysUntilMonday = (8 - septemberFirst.getUTCDay()) % 7;
  const laborDay = new Date(Date.UTC(year, 8, 1 + daysUntilMonday));
  laborDay.setUTCDate(laborDay.getUTCDate() - 2);
  return laborDay;
}

function icsDateTime(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}T060000Z`;
}

const firstYear = 2026;
const lastYear = 2100;
const firstDate = burnNightForYear(firstYear);
const nextDate = new Date(firstDate);
nextDate.setUTCDate(nextDate.getUTCDate() + 1);
const recurrenceDates = [];
for (let year = firstYear + 1; year <= lastYear; year += 1) {
  recurrenceDates.push(`RDATE:${icsDateTime(burnNightForYear(year))}`);
}

const event = [
  'BEGIN:VEVENT',
  'UID:burn-night@maybesomethingseasonal.com',
  'DTSTAMP:20260829T102300Z',
  `DTSTART:${icsDateTime(firstDate)}`,
  `DTEND:${icsDateTime(nextDate)}`,
  ...recurrenceDates,
  'SUMMARY:Burn Night',
  'DESCRIPTION:Seasonal observance held on the Saturday immediately before U.S. Labor Day.\\n\\nIcon: 🔥\\nCategory: seasonal',
  'CATEGORIES:seasonal',
  'STATUS:CONFIRMED',
  'TRANSP:TRANSPARENT',
  'END:VEVENT',
  ''
].join('\n');

if (source.includes('SUMMARY:Burn Night')) {
  fs.writeFileSync(outputPath, source);
  process.exit(0);
}

if (!/END:VCALENDAR\s*$/.test(source)) {
  throw new Error('MSS.ics is missing END:VCALENDAR');
}

const merged = source.replace(/END:VCALENDAR\s*$/, `${event}END:VCALENDAR\n`);
fs.writeFileSync(outputPath, merged);
