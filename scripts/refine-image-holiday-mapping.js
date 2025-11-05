const fs = require('fs');
const path = require('path');

// Load the mapping data
const mappingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'image-holiday-mapping.json'), 'utf8'));

const { imageCellMap, holidayRows, holidays } = mappingData;

// Convert column letters to numbers for easier comparison
function colToNum(col) {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num - 1; // Convert to 0-based
}

// Convert column number to letter
function numToCol(num) {
  let col = '';
  num++; // Convert to 1-based
  while (num > 0) {
    const remainder = (num - 1) % 26;
    col = String.fromCharCode(65 + remainder) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

// Create a refined mapping using better logic
function createRefinedMapping() {
  const refinedMappings = [];
  
  // Group images and holidays by row ranges (each row block represents a time period)
  const rowBlocks = [
    { startRow: 3, endRow: 5, name: 'Early October' },
    { startRow: 9, endRow: 13, name: 'Late October/Early November' },
    { startRow: 15, endRow: 17, name: 'Mid-November' },
    { startRow: 19, endRow: 21, name: 'Late November/Early December' },
    { startRow: 22, endRow: 24, name: 'Mid-December' },
    { startRow: 25, endRow: 27, name: 'Late December' },
    { startRow: 28, endRow: 30, name: 'Christmas Week' },
    { startRow: 32, endRow: 34, name: 'New Year' },
    { startRow: 35, endRow: 37, name: 'Early January' },
    { startRow: 38, endRow: 40, name: 'Mid-January' },
    { startRow: 41, endRow: 43, name: 'Late January' },
    { startRow: 44, endRow: 46, name: 'Early February' }
  ];
  
  rowBlocks.forEach(block => {
    // Get images in this block
    const blockImages = imageCellMap.filter(img => 
      img.row >= block.startRow && img.row <= block.endRow
    ).sort((a, b) => {
      // Sort by row first, then column
      if (a.row !== b.row) return a.row - b.row;
      return a.colNum - b.colNum;
    });
    
    // Get holidays in this block
    const blockHolidays = [];
    Object.keys(holidayRows).forEach(holiday => {
      holidayRows[holiday].forEach(pos => {
        if (pos.row >= block.startRow && pos.row <= block.endRow) {
          blockHolidays.push({
            holiday,
            row: pos.row,
            col: pos.col,
            colNum: colToNum(pos.col)
          });
        }
      });
    });
    blockHolidays.sort((a, b) => {
      // Sort by row first, then column
      if (a.row !== b.row) return a.row - b.row;
      return a.colNum - b.colNum;
    });
    
    console.log(`\n=== ${block.name} (Rows ${block.startRow}-${block.endRow}) ===`);
    console.log(`Images: ${blockImages.length}, Holidays: ${blockHolidays.length}`);
    
    // Match images to holidays using multiple strategies
    const usedHolidays = new Set();
    
    blockImages.forEach((img, imgIdx) => {
      let bestMatch = null;
      let bestScore = Infinity;
      
      blockHolidays.forEach((hol, holIdx) => {
        if (usedHolidays.has(hol.holiday)) return;
        
        // Calculate score based on:
        // 1. Row distance (closer is better)
        // 2. Column distance (closer is better)
        // 3. Sequential position (earlier images match earlier holidays)
        const rowDist = Math.abs(img.row - hol.row);
        const colDist = Math.abs(img.colNum - hol.colNum);
        const seqDist = Math.abs(imgIdx - holIdx);
        
        // Weighted score
        const score = rowDist * 10 + colDist * 5 + seqDist * 2;
        
        if (score < bestScore) {
          bestScore = score;
          bestMatch = hol;
        }
      });
      
      if (bestMatch) {
        usedHolidays.add(bestMatch.holiday);
        refinedMappings.push({
          holiday: bestMatch.holiday,
          image: img.imageName,
          imageRow: img.row,
          imageCol: img.col,
          holidayRow: bestMatch.row,
          holidayCol: bestMatch.col,
          score: bestScore,
          block: block.name
        });
        
        console.log(`  ${img.imageName} (row ${img.row}, col ${img.col}) ? ${bestMatch.holiday} (row ${bestMatch.row}, col ${bestMatch.col}) [score: ${bestScore.toFixed(1)}]`);
      } else {
        console.log(`  ${img.imageName} (row ${img.row}, col ${img.col}) ? NO MATCH`);
      }
    });
  });
  
  return refinedMappings;
}

// Also create a chronological mapping (matching by order)
function createChronologicalMapping() {
  const sortedImages = [...imageCellMap].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.colNum - b.colNum;
  });
  
  const sortedHolidays = [];
  Object.keys(holidayRows).forEach(holiday => {
    holidayRows[holiday].forEach(pos => {
      sortedHolidays.push({
        holiday,
        row: pos.row,
        col: pos.col,
        colNum: colToNum(pos.col)
      });
    });
  });
  sortedHolidays.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.colNum - b.colNum;
  });
  
  const chronologicalMappings = [];
  const minLength = Math.min(sortedImages.length, sortedHolidays.length);
  
  console.log('\n=== Chronological Mapping (Sequential Order) ===');
  for (let i = 0; i < minLength; i++) {
    chronologicalMappings.push({
      holiday: sortedHolidays[i].holiday,
      image: sortedImages[i].imageName,
      imageRow: sortedImages[i].row,
      holidayRow: sortedHolidays[i].row,
      index: i + 1
    });
    console.log(`${i + 1}. ${sortedImages[i].imageName} ? ${sortedHolidays[i].holiday}`);
  }
  
  return chronologicalMappings;
}

