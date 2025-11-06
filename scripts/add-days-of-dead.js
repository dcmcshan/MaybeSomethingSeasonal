const fs = require('fs');
const path = require('path');

const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
const icsContent = fs.readFileSync(icsPath, 'utf8');
const lines = icsContent.split('\n');

// Find where to insert the new events (after October events, before existing Day of the Dead if any)
// Look for November 1st and 2nd dates
let insertIndex = -1;
let foundNov1 = false;
let foundNov2 = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for November dates
  if (line.includes('DTSTART:20251101') || line.includes('DTSTART:20251102')) {
    if (line.includes('DTSTART:20251101')) {
      foundNov1 = true;
    }
    if (line.includes('DTSTART:20251102')) {
      foundNov2 = true;
    }
  }
  
  // Also check for existing Day of the Dead events
  if (line.includes('Day of the Dead') || line.includes('Día de los Muertos') || line.includes('Día de los Angelitos')) {
    console.log(`Found existing event at line ${i}: ${line.substring(0, 80)}`);
  }
}

console.log(`Found Nov 1 events: ${foundNov1}`);
console.log(`Found Nov 2 events: ${foundNov2}`);

// Generate timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

// Create the two new events
const event1 = {
  uid: `event-dia-angelitos-2025@maybesomethingseasonal.com`,
  date: '2025-11-01',
  title: 'Día de los Angelitos',
  description: 'Day of the Little Angels - honoring deceased children.\n\nIcon: 👼\nCategory: cultural',
  category: 'cultural',
  icon: '👼'
};

const event2 = {
  uid: `event-dia-muertos-2025@maybesomethingseasonal.com`,
  date: '2025-11-02',
  title: 'Día de los Muertos',
  description: 'Day of the Dead - celebration of deceased loved ones.\n\nIcon: 💀\nCategory: cultural',
  category: 'cultural',
  icon: '💀'
};

function escapeIcsText(value) {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r/g, '');
}

function createEventICS(event) {
  const eventDate = new Date(event.date + 'T07:00:00');
  const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${timestamp}
DTSTART:${startDate}
DTEND:${endDate}
DESCRIPTION:${escapeIcsText(event.description)}
CATEGORIES:${escapeIcsText(event.category)}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT`;
}

// Find the insertion point - before END:VCALENDAR
let endIndex = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === 'END:VCALENDAR') {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error('Could not find END:VCALENDAR in ICS file!');
  process.exit(1);
}

// Check if events already exist
const existingTitles = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('DESCRIPTION:')) {
    const desc = lines[i].replace('DESCRIPTION:', '');
    if (desc.includes('Día de los Angelitos') || desc.includes('Day of the Little Angels')) {
      existingTitles.push('Día de los Angelitos');
    }
    if (desc.includes('Día de los Muertos') || desc.includes('Day of the Dead')) {
      existingTitles.push('Día de los Muertos');
    }
  }
}

// Insert new events before END:VCALENDAR
const newLines = [...lines];
let inserted = 0;

if (!existingTitles.includes('Día de los Angelitos')) {
  newLines.splice(endIndex, 0, createEventICS(event1));
  inserted++;
  console.log('✅ Added Día de los Angelitos (Nov 1)');
} else {
  console.log('⚠️  Día de los Angelitos already exists');
}

if (!existingTitles.includes('Día de los Muertos')) {
  newLines.splice(endIndex + inserted, 0, createEventICS(event2));
  inserted++;
  console.log('✅ Added Día de los Muertos (Nov 2)');
} else {
  console.log('⚠️  Día de los Muertos already exists');
}

// Write updated ICS file
fs.writeFileSync(icsPath, newLines.join('\n'));
console.log(`\n✅ Updated ICS file with ${inserted} new event(s)`);
