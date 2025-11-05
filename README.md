# Maybe Something Seasonal

A beautiful seasonal calendar celebrating nature's cycles and special moments throughout the year.

## Features

- 📅 **Interactive Calendar View** - Navigate through months and view events
- 🎨 **Custom Icons** - Each event has a unique emoji icon
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 📥 **ICS Download** - Download the calendar as a standard .ics file
- 🌱 **Seasonal Focus** - Events centered around nature's cycles and seasonal celebrations

## Live Demo

Visit the live calendar at: [https://danielmcshan.github.io/MaybeSomethingSeasonal/](https://danielmcshan.github.io/MaybeSomethingSeasonal/)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dcmcshan/MaybeSomethingSeasonal.git
cd MaybeSomethingSeasonal
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

5. Open your browser and visit `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This will create a `dist` folder with the production build. The `public/MSS.ics` file is copied to `dist/` during the build.

## Project Structure

```
MaybeSomethingSeasonal/
├── src/
│   ├── App.tsx          # Main React component
│   ├── App.css          # Custom styles
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── scripts/
│   └── generate-ics.js  # Legacy ICS generator (not used)
├── public/              # Static files
│   └── MSS.ics          # Calendar source file (edit directly)
├── .github/workflows/
│   └── deploy.yml       # GitHub Pages deployment
└── package.json
```

## Customizing Events

**MSS.ics is the source of truth** - edit `public/MSS.ics` directly to add, modify, or remove events.

The ICS file format includes:
- `SUMMARY:` - Event title
- `DTSTART:` - Event date (YYYYMMDDTHHMMSSZ format)
- `DTEND:` - End date
- `DESCRIPTION:` - Event description with embedded Icon and Category

Example event structure:
```
BEGIN:VEVENT
UID:event-0-1234567890@maybesomethingseasonal.com
DTSTAMP:20250101T000000Z
DTSTART:20250101T070000Z
DTEND:20250102T070000Z
SUMMARY:New Year's Day
DESCRIPTION:Celebration of the new year.\n\nIcon: 🎊\nCategory: celebration
CATEGORIES:celebration
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
```

After editing, commit and push the changes. The app will automatically parse and display the updated events.

## Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment workflow:

1. Builds the React application
2. Copies `public/MSS.ics` to `dist/`
3. Deploys to GitHub Pages

## Technologies Used

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **date-fns** - Date manipulation
- **Lucide React** - Icons
- **GitHub Pages** - Hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the beauty of seasonal changes and nature's cycles
- Built with modern web technologies for the best user experience
