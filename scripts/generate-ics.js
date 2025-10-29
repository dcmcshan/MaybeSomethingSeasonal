const fs = require('fs');
const path = require('path');

// Sample seasonal calendar data
const seasonalEvents = [
  {
    title: "Spring Equinox",
    date: "2024-03-20",
    description: "The first day of spring! Time for renewal and growth.",
    icon: "🌸",
    category: "seasonal"
  },
  {
    title: "Earth Day",
    date: "2024-04-22",
    description: "Celebrate our planet and environmental awareness.",
    icon: "🌍",
    category: "environmental"
  },
  {
    title: "Summer Solstice",
    date: "2024-06-21",
    description: "The longest day of the year - peak of summer energy.",
    icon: "☀️",
    category: "seasonal"
  },
  {
    title: "Autumn Equinox",
    date: "2024-09-22",
    description: "Fall begins - time for harvest and reflection.",
    icon: "🍂",
    category: "seasonal"
  },
  {
    title: "Winter Solstice",
    date: "2024-12-21",
    description: "The shortest day - embrace the darkness and prepare for renewal.",
    icon: "❄️",
    category: "seasonal"
  },
  {
    title: "New Year's Day",
    date: "2024-01-01",
    description: "Fresh start and new beginnings.",
    icon: "🎊",
    category: "celebration"
  },
  {
    title: "Valentine's Day",
    date: "2024-02-14",
    description: "Celebrate love and connection.",
    icon: "💕",
    category: "celebration"
  },
  {
    title: "Halloween",
    date: "2024-10-31",
    description: "Embrace the spooky and mysterious.",
    icon: "🎃",
    category: "celebration"
  },
  {
    title: "Christmas",
    date: "2024-12-25",
    description: "Joy, peace, and celebration.",
    icon: "🎄",
    category: "celebration"
  },
  {
    title: "Palmer Lake Yule Log Hunt",
    date: "2025-12-14",
    description: "Annual tradition in Palmer Lake, Colorado: community yule log hunt and celebration.",
    icon: "🪵",
    category: "cultural"
  }
];

function generateICS(events) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MaybeSomethingSeasonal//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Maybe Something Seasonal
X-WR-CALDESC:A seasonal calendar celebrating nature's cycles
X-WR-TIMEZONE:America/New_York
`;

  events.forEach((event, index) => {
    const eventDate = new Date(event.date + 'T00:00:00');
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `event-${index}-${Date.now()}@maybesomethingseasonal.com`;
    
    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}\\n\\nIcon: ${event.icon}\\nCategory: ${event.category}
CATEGORIES:${event.category}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
  });

  icsContent += 'END:VCALENDAR';
  return icsContent;
}

function generateCalendarData() {
  const icsContent = generateICS(seasonalEvents);
  
  // Write ICS file
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'MaybeSomethingSeasonal.ics'), icsContent);
  
  // Write JSON data for React app
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'calendar-data.json'), 
    JSON.stringify(seasonalEvents, null, 2)
  );
  
  console.log('✅ Generated MaybeSomethingSeasonal.ics');
  console.log('✅ Generated calendar-data.json');
  console.log(`📅 Created ${seasonalEvents.length} seasonal events`);
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

generateCalendarData();
