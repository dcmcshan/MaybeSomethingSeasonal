const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'public', 'MSS.ics');
const outputPath = path.join(__dirname, '..', 'dist', 'MSS.ics');

const source = fs.readFileSync(sourcePath, 'utf8');

const event = [
  'BEGIN:VEVENT',
  'UID:burn-night-2026@maybesomethingseasonal.com',
  'DTSTAMP:20260829T102300Z',
  'DTSTART:20260905T060000Z',
  'DTEND:20260906T060000Z',
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
