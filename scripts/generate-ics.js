const fs = require('fs');
const path = require('path');

// Read and extract CALENDAR_DATA from App.tsx
function extractCalendarData() {
  const appTsxPath = path.join(__dirname, '..', 'src', 'App.tsx');
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Find the CALENDAR_DATA array - it starts with "const CALENDAR_DATA: CalendarEvent[] = [" and ends with "];"
  const startMarker = 'const CALENDAR_DATA: CalendarEvent[] = [';
  const startIndex = appContent.indexOf(startMarker);
  
  if (startIndex === -1) {
    throw new Error('Could not find CALENDAR_DATA in App.tsx');
  }
  
  // Find the matching closing bracket for the array
  let bracketCount = 0;
  let inArray = false;
  let arrayStart = -1;
  let arrayEnd = -1;
  
  for (let i = startIndex; i < appContent.length; i++) {
    if (appContent[i] === '[') {
      if (!inArray) {
        arrayStart = i;
        inArray = true;
      }
      bracketCount++;
    } else if (appContent[i] === ']') {
      bracketCount--;
      if (bracketCount === 0 && inArray) {
        arrayEnd = i + 1;
        break;
      }
    }
  }
  
  if (arrayEnd === -1) {
    throw new Error('Could not find end of CALENDAR_DATA array');
  }
  
  // Extract the array content
  const arrayContent = appContent.substring(arrayStart, arrayEnd);
  
  // Parse the array - we'll use a simple regex approach to extract event objects
  // Since it's TypeScript/JavaScript object syntax, we can evaluate it safely
  // But for safety, let's parse it more carefully
  
  // Use eval in a controlled way - we know this is our own code
  // Extract just the array part
  const events = [];
  const eventRegex = /\{\s*title:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*icon:\s*"([^"]*)",(?:\s*image:\s*"([^"]*)",)?\s*category:\s*"([^"]+)"\s*\}/g;
  
  let match;
  while ((match = eventRegex.exec(arrayContent)) !== null) {
    const event = {
      title: match[1],
      date: match[2],
      description: match[3],
      icon: match[4],
      category: match[6]
    };
    if (match[5]) {
      event.image = match[5];
    }
    events.push(event);
  }
  
  // If regex didn't work well, try a different approach - parse as JSON after cleaning
  if (events.length === 0) {
    // Try to extract objects more carefully
    const objectStrings = [];
    let currentObject = '';
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      
      if (escapeNext) {
        currentObject += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentObject += char;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        currentObject += char;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (depth === 0) {
            currentObject = '';
          }
          depth++;
          currentObject += char;
        } else if (char === '}') {
          currentObject += char;
          depth--;
          if (depth === 0) {
            objectStrings.push(currentObject);
            currentObject = '';
          }
        } else {
          currentObject += char;
        }
      } else {
        currentObject += char;
      }
    }
    
    // Try to parse each object
    for (const objStr of objectStrings) {
      try {
        // Replace TypeScript-specific syntax with JavaScript
        const jsObjStr = objStr
          .replace(/:\s*CalendarEvent\[\]/g, '')
          .replace(/\/\/.*$/gm, '') // Remove comments
          .trim();
        
        // Try to extract fields manually
        const titleMatch = jsObjStr.match(/title:\s*"([^"]+)"/);
        const dateMatch = jsObjStr.match(/date:\s*"([^"]+)"/);
        const descMatch = jsObjStr.match(/description:\s*"([^"]*)"/);
        const iconMatch = jsObj.match(/icon:\s*"([^"]+)"/);
        const categoryMatch = jsObjStr.match(/category:\s*"([^"]+)"/);
        const imageMatch = jsObjStr.match(/image:\s*"([^"]+)"/);
        
        if (titleMatch && dateMatch) {
          events.push({
            title: titleMatch[1],
            date: dateMatch[1],
            description: descMatch ? descMatch[1] : '',
            icon: iconMatch ? iconMatch[1] : '📅',
            category: categoryMatch ? categoryMatch[1] : 'default',
            ...(imageMatch && { image: imageMatch[1] })
          });
        }
      } catch (e) {
        // Skip malformed objects
        console.warn('Could not parse object:', e.message);
      }
    }
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
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MaybeSomethingSeasonal//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:MSS
X-WR-CALDESC:A seasonal calendar celebrating nature's cycles
X-WR-TIMEZONE:America/New_York
`;

  events.forEach((event, index) => {
    const eventDate = new Date(event.date + 'T00:00:00');
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `event-${index}-${Date.now()}@maybesomethingseasonal.com`;
    
    const description = `${escapeIcsText(event.description)}\\n\\nIcon: ${escapeIcsText(event.icon)}\\nCategory: ${escapeIcsText(event.category)}`;
    
    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeIcsText(event.title)}
DESCRIPTION:${description}
CATEGORIES:${escapeIcsText(event.category)}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
  });

  icsContent += 'END:VCALENDAR';
  return icsContent;
}

function generateCalendarData() {
  console.log('📖 Extracting calendar data from App.tsx...');
  const allEvents = extractCalendarData();
  
  console.log(`✅ Extracted ${allEvents.length} events from CALENDAR_DATA`);
  
  const icsContent = generateICS(allEvents);
  
  // Write ICS file
  const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
  fs.writeFileSync(icsPath, icsContent);
  
  // Write JSON data for React app (optional, for reference)
  const jsonPath = path.join(__dirname, '..', 'public', 'calendar-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allEvents, null, 2));
  
  console.log('✅ Generated MSS.ics');
  console.log('✅ Generated calendar-data.json');
  console.log(`📅 Created ${allEvents.length} events in MSS.ics`);
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

generateCalendarData();
