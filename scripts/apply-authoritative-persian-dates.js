const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
let content = fs.readFileSync(icsPath, 'utf8');

// The University of Tehran Calendar Center publishes the official Solar Hijri
// calendar conversion table. For 1405-1414 (Gregorian 2026-2035), 1 Farvardin
// falls on March 20 in every year. Yalda is the night of 30 Azar; with the
// standard Solar Hijri month lengths, that is December 20 for the same span.
//
// We deliberately publish pinned RDATEs rather than a naive yearly RRULE:
// the Calendar Center table itself shows that 1 Farvardin can fall on March
// 19, 20, or 21 outside this horizon.
const TEHRAN_CALENDAR_SOURCE = 'https://calendar.ut.ac.ir/';
const PERSIAN_POLICY = 'University of Tehran Calendar Center Solar Hijri dates; Nowruz=1 Farvardin; Yalda=30 Azar';

const AUTHORITATIVE_EVENTS = new Map([
  ['Nowruz', [
    '20260320', '20270320', '20280320', '20290320', '20300320',
    '20310320', '20320320', '20330320', '20340320', '20350320',
  ]],
  ['Yalda Night', [
    '20251220', '20261220', '20271220', '20281220', '20291220',
    '20301220', '20311220', '20321220', '20331220', '20341220', '20351220',
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
    .replace(/^X-MSS-PERSIAN-POLICY:.*\r?\n/gmi, '');

  const rdates = dates.slice(1).map((date) => `RDATE;VALUE=DATE:${date}`).join('\n');
  updated = updated.replace(
    /^(DTSTART;VALUE=DATE:[^\r\n]+\r?\n)/mi,
    `$1${rdates ? `${rdates}\n` : ''}X-MSS-DATE-SOURCE:${TEHRAN_CALENDAR_SOURCE}\nX-MSS-PERSIAN-POLICY:${PERSIAN_POLICY}\n`,
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
  throw new Error(`Expected to update ${AUTHORITATIVE_EVENTS.size} Persian observances, updated ${changed}; found: ${found.join(', ')}`);
}

fs.writeFileSync(icsPath, content);
console.log(`Applied University of Tehran Solar Hijri dates through 2035 to ${changed} Persian observances.`);
