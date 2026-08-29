const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
let content = fs.readFileSync(icsPath, 'utf8');

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function prop(block, name) {
  const unfolded = unfold(block);
  const match = unfolded.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'mi'));
  return match ? match[1].trim() : null;
}

function ymdFromDtstart(block) {
  const value = prop(block, 'DTSTART');
  const match = value && value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function weekdayToken(year, month, day) {
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdayRule(date) {
  const weekday = weekdayToken(date.year, date.month, date.day);
  const positiveOrdinal = Math.floor((date.day - 1) / 7) + 1;
  const isLast = date.day + 7 > daysInMonth(date.year, date.month);
  return {
    month: date.month,
    weekday,
    positiveOrdinal,
    isLast,
  };
}

function stableUid(summary) {
  const slug = summary
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'event';
  return `${slug}@maybesomethingseasonal.com`;
}

function addOrReplaceUid(block, summary) {
  if (/^UID:/mi.test(block)) return block;
  return block.replace(/^BEGIN:VEVENT\r?\n/m, `BEGIN:VEVENT\nUID:${stableUid(summary)}\n`);
}

function addRrule(block, rrule) {
  if (/^RRULE:/mi.test(block) || /^RDATE(?:;[^:]*)?:/mi.test(block)) return block;
  return block.replace(/^(DTSTART(?:;[^:]*)?:[^\r\n]+\r?\n)/mi, `$1RRULE:${rrule}\n`);
}

const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g;
const events = [...content.matchAll(eventRegex)].map((m, index) => ({
  index,
  block: m[0],
  start: m.index,
  end: m.index + m[0].length,
  summary: prop(m[0], 'SUMMARY'),
  date: ymdFromDtstart(m[0]),
  hasRecurrence: /^RRULE:|^RDATE(?:;[^:]*)?:/mi.test(unfold(m[0])),
}));

const groups = new Map();
for (const event of events) {
  if (!event.summary || !event.date || event.hasRecurrence) continue;
  if (!groups.has(event.summary)) groups.set(event.summary, []);
  groups.get(event.summary).push(event);
}

const replacements = new Map();
const removals = new Set();
let fixedDateCount = 0;
let weekdayRuleCount = 0;
let unresolvedRepeatedCount = 0;

for (const [summary, group] of groups) {
  const years = new Set(group.map((e) => e.date.year));
  if (years.size < 2) continue;

  const sorted = [...group].sort((a, b) =>
    a.date.year - b.date.year || a.date.month - b.date.month || a.date.day - b.date.day
  );
  const canonical = sorted[0];

  const sameMonthDay = group.every(
    (e) => e.date.month === canonical.date.month && e.date.day === canonical.date.day
  );

  let rrule = null;
  if (sameMonthDay) {
    rrule = 'FREQ=YEARLY';
    fixedDateCount++;
  } else {
    const rules = group.map((e) => weekdayRule(e.date));
    const sameMonth = rules.every((r) => r.month === rules[0].month);
    const sameWeekday = rules.every((r) => r.weekday === rules[0].weekday);
    const allLast = rules.every((r) => r.isLast);
    const samePositiveOrdinal = rules.every((r) => r.positiveOrdinal === rules[0].positiveOrdinal);

    if (sameMonth && sameWeekday && allLast) {
      rrule = `FREQ=YEARLY;BYMONTH=${rules[0].month};BYDAY=-1${rules[0].weekday}`;
      weekdayRuleCount++;
    } else if (sameMonth && sameWeekday && samePositiveOrdinal) {
      rrule = `FREQ=YEARLY;BYMONTH=${rules[0].month};BYDAY=${rules[0].positiveOrdinal}${rules[0].weekday}`;
      weekdayRuleCount++;
    }
  }

  if (!rrule) {
    unresolvedRepeatedCount++;
    continue;
  }

  let block = addOrReplaceUid(canonical.block, summary);
  block = addRrule(block, rrule);
  replacements.set(canonical.index, block);
  for (const duplicate of sorted.slice(1)) removals.add(duplicate.index);
}

let rebuilt = '';
let cursor = 0;
for (const event of events) {
  rebuilt += content.slice(cursor, event.start);
  if (!removals.has(event.index)) rebuilt += replacements.get(event.index) || event.block;
  cursor = event.end;
}
rebuilt += content.slice(cursor);

fs.writeFileSync(icsPath, rebuilt);
console.log(
  `Normalized recurring events: ${fixedDateCount} fixed-date, ${weekdayRuleCount} weekday-rule; ${unresolvedRepeatedCount} repeated movable groups left explicit.`
);
