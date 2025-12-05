# Character Status Tracker

A litRPG character status tracking app for managing character stats, skills, titles, and progression throughout your novel. **Template-ready** - can be copied and configured for different characters.

## Features

- **Multi-tab Interface**: Separate views for stats, abilities, titles, companion, output preview, and save history
- **Real-time Stat Syncing**: Bonded characters' stats automatically sync (configurable)
- **Title Bonus Calculations**: Title stat bonuses automatically calculate and display in total stats
- **Advancement Tracking**: Mark skills/classes with advancement opportunities
- **Copy Status**: One-click copy of formatted status screen for pasting into Notion/story
- **Snapshot History**: Save named snapshots (e.g., "Chapter 10 Status Screen") and restore any previous state
- **Template System**: Configure for any character via `config/character.json`

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install all dependencies (server + client)
npm run install-all
```

### Running the App

```bash
# Start both server and client
npm start
```

This will start:
- Backend server on http://localhost:3000
- React frontend on http://localhost:3001

Open your browser to **http://localhost:3001** to use the app.

### Alternative: Run Separately

```bash
# Terminal 1: Start the backend
npm run server

# Terminal 2: Start the frontend
cd client
npm start
```

## Creating an App for a New Character

This app is designed to be copied and customized for different characters. See [DEVELOPMENT.md](DEVELOPMENT.md) for full details.

**Quick steps:**
1. Copy the entire project folder
2. Edit `config/character.json` with your character's name and settings
3. Delete `data/current.json` and `data/snapshots.json` (will regenerate)
4. Run `npm run install-all` and `npm start`

## Project Structure

```
CharacterStatusApp/
├── server.js             # Express backend API
├── package.json          # Server dependencies
├── DEVELOPMENT.md        # Developer guide for template-aware coding
├── config/
│   └── character.json    # Character configuration (names, features, etc.)
├── data/                 # JSON data storage
│   ├── current.json      # Current character state
│   └── snapshots.json    # Saved snapshots
├── client/               # React frontend
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── config/       # Configuration loader
│       ├── context/      # Character state management
│       ├── tabs/         # Tab components
│       └── utils/        # Formatters and calculators
└── old-reference/        # Original spreadsheet for reference
```

## Configuration

Edit `config/character.json` to customize:

```json
{
  "mainCharacter": {
    "name": "Your Character Name"
  },
  "companion": {
    "enabled": true,        // Set false if no companion
    "name": "Companion Name"
  },
  "bond": {
    "enabled": true,        // Enable stat syncing between characters
    "syncRules": [...]      // Define which stats sync
  },
  "features": {
    "traits": true,         // Toggle features on/off
    "titles": true,
    ...
  }
}
```

## Data Storage

All data is stored locally in the `data/` folder as JSON files. You can:
- Backup by copying the `data/` folder
- Transfer to another computer by copying the entire project
- Export individual snapshots from within the app

## Tabs

1. **Basic Stats**: Name, level, class, HP/MP, physical and magical stats
2. **Skills**: Traits, bond skills, active skills, passive skills, bound items
3. **Titles**: Manage titles with stat bonuses, set primary title
4. **Companion**: Companion stats with synced values (if enabled)
5. **Output**: Live preview with copy button for Notion
6. **History**: View, load, and manage saved snapshots

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for guidelines on:
- Template-aware development practices
- Using generic vs character-specific names
- Adding new features
- Legacy code migration
