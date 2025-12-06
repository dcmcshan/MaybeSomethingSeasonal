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
  'Andermas Eve': ['Andermas Eve', 'St. Andrew\'s Eve', 'Eve of St. Andrew', 'Noaptea Lupilor', 'andrew'],
  'Keystone': ['Keystone'], // May not be in calendar
  'Magic Flute': ['Magic Flute'], // May not be in calendar
  'Gita Mahotsav': ['Gita Mahotsav', 'Gita Jayanti', 'Gita Jayanti (गीता जयंती)'], // May not be in calendar
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
            
            // Debug: log response structure for troubleshooting
            if (process.env.DEBUG) {
              console.log('  Response structure:', JSON.stringify(response, null, 2).substring(0, 500));
            }
            
            if (response.choices && response.choices[0]) {
              const choice = response.choices[0];
              const message = choice.message;
              
              if (message.content) {
                const content = message.content;
                
                if (Array.isArray(content)) {
                  const imageItem = content.find(item => 
                    item.type === 'image' || 
                    item.type === 'image_url' ||
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
                  // Try to extract URL from text
                  const urlMatch = content.match(/https?:\/\/[^\s\)]+/);
                  if (urlMatch) {
                    resolve(urlMatch[0]);
                    return;
                  }
                }
              }
              
              // Check for images in response.data
              if (response.data && Array.isArray(response.data)) {
                const imageData = response.data.find(item => item.url || item.b64_json);
                if (imageData?.url) {
                  resolve(imageData.url);
                  return;
                }
              }
              
              // Check for image in other response fields
              if (response.image_url || response.url) {
                resolve(response.image_url || response.url);
                return;
              }
              
              // Check reasoning field (GPT-5 often puts info in reasoning)
              if (message.reasoning) {
                const reasoningText = typeof message.reasoning === 'string' 
                  ? message.reasoning 
                  : JSON.stringify(message.reasoning);
                const urlMatch = reasoningText.match(/https?:\/\/[^\s"'\\)]+\.(jpg|jpeg|png|webp|webm)/i);
                if (urlMatch) {
                  resolve(urlMatch[0]);
                  return;
                }
              }
              
              // Check reasoning_details for image references
              if (message.reasoning_details) {
                const reasoningText = JSON.stringify(message.reasoning_details);
                const urlMatch = reasoningText.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/);
                if (urlMatch) {
                  resolve(urlMatch[0]);
                  return;
                }
              }
              
              // Check for image in tool_calls or other nested structures
              if (message.tool_calls) {
                for (const toolCall of message.tool_calls) {
                  if (toolCall.function?.arguments) {
                    try {
                      const args = JSON.parse(toolCall.function.arguments);
                      if (args.image_url || args.url) {
                        resolve(args.image_url || args.url);
                        return;
                      }
                    } catch (e) {
                      // Not JSON
                    }
                  }
                }
              }
              
              // Check for image in attachments or media
              if (message.attachments) {
                for (const attachment of message.attachments) {
                  if (attachment.url || attachment.image_url) {
                    resolve(attachment.url || attachment.image_url);
                    return;
                  }
                }
              }
            }
            
            // Check if response has image_url at top level
            if (response.image_url || response.image) {
              resolve(response.image_url || response.image);
              return;
            }
            
            // Log the full response for debugging if it fails
            const responsePreview = JSON.stringify(response, null, 2);
            console.error('  Response structure (first 1500 chars):', responsePreview.substring(0, 1500));
            console.error('  Full message content:', JSON.stringify(message, null, 2).substring(0, 500));
            reject(new Error('No image URL found in OpenRouter response. The model may not support image generation in this format.'));
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
  console.log('🎨 Generating images for all calendar events...\n');
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ ERROR: OPENROUTER_API_KEY environment variable not set!');
    console.error('   Set it with: export OPENROUTER_API_KEY=your-key-here');
    process.exit(1);
  }
  
  // Get all events from ICS
  const events = extractEventsFromICS();
  console.log(`Found ${events.length} events in calendar\n`);
  
  if (events.length === 0) {
    console.error('❌ No events found in calendar!');
    process.exit(1);
  }
  
  // Generate images for all events (skip Excel matching)
  const assignments = [];
  const generatedImages = [];
  let generatedCount = 0;
  let failedCount = 0;
  
  console.log('🖼️  Generating images for all events...\n');
  
  // Generate images for ALL events (regenerate all)
  // Filter to get all events that need new images
  const eventsNeedingImages = events.filter(event => {
    // Generate for all events (will replace existing images)
    return true;
  });
    
  console.log(`Found ${eventsNeedingImages.length} events to generate images for`);
  
  if (eventsNeedingImages.length === 0) {
    console.log('⚠️  No events found!\n');
  } else {
    console.log(`Generating images for ${eventsNeedingImages.length} events...\n`);
    
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
    generatedImages,
    summary: {
      totalEvents: events.length,
      totalAssignments: assignments.length,
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
  console.log(`   Total events: ${report.summary.totalEvents}`);
  console.log(`   Images generated: ${report.summary.generatedCount}`);
  console.log(`   Generation failures: ${report.summary.failedCount}`);
  console.log(`   Events with images: ${report.summary.eventsWithImages}`);
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
