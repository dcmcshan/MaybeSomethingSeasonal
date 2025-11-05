const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local if it exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

// API Keys
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const USE_PROMPT_ENHANCEMENT = true;

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

// Generate image using OpenRouter's GPT-5 Image API
async function generateImage(prompt, retries = 3) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable not set!');
  }

  // First, enhance the prompt using OpenRouter's GPT if enabled
  let finalPrompt = prompt;
  if (USE_PROMPT_ENHANCEMENT) {
    try {
      finalPrompt = await enhancePromptWithOpenRouter(prompt);
      console.log(`  Enhanced prompt: ${finalPrompt.substring(0, 80)}...`);
    } catch (error) {
      console.log(`  Prompt enhancement failed, using original prompt`);
    }
  }
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "openai/gpt-5-image",
      messages: [
        {
          role: "user",
          content: finalPrompt
        }
      ],
      modalities: ["image", "text"],
      max_tokens: 4000,
      stream: false
    });
    
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://maybesomethingseasonal.com',
        'X-Title': 'Maybe Something Seasonal Calendar',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.choices && response.choices[0]) {
              const choice = response.choices[0];
              const message = choice.message;
              
              if (message.content) {
                const content = message.content;
                
                if (Array.isArray(content)) {
                  const imageItem = content.find(item => 
                    item.type === 'image' || 
                    item.image_url || 
                    (item.type === 'image_url' && item.image_url?.url)
                  );
                  if (imageItem) {
                    const imageUrl = imageItem.image_url?.url || imageItem.url || imageItem.image_url;
                    if (imageUrl) {
                      resolve(imageUrl);
                      return;
                    }
                  }
                }
                
                if (typeof content === 'string') {
                  if (content.startsWith('http://') || content.startsWith('https://')) {
                    resolve(content.trim());
                    return;
                  }
                  const urlMatch = content.match(/https?:\/\/[^\s\)]+/);
                  if (urlMatch) {
                    resolve(urlMatch[0]);
                    return;
                  }
                }
              }
              
              if (response.data && Array.isArray(response.data)) {
                const imageData = response.data.find(item => item.url || item.b64_json);
                if (imageData?.url) {
                  resolve(imageData.url);
                  return;
                }
              }
              
              if (response.image_url || response.url) {
                resolve(response.image_url || response.url);
                return;
              }
              
              if (message.reasoning_details) {
                const reasoningText = JSON.stringify(message.reasoning_details);
                const urlMatch = reasoningText.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/);
                if (urlMatch) {
                  resolve(urlMatch[0]);
                  return;
                }
              }
            }
            
            reject(new Error('No image URL found in OpenRouter response.'));
          } catch (e) {
            reject(e);
          }
        } else if (res.statusCode === 429 && retries > 0) {
          const retryAfter = res.headers['retry-after'] || 60;
          console.log(`Rate limited, waiting ${retryAfter} seconds before retry...`);
          setTimeout(() => {
            generateImage(prompt, retries - 1).then(resolve).catch(reject);
          }, retryAfter * 1000);
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Enhance prompt using OpenRouter's GPT-4o
async function enhancePromptWithOpenRouter(originalPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed, artistic image generation prompts for DALL-E 3. Create concise, detailed, visually rich prompts that will generate beautiful calendar illustrations. Focus on style, mood, colors, cultural elements, and visual composition."
        },
        {
          role: "user",
          content: `Create an enhanced, detailed image generation prompt optimized for DALL-E 3 based on this calendar event: ${originalPrompt}\n\nMake it specific, artistic, and visually descriptive. Include style, mood, colors, cultural elements, and composition. Keep it under 200 words.`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://maybesomethingseasonal.com',
        'X-Title': 'Maybe Something Seasonal Calendar',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const enhanced = response.choices?.[0]?.message?.content?.trim();
            if (enhanced && enhanced.length > 20) {
              resolve(enhanced);
            } else {
              resolve(originalPrompt);
            }
          } catch (e) {
            resolve(originalPrompt);
          }
        } else {
          resolve(originalPrompt);
        }
      });
    });
    
    req.on('error', () => {
      resolve(originalPrompt);
    });
    
    req.write(postData);
    req.end();
  });
}

