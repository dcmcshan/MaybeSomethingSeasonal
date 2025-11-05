const fs = require('fs');
const path = require('path');

// Load the v2 mapping
const v2Data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'image-holiday-mapping-v2.json'), 'utf8'));

// Create one-to-one mappings prioritizing best column matches
const finalMappings = [];
const usedHolidays = new Set();
const usedImages = new Set();

// Sort mappings by column distance (best matches first)
const sortedMappings = v2Data.mappings
  .filter(m => m.holiday !== 'UNMATCHED')
  .sort((a, b) => {
    // First by column distance, then by row
    if (a.colDistance !== b.colDistance) {
      return a.colDistance - b.colDistance;
    }
    return a.imageRow - b.imageRow;
  });

sortedMappings.forEach(m => {
  // Skip if already matched
  if (usedImages.has(m.image) || usedHolidays.has(m.holiday)) {
    return;
  }
  
  // Check if this is a good match (same column or adjacent)
  if (m.colDistance <= 2) {
    finalMappings.push({
      image: m.image,
      holiday: m.holiday,
      imageRow: m.imageRow,
      imageCol: m.imageCol,
      holidayRow: m.holidayRow,
      holidayCol: m.holidayCol,
      dayValue: m.dayValue,
      colDistance: m.colDistance
    });
    usedImages.add(m.image);
    usedHolidays.add(m.holiday);
  }
});

// Handle unmatched images
const unmatchedImages = v2Data.mappings.filter(m => 
  !usedImages.has(m.image) && m.holiday !== 'UNMATCHED'
);

// For unmatched images, try to match them to remaining holidays
unmatchedImages.forEach(m => {
  if (m.holiday !== 'UNMATCHED' && !usedHolidays.has(m.holiday)) {
    finalMappings.push({
      image: m.image,
      holiday: m.holiday,
      imageRow: m.imageRow,
      imageCol: m.imageCol,
      holidayRow: m.holidayRow,
      holidayCol: m.holidayCol,
      dayValue: m.dayValue,
      colDistance: m.colDistance,
      note: 'Secondary match'
    });
    usedImages.add(m.image);
    usedHolidays.add(m.holiday);
  }
});

// Sort final mappings by image row
finalMappings.sort((a, b) => {
  if (a.imageRow !== b.imageRow) return a.imageRow - b.imageRow;
  return a.imageCol.charCodeAt(0) - b.imageCol.charCodeAt(0);
});

console.log('🎯 Final One-to-One Image to Holiday Mappings\n');
console.log('Layout: Day (above) → Image (middle) → Holiday Name (below)\n');
console.log('='.repeat(80));

finalMappings.forEach((m, idx) => {
  console.log(`\n${idx + 1}. ${m.image}`);
  console.log(`   Image: Row ${m.imageRow}, Col ${m.imageCol}`);
  console.log(`   Holiday: ${m.holiday}`);
  console.log(`   Holiday: Row ${m.holidayRow}, Col ${m.holidayCol}`);
  if (m.dayValue) {
    console.log(`   Day above: ${m.dayValue}`);
  }
  if (m.note) {
    console.log(`   Note: ${m.note}`);
  }
});

// Handle truly unmatched images
const allImages = v2Data.mappings.map(m => m.image);
const matchedImages = new Set(finalMappings.map(m => m.image));
const trulyUnmatched = allImages.filter(img => !matchedImages.has(img));

if (trulyUnmatched.length > 0) {
  console.log(`\n\n⚠️  Unmatched Images (${trulyUnmatched.length}):`);
  trulyUnmatched.forEach(img => {
    const imgData = v2Data.mappings.find(m => m.image === img);
    console.log(`   - ${img} (Row ${imgData.imageRow}, Col ${imgData.imageCol})`);
  });
}

// Save results
const output = {
  mappings: finalMappings,
  unmatchedImages: trulyUnmatched,
  summary: {
    totalImages: allImages.length,
    matchedImages: finalMappings.length,
    unmatchedImages: trulyUnmatched.length
  }
};

fs.writeFileSync(
  path.join(__dirname, '..', 'final-image-holiday-mapping.json'),
  JSON.stringify(output, null, 2)
);

// Create clean markdown
let markdown = '# Final Image to Holiday Mappings\n\n';
markdown += '**Layout Structure:** Day (above) → Image (middle) → Holiday Name (below)\n\n';
markdown += `## Summary\n\n`;
markdown += `- Total Images: ${output.summary.totalImages}\n`;
markdown += `- Matched Images: ${output.summary.matchedImages}\n`;
markdown += `- Unmatched Images: ${output.summary.unmatchedImages}\n\n`;

markdown += `## Mappings\n\n`;
markdown += `| # | Image | Holiday | Image Row/Col | Holiday Row/Col | Day |\n`;
markdown += `|---|-------|---------|---------------|-----------------|-----|\n`;

finalMappings.forEach((m, idx) => {
  markdown += `| ${idx + 1} | ${m.image} | ${m.holiday} | ${m.imageRow}/${m.imageCol} | ${m.holidayRow}/${m.holidayCol} | ${m.dayValue || 'N/A'} |\n`;
});

if (trulyUnmatched.length > 0) {
  markdown += `\n## Unmatched Images\n\n`;
  trulyUnmatched.forEach(img => {
    const imgData = v2Data.mappings.find(m => m.image === img);
    markdown += `- ${img} (Row ${imgData.imageRow}, Col ${imgData.imageCol})\n`;
  });
}

fs.writeFileSync(
  path.join(__dirname, '..', 'FINAL_IMAGE_HOLIDAY_MAPPING.md'),
  markdown
);

console.log(`\n\n✅ Final mappings saved:`);
console.log(`   - final-image-holiday-mapping.json`);
console.log(`   - FINAL_IMAGE_HOLIDAY_MAPPING.md`);
console.log(`\n📊 Summary: ${output.summary.matchedImages}/${output.summary.totalImages} images matched`);
