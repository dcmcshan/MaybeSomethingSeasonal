const fs = require('fs');
const path = require('path');

// Read Excel XML files
const sheet1Path = path.join(__dirname, '..', 'extracted_excel', 'xl', 'worksheets', 'sheet1.xml');
const sharedStringsPath = path.join(__dirname, '..', 'extracted_excel', 'xl', 'sharedStrings.xml');
const drawingPath = path.join(__dirname, '..', 'extracted_excel', 'xl', 'drawings', 'drawing1.xml');

// Read files
const sheet1Xml = fs.readFileSync(sheet1Path, 'utf8');
const sharedStringsXml = fs.readFileSync(sharedStringsPath, 'utf8');
const drawingXml = fs.readFileSync(drawingPath, 'utf8');

// Parse shared strings
const sharedStrings = [];
const sharedStringsMatch = sharedStringsXml.match(/<si><t>([^<]+)<\/t><\/si>/g);
if (sharedStringsMatch) {
  sharedStringsMatch.forEach(match => {
    const text = match.match(/<t>([^<]+)<\/t>/)[1];
    sharedStrings.push(text);
  });
}

console.log(`Found ${sharedStrings.length} shared strings:`);
sharedStrings.forEach((str, i) => console.log(`  ${i}: ${str}`));

// Parse sheet1 to find cells with values and images
// Extract all cell references and their values
const cellPattern = /<c r="([A-Z]+)(\d+)"([^>]*?)>(.*?)<\/c>/gs;
const cells = [];
let match;

// First, let's extract all cells with their row/column info
const cellMatches = [...sheet1Xml.matchAll(cellPattern)];
const cellData = {};

cellMatches.forEach(match => {
  const col = match[1];
  const row = parseInt(match[2]);
  const attrs = match[3];
  const content = match[4];
  
  // Check if it's a shared string
  let value = null;
  const vMatch = content.match(/<v>(\d+)<\/v>/);
  if (vMatch) {
    const index = parseInt(vMatch[1]);
    if (attrs.includes('t="s"')) {
      // It's a shared string
      value = sharedStrings[index] || null;
    } else {
      value = index;
    }
  }
  
  if (!cellData[row]) {
    cellData[row] = {};
  }
  cellData[row][col] = { value, attrs, content };
});

// Now let's look for images in the drawing
// Images are typically linked to cells via anchor points
console.log('\n=== Analyzing Drawing ===');
// Try both oneCellAnchor and twoCellAnchor
const oneCellPattern = /<xdr:oneCellAnchor[^>]*>(.*?)<\/xdr:oneCellAnchor>/gs;
const twoCellPattern = /<xdr:twoCellAnchor[^>]*>(.*?)<\/xdr:twoCellAnchor>/gs;
const oneCellAnchors = [...drawingXml.matchAll(oneCellPattern)];
const twoCellAnchors = [...drawingXml.matchAll(twoCellPattern)];

console.log(`Found ${oneCellAnchors.length} oneCellAnchor images`);
console.log(`Found ${twoCellAnchors.length} twoCellAnchor images`);

// Extract image-to-cell relationships
const imageCellMap = [];

// Process oneCellAnchor
oneCellAnchors.forEach((anchorMatch) => {
  const anchorXml = anchorMatch[1];
  
  // Find the from cell (where image is anchored)
  const fromMatch = anchorXml.match(/<xdr:from><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(\d+)<\/xdr:rowOff><\/xdr:from>/);
  
  // Find the image name - look for name attribute in cNvPr
  const nameMatch = anchorXml.match(/<xdr:cNvPr[^>]*name="([^"]+)"[^>]*>/);
  
  // Find the image reference (rId)
  const blipMatch = anchorXml.match(/<a:blip[^>]*r:embed="rId(\d+)"[^>]*\/>/);
  
  if (fromMatch && blipMatch) {
    const col = parseInt(fromMatch[1]);
    const row = parseInt(fromMatch[3]) + 1; // Excel is 1-indexed, but row in XML is 0-indexed
    
    // Convert column number to letter (0=A, 1=B, etc.)
    let colLetter = '';
    let colNum = col;
    while (colNum >= 0) {
      colLetter = String.fromCharCode(65 + (colNum % 26)) + colLetter;
      colNum = Math.floor(colNum / 26) - 1;
      if (colNum < 0) break;
    }
    
    const imageName = nameMatch ? nameMatch[1] : `image${blipMatch[1]}.jpg`;
    
    imageCellMap.push({
      row,
      col: colLetter,
      colNum: col,
      imageName,
      rId: parseInt(blipMatch[1])
    });
  }
});

