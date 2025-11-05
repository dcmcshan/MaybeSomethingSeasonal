const fs = require('fs');
const path = require('path');

// Load the image-holiday mappings
const mappingData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'final-image-holiday-mapping.json'),
  'utf8'
));

// Load the complete mapping for all images (including duplicates)
const completeMappingData = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'image-holiday-mapping-v2.json'),
  'utf8'
));

// Create a mapping from Excel holiday names to calendar event titles
// This handles variations in naming
const holidayNameMap = {
  'New Years Day': ['New Year\'s Day', 'New Year Day', 'new year'],
  'Christmas': ['Christmas', 'Christmas Day', 'Twelfth Night'],
  'Christmas Eve': ['Christmas Eve', 'eve of christmas'],
  'St. John Evangelist': ['St. John the Evangelist', 'St. John Evangelist', 'john evangelist'],
  'Feast of St. Stefan': ['St. Stephen', 'Feast of St. Stefan', 'stephen'],
  'Childermas': ['Holy Innocents', 'Childermas', 'innocents'],
  'Día de los Reyes': ['Día de los Reyes', 'Epiphany', 'Three Kings Day', 'three kings', 'reyes'],
  'St Andrew\'s Day': ['St. Andrew', 'St Andrew\'s Day', 'St. Andrew\'s Day', 'andrew'],
  'Krampusnacht': ['Krampusnacht', 'Krampus Night', 'krampus'],
  'St Nicks Day': ['St. Nicholas', 'St Nicks Day', 'St. Nick\'s Day', 'nicholas'],
  'Virgin of Guadalupe': ['Our Lady of Guadalupe', 'Virgin of Guadalupe', 'guadalupe'],
  'Imbolc Eve': ['Imbolc Eve', 'Eve of Imbolc', 'imbolc'],
  'Imbolc': ['Imbolc', 'celtic festival'],
  'Candelaria': ['Candlemas', 'Candelaria', 'candlemas'],
  'Perchtag': ['Perchtag', 'Perchta Day', 'perchta'],
  'St Dwynwyn\'s Day': ['St. Dwynwyn', 'St Dwynwyn\'s Day', 'dwynwyn'],
  'Dondoyaki': ['Dondoyaki', 'burning new year'],
  'Solstice': ['Winter Solstice', 'Solstice', 'solstice'],
  'Martinstag': ['St. Martin\'s Day', 'Martinstag', 'Martinmas', 'martin'],
  'el Día de Muertos': ['Día de los Muertos', 'Day of the Dead', 'el Día de Muertos', 'dead'],
  'Andermas Eve': ['Andermas Eve', 'St. Andrew\'s Eve', 'Eve of St. Andrew', 'andrew'],
  'Keystone': ['Keystone'], // May not be in calendar
  'Magic Flute': ['Magic Flute'], // May not be in calendar
  'Gita Mahotsav': ['Gita Mahotsav'], // May not be in calendar
  'Lussi Day': ['Lussi Day', 'St. Lucy\'s Day', 'St. Lucy', 'lucy'],
  'Christmas Party': ['Christmas Party'], // May not be in calendar
  'It\'s a Wonderful Life': ['It\'s a Wonderful Life'], // May not be in calendar
  'Saturnalia': ['Saturnalia'],
  'A Colorado Nutcracker': ['A Colorado Nutcracker', 'nutcracker'], // May not be in calendar
  '1940s': ['1940s'] // May not be in calendar
};

