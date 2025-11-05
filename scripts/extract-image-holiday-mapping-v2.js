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

// Parse sheet1 to find cells with values
const cellPattern = /<c r="([A-Z]+)(\d+)"([^>]*?)>(.*?)<\/c>/gs;
const cellMatches = [...sheet1Xml.matchAll(cellPattern)];
const cellData = {};

cellMatches.forEach(match => {
  const col = match[1];
  const row = parseInt(match[2]);
  const attrs = match[3];
  const content = match[4];
  
  // Check if it's a shared string or value
  let value = null;
  let cellType = 'empty';
  
  const vMatch = content.match(/<v>(\d+)<\/v>/);
  if (vMatch) {
    const index = parseInt(vMatch[1]);
    if (attrs.includes('t="s"')) {
      // It's a shared string
      value = sharedStrings[index] || null;
      cellType = 'string';
    } else {
      // It's a number - could be a date
      value = index;
      cellType = 'number';
      // Check if it might be a date (Excel date serial numbers are typically > 40000)
      if (index > 40000 && index < 50000) {
        cellType = 'date';
      }
    }
  }
  
  if (!cellData[row]) {
    cellData[row] = {};
  }
  cellData[row][col] = { value, attrs, content, cellType };
});

// Extract images from drawing
const oneCellPattern = /<xdr:oneCellAnchor[^>]*>(.*?)<\/xdr:oneCellAnchor>/gs;
const oneCellAnchors = [...drawingXml.matchAll(oneCellPattern)];