// Process twoCellAnchor (if any)
twoCellAnchors.forEach((anchorMatch) => {
  const anchorXml = anchorMatch[1];
  
  const fromMatch = anchorXml.match(/<xdr:from><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(\d+)<\/xdr:rowOff><\/xdr:from>/);
  const nameMatch = anchorXml.match(/<xdr:cNvPr[^>]*name="([^"]+)"[^>]*\/>/);
  const blipMatch = anchorXml.match(/<a:blip[^>]*r:embed="rId(\d+)"[^>]*\/>/);
  
  if (fromMatch && blipMatch) {
    const col = parseInt(fromMatch[1]);
    const row = parseInt(fromMatch[3]) + 1;
    
    let colLetter = '';
    let colNum = col;
    while (colNum >= 0) {
      colLetter = String.fromCharCode(65 + (colNum % 26)) + colLetter;
      colNum = Math.floor(colNum / 26) - 1;
      if (colNum < 0) break;
    }
    
    const imageName = nameMatch ? nameMatch[1] : `image${blipMatch[1]}.jpg`;
    
    imageCellMap.push({
      row,
      col: colLetter,
      colNum: col,
      imageName,
      rId: parseInt(blipMatch[1])
    });
  }
});

console.log('\n=== Image to Cell Mappings ===');
imageCellMap.forEach(map => {
  const cell = cellData[map.row]?.[map.col];
  const value = cell?.value || 'N/A';
  console.log(`Image ${map.imageId} -> Row ${map.row}, Col ${map.col} (${value})`);
});

// Now let's try a different approach - look at the drawing relationships
const drawingRelsPath = path.join(__dirname, '..', 'extracted_excel', 'xl', 'drawings', '_rels', 'drawing1.xml.rels');
if (fs.existsSync(drawingRelsPath)) {
  const drawingRels = fs.readFileSync(drawingRelsPath, 'utf8');
  console.log('\n=== Drawing Relationships ===');
  const relPattern = /<Relationship Id="rId(\d+)"[^>]*Target="([^"]+)"[^>]*\/>/g;
  const rels = [...drawingRels.matchAll(relPattern)];
  rels.forEach(rel => {
    console.log(`rId${rel[1]} -> ${rel[2]}`);
  });
}

// Try to find which cells contain holiday names and match them with images
console.log('\n=== Attempting to match holidays with images ===');
const holidays = sharedStrings.filter(s => s && s.length > 0);

// For each holiday, find its row in the Excel sheet
const holidayRows = {};
Object.keys(cellData).forEach(row => {
  Object.keys(cellData[row]).forEach(col => {
    const cell = cellData[row][col];
    if (cell.value && holidays.includes(cell.value)) {
      if (!holidayRows[cell.value]) {
        holidayRows[cell.value] = [];
      }
      holidayRows[cell.value].push({ row: parseInt(row), col });
    }
  });
});

// Match images to holidays based on row proximity
// Images are typically in the same row or nearby rows as the holiday text
const holidayImageMap = [];
imageCellMap.sort((a, b) => a.row - b.row).forEach(img => {
  // Find the closest holiday in any column within a reasonable distance
  let closestHoliday = null;
  let minDistance = Infinity;
  let closestHolidayPos = null;
  
  Object.keys(holidayRows).forEach(holiday => {
    holidayRows[holiday].forEach(holidayPos => {
      // Check rows within 5 rows of the image
      const distance = Math.abs(holidayPos.row - img.row);
      if (distance < minDistance && distance <= 5) {
        minDistance = distance;
        closestHoliday = holiday;
        closestHolidayPos = holidayPos;
      }
    });
  });
  
  if (closestHoliday && minDistance <= 5) {
    holidayImageMap.push({
      holiday: closestHoliday,
      image: img.imageName,
      rowDiff: minDistance,
      imageRow: img.row,
      imageCol: img.col,
      holidayRow: closestHolidayPos.row,
      holidayCol: closestHolidayPos.col
    });
  }
});

// Also try matching by chronological order - if images are in sequential rows
// and holidays are also in sequential rows, match them in order
const sortedImages = [...imageCellMap].sort((a, b) => a.row - b.row);
const sortedHolidays = [];
Object.keys(holidayRows).forEach(holiday => {
  const positions = holidayRows[holiday];
  positions.forEach(pos => {
    sortedHolidays.push({ holiday, row: pos.row, col: pos.col });
  });
});
sortedHolidays.sort((a, b) => a.row - b.row);

console.log('\n=== Sequential Matching (images sorted by row) ===');
sortedImages.forEach((img, idx) => {
  console.log(`Row ${img.row}, Col ${img.col}: ${img.imageName}`);
});

console.log('\n=== Holidays sorted by row ===');
sortedHolidays.forEach((hol, idx) => {
  console.log(`Row ${hol.row}, Col ${hol.col}: ${hol.holiday}`);
});

console.log('\n=== Holiday to Image Mappings ===');
holidayImageMap.sort((a, b) => a.holidayRow - b.holidayRow).forEach(map => {
  console.log(`${map.holiday} -> ${map.image} (row ${map.imageRow}, holiday row ${map.holidayRow}, diff: ${map.rowDiff})`);
});

// Output as JSON
const output = {
  holidays: sharedStrings,
  imageCellMap,
  holidayRows,
  holidayImageMap
};

fs.writeFileSync(
  path.join(__dirname, '..', 'image-holiday-mapping.json'),
  JSON.stringify(output, null, 2)
);

console.log('\n? Saved mapping to image-holiday-mapping.json');
