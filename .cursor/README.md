# Cursor Web Agents

This directory contains Cursor Web agent configurations for the Maybe Something Seasonal project.

## Available Agents

The agents are defined in `agents.json` and can be used in Cursor Web:

### 📅 Calendar & ICS Manager
Specialized for managing calendar events, ICS file operations, and seasonal event data.

**Use when**: Working with calendar events, ICS files, adding/modifying events

### 🖼️ Image Management Specialist
Specialized for image assignment, generation, and linking to calendar events.

**Use when**: Assigning images, generating AI images, managing image mappings

### 💻 React Developer
Specialized for React/TypeScript development, UI improvements, and code maintenance.

**Use when**: Developing React components, improving UI, refactoring code

### ✅ Quality Assurance
Specialized for validation, testing, and ensuring code quality before deployment.

**Use when**: Running tests, validating code, checking deployment readiness

## Configuration

Agents are configured in `.cursor/agents.json` with:
- Name and description
- Detailed instructions for each agent
- Available tools
- Model preferences

## How to Use in Cursor Web

1. Open Cursor Web
2. Navigate to Agents section
3. Select the appropriate agent for your task
4. The agent will follow its specialized instructions

## Project Overview

**Maybe Something Seasonal** is a beautiful seasonal calendar celebrating nature's cycles and special moments throughout the year.

- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Source of Truth**: `public/MSS.ics` (ICS calendar file)
- **Deployment**: GitHub Pages (automatic on push to main)
- **Live Site**: https://danielmcshan.github.io/MaybeSomethingSeasonal/

## Quick Reference

### Essential Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run validate     # Validate ICS file
npm run smoke        # Run smoke tests
npm run test:local   # Full test suite
```

### Key Files
- `public/MSS.ics` - Calendar source file (edit directly)
- `src/App.tsx` - Main React component
- `scripts/` - Utility scripts for calendar/image management

### Workflow
1. Edit `public/MSS.ics` for calendar changes
2. Run `npm run validate` to check format
3. Run `npm run test:local` before pushing
4. Push to `main` for automatic deployment
