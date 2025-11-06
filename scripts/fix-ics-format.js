const fs = require('fs');
const path = require('path');

const ICS_PATH = path.join(__dirname, '..', 'public', 'MSS.ics');

function fixICSFormat() {
  console.log('🔧 Fixing ICS file format...\n');
  
  const content = fs.readFileSync(ICS_PATH, 'utf8');
  const lines = content.split('\n');
  const updatedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this is the start of an event
    // Events start with DTSTAMP after END:VEVENT, or after VCALENDAR header lines (X-WR-)
    // Also check for UID: as some events might start with that
    if (trimmed.startsWith('DTSTAMP:') || trimmed.startsWith('UID:')) {
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      // If previous line is END:VEVENT, or it's after VCALENDAR header (X-WR- lines), add BEGIN:VEVENT
      if (prevLine === 'END:VEVENT' || prevLine.startsWith('X-WR-') || 
          (prevLine === '' && i > 0 && lines[i - 2] && lines[i - 2].trim().startsWith('X-WR-'))) {
        updatedLines.push('BEGIN:VEVENT');
      }
    }
    
    updatedLines.push(line);
  }
  
  // Write updated file
  fs.writeFileSync(ICS_PATH, updatedLines.join('\n'));
  
  console.log(`✅ Fixed ICS file format`);
  console.log(`📝 Added BEGIN:VEVENT markers before each event`);
  console.log(`📁 File saved: ${ICS_PATH}\n`);
  
  // Count events
  const eventCount = updatedLines.filter(l => l.trim() === 'BEGIN:VEVENT').length;
  console.log(`📊 Found ${eventCount} events in the file`);
}

if (require.main === module) {
  fixICSFormat();
}

module.exports = { fixICSFormat };
