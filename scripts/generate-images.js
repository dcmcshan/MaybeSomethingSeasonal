const fs = require('fs');
const path = require('path');
const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const ICS_PATH = path.join(__dirname, '..', 'public', 'MSS.ics');
const USE_OPENROUTER = true; // Use OpenRouter API instead of direct OpenAI

// Read ICS file and extract events
function extractEvents() {
  const content = fs.readFileSync(ICS_PATH, 'utf8');
  const lines = content.split('\n');
  
  const events = [];
  let currentEvent = {};
  let inEvent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line.trim() === 'END:VEVENT' && inEvent) {
      if (currentEvent.summary) {
        events.push({ ...currentEvent });
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent && line.startsWith('SUMMARY:')) {
      currentEvent.summary = line.replace('SUMMARY:', '').trim();
      currentEvent.summaryLineIndex = i;
    } else if (inEvent && line.startsWith('DESCRIPTION:')) {
      currentEvent.description = line.replace('DESCRIPTION:', '').trim();
    } else if (inEvent && line.startsWith('X-IMAGE:')) {
      currentEvent.imageIndex = i;
      currentEvent.currentImage = line.replace('X-IMAGE:', '').trim();
    }
  }
  
  return { events, lines };
}

// Generate image using OpenRouter API (which routes to DALL-E or other image models)
function generateImage(prompt, retries = 3) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "openai/dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });
    
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://maybesomethingseasonal.com',
        'X-Title': 'Maybe Something Seasonal Calendar',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            // OpenRouter may wrap the response differently
            if (response.data && response.data[0] && response.data[0].url) {
              resolve(response.data[0].url);
            } else if (response.url) {
              // Direct URL response
              resolve(response.url);
            } else {
              console.error('Response structure:', JSON.stringify(response, null, 2));
              reject(new Error('No image URL in response'));
            }
          } catch (e) {
            reject(e);
          }
        } else if (res.statusCode === 429 && retries > 0) {
          // Rate limited - wait and retry
          const retryAfter = res.headers['retry-after'] || 60;
          console.log(`Rate limited, waiting ${retryAfter} seconds before retry...`);
          setTimeout(() => {
            generateImage(prompt, retries - 1).then(resolve).catch(reject);
          }, retryAfter * 1000);
        } else {
          console.error(`API error response: ${data}`);
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

// Create prompt for event
function createPrompt(event) {
  const description = event.description || '';
  // Clean description (remove icon/category markers)
  const cleanDesc = description.split('\\n\\nIcon:')[0].replace(/\\n/g, ' ').trim();
  
  return `A beautiful, seasonal calendar illustration for "${event.summary}". ${cleanDesc}. Style: warm, inviting, traditional, cultural celebration. High quality, detailed, suitable for a calendar background.`;
}

// Update ICS file with new image URLs
function updateICSFile(eventsWithImages, originalLines) {
  const updatedLines = [...originalLines];
  
  eventsWithImages.forEach(({ event, imageUrl }) => {
    if (event.imageIndex !== undefined) {
      // Update existing X-IMAGE line
      updatedLines[event.imageIndex] = `X-IMAGE:${imageUrl}`;
    } else {
      // Find where to insert X-IMAGE (before END:VEVENT)
      let endIndex = -1;
      for (let i = event.summaryLineIndex; i < updatedLines.length; i++) {
        if (updatedLines[i].trim() === 'END:VEVENT') {
          endIndex = i;
          break;
        }
      }
      
      if (endIndex > 0) {
        // Insert before TRANSP or STATUS if present, otherwise before END:VEVENT
        let insertPos = endIndex;
        for (let i = endIndex - 1; i >= event.summaryLineIndex; i--) {
          if (updatedLines[i].startsWith('TRANSP:') || updatedLines[i].startsWith('STATUS:')) {
            insertPos = i + 1;
            break;
          }
        }
        updatedLines.splice(insertPos, 0, `X-IMAGE:${imageUrl}`);
      }
    }
  });
  
  fs.writeFileSync(ICS_PATH, updatedLines.join('\n'));
  console.log('\n? Updated ICS file with generated images');
}

// Main execution
async function main() {
  console.log('?? Starting image generation for calendar events...\n');
  
  const { events, lines } = extractEvents();
  console.log(`Found ${events.length} events to generate images for\n`);
  
  const eventsWithImages = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`[${i + 1}/${events.length}] Generating image for: "${event.summary}"`);
    
    try {
      const prompt = createPrompt(event);
      console.log(`  Prompt: ${prompt.substring(0, 100)}...`);
      
      const imageUrl = await generateImage(prompt);
      console.log(`  ? Generated: ${imageUrl.substring(0, 60)}...\n`);
      
      eventsWithImages.push({ event, imageUrl });
      successCount++;
      
      // Rate limiting: wait 2 seconds between requests to avoid rate limits
      if (i < events.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ? Failed: ${error.message}\n`);
      failCount++;
      
      // Continue with next event even if one fails
      if (event.currentImage) {
        // Keep existing image if generation fails
        eventsWithImages.push({ event, imageUrl: event.currentImage });
      }
    }
  }
  
  console.log(`\n?? Summary:`);
  console.log(`  ? Successfully generated: ${successCount}`);
  console.log(`  ? Failed: ${failCount}`);
  
  if (eventsWithImages.length > 0) {
    updateICSFile(eventsWithImages, lines);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateImage, createPrompt };
