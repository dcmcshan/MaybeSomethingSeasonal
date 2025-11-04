const fs = require('fs');
const path = require('path');

// Read and extract CALENDAR_DATA from App_curated.tsx (curated list, not full liturgical calendar)
function extractEvents() {
  const appTsxPath = path.join(__dirname, '..', 'src', 'App_curated.tsx');
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  const events = [];
  
  // Match event objects - handle multiline with flexible whitespace
  const eventPattern = /\{\s*title:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*icon:\s*"([^"]+)",(?:\s*image:\s*"([^"]+)",)?\s*category:\s*"([^"]+)"\s*\}/g;
  
  let match;
  while ((match = eventPattern.exec(appContent)) !== null) {
    const event = {
      title: match[1],
      date: match[2],
      description: match[3] || '',
      icon: match[4],
      category: match[6]
    };
    if (match[5]) {
      event.image = match[5];
    }
    events.push(event);
  }
  
  return events;
}

function escapeIcsText(value) {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r/g, '');
}

function generateICS(events) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//MaybeSomethingSeasonal//Calendar//EN\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += 'X-WR-CALNAME:MSS\r\n';
  ics += 'X-WR-CALDESC:A seasonal calendar celebrating nature\'s cycles\r\n';
  ics += 'X-WR-TIMEZONE:America/New_York\r\n';
  
  events.forEach((event, index) => {
    const eventDate = new Date(event.date + 'T00:00:00');
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `event-${index}-${Date.now()}@maybesomethingseasonal.com`;
    
    const description = `${escapeIcsText(event.description)}\\n\\nIcon: ${escapeIcsText(event.icon)}\\nCategory: ${escapeIcsText(event.category)}`;
    
    ics += 'BEGIN:VEVENT\r\n';
    ics += `UID:${uid}\r\n`;
    ics += `DTSTAMP:${timestamp}\r\n`;
    ics += `DTSTART:${startDate}\r\n`;
    ics += `DTEND:${endDate}\r\n`;
    ics += `SUMMARY:${escapeIcsText(event.title)}\r\n`;
    ics += `DESCRIPTION:${description}\r\n`;
    ics += `CATEGORIES:${escapeIcsText(event.category)}\r\n`;
    ics += 'STATUS:CONFIRMED\r\n';
    ics += 'TRANSP:TRANSPARENT\r\n';
    ics += 'END:VEVENT\r\n';
  });
  
  ics += 'END:VCALENDAR';
  return ics;
}

// Main execution
console.log('?? Extracting curated events from App_curated.tsx...');
const events = extractEvents();
console.log(`? Found ${events.length} curated events`);

const icsContent = generateICS(events);
const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
fs.writeFileSync(icsPath, icsContent);
console.log(`? Generated MSS.ics with ${events.length} events`);
