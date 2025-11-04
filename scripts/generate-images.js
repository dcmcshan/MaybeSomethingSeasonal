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
  console.log('? Loaded environment variables from .env.local');
}

// API Keys - MUST be set via environment variables for security
// Do NOT hardcode API keys in this file!
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ICS_PATH = path.join(__dirname, '..', 'public', 'MSS.ics');
const USE_PROMPT_ENHANCEMENT = true; // Use OpenRouter to enhance prompts before image generation

// Validate API keys are set
if (!OPENROUTER_API_KEY) {
  console.error('? ERROR: OPENROUTER_API_KEY environment variable not set!');
  console.error('   Set it with: export OPENROUTER_API_KEY=your-key-here');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.warn('??  WARNING: OPENAI_API_KEY not set. Image generation will fail.');
  console.warn('   Set it with: export OPENAI_API_KEY=your-key-here');
}

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

// Generate image using OpenAI DALL-E API
// Note: Requires an OpenAI API key (not OpenRouter key)
async function generateImage(prompt, retries = 3) {
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
  
  // Generate image using OpenAI DALL-E
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });
    
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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

// Enhance prompt using OpenRouter's GPT-5 or GPT-4o API
async function enhancePromptWithOpenRouter(originalPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "openai/gpt-4o", // Try GPT-5 if available: "openai/gpt-5" or "openai/o1-preview"
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
              console.log('  OpenRouter returned empty/short response, using original prompt');
              resolve(originalPrompt);
            }
          } catch (e) {
            console.log('  Error parsing OpenRouter response, using original prompt');
            resolve(originalPrompt); // Fallback to original
          }
        } else {
          console.log(`  OpenRouter API error (${res.statusCode}), using original prompt`);
          resolve(originalPrompt); // Fallback to original on error
        }
      });
    });
    
    req.on('error', () => {
      console.log('  Network error with OpenRouter, using original prompt');
      resolve(originalPrompt); // Fallback to original on error
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
