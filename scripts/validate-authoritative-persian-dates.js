const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const content = fs.readFileSync(icsPath, 'utf8');

const EXPECTED = new Map([
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

function eventBlock(summary) {
  const blocks = [...content.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map((match) => match[0]);
  const block = blocks.find((candidate) => prop(candidate, 'SUMMARY') === summary);
  if (!block) throw new Error(`${summary}: VEVENT missing`);
  return block;
}

function allDates(block) {
  const start = prop(block, 'DTSTART');
  const rdates = [...unfold(block).matchAll(/^RDATE;VALUE=DATE:(\d{8})$/gmi)].map((match) => match[1]);
  return [start, ...rdates];
}

for (const [summary, expected] of EXPECTED) {
  const block = eventBlock(summary);
  if (!/^DTSTART;VALUE=DATE:/mi.test(block) || !/^DTEND;VALUE=DATE:/mi.test(block)) {
    throw new Error(`${summary}: expected true all-day VALUE=DATE encoding`);
  }
  if (/^RRULE:/mi.test(block)) {
    throw new Error(`${summary}: Persian-calendar observance must not use a naive yearly RRULE`);
  }
  const actual = allDates(block);
  if (actual.join(',') !== expected.join(',')) {
    throw new Error(`${summary}: authoritative dates differ\nexpected ${expected.join(',')}\nactual   ${actual.join(',')}`);
  }
  if (prop(block, 'X-MSS-DATE-SOURCE') !== 'https://calendar.ut.ac.ir/') {
    throw new Error(`${summary}: University of Tehran Calendar Center source metadata missing`);
  }
  const policy = prop(block, 'X-MSS-PERSIAN-POLICY') || '';
  if (!policy.includes('Nowruz=1 Farvardin') || !policy.includes('Yalda=30 Azar')) {
    throw new Error(`${summary}: Persian calendar policy metadata missing`);
  }
}

console.log('Authoritative Persian-calendar date validation passed through 2035.');
