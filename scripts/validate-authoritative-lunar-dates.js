const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const content = fs.readFileSync(icsPath, 'utf8');

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function prop(block, name) {
  const match = unfold(block).match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'mi'));
  return match ? match[1].trim() : null;
}

const blocks = [...content.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map((match) => match[0]);
function requireBlock(summary) {
  const block = blocks.find((candidate) => prop(candidate, 'SUMMARY') === summary);
  if (!block) throw new Error(`${summary} event missing`);
  return block;
}

function validateAuthoritativeDates(summary, expected) {
  const block = requireBlock(summary);
  if (prop(block, 'DTSTART') !== expected[0]) {
    throw new Error(`${summary}: DTSTART must be ${expected[0]}, found ${prop(block, 'DTSTART')}`);
  }
  if (prop(block, 'RRULE')) throw new Error(`${summary}: must use authoritative RDATEs, not RRULE`);
  if (!/^DTSTART;VALUE=DATE:/mi.test(block) || !/^DTEND;VALUE=DATE:/mi.test(block)) {
    throw new Error(`${summary}: Apple/iCloud-facing event must use VALUE=DATE`);
  }
  const rdates = [...block.matchAll(/^RDATE;VALUE=DATE:(\d{8})$/gmi)].map((match) => match[1]);
  const actual = [expected[0], ...rdates];
  if (actual.join(',') !== expected.join(',')) {
    throw new Error(`${summary}: authoritative dates differ\nexpected ${expected.join(',')}\nactual   ${actual.join(',')}`);
  }
  if (!block.includes('X-MSS-DATE-SOURCE:https://www.hko.gov.hk/en/gts/time/conversion.htm')) {
    throw new Error(`${summary}: HKO date-source metadata missing`);
  }
  return block;
}

validateAuthoritativeDates('Lunar New Year (Chunjie)', [
  '20260217', '20270206', '20280126', '20290213', '20300203',
  '20310123', '20320211', '20330131', '20340219', '20350208',
]);

validateAuthoritativeDates('Buddhist Ghost Festival (Ullambana)', [
  '20260827', '20270816', '20280903', '20290824', '20300813',
  '20310901', '20320820', '20330809', '20340828', '20350818',
]);

const uidLines = blocks.map((block) => prop(block, 'UID')).filter(Boolean);
if (uidLines.length !== blocks.length) {
  throw new Error(`Every VEVENT must have a UID after final subscription build (${blocks.length - uidLines.length} missing)`);
}
if (new Set(uidLines).size !== uidLines.length) throw new Error('Duplicate UIDs found after authoritative-date application');

console.log('Authoritative HKO lunar-date validation passed through 2035.');
