const fs = require('fs');
const path = require('path');
const https = require('https');
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

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
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
const REPLICATE_API_TOKEN =
  process.env.REPLICATE_API_TOKEN ||
  process.env.REPLICATE_API_KEY ||
  process.env.REPLICATE_TOKEN;
const ICS_PATH = path.join(__dirname, '..', 'public', 'MSS.ics');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const USE_PROMPT_ENHANCEMENT = process.env.USE_PROMPT_ENHANCEMENT !== 'false';
const REPLICATE_MODEL = process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell';
const REPLICATE_ASPECT_RATIO = process.env.REPLICATE_ASPECT_RATIO || '1:1';
const REPLICATE_NUM_OUTPUTS = Math.max(
  1,
  Number.parseInt(process.env.REPLICATE_NUM_OUTPUTS || '1', 10) || 1
);
const REPLICATE_POLL_INTERVAL_MS = Math.max(
  1000,
  Number.parseInt(process.env.REPLICATE_POLL_INTERVAL_MS || '2000', 10) || 2000
);
const REPLICATE_API_BASE = process.env.REPLICATE_API_BASE || 'https://api.replicate.com';

const CALENDAR_CELL_SIZE = Number.parseInt(process.env.CALENDAR_ICON_SIZE || '512', 10) || 512;
const CALENDAR_CELL_WIDTH = CALENDAR_CELL_SIZE; // Calendar icon width in pixels
const CALENDAR_CELL_HEIGHT = CALENDAR_CELL_SIZE; // Calendar icon height in pixels

// CLI flags / env toggles
const args = process.argv.slice(2);
const FORCE_REGENERATE = args.includes('--force') || process.env.FORCE_IMAGE_REGEN === 'true';
const LIMIT_ARG = args.find(arg => arg.startsWith('--limit='));
const MAX_EVENTS = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined;
if (MAX_EVENTS !== undefined && (Number.isNaN(MAX_EVENTS) || MAX_EVENTS <= 0)) {
  console.warn(`⚠️  Ignoring invalid --limit value: ${LIMIT_ARG}`);
}

// Validate required API tokens
if (!REPLICATE_API_TOKEN) {
  console.error('❌ ERROR: REPLICATE_API_TOKEN (or REPLICATE_API_KEY / REPLICATE_TOKEN) is not set.');
  console.error('   Set it with: export REPLICATE_API_TOKEN=your-token-here');
  process.exit(1);
}

