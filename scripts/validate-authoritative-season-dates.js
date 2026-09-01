const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const content = fs.readFileSync(icsPath, 'utf8');

const EXPECTED = new Map([
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

function blockFor(summary) {
  return [...content.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)]
    .map((match) => match[0])
    .find((block) => prop(block, 'SUMMARY') === summary);
}

function addDays(yyyymmdd, days) {
  const year = Number(yyyymmdd.slice(0, 4));
  const month = Number(yyyymmdd.slice(4, 6));
  const day = Number(yyyymmdd.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

for (const [summary, dates] of EXPECTED) {
  const block = blockFor(summary);
  if (!block) throw new Error(`${summary} missing after USNO date application`);
  if (prop(block, 'RRULE')) throw new Error(`${summary} must use authoritative RDATEs, not a yearly RRULE`);

  const startLine = block.match(/^DTSTART;VALUE=DATE:(\d{8})$/mi);
  const endLine = block.match(/^DTEND;VALUE=DATE:(\d{8})$/mi);
  if (!startLine || startLine[1] !== dates[0]) {
    throw new Error(`${summary} DTSTART must be ${dates[0]}`);
  }
  if (!endLine || endLine[1] !== addDays(dates[0], 1)) {
    throw new Error(`${summary} DTEND must be the next civil day`);
  }

  const actualRdates = [...block.matchAll(/^RDATE;VALUE=DATE:(\d{8})$/gmi)].map((match) => match[1]);
  const expectedRdates = dates.slice(1);
  if (JSON.stringify(actualRdates) !== JSON.stringify(expectedRdates)) {
    throw new Error(`${summary} RDATE list does not match pinned USNO America/Denver dates`);
  }

  if (prop(block, 'X-MSS-DATE-SOURCE') !== 'https://aa.usno.navy.mil/data/api.html') {
    throw new Error(`${summary} USNO source metadata missing`);
  }
  if (prop(block, 'X-MSS-CIVIL-TZ') !== 'America/Denver') {
    throw new Error(`${summary} canonical civil timezone metadata missing`);
  }
}

// These cases prove the migration is not silently using a fixed month/day or
// the UTC calendar date. The Denver civil date differs in each example.
if (EXPECTED.get('Spring Equinox (Ostara)')[2] !== '20280319') throw new Error('Spring 2028 guard changed');
if (EXPECTED.get('Autumn Equinox (Mabon)')[0] !== '20260922') throw new Error('Autumn 2026 Denver-date guard changed');
if (EXPECTED.get('Winter Solstice (Yule)')[1] !== '20271221') throw new Error('Winter 2027 Denver-date guard changed');

console.log('Authoritative USNO season-date validation passed through 2035 (America/Denver civil-date policy).');
