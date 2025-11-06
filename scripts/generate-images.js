const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const url = require('url');
const sharp = require('sharp');

// Load environment variables from .env.local and ~/.env if present
function loadEnvFile(envFilePath, label) {
  try {
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=')
              .trim()
              .replace(/^\"|\"$/g, '')
              .replace(/^'|'$/g, '');
            // Always set (allows .env.local to override ~/.env)
            process.env[key] = value;
          }
        }
      });
      console.log(`✅ Loaded environment variables from ${label}`);
      return true;
    }
  } catch (err) {
    console.warn(`⚠️  Failed to load ${label}: ${err.message}`);
  }
  return false;
}

const envLocalPath = path.join(__dirname, '..', '.env.local');
const homeEnvPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.env');

// Load from ~/.env first (as base), then .env.local (overrides)
// This allows ~/.env to be the default with project-specific overrides
loadEnvFile(homeEnvPath, '~/.env');
loadEnvFile(envLocalPath, '.env.local');

// API Keys - MUST be set via environment variables for security
// Do NOT hardcode API keys in this file!
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ICS_PATH = path.join(__dirname, '..', 'public', 'MSS.ics');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const USE_PROMPT_ENHANCEMENT = true; // Use OpenRouter to enhance prompts before image generation
const CALENDAR_CELL_WIDTH = 400; // Calendar cell image width in pixels
const CALENDAR_CELL_HEIGHT = 300; // Calendar cell image height in pixels

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
      // Extract title from description if summary doesn't exist
      if (!currentEvent.summary && currentEvent.description) {
        const firstLine = currentEvent.description.split('\\n')[0].trim();
        currentEvent.summary = firstLine || 'Untitled Event';
      }
      
      if (currentEvent.summary || currentEvent.description) {
        events.push({ ...currentEvent });
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent && line.startsWith('SUMMARY:')) {
      currentEvent.summary = line.replace('SUMMARY:', '').trim();
      currentEvent.summaryLineIndex = i;
    } else if (inEvent && line.startsWith('DESCRIPTION:')) {
      currentEvent.description = line.replace('DESCRIPTION:', '').trim();
      if (!currentEvent.summaryLineIndex) {
        currentEvent.summaryLineIndex = i; // Use description line as fallback
      }
    } else if (inEvent && line.startsWith('X-IMAGE:')) {
      currentEvent.imageIndex = i;
      currentEvent.currentImage = line.replace('X-IMAGE:', '').trim();
    }
  }
  
  return { events, lines };
}

// Generate image using OpenRouter's image generation API
// OpenRouter supports image generation through chat completions with modalities parameter
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
  
  // Use OpenRouter's image generation via chat completions API
  // Models that support image generation: openai/gpt-5-image, google/gemini-2.5-flash-image
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "openai/gpt-5-image", // GPT-5 Image generation model via OpenRouter
      messages: [
        {
          role: "user",
          content: finalPrompt
        }
      ],
      modalities: ["image", "text"], // Request image generation
      max_tokens: 4000, // Increase tokens for image generation
      stream: false // Non-streaming to get complete response
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
            // OpenRouter returns images in the response
            // GPT-5 Image may return images in different formats
            if (response.choices && response.choices[0]) {
              const choice = response.choices[0];
              const message = choice.message;
              
              // Check message.content - might be array or string
              if (message.content) {
                const content = message.content;
                
                // If content is an array, look for image objects
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
                
                // If content is a string, check for URL
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
              
              // Check reasoning_details for image references
              if (message.reasoning_details) {
                const reasoningText = JSON.stringify(message.reasoning_details);
                const urlMatch = reasoningText.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/i);
                if (urlMatch) {
                  resolve(urlMatch[0]);
                  return;
                }
              }
              
              // Check reasoning text (if it's a string property)
              if (message.reasoning) {
                const urlMatch = message.reasoning.match(/https?:\/\/[^\s\)]+\.(jpg|jpeg|png|webp|gif)/i);
                if (urlMatch) {
                  resolve(urlMatch[0]);
                  return;
                }
              }
              
              // Check tool_calls for image generation results
              if (message.tool_calls && Array.isArray(message.tool_calls)) {
                for (const toolCall of message.tool_calls) {
                  if (toolCall.function && toolCall.function.arguments) {
                    try {
                      const args = JSON.parse(toolCall.function.arguments);
                      if (args.url || args.image_url || args.image) {
                        resolve(args.url || args.image_url || args.image);
                        return;
                      }
                    } catch (e) {
                      // Not JSON, try regex
                      const urlMatch = toolCall.function.arguments.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/i);
                      if (urlMatch) {
                        resolve(urlMatch[0]);
                        return;
                      }
                    }
                  }
                  // Check tool call response
                  if (toolCall.response) {
                    const urlMatch = JSON.stringify(toolCall.response).match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/i);
                    if (urlMatch) {
                      resolve(urlMatch[0]);
                      return;
                    }
                  }
                }
              }
            }
            
            // Check for base64 encoded images in response
            if (message.content) {
              const contentStr = typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content);
              
              // Look for base64 image data
              const base64Match = contentStr.match(/data:image\/([^;]+);base64,([A-Za-z0-9+\/=]+)/);
              if (base64Match) {
                // Return base64 data URI - downloadImage will handle it
                resolve(base64Match[0]);
                return;
              }
            }
            
            // Check the entire response JSON for any image URLs
            const fullResponseText = JSON.stringify(response);
            const urlMatches = fullResponseText.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/gi);
            if (urlMatches && urlMatches.length > 0) {
              // Filter out known non-image URLs (like openrouter.ai, api endpoints, etc.)
              const imageUrls = urlMatches.filter(url => 
                !url.includes('openrouter.ai') && 
                !url.includes('/api/') &&
                !url.includes('openai.com/api') &&
                (url.includes('oaidalleapiprodscus') || 
                 url.includes('cdn.openai.com') ||
                 url.includes('replicate.delivery') ||
                 url.includes('storage.googleapis.com') ||
                 url.match(/\.(jpg|jpeg|png|webp|gif)/i))
              );
              if (imageUrls.length > 0) {
                resolve(imageUrls[0]);
                return;
              }
            }
            
            // If finish_reason is "length", the response might be incomplete
            if (response.choices?.[0]?.finish_reason === 'length') {
              console.warn('  Response was truncated (max_tokens reached), image might still be generating...');
            }
            
            // Debug: log the response structure (first 3000 chars)
            console.error('Response structure:', JSON.stringify(response, null, 2).substring(0, 3000));
            reject(new Error('No image URL found in OpenRouter response. Response may be incomplete or image generation failed.'));
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
          console.error(`API error response: ${data.substring(0, 500)}`);
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
  const summary = event.summary || 'Calendar Event';
  // Clean description (remove icon/category markers)
  const cleanDesc = description.split('\\n\\nIcon:')[0].replace(/\\n/g, ' ').trim();
  
  return `A beautiful, seasonal calendar illustration for "${summary}". ${cleanDesc}. Style: warm, inviting, traditional, cultural celebration. High quality, detailed, suitable for a calendar background.`;
}