if (USE_PROMPT_ENHANCEMENT && !OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY not set. Prompt enhancement disabled.');
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

// Generate image using Replicate
async function generateImage(prompt) {
  let finalPrompt = prompt;
  if (USE_PROMPT_ENHANCEMENT && OPENROUTER_API_KEY) {
    try {
      finalPrompt = await enhancePromptWithOpenRouter(prompt);
      console.log(`  Enhanced prompt: ${finalPrompt.substring(0, 80)}...`);
    } catch (error) {
      console.log('  Prompt enhancement failed, using original prompt');
    }
  } else if (USE_PROMPT_ENHANCEMENT) {
    console.log('  Prompt enhancement requested but OPENROUTER_API_KEY is missing. Using original prompt.');
  }

  const prediction = await createReplicatePrediction(finalPrompt);
  const imageUrl = extractReplicateImageUrl(prediction);
  if (!imageUrl) {
    throw new Error('Replicate prediction succeeded but no image URL was returned');
  }

  return imageUrl;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createReplicatePrediction(promptText) {
  const body = {
    input: {
      prompt: promptText,
      aspect_ratio: REPLICATE_ASPECT_RATIO,
      num_outputs: REPLICATE_NUM_OUTPUTS
    }
  };

  const response = await fetch(`${REPLICATE_API_BASE}/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await safeResponseText(response);
    throw new Error(`Replicate request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const prediction = await response.json();
  console.log(`  🚀 Replicate prediction created (id: ${prediction.id})`);
  logReplicatePrediction('created', prediction);
  return pollReplicatePrediction(prediction);
}

async function pollReplicatePrediction(prediction) {
  let current = prediction;

  while (current.status === 'starting' || current.status === 'processing') {
    const progress = typeof current.metrics?.progress === 'number'
      ? ` ${(current.metrics.progress * 100).toFixed(0)}%`
      : '';
    console.log(`  ⏳ Replicate status: ${current.status}${progress}`);
    await sleep(REPLICATE_POLL_INTERVAL_MS);

    const pollRes = await fetch(`${REPLICATE_API_BASE}/v1/predictions/${current.id}`, {
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`
      }
    });

    if (!pollRes.ok) {
      const pollError = await safeResponseText(pollRes);
      throw new Error(`Failed to poll Replicate prediction: ${pollRes.status} ${pollRes.statusText} - ${pollError}`);
    }

    current = await pollRes.json();
  }

  if (current.status !== 'succeeded') {
    logReplicatePrediction('failed', current);
    throw new Error(`Replicate prediction failed with status "${current.status}"${current.error ? `: ${current.error}` : ''}`);
  }

  logReplicatePrediction('succeeded', current);
  return current;
}

function extractReplicateImageUrl(prediction) {
  if (!prediction) return null;
  const { output } = prediction;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') {
      return first;
    }
    if (first && typeof first === 'object' && typeof first.url === 'string') {
      return first.url;
    }
  }
  return null;
}

async function safeResponseText(response) {
  try {
    return await response.text();
  } catch {
    return '<unable to read response body>';
  }
}

function logReplicatePrediction(state, prediction) {
  try {
    ensureDirectory(LOGS_DIR);
    const logPath = path.join(LOGS_DIR, 'replicate-last-prediction.json');
    const payload = {
      timestamp: new Date().toISOString(),
      state,
      prediction
    };
    fs.writeFileSync(logPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`  📝 Replicate ${state} payload saved to logs/replicate-last-prediction.json`);
  } catch (err) {
    console.warn(`  ⚠️  Failed to write Replicate log: ${err.message}`);
  }
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
  
  const details = [
    `Create a clean, high-contrast icon for "${summary}".`,
    cleanDesc ? `${cleanDesc}.` : '',
    'Focus on a single symbolic object, centered composition, minimal shadow.',
    'Render on a crisp white or transparent background with no scenery or text.',
    'Style: polished vector, flat illustration, subtle gradients welcome.'
  ]
    .filter(Boolean)
    .join(' ');

  return details;
}

// Download image from URL or base64 data URI
async function downloadImage(imageUrl) {
  if (imageUrl.startsWith('data:image/')) {
    const base64Match = imageUrl.match(/data:image\/[^;]+;base64,(.+)/);
    if (base64Match) {
      try {
        return Buffer.from(base64Match[1], 'base64');
      } catch (error) {
        throw new Error(`Failed to decode base64 image: ${error.message}`);
      }
    }
  }

  const headers = {};
  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname && parsed.hostname.includes('replicate.delivery')) {
      headers.Authorization = `Bearer ${REPLICATE_API_TOKEN}`;
    }
  } catch {
    // Ignore parsing errors; fetch will surface a clearer error below.
  }

  const response = await fetch(imageUrl, Object.keys(headers).length > 0 ? { headers } : undefined);

  if (!response.ok) {
    const errorText = await safeResponseText(response);
    throw new Error(`Failed to download image: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Resize image to calendar cell size
async function resizeImageToCalendarCell(imageBuffer) {
  try {
    const resizedBuffer = await sharp(imageBuffer)
      .resize(CALENDAR_CELL_WIDTH, CALENDAR_CELL_HEIGHT, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toBuffer();
    return resizedBuffer;
  } catch (error) {
    throw new Error(`Failed to resize image: ${error.message}`);
  }
}

async function createPlaceholderImage(eventTitle) {
  const placeholderLines = wrapPlaceholderText(eventTitle || 'Seasonal Event');
  const textElements = placeholderLines
    .map((line, index) => {
      const yPosition = 140 + index * 32;
      return `<text x="50%" y="${yPosition}" fill="#F3F4F6" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="600" text-anchor="middle">${escapeForSvg(line)}</text>`;
    })
    .join('');

  const svg = `
    <svg width="${CALENDAR_CELL_WIDTH}" height="${CALENDAR_CELL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="placeholderGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f2937" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#placeholderGradient)" />
      <g>
        ${textElements}
      </g>
      <text x="50%" y="${CALENDAR_CELL_HEIGHT - 36}" fill="#9CA3AF" font-family="Helvetica, Arial, sans-serif" font-size="18" text-anchor="middle">Image pending</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true
    })
    .toBuffer();
}

function wrapPlaceholderText(text, maxLengthPerLine = 24, maxLines = 2) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return ['Seasonal Event'];
  }

  const words = clean.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxLengthPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.length > 0 && lines.join(' ').length < clean.length) {
    const lastIndex = lines.length - 1;
    if (lines[lastIndex].length > maxLengthPerLine - 3) {
      lines[lastIndex] = `${lines[lastIndex].slice(0, maxLengthPerLine - 3)}...`;
    } else {
      lines[lastIndex] = `${lines[lastIndex]}...`;
    }
  }

  return lines.length > 0 ? lines : ['Seasonal Event'];
}

function escapeForSvg(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Generate filename for event image
function generateImageFilename(event, index) {
  // Try to extract filename from existing X-IMAGE path if available
  if (event.currentImage) {
    try {
      const parsed = path.parse(event.currentImage.trim());
      if (parsed && parsed.name) {
        return `${parsed.name}.png`;
      }
    } catch (error) {
      console.warn(`  ⚠️  Could not parse existing image path "${event.currentImage}": ${error.message}`);
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
  
  const baseName = sanitized || `event-${index + 1}`;
  return `${baseName}.png`;
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
  const targetEvents = MAX_EVENTS ? events.slice(0, MAX_EVENTS) : events;
  const totalEvents = targetEvents.length;

  console.log(`Found ${events.length} events, processing ${totalEvents}${MAX_EVENTS ? ` (limit ${MAX_EVENTS})` : ''}\n`);

  const eventsWithImages = [];
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < targetEvents.length; i++) {
    const event = targetEvents[i];
    const eventTitle = event.summary || event.description?.split('\\n')[0] || `Event ${i + 1}`;
    const filename = generateImageFilename(event, i);
    const filePath = path.join(IMAGES_DIR, filename);

    // Check if image already exists
    if (fs.existsSync(filePath)) {
      if (FORCE_REGENERATE) {
        console.log(`[${i + 1}/${totalEvents}] Regenerating "${eventTitle}" (forced) - existing file will be replaced`);
      } else {
        console.log(`[${i + 1}/${totalEvents}] Skipping "${eventTitle}" - image already exists: ${filename}`);
        eventsWithImages.push({ event, imageUrl: `/images/${filename}` });
        skipCount++;
        continue;
      }
    }
    
    console.log(`[${i + 1}/${totalEvents}] Generating image for: "${eventTitle}"`);
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
      if (i < targetEvents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      failCount++;

      try {
        console.log('  🛟 Falling back to placeholder image...');
        const placeholderBuffer = await createPlaceholderImage(eventTitle);
        const localPath = await saveImageToLocal(placeholderBuffer, filename);
        console.log(`  ⚠️ Placeholder saved to: ${localPath}\n`);
        eventsWithImages.push({ event, imageUrl: localPath });
      } catch (placeholderError) {
        console.error(`  ⚠️ Placeholder generation failed: ${placeholderError.message}`);
        const fallbackPath = fs.existsSync(filePath)
          ? `/images/${filename}`
          : (event.currentImage || `/images/${filename}`);
        console.log(`  ↩️  Reverting to existing reference: ${fallbackPath}\n`);
        eventsWithImages.push({ event, imageUrl: fallbackPath });
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