// Normalize holiday names for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Fuzzy match holiday names
function findMatchingEventTitle(excelHoliday, events) {
  const normalizedExcel = normalizeName(excelHoliday);
  
  // Exact match on title first
  for (const event of events) {
    if (normalizeName(event.title) === normalizedExcel) {
      return event.title;
    }
  }
  
  // Check name map
  if (holidayNameMap[excelHoliday]) {
    for (const variant of holidayNameMap[excelHoliday]) {
      for (const event of events) {
        if (normalizeName(event.title) === normalizeName(variant)) {
          return event.title;
        }
      }
    }
  }
  
  // Partial match on title
  for (const event of events) {
    const normalizedTitle = normalizeName(event.title);
    if (normalizedTitle.includes(normalizedExcel) || normalizedExcel.includes(normalizedTitle)) {
      return event.title;
    }
  }
  
  // Check description for keywords
  const keywords = excelHoliday.toLowerCase().split(/[\s'-]+/).filter(w => w.length > 3);
  for (const event of events) {
    const desc = (event.description || '').toLowerCase();
    const title = event.title.toLowerCase();
    const matches = keywords.filter(k => desc.includes(k) || title.includes(k));
    if (matches.length >= keywords.length * 0.6) { // 60% keyword match
      return event.title;
    }
  }
  
  return null;
}

// Read ICS file to get all events
function extractEventsFromICS() {
  const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
  if (!fs.existsSync(icsPath)) {
    console.error('ICS file not found:', icsPath);
    return [];
  }
  
  const content = fs.readFileSync(icsPath, 'utf8');
  // Handle line continuations (lines starting with space)
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.split('\n');
  
  const events = [];
  let currentEvent = {};
  let inEvent = false;
  let currentDescription = '';
  let inDescription = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle line continuation (space at start means continuation)
    if (line.startsWith(' ') && inDescription) {
      currentDescription += line.substring(1);
      continue;
    }
    
    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      currentDescription = '';
      inDescription = false;
    } else if (trimmedLine === 'END:VEVENT' && inEvent) {
      // Extract title from description (first line before \n)
      if (currentDescription) {
        const firstLine = currentDescription.split('\\n')[0] || currentDescription.split('\n')[0];
        currentEvent.title = firstLine.trim();
      }
      
      // If no title, try to extract from UID
      if (!currentEvent.title && currentEvent.uid) {
        // Extract from UID like "event-reyes-2025" -> "Reyes"
        const uidMatch = currentEvent.uid.match(/event-([^-]+)-/);
        if (uidMatch) {
          const name = uidMatch[1].replace(/-/g, ' ');
          currentEvent.title = name.split(' ').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
        }
      }
      
      if (currentEvent.title && currentEvent.date) {
        events.push({
          title: currentEvent.title,
          date: currentEvent.date,
          description: currentDescription,
          image: currentEvent.image || null,
          uid: currentEvent.uid
        });
      }
      inEvent = false;
      currentEvent = {};
      currentDescription = '';
      inDescription = false;
    } else if (inEvent && trimmedLine.startsWith('SUMMARY:')) {
      currentEvent.title = trimmedLine.replace('SUMMARY:', '').trim();
    } else if (inEvent && trimmedLine.startsWith('DESCRIPTION:')) {
      inDescription = true;
      currentDescription = trimmedLine.replace('DESCRIPTION:', '').trim();
      // Unescape \\n
      currentDescription = currentDescription.replace(/\\n/g, '\n');
    } else if (inEvent && trimmedLine.startsWith('DTSTART')) {
      // Handle DTSTART:20250101T070000Z or DTSTART;VALUE=DATE:20250101
      const dateMatch = trimmedLine.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})/);
      if (dateMatch) {
        currentEvent.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }
    } else if (inEvent && trimmedLine.startsWith('X-IMAGE:')) {
      currentEvent.image = trimmedLine.replace('X-IMAGE:', '').trim();
    } else if (inEvent && trimmedLine.startsWith('UID:')) {
      currentEvent.uid = trimmedLine.replace('UID:', '').trim();
    }
  }
  
  return events;
}

