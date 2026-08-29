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

const MOVABLE_NAME = /\b(lunar|losar|ramadan|eid|passover|pesach|rosh hash|yom kippur|sukkot|hanukkah|chanukah|purim|easter|ash wednesday|palm sunday|good friday|holy saturday|pentecost|ascension|corpus christi|orthodox|mardi gras|carnival|diwali|deepavali|navaratri|holi|vesak|wesak|mid-autumn|moon|equinox|solstice|nowruz|navroz|thanksgiving|advent|gaudete|sinterklaas arrival|ghost festival|ullambana|gita jayanti)\b/i;

requireMatch(/UID:burn-night@maybesomethingseasonal\.com/, 'Burn Night UID missing');
requireMatch(/SUMMARY:Burn Night/, 'Burn Night missing');
requireMatch(/RDATE:20270904T060000Z/, 'Burn Night 2027 occurrence missing');
requireMatch(/RDATE:21000904T060000Z/, 'Burn Night recurrence horizon does not reach 2100');

requireMatch(/UID:glen-eyrie-madrigal-tickets@maybesomethingseasonal\.com/, 'Madrigal ticket-sale UID missing');
requireMatch(/SUMMARY:Glen Eyrie Madrigal Tickets Go On Sale/, 'Madrigal ticket-sale event missing');
requireMatch(/RRULE:FREQ=YEARLY;BYMONTH=9;BYDAY=TU;BYMONTHDAY=2,3,4,5,6,7,8/, 'Madrigal recurrence rule missing or changed');
requireMatch(/URL:https:\/\/gleneyrie\.org\/our-event\/madrigal\//, 'Madrigal source URL missing');

requireMatch(/UID:indigenous-peoples-day@maybesomethingseasonal\.com/, 'Indigenous Peoples’ Day UID missing');
requireMatch(/SUMMARY:Indigenous Peoples’ Day/, 'Indigenous Peoples’ Day event missing');
requireMatch(
  /RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=MO;BYMONTHDAY=8,9,10,11,12,13,14/,
  'Indigenous Peoples’ Day must recur on the second Monday in October'
);
requireMatch(/Icon: 🍅/, 'Indigenous Peoples’ Day tomato icon missing');
requireMatch(/especially tomatoes/, 'Indigenous Peoples’ Day tomato feast description missing');

const navaratriBlocks = [...content.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)]
  .map((match) => match[0])
  .filter((block) => /^Navaratri Day [1-9] — /.test(prop(block, 'SUMMARY') || ''));
if (navaratriBlocks.length !== 9) {
  throw new Error(`Expected nine distinct Navaratri events, found ${navaratriBlocks.length}`);
}
const navaratriIcons = navaratriBlocks.map((block) => prop(block, 'DESCRIPTION')?.match(/Icon: ([^\\]+)/)?.[1]);
if (new Set(navaratriIcons).size !== 9) {
  throw new Error('Each Navaratri event must have its own icon');
}
if (navaratriBlocks.some((block) => prop(block, 'RRULE') || prop(block, 'RDATE'))) {
  throw new Error('Navaratri 2026 dates must remain explicit lunisolar events');
}
for (let day = 1; day <= 9; day += 1) {
  requireMatch(new RegExp(`SUMMARY:Navaratri Day ${day} — `), `Navaratri Day ${day} missing`);
}

requireMatch(/UID:palmer-lake-yule-log@maybesomethingseasonal\.com/, 'Palmer Lake Yule Log UID missing');
requireMatch(/SUMMARY:Palmer Lake Yule Log Hunt/, 'Palmer Lake Yule Log event missing');
requireMatch(
  /RRULE:FREQ=YEARLY;BYMONTH=12;BYDAY=SU;BYMONTHDAY=11,12,13,14,15,16,17/,
  'Palmer Lake Yule Log must recur on the second Sunday before Christmas'
);
requireMatch(/URL:https:\/\/palmerdividehistory\.org\//, 'Palmer Lake Yule Log source URL missing');

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

// After normalization, no non-movable same-summary multi-year group that
// clearly follows a fixed month/day or stable weekday ordinal should remain as
// separate one-offs.
const oneOffGroups = new Map();
for (const event of events) {
  if (!event.summary || !event.date || event.recurrence) continue;
  if (!oneOffGroups.has(event.summary)) oneOffGroups.set(event.summary, []);
  oneOffGroups.get(event.summary).push(event);
}

const missed = [];
for (const [summary, group] of oneOffGroups) {
  if (MOVABLE_NAME.test(summary)) continue;
  const signatures = group.map((event) => recurrenceSignature(event.date));
  const fixed = new Set(signatures.map((sig) => sig.fixed));
  const weekday = new Set(signatures.map((sig) => sig.weekday));
  if (fixed.size === 1 || weekday.size === 1) missed.push(summary);
}

if (missed.length) {
  throw new Error(`Fixed or inferable recurring events were not normalized: ${missed.join(', ')}`);
}

const feastOneOffs = events
  .filter((event) => event.summary && /\\b(feast|fete)\\b/i.test(event.summary))
  .filter((event) => !MOVABLE_NAME.test(event.summary) && !event.recurrence)
  .map((event) => event.summary);
if (feastOneOffs.length) {
  throw new Error(`Fixed Feast events remain one-offs: ${feastOneOffs.join(', ')}`);
}

const recurringCount = events.filter((event) => event.recurrence).length;
if (recurringCount < 2) throw new Error('Expected at least the Burn Night and Madrigal recurring events');

console.log(`Recurring-event validation passed (${recurringCount} recurring VEVENTs).`);
