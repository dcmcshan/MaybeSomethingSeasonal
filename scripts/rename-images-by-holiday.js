const fs = require('fs');
const path = require('path');

const ICS_PATH = path.join(__dirname, '..', 'public', 'MSS.ics');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function parseIcs() {
  const content = fs.readFileSync(ICS_PATH, 'utf8');
  const lines = content.split('\n');
  const events = [];
  let inEvent = false;
  let current = { };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      current = { };
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (!current.summary && current.description) {
        current.summary = current.description.split('\\n')[0].trim();
      }
      if (current.summary) events.push(current);
      inEvent = false;
      current = { };
      continue;
    }

    if (!inEvent) continue;

    if (trimmed.startsWith('SUMMARY:')) {
      current.summary = trimmed.replace('SUMMARY:', '').trim();
    } else if (trimmed.startsWith('DESCRIPTION:')) {
      current.description = trimmed.replace('DESCRIPTION:', '').trim();
    } else if (trimmed.startsWith('X-IMAGE:')) {
      current.imageIndex = i;
      current.imagePath = trimmed.replace('X-IMAGE:', '').trim();
    }
  }

  return { events, lines };
}

function ensureUniqueFilename(baseSlug, ext, existingSet) {
  let candidate = `${baseSlug}${ext}`;
  let counter = 2;
  while (existingSet.has(candidate)) {
    candidate = `${baseSlug}-${counter}${ext}`;
    counter++;
  }
  existingSet.add(candidate);
  return candidate;
}

function run() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('Images directory not found:', IMAGES_DIR);
    process.exit(1);
  }

  const { events, lines } = parseIcs();

  // Track current files to avoid collisions
  const existingFiles = new Set(fs.readdirSync(IMAGES_DIR));

  const renames = [];

  for (const ev of events) {
    const title = ev.summary || 'event';
    const slug = slugify(title) || 'event';
    const current = ev.imagePath || '';
    const currentBasename = current.startsWith('/images/') ? current.slice('/images/'.length) : current;

    // Determine extension from existing file if present, else default .jpg
    const ext = path.extname(currentBasename) || '.jpg';

    const desiredBase = ensureUniqueFilename(slug, ext, existingFiles);

    if (!currentBasename || currentBasename === desiredBase) {
      // Nothing to do (either missing image or already correct)
      if (ev.imageIndex !== undefined) {
        lines[ev.imageIndex] = `X-IMAGE:/images/${desiredBase}`;
      }
      continue;
    }

    const srcPath = path.join(IMAGES_DIR, currentBasename);
    const dstPath = path.join(IMAGES_DIR, desiredBase);

    if (fs.existsSync(srcPath)) {
      renames.push({ srcPath, dstPath, lineIndex: ev.imageIndex, newPath: `/images/${desiredBase}` });
    } else {
      // File missing; just update the ICS path so future generation uses the new name
      if (ev.imageIndex !== undefined) {
        lines[ev.imageIndex] = `X-IMAGE:/images/${desiredBase}`;
      }
    }
  }

  // Perform renames
  for (const r of renames) {
    try {
      fs.renameSync(r.srcPath, r.dstPath);
      if (r.lineIndex !== undefined) {
        lines[r.lineIndex] = `X-IMAGE:${r.newPath}`;
      }
      console.log(`Renamed ${path.basename(r.srcPath)} -> ${path.basename(r.dstPath)}`);
    } catch (e) {
      console.warn(`Failed to rename ${r.srcPath}: ${e.message}`);
    }
  }

  fs.writeFileSync(ICS_PATH, lines.join('\n'));
  console.log('Updated X-IMAGE entries in MSS.ics');
}

if (require.main === module) {
  run();
}