// Download image from URL or base64 data URI
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    // Handle base64 data URIs
    if (imageUrl.startsWith('data:image/')) {
      const base64Match = imageUrl.match(/data:image\/[^;]+;base64,(.+)/);
      if (base64Match) {
        try {
          const buffer = Buffer.from(base64Match[1], 'base64');
          resolve(buffer);
          return;
        } catch (error) {
          reject(new Error(`Failed to decode base64 image: ${error.message}`));
          return;
        }
      }
    }
    
    // Handle regular URLs
    const parsedUrl = url.parse(imageUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    client.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Resize image to calendar cell size
async function resizeImageToCalendarCell(imageBuffer) {
  try {
    const resizedBuffer = await sharp(imageBuffer)
      .resize(CALENDAR_CELL_WIDTH, CALENDAR_CELL_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    return resizedBuffer;
  } catch (error) {
    throw new Error(`Failed to resize image: ${error.message}`);
  }
}

// Generate filename for event image
function generateImageFilename(event, index) {
  // Try to extract filename from existing X-IMAGE path if available
  if (event.currentImage) {
    const match = event.currentImage.match(/\/([^\/]+\.(jpg|jpeg|png))$/i);
    if (match) {
      return match[1];
    }
  }
  
  // Generate filename based on event description (first line before Icon/Category)
  let baseText = '';
  if (event.description) {
    const firstLine = event.description.split('\\n')[0].trim();
    baseText = firstLine || event.summary || `event-${index}`;
  } else if (event.summary) {
    baseText = event.summary;
  } else {
    baseText = `event-${index}`;
  }
  
  // Convert to kebab-case filename
  const sanitized = baseText
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
  
  return `${sanitized}.jpg`;
}

// Save image to local directory
async function saveImageToLocal(imageBuffer, filename) {
  // Ensure images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  
  const filePath = path.join(IMAGES_DIR, filename);
  fs.writeFileSync(filePath, imageBuffer);
  return `/images/${filename}`;
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
  console.log('🎨 Starting image generation for calendar events...\n');
  
  const { events, lines } = extractEvents();
  console.log(`Found ${events.length} events to generate images for\n`);
  
  const eventsWithImages = [];
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventTitle = event.summary || event.description?.split('\\n')[0] || `Event ${i + 1}`;
    const filename = generateImageFilename(event, i);
    const filePath = path.join(IMAGES_DIR, filename);
    
    // Check if image already exists
    if (fs.existsSync(filePath) && event.currentImage) {
      console.log(`[${i + 1}/${events.length}] Skipping "${eventTitle}" - image already exists: ${filename}`);
      eventsWithImages.push({ event, imageUrl: event.currentImage });
      skipCount++;
      continue;
    }
    
    console.log(`[${i + 1}/${events.length}] Generating image for: "${eventTitle}"`);
    console.log(`  Target filename: ${filename}`);
    
    try {
      const prompt = createPrompt(event);
      console.log(`  Prompt: ${prompt.substring(0, 100)}...`);
      
      // Generate image URL
      const imageUrl = await generateImage(prompt);
      console.log(`  ✅ Generated URL: ${imageUrl.substring(0, 60)}...`);
      
      // Download image
      console.log(`  ⬇️  Downloading image...`);
      const imageBuffer = await downloadImage(imageUrl);
      
      // Resize to calendar cell size
      console.log(`  🔄 Resizing to ${CALENDAR_CELL_WIDTH}x${CALENDAR_CELL_HEIGHT}px...`);
      const resizedBuffer = await resizeImageToCalendarCell(imageBuffer);
      
      // Save locally
      const localPath = await saveImageToLocal(resizedBuffer, filename);
      console.log(`  💾 Saved to: ${localPath}\n`);
      
      eventsWithImages.push({ event, imageUrl: localPath });
      successCount++;
      
      // Rate limiting: wait 2 seconds between requests to avoid rate limits
      if (i < events.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      failCount++;
      
      // Continue with next event even if one fails
      if (event.currentImage) {
        // Keep existing image if generation fails
        eventsWithImages.push({ event, imageUrl: event.currentImage });
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Successfully generated: ${successCount}`);
  console.log(`  ⏭️  Skipped (already exists): ${skipCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  
  if (eventsWithImages.length > 0) {
    updateICSFile(eventsWithImages, lines);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateImage, createPrompt };
