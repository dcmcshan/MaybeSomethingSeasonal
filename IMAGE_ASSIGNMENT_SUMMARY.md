# Image Assignment Summary

## ✅ Successfully Assigned Images

The following images have been automatically assigned to calendar events:

1. **St Andrew's Day** → `image14.png`
   - Event: "Eve of St. Andrew's Day"
   - Date: 2025-11-29

2. **Solstice** → `image2.jpg` 
   - Event: "Eve of the winter solstice"
   - Date: 2025-12-20

3. **Christmas Eve** → `image18.jpg`
   - Event: "Twelfth Night"
   - Date: 2025-01-05

4. **Christmas** → `image19.png`
   - Event: "Twelfth Night"
   - Date: 2025-01-05

5. **Childermas** → `image35.jpg`
   - Event: "Feast of the Holy Innocents"
   - Date: 2025-12-27

6. **Imbolc Eve** → `image37.png`
   - Event: "Eve of Imbolc"
   - Date: 2025-01-30

7. **Imbolc** → `image28.png`
   - Event: "Eve of Imbolc"
   - Date: 2025-01-30

## ⚠️ Images Not Yet Assigned

These images from the Excel file don't have matching events in the calendar yet:

### Likely Need Calendar Events Added:
- **New Years Day** (`image29.jpg`, `image22.png`) - Needs event matching "Celebration of the new year"
- **Día de los Reyes** (`image23.png`, `image31.png`) - Needs event matching "Epiphany" or "Three Kings Day"
- **Perchtag** (`image40.png`) - Needs event matching "Perchta Day"
- **Candelaria** (`image38.jpg`) - Needs event matching "Candlemas"
- **Krampusnacht** (`image39.jpg`, `image10.jpg`) - Needs event matching "Krampus Night"
- **St Nicks Day** (`image44.jpg`) - Needs event matching "St. Nicholas"
- **Martinstag** (`image5.png`, `image32.png`, `image24.png`) - Needs event matching "St. Martin's Day"
- **Virgin of Guadalupe** (`image3.jpg`) - Needs event matching "Our Lady of Guadalupe"
- **St. John Evangelist** (`image16.jpg`) - Needs event matching "St. John the Evangelist"
- **Feast of St. Stefan** (`image21.png`) - Needs event matching "St. Stephen"
- **Dondoyaki** (`image45.png`, `image26.png`) - Needs event matching "burning New Year decorations"
- **St Dwynwyn's Day** (`image41.png`, `image42.png`) - May not be in calendar

### Personal/Custom Events (May Not Be in Calendar):
- **Keystone** (`image25.png`, `image8.jpg`)
- **el Día de Muertos** (`image1.jpg`)
- **Andermas Eve** (`image4.jpg`, `image12.jpg`)
- **1940s** (`image11.jpg`)
- **Magic Flute** (`image36.jpg`, `image27.jpg`)
- **Gita Mahotsav** (`image43.png`)
- **Lussi Day** (`image6.png`)
- **Christmas Party** (`image46.png`)
- **It's a Wonderful Life** (`image9.jpg`, `image34.jpg`)
- **Saturnalia** (`image30.png`)
- **A Colorado Nutcracker** (`image17.jpg`)

## Next Steps

1. **Review the ICS file** to see which holidays actually exist
2. **Add missing events** to the calendar for holidays that should be there
3. **Manually assign images** for personal/custom events that may not be in the standard calendar
4. **Improve matching logic** to handle more variations in naming

The script has been created and saved. You can run it again after adding more events to the calendar:

```bash
node scripts/assign-images-to-calendar.js
```
