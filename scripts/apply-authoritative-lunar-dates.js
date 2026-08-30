const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
let content = fs.readFileSync(icsPath, 'utf8');

// Dates are pinned from the Hong Kong Observatory Gregorian–Lunar Calendar
// Conversion Tables. HKO publishes annual conversion tables for 1901–2100.
// This first migration slice covers the issue #52 acceptance horizon through
// 2035 without relying on network access during a production build.
const HKO_SOURCE = 'https://www.hko.gov.hk/en/gts/time/conversion.htm';

const AUTHORITATIVE_DATES = new Map([
  ['Lunar New Year (Chunjie)', [
    '20260217', '20270206', '20280126', '20290213', '20300203',
    '20310123', '20320211', '20330131', '20340219', '20350208',
  ]],
  ['Buddhist Ghost Festival (Ullambana)', [
    '20260827', '20270816', '20280903', '20290824', '20300813',
    '20310901', '20320820', '20330809', '20340828', '20350818',
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
    .replace(/^X-MSS-DATE-SOURCE:.*\r?\n/gmi, '');

  const rdates = dates.slice(1).map((date) => `RDATE;VALUE=DATE:${date}`).join('\n');
  const sourceLine = `X-MSS-DATE-SOURCE:${HKO_SOURCE}`;
  updated = updated.replace(
    /^(DTSTART;VALUE=DATE:[^\r\n]+\r?\n)/mi,
    `$1${rdates ? `${rdates}\n` : ''}${sourceLine}\n`,
  );
  return updated;
}

const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g;
let changed = 0;
content = content.replace(eventRegex, (block) => {
  const summary = prop(block, 'SUMMARY');
  const dates = AUTHORITATIVE_DATES.get(summary);
  if (!dates) return block;
  changed += 1;
  return applyDates(block, summary, dates);
});

if (changed !== AUTHORITATIVE_DATES.size) {
  const found = [...AUTHORITATIVE_DATES.keys()].filter((summary) => content.includes(`SUMMARY:${summary}`));
  throw new Error(`Expected to update ${AUTHORITATIVE_DATES.size} authoritative events, updated ${changed}; found: ${found.join(', ')}`);
}

fs.writeFileSync(icsPath, content);
console.log(`Applied Hong Kong Observatory dates through 2035 to ${changed} Chinese-lunar observances.`);
