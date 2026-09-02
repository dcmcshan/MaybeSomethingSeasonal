const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const content = fs.readFileSync(icsPath, 'utf8');

const EXPECTED = [
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

const blocks = [...content.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map((match) => match[0]);
const block = blocks.find((candidate) => prop(candidate, 'SUMMARY') === 'Losar (Tibetan New Year)');
if (!block) throw new Error('Losar VEVENT missing');

if (!/^DTSTART;VALUE=DATE:/mi.test(block) || !/^DTEND;VALUE=DATE:/mi.test(block)) {
  throw new Error('Losar: expected true all-day VALUE=DATE encoding');
}
if (/^RRULE:/mi.test(block)) {
  throw new Error('Losar: Tibetan lunisolar observance must not use a Gregorian yearly RRULE');
}

const unfolded = unfold(block);
const actual = [
  prop(block, 'DTSTART'),
  ...[...unfolded.matchAll(/^RDATE;VALUE=DATE:(\d{8})$/gmi)].map((match) => match[1]),
];
if (actual.join(',') !== EXPECTED.join(',')) {
  throw new Error(`Losar: Phugpa dates differ\nexpected ${EXPECTED.join(',')}\nactual   ${actual.join(',')}`);
}

if (prop(block, 'X-MSS-DATE-SOURCE') !== 'https://www.lotsawahouse.org/Static/tools/phugpa.html') {
  throw new Error('Losar: Phugpa calculator source metadata missing');
}
const policy = prop(block, 'X-MSS-TIBETAN-POLICY') || '';
if (!policy.includes('Phugpa Tibetan calendar') || !policy.includes('Losar=first day of first Tibetan month')) {
  throw new Error('Losar: Phugpa calendar policy metadata missing');
}

console.log('Authoritative Phugpa Losar date validation passed through 2035.');
