const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const content = fs.readFileSync(icsPath, 'utf8');

function requireMatch(pattern, message) {
  if (!pattern.test(content)) throw new Error(message);
}

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function prop(block, name) {
  const match = unfold(block).match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'mi'));
  return match ? match[1].trim() : null;
}

function eventDate(block) {
  const value = prop(block, 'DTSTART');
  const match = value && value.match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
}

function weekdayToken(date) {
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][
    new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
  ];
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function recurrenceSignature(date) {
  const weekday = weekdayToken(date);
  const ordinal = Math.floor((date.day - 1) / 7) + 1;
  const last = date.day + 7 > daysInMonth(date.year, date.month);
  return {
    fixed: `${date.month}-${date.day}`,
    weekday: `${date.month}-${last ? -1 : ordinal}${weekday}`,
  };
}

requireMatch(/UID:burn-night@maybesomethingseasonal\.com/, 'Burn Night UID missing');
requireMatch(/SUMMARY:Burn Night/, 'Burn Night missing');
requireMatch(/RDATE:20270904T060000Z/, 'Burn Night 2027 occurrence missing');
requireMatch(/RDATE:21000904T060000Z/, 'Burn Night recurrence horizon does not reach 2100');

requireMatch(/UID:glen-eyrie-madrigal-tickets@maybesomethingseasonal\.com/, 'Madrigal ticket-sale UID missing');
requireMatch(/SUMMARY:Glen Eyrie Madrigal Tickets Go On Sale/, 'Madrigal ticket-sale event missing');
requireMatch(/RRULE:FREQ=YEARLY;BYMONTH=9;BYDAY=TU;BYMONTHDAY=2,3,4,5,6,7,8/, 'Madrigal recurrence rule missing or changed');
requireMatch(/URL:https:\/\/gleneyrie\.org\/our-event\/madrigal\//, 'Madrigal source URL missing');

const events = [...content.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map((match) => ({
  block: match[0],
  summary: prop(match[0], 'SUMMARY'),
  date: eventDate(match[0]),
  recurrence: prop(match[0], 'RRULE') || prop(match[0], 'RDATE'),
}));

const uidLines = events.map((event) => prop(event.block, 'UID')).filter(Boolean);
const uniqueUids = new Set(uidLines);
if (uidLines.length !== uniqueUids.size) {
  throw new Error(`Duplicate UIDs detected: ${uidLines.length - uniqueUids.size}`);
}

// After normalization, no same-summary multi-year group that clearly follows a
// fixed month/day or stable weekday ordinal should remain as separate one-offs.
const oneOffGroups = new Map();
for (const event of events) {
  if (!event.summary || !event.date || event.recurrence) continue;
  if (!oneOffGroups.has(event.summary)) oneOffGroups.set(event.summary, []);
  oneOffGroups.get(event.summary).push(event);
}

const missed = [];
for (const [summary, group] of oneOffGroups) {
  if (new Set(group.map((event) => event.date.year)).size < 2) continue;
  const signatures = group.map((event) => recurrenceSignature(event.date));
  const fixed = new Set(signatures.map((sig) => sig.fixed));
  const weekday = new Set(signatures.map((sig) => sig.weekday));
  if (fixed.size === 1 || weekday.size === 1) missed.push(summary);
}

if (missed.length) {
  throw new Error(`Recurring groups were not normalized: ${missed.join(', ')}`);
}

const recurringCount = events.filter((event) => event.recurrence).length;
if (recurringCount < 2) throw new Error('Expected at least the Burn Night and Madrigal recurring events');

console.log(`Recurring-event validation passed (${recurringCount} recurring VEVENTs).`);