// Main execution
console.log('?? Creating refined image-to-holiday mappings...\n');

const refinedMappings = createRefinedMapping();
const chronologicalMappings = createChronologicalMapping();

// Save results
const output = {
  refinedMappings,
  chronologicalMappings,
  summary: {
    totalImages: imageCellMap.length,
    totalHolidays: Object.keys(holidayRows).length,
    matchedImages: refinedMappings.length,
    matchedChronologically: chronologicalMappings.length
  }
};

fs.writeFileSync(
  path.join(__dirname, '..', 'refined-holiday-image-mapping.json'),
  JSON.stringify(output, null, 2)
);

console.log('\n? Refined mappings saved to refined-holiday-image-mapping.json');
console.log(`\n?? Summary:`);
console.log(`   Total Images: ${output.summary.totalImages}`);
console.log(`   Total Holidays: ${output.summary.totalHolidays}`);
console.log(`   Matched Images (refined): ${output.summary.matchedImages}`);
console.log(`   Matched Chronologically: ${output.summary.matchedChronologically}`);

// Create a markdown summary
let markdown = '# Refined Holiday to Image Mappings\n\n';
markdown += '## Summary\n\n';
markdown += `- Total Images: ${output.summary.totalImages}\n`;
markdown += `- Total Holidays: ${output.summary.totalHolidays}\n`;
markdown += `- Matched Images: ${output.summary.matchedImages}\n\n`;

markdown += '## Refined Mappings (by Row Block)\n\n';
markdown += '| Image | Holiday | Image Row/Col | Holiday Row/Col | Score | Block |\n';
markdown += '|-------|---------|---------------|-----------------|-------|-------|\n';
refinedMappings.forEach(m => {
  markdown += `| ${m.image} | ${m.holiday} | ${m.imageRow}/${m.imageCol} | ${m.holidayRow}/${m.holidayCol} | ${m.score.toFixed(1)} | ${m.block} |\n`;
});

markdown += '\n## Chronological Mappings (Sequential Order)\n\n';
markdown += '| # | Image | Holiday |\n';
markdown += '|---|-------|---------|\n';
chronologicalMappings.forEach(m => {
  markdown += `| ${m.index} | ${m.image} | ${m.holiday} |\n`;
});

fs.writeFileSync(
  path.join(__dirname, '..', 'REFINED_HOLIDAY_IMAGE_MAPPING.md'),
  markdown
);

console.log('? Markdown summary saved to REFINED_HOLIDAY_IMAGE_MAPPING.md');
