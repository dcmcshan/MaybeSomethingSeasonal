const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
const icsContent = fs.readFileSync(icsPath, 'utf8');

// Events to keep (cultural, seasonal, celebration, environmental)
// Remove all liturgical/religious events except those with strong cultural significance
const keepEvents = [
  "New Year's Day",
  "D?a de los Reyes",
  "Chinese New Year",
  "Imbolc",
  "St. Valentine", // Cultural - Valentine's Day
  "St. Patrick", // Cultural - widely celebrated
  "Independence Day",
  "Autumn Equinox",
  "Halloween",
  "D?a de los Muertos",
  "Thanksgiving",
  "Krampusnacht",
  "Sinterklaas Arrival",
  "Lussi Day",
  "Saturnalia",
  "Winter Solstice",
  "Christmas Eve",
  "Christmas Day",
  "Earth Day"
];

// Parse ICS file and filter events
const lines = icsContent.split(/\r?\n/);
const filteredLines = [];
let inEvent = false;
let currentEvent = [];
let keepCurrentEvent = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  if (trimmed === 'BEGIN:VEVENT') {
    inEvent = true;
    currentEvent = [line];
    keepCurrentEvent = false;
  } else if (trimmed === 'END:VEVENT' && inEvent) {
    currentEvent.push(line);
    if (keepCurrentEvent) {
      filteredLines.push(...currentEvent);
    }
    inEvent = false;
    currentEvent = [];
  } else if (inEvent) {
    currentEvent.push(line);
    if (trimmed.startsWith('SUMMARY:')) {
      const summary = trimmed.substring(8);
      // Handle escaped commas and check if we should keep this event
      const cleanSummary = summary.replace(/\\,/g, ',');
      keepCurrentEvent = keepEvents.some(keep => cleanSummary === keep);
    }
  } else {
    // Calendar header/footer lines - always keep
    filteredLines.push(line);
  }
}

fs.writeFileSync(icsPath, filteredLines.join('\r\n'));
console.log(`? Filtered ICS file - kept ${keepEvents.length} cultural/seasonal events`);
console.log(`?? Removed all liturgical/religious events`);
