# Alex Status Tracker

A litRPG character status tracking app for managing Alex's stats, skills, titles, and progression throughout the novel.

## Features

- **Multi-tab Interface**: Separate views for stats, abilities, titles, companion, output preview, and save history
- **Real-time Stat Syncing**: Alex and Valtherion's bonded stats automatically sync (Alex gets half Val's Mana, Val gets half Alex's Willpower)
- **Title Bonus Calculations**: Title stat bonuses automatically calculate and display in total stats
- **Advancement Tracking**: Mark skills/classes with advancement opportunities
- **Copy Status**: One-click copy of formatted status screen for pasting into Notion/story
- **Snapshot History**: Save named snapshots (e.g., "Chapter 10 Status Screen") and restore any previous state

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

## Project Structure

```
AlexStatusApp/
├── server.js           # Express backend API
├── package.json        # Server dependencies
├── data/               # JSON data storage
│   ├── current.json    # Current character state
│   └── snapshots.json  # Saved snapshots
├── client/             # React frontend
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── context/    # Character state management
│       ├── tabs/       # Tab components
│       └── utils/      # Formatters and calculators
└── old-reference/      # Original spreadsheet for reference
```

## Data Storage

All data is stored locally in the `data/` folder as JSON files. You can:
- Backup by copying the `data/` folder
- Transfer to another computer by copying the entire project
- Export individual snapshots from within the app

## Tabs

1. **Basic Stats**: Name, level, class, HP/MP, physical and magical stats
2. **Abilities**: Traits, bond skills, active skills, passive skills, bound items
3. **Titles**: Manage titles with stat bonuses, set primary title
4. **Valtherion**: Companion stats with synced values
5. **Output Preview**: Live preview with copy button for Notion
6. **Save History**: View, load, and manage saved snapshots