// Create prompt for event
function createPrompt(event) {
  const description = event.description || '';
  const cleanDesc = description.split('\\n\\nIcon:')[0].replace(/\\n/g, ' ').trim();
  
  return `A beautiful, seasonal calendar illustration for "${event.title}". ${cleanDesc}. Style: warm, inviting, traditional, cultural celebration. High quality, detailed, suitable for a calendar background.`;
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
async function assignImages() {
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
  
  // Find events without images and generate them
  const generatedImages = [];
  let generatedCount = 0;
  let failedCount = 0;
  
  if (OPENROUTER_API_KEY) {
    console.log('\n🖼️  Generating images for events without assigned images...\n');
    const eventsNeedingImages = events.filter(event => {
      // Check if this event has an assignment
      const hasAssignment = assignments.some(a => a.eventTitle === event.title);
      // Check if event already has an image
      const hasExistingImage = !!event.image;
      // Return true if event needs an image
      return !hasAssignment && !hasExistingImage;
    });
    
    console.log(`Found ${eventsNeedingImages.length} events without images`);
    
    if (eventsNeedingImages.length > 0) {
      for (let i = 0; i < eventsNeedingImages.length; i++) {
        const event = eventsNeedingImages[i];
        console.log(`[${i + 1}/${eventsNeedingImages.length}] Generating image for: "${event.title}"`);
        
        try {
          const prompt = createPrompt(event);
          console.log(`  Prompt: ${prompt.substring(0, 100)}...`);
          
          const imageUrl = await generateImage(prompt);
          console.log(`  ✅ Generated: ${imageUrl.substring(0, 60)}...\n`);
          
          generatedImages.push({
            eventTitle: event.title,
            eventDate: event.date,
            image: imageUrl,
            generated: true
          });
          
          generatedCount++;
          
          // Add to assignments
          assignments.push({
            excelHoliday: null,
            eventTitle: event.title,
            eventDate: event.date,
            image: imageUrl,
            generated: true
          });
          
          // Rate limiting: wait 2 seconds between requests
          if (i < eventsNeedingImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`  ❌ Failed: ${error.message}\n`);
          failedCount++;
        }
      }
      
      console.log(`\n📊 Image Generation Summary:`);
      console.log(`   Generated: ${generatedCount}`);
      console.log(`   Failed: ${failedCount}`);
    } else {
      console.log('\n✅ All events already have images assigned!\n');
    }
  } else {
    console.log('\n⚠️  OPENROUTER_API_KEY not set - skipping image generation');
    console.log('   Set it with: export OPENROUTER_API_KEY=your-key-here\n');
  }
  
  // Update ICS file with image assignments
  const icsPath = path.join(__dirname, '..', 'public', 'MSS.ics');
  const icsContent = fs.readFileSync(icsPath, 'utf8');
  const lines = icsContent.split('\n');
  
  const updatedLines = [];
  let currentEventTitle = null;
  let currentEventDescription = null;
  let inEvent = false;
  let eventHasImage = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEventTitle = null;
      currentEventDescription = null;
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
      currentEventDescription = null;
      eventHasImage = false;
    } else if (inEvent && trimmedLine.startsWith('DESCRIPTION:')) {
      currentEventDescription = trimmedLine.replace('DESCRIPTION:', '').trim();
      // Extract title from description (first line)
      const firstLine = currentEventDescription.split('\\n')[0] || currentEventDescription.split('\n')[0];
      currentEventTitle = firstLine.trim();
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
    generatedImages,
    summary: {
      totalAssignments: assignments.length,
      totalUnmatched: unmatchedImages.length,
      eventsWithImages: new Set(assignments.map(a => a.eventTitle)).size,
      generatedCount,
      failedCount
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
  if (generatedCount > 0) {
    console.log(`   Images generated: ${report.summary.generatedCount}`);
    console.log(`   Generation failures: ${report.summary.failedCount}`);
  }
  console.log(`\n✅ Updated ICS file: ${icsPath}`);
  console.log(`✅ Assignment report: image-assignment-report.json`);
  
  return report;
}

// Run the script
if (require.main === module) {
  (async () => {
    try {
      await assignImages();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { assignImages, findMatchingEventTitle };
