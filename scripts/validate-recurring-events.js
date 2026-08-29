const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'dist', 'MSS.ics');
const content = fs.readFileSync(icsPath, 'utf8');

function requireMatch(pattern, message) {
  if (!pattern.test(content)) throw new Error(message);
}

requireMatch(/UID:burn-night@maybesomethingseasonal\.com/, 'Burn Night UID missing');
requireMatch(/SUMMARY:Burn Night/, 'Burn Night missing');
requireMatch(/RDATE:20270904T060000Z/, 'Burn Night 2027 occurrence missing');
requireMatch(/RDATE:21000904T060000Z/, 'Burn Night recurrence horizon does not reach 2100');

requireMatch(/UID:glen-eyrie-madrigal-tickets@maybesomethingseasonal\.com/, 'Madrigal ticket-sale UID missing');
requireMatch(/SUMMARY:Glen Eyrie Madrigal Tickets Go On Sale/, 'Madrigal ticket-sale event missing');
requireMatch(/RRULE:FREQ=YEARLY;BYMONTH=9;BYDAY=TU;BYMONTHDAY=2,3,4,5,6,7,8/, 'Madrigal recurrence rule missing or changed');
requireMatch(/URL:https:\/\/gleneyrie\.org\/our-event\/madrigal\//, 'Madrigal source URL missing');

const uidMatches = content.match(/^UID:/gm) || [];
const uniqueUids = new Set((content.match(/^UID:.*$/gm) || []).map(line => line.slice(4)));
if (uidMatches.length !== uniqueUids.size) {
  throw new Error(`Duplicate UIDs detected: ${uidMatches.length - uniqueUids.size}`);
}

console.log('Recurring-event validation passed.');
