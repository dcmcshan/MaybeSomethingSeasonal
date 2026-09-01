const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
let content = fs.readFileSync(icsPath, 'utf8');

// U.S. Naval Observatory Earth's Seasons data gives the astronomical instant
// in Universal Time. MSS maps that instant to the America/Denver civil date
// and publishes the observance as a true all-day VALUE=DATE event so Apple/
// iCloud subscriptions render it consistently across refreshes.
//
// Source/API documentation: https://aa.usno.navy.mil/data/api.html
// Canonical MSS civil timezone for astronomical seasonal observances:
// America/Denver.
const USNO_SOURCE = 'https://aa.usno.navy.mil/data/api.html';
const CIVIL_TZ = 'America/Denver';

const AUTHORITATIVE_EVENTS = new Map([
  ['Spring Equinox (Ostara)', [
    '20260320', '20270320', '20280319', '20290320', '20300320',
    '20310320', '20320319', '20330320', '20340320', '20350320',
  ]],
  ['Autumn Equinox (Mabon)', [
    '20260922', '20270923', '20280922', '20290922', '20300922',
    '20310922', '20320922', '20330922', '20340922', '20350922',
  ]],
  ['Winter Solstice (Yule)', [
    '20261221', '20271221', '20281221', '20291221', '20301221',
    '20311221', '20321221', '20331221', '20341221', '20351221',
  ]],
]);

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function prop(block, name) {
  const match = unfold(block).match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'mi'));
  return match ? match[1].trim() : null;
}

function addDays(yyyymmdd, days) {
  const year = Number(yyyymmdd.slice(0, 4));
  const month = Number(yyyymmdd.slice(4, 6));
  const day = Number(yyyymmdd.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

function applyDates(block, summary, dates) {
  if (!dates.length) throw new Error(`${summary}: authoritative date list is empty`);

  let updated = block
    .replace(/^DTSTART(?:;[^:]*)?:.*$/mi, `DTSTART;VALUE=DATE:${dates[0]}`)
    .replace(/^DTEND(?:;[^:]*)?:.*$/mi, `DTEND;VALUE=DATE:${addDays(dates[0], 1)}`)
    .replace(/^RRULE:.*\r?\n/gmi, '')
    .replace(/^RDATE(?:;[^:]*)?:.*\r?\n/gmi, '')
    .replace(/^X-MSS-DATE-SOURCE:.*\r?\n/gmi, '')
    .replace(/^X-MSS-CIVIL-TZ:.*\r?\n/gmi, '')
    .replace(/^X-MSS-ASTRONOMY-POLICY:.*\r?\n/gmi, '');

  const rdates = dates.slice(1).map((date) => `RDATE;VALUE=DATE:${date}`).join('\n');
  updated = updated.replace(
    /^(DTSTART;VALUE=DATE:[^\r\n]+\r?\n)/mi,
    `$1${rdates ? `${rdates}\n` : ''}X-MSS-DATE-SOURCE:${USNO_SOURCE}\nX-MSS-CIVIL-TZ:${CIVIL_TZ}\nX-MSS-ASTRONOMY-POLICY:USNO season instant mapped to America/Denver civil date\n`,
  );
  return updated;
}

const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g;
let changed = 0;
content = content.replace(eventRegex, (block) => {
  const summary = prop(block, 'SUMMARY');
  const dates = AUTHORITATIVE_EVENTS.get(summary);
  if (!dates) return block;
  changed += 1;
  return applyDates(block, summary, dates);
});

if (changed !== AUTHORITATIVE_EVENTS.size) {
  const found = [...AUTHORITATIVE_EVENTS.keys()].filter((summary) => content.includes(`SUMMARY:${summary}`));
  throw new Error(`Expected to update ${AUTHORITATIVE_EVENTS.size} seasonal observances, updated ${changed}; found: ${found.join(', ')}`);
}

fs.writeFileSync(icsPath, content);
console.log(`Applied USNO season dates through 2035 to ${changed} astronomical observances using ${CIVIL_TZ} civil dates.`);