// Main function
function assignImages() {
  console.log('🎨 Assigning images to calendar events...\n');
  
  // Get all events from ICS
  const events = extractEventsFromICS();
  console.log(`Found ${events.length} events in calendar\n`);
  
  // Create a map of all image-to-holiday mappings (including duplicates)
  const imageHolidayMap = {};
  completeMappingData.mappings.forEach(m => {
    if (m.holiday !== 'UNMATCHED') {
      const imagePath = `/images/${m.image}`;
      if (!imageHolidayMap[m.holiday]) {
        imageHolidayMap[m.holiday] = [];
      }
      // Only add if not already in list (avoid duplicates)
      if (!imageHolidayMap[m.holiday].includes(imagePath)) {
        imageHolidayMap[m.holiday].push(imagePath);
      }
    }
  });
  
  // Match and assign images
  const assignments = [];
  const unmatchedImages = [];
  
  Object.keys(imageHolidayMap).forEach(excelHoliday => {
    const matchingTitle = findMatchingEventTitle(excelHoliday, events);
    
    if (matchingTitle) {
      const images = imageHolidayMap[excelHoliday];
      const matchingEvents = events.filter(e => e.title === matchingTitle);
      
      matchingEvents.forEach((event, idx) => {
        // Use the first image, or cycle through if multiple events
        const imageIndex = idx % images.length;
        const imagePath = images[imageIndex];
        
        assignments.push({
          excelHoliday,
          eventTitle: event.title,
          eventDate: event.date,
          image: imagePath,
          hadExistingImage: !!event.image
        });
      });
      
      console.log(`✅ ${excelHoliday} → ${matchingTitle} (${images.length} image(s), ${matchingEvents.length} event(s))`);
    } else {
      unmatchedImages.push({
        excelHoliday,
        images: imageHolidayMap[excelHoliday]
      });
      console.log(`⚠️  ${excelHoliday} → NO MATCH FOUND`);
    }
  });
  
  // Update ICS file with image assignments
  const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
  const icsContent = fs.readFileSync(icsPath, 'utf8');
  const lines = icsContent.split('\n');
  
  const updatedLines = [];
  let currentEventTitle = null;
  let inEvent = false;
  let eventHasImage = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEventTitle = null;
      eventHasImage = false;
      updatedLines.push(line);
    } else if (trimmedLine === 'END:VEVENT' && inEvent) {
      // Before closing, add image if we have an assignment
      if (currentEventTitle && !eventHasImage) {
        const assignment = assignments.find(a => a.eventTitle === currentEventTitle);
        if (assignment) {
          updatedLines.push(`X-IMAGE:${assignment.image}`);
        }
      }
      updatedLines.push(line);
      inEvent = false;
      currentEventTitle = null;
      eventHasImage = false;
    } else if (inEvent && trimmedLine.startsWith('SUMMARY:')) {
      currentEventTitle = trimmedLine.replace('SUMMARY:', '').trim();
      updatedLines.push(line);
    } else if (inEvent && trimmedLine.startsWith('X-IMAGE:')) {
      eventHasImage = true;
      // Update existing image if we have a better assignment
      const assignment = assignments.find(a => a.eventTitle === currentEventTitle);
      if (assignment) {
        updatedLines.push(`X-IMAGE:${assignment.image}`);
      } else {
        updatedLines.push(line); // Keep existing
      }
    } else {
      updatedLines.push(line);
    }
  }
  
  // Write updated ICS file
  fs.writeFileSync(icsPath, updatedLines.join('\n'));
  
  // Save assignment report
  const report = {
    assignments,
    unmatchedImages,
    summary: {
      totalAssignments: assignments.length,
      totalUnmatched: unmatchedImages.length,
      eventsWithImages: new Set(assignments.map(a => a.eventTitle)).size
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'image-assignment-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📊 Summary:`);
  console.log(`   Assignments made: ${report.summary.totalAssignments}`);
  console.log(`   Events with images: ${report.summary.eventsWithImages}`);
  console.log(`   Unmatched Excel holidays: ${report.summary.totalUnmatched}`);
  console.log(`\n✅ Updated ICS file: ${icsPath}`);
  console.log(`✅ Assignment report: image-assignment-report.json`);
  
  return report;
}

// Run the script
if (require.main === module) {
  try {
    assignImages();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

module.exports = { assignImages, findMatchingEventTitle };
