const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
let content = fs.readFileSync(icsPath, 'utf8');

// MSS uses the Phugpa Tibetan calendar convention for Losar. The Lotsawa
// House Phugpa calculator implements the exact calendrical mathematics in
// Svante Janson, "Tibetan Calendar Mathematics" (arXiv:1401.6285).
//
// There are multiple Tibetan calendrical traditions (notably Phugpa and
// Tsurphu), so Losar must be pinned as generated dates rather than inferred as
// a Gregorian RRULE. The 2026 Phugpa date, 18 February, is also the date used
// by current Tibetan institutional calendars; the full 2026-2035 array below
// is generated from the Phugpa algorithm and independently cross-checked.
const PHUGPA_SOURCE = 'https://www.lotsawahouse.org/Static/tools/phugpa.html';
const PHUGPA_POLICY = 'Phugpa Tibetan calendar; Losar=first day of first Tibetan month; Svante Janson calendar mathematics';

const LOSAR_DATES = [
  '20260218', '20270207', '20280226', '20290214', '20300305',
  '20310222', '20320212', '20330302', '20340219', '20350209',
];

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

function applyLosarDates(block) {
  let updated = block
    .replace(/^DTSTART(?:;[^:]*)?:.*$/mi, `DTSTART;VALUE=DATE:${LOSAR_DATES[0]}`)
    .replace(/^DTEND(?:;[^:]*)?:.*$/mi, `DTEND;VALUE=DATE:${addDays(LOSAR_DATES[0], 1)}`)
    .replace(/^RRULE:.*\r?\n/gmi, '')
    .replace(/^RDATE(?:;[^:]*)?:.*\r?\n/gmi, '')
    .replace(/^X-MSS-DATE-SOURCE:.*\r?\n/gmi, '')
    .replace(/^X-MSS-TIBETAN-POLICY:.*\r?\n/gmi, '');

  const rdates = LOSAR_DATES.slice(1).map((date) => `RDATE;VALUE=DATE:${date}`).join('\n');
  updated = updated.replace(
    /^(DTSTART;VALUE=DATE:[^\r\n]+\r?\n)/mi,
    `$1${rdates}\nX-MSS-DATE-SOURCE:${PHUGPA_SOURCE}\nX-MSS-TIBETAN-POLICY:${PHUGPA_POLICY}\n`,
  );
  return updated;
}

const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g;
let changed = 0;
content = content.replace(eventRegex, (block) => {
  if (prop(block, 'SUMMARY') !== 'Losar (Tibetan New Year)') return block;
  changed += 1;
  return applyLosarDates(block);
});

if (changed !== 1) {
  throw new Error(`Expected exactly one Losar VEVENT, updated ${changed}`);
}

fs.writeFileSync(icsPath, content);
console.log('Applied Phugpa Losar dates through 2035.');
