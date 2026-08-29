const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'public', 'MSS.ics');
const outputPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const source = fs.readFileSync(sourcePath, 'utf8');

const burnNight = `BEGIN:VEVENT\nUID:burn-night-2026@maybesomethingseasonal.com\nDTSTAMP:20260829T102300Z\nDTSTART:20260905T060000Z\nDTEND:20260906T060000Z\nSUMMARY:Burn Night\nDESCRIPTION:Seasonal observance held on the Saturday immediately before U.S. Labor Day.\\n\\nIcon: 🔥\\nCategory: seasonal\nCATEGORIES:seasonal\nSTATUS:CONFIRMED\nTRANSP:TRANSPARENT\nEND:VEVENT\n`;

if (!source.includes('SUMMARY:Burn Night')) {
  fs.writeFileSync(outputPath, source.replace(/END:VCALENDAR\s*$/, `${burnNight}END:VCALENDAR\n`));
}