const imageCellMap = [];
oneCellAnchors.forEach((anchorMatch) => {
  const anchorXml = anchorMatch[1];
  
  const fromMatch = anchorXml.match(/<xdr:from><xdr:col>(\d+)<\/xdr:col><xdr:colOff>(\d+)<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row><xdr:rowOff>(\d+)<\/xdr:rowOff><\/xdr:from>/);
  const nameMatch = anchorXml.match(/<xdr:cNvPr[^>]*name="([^"]+)"[^>]*>/);
  const blipMatch = anchorXml.match(/<a:blip[^>]*r:embed="rId(\d+)"[^>]*\/>/);
  
  if (fromMatch && blipMatch) {
    const col = parseInt(fromMatch[1]);
    const row = parseInt(fromMatch[3]) + 1; // Excel is 1-indexed
    
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

console.log('?? Extracting image-to-holiday mappings based on layout:\n');
console.log('   Layout: Day (above) ? Image (middle) ? Holiday Name (below)\n');

// Find holidays in cells
const holidayRows = {};
Object.keys(cellData).forEach(row => {
  Object.keys(cellData[row]).forEach(col => {
    const cell = cellData[row][col];
    if (cell.value && sharedStrings.includes(cell.value)) {
      if (!holidayRows[cell.value]) {
        holidayRows[cell.value] = [];
      }
      holidayRows[cell.value].push({ row: parseInt(row), col });
    }
  });
});

// Find dates/days in cells (numbers that might be dates, or look for date patterns)
const dayRows = {};
Object.keys(cellData).forEach(row => {
  Object.keys(cellData[row]).forEach(col => {
    const cell = cellData[row][col];
    // Look for date-like numbers (Excel serial dates) or day numbers (1-31)
    if (cell.cellType === 'date' || (cell.cellType === 'number' && cell.value > 0 && cell.value <= 31)) {
      if (!dayRows[row]) {
        dayRows[row] = [];
      }
      dayRows[row].push({ col, value: cell.value });
    }
  });
});

// Match images to holidays
// Layout: Day (row-1) ? Image (row) ? Holiday (row+1)
const imageHolidayMappings = [];

imageCellMap.sort((a, b) => {
  if (a.row !== b.row) return a.row - b.row;
  return a.colNum - b.colNum;
}).forEach(img => {
  // Look for holiday in the row BELOW the image (row + 1)
  const holidayRow = img.row + 1;
  const holidayCols = cellData[holidayRow] || {};
  
  // Also check same row and row+2 in case of variations
  let bestHoliday = null;
  let bestScore = Infinity;
  
  // Check row+1 first (most likely)
  Object.keys(holidayCols).forEach(col => {
    const cell = holidayCols[col];
    if (cell.value && sharedStrings.includes(cell.value)) {
      const colDist = Math.abs(img.colNum - (col.charCodeAt(0) - 65));
      if (colDist < bestScore) {
        bestScore = colDist;
        bestHoliday = {
          name: cell.value,
          row: holidayRow,
          col: col
        };
      }
    }
  });
  
  // Check same row (img.row)
  if (!bestHoliday) {
    const sameRowCells = cellData[img.row] || {};
    Object.keys(sameRowCells).forEach(col => {
      const cell = sameRowCells[col];
      if (cell.value && sharedStrings.includes(cell.value)) {
        const colDist = Math.abs(img.colNum - (col.charCodeAt(0) - 65));
        if (colDist < bestScore) {
          bestScore = colDist;
          bestHoliday = {
            name: cell.value,
            row: img.row,
            col: col
          };
        }
      }
    });
  }
  
  // Check row+2 as fallback
  if (!bestHoliday) {
    const holidayRow2 = img.row + 2;
    const holidayCols2 = cellData[holidayRow2] || {};
    Object.keys(holidayCols2).forEach(col => {
      const cell = holidayCols2[col];
      if (cell.value && sharedStrings.includes(cell.value)) {
        const colDist = Math.abs(img.colNum - (col.charCodeAt(0) - 65));
        if (colDist < bestScore) {
          bestScore = colDist;
          bestHoliday = {
            name: cell.value,
            row: holidayRow2,
            col: col
          };
        }
      }
    });
  }
  
  // Also check for day/date above the image
  const dayRow = img.row - 1;
  const dayCells = cellData[dayRow] || {};
  let dayValue = null;
  Object.keys(dayCells).forEach(col => {
    const cell = dayCells[col];
    if (cell.cellType === 'date' || (cell.cellType === 'number' && cell.value > 0 && cell.value <= 31)) {
      const colDist = Math.abs(img.colNum - (col.charCodeAt(0) - 65));
      if (colDist <= 1) {
        dayValue = cell.value;
      }
    }
  });
  
  if (bestHoliday) {
    imageHolidayMappings.push({
      image: img.imageName,
      imageRow: img.row,
      imageCol: img.col,
      holiday: bestHoliday.name,
      holidayRow: bestHoliday.row,
      holidayCol: bestHoliday.col,
      dayRow: dayRow,
      dayValue: dayValue,
      colDistance: bestScore
    });
  } else {
    imageHolidayMappings.push({
      image: img.imageName,
      imageRow: img.row,
      imageCol: img.col,
      holiday: 'UNMATCHED',
      dayRow: dayRow,
      dayValue: dayValue
    });
  }
});

// Print results
console.log('=== Image to Holiday Mappings (Image above Holiday Name) ===\n');
imageHolidayMappings.forEach(m => {
  if (m.holiday !== 'UNMATCHED') {
    console.log(`${m.image} (row ${m.imageRow}, col ${m.imageCol})`);
    console.log(`  ? Holiday: ${m.holiday} (row ${m.holidayRow}, col ${m.holidayCol})`);
    if (m.dayValue) {
      console.log(`  ? Day above: row ${m.dayRow}, value: ${m.dayValue}`);
    }
    console.log('');
  } else {
    console.log(`${m.image} (row ${m.imageRow}, col ${m.imageCol}) - NO HOLIDAY MATCH FOUND`);
    if (m.dayValue) {
      console.log(`  ? Day above: row ${m.dayRow}, value: ${m.dayValue}`);
    }
    console.log('');
  }
});

// Save to JSON
const output = {
  mappings: imageHolidayMappings,
  summary: {
    totalImages: imageCellMap.length,
    matchedImages: imageHolidayMappings.filter(m => m.holiday !== 'UNMATCHED').length,
    unmatchedImages: imageHolidayMappings.filter(m => m.holiday === 'UNMATCHED').length
  }
};

fs.writeFileSync(
  path.join(__dirname, '..', 'image-holiday-mapping-v2.json'),
  JSON.stringify(output, null, 2)
);

// Create markdown
let markdown = '# Image to Holiday Mappings (Corrected Layout)\n\n';
markdown += '**Layout Structure:** Day (above) ? Image (middle) ? Holiday Name (below)\n\n';
markdown += `## Summary\n\n`;
markdown += `- Total Images: ${output.summary.totalImages}\n`;
markdown += `- Matched Images: ${output.summary.matchedImages}\n`;
markdown += `- Unmatched Images: ${output.summary.unmatchedImages}\n\n`;
markdown += `## Mappings\n\n`;
markdown += `| Image | Holiday | Image Row/Col | Holiday Row/Col | Day Value |\n`;
markdown += `|-------|---------|---------------|-----------------|----------|\n`;

imageHolidayMappings.forEach(m => {
  if (m.holiday !== 'UNMATCHED') {
    markdown += `| ${m.image} | ${m.holiday} | ${m.imageRow}/${m.imageCol} | ${m.holidayRow}/${m.holidayCol} | ${m.dayValue || 'N/A'} |\n`;
  } else {
    markdown += `| ${m.image} | *UNMATCHED* | ${m.imageRow}/${m.imageCol} | - | ${m.dayValue || 'N/A'} |\n`;
  }
});

fs.writeFileSync(
  path.join(__dirname, '..', 'IMAGE_HOLIDAY_MAPPING_V2.md'),
  markdown
);

console.log(`\n? Saved ${output.summary.matchedImages} matched mappings`);
console.log(`? Results saved to:`);
console.log(`   - image-holiday-mapping-v2.json`);
console.log(`   - IMAGE_HOLIDAY_MAPPING_V2.md`);
