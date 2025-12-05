/**
 * Character Status App - Backend Server
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This server is designed to be template-ready. When creating a new character
 * app from this template:
 * 
 * 1. Edit /config/character.json to configure the character
 * 2. The server reads character names from config for defaults
 * 3. Data is stored with generic keys: "main" and "companion"
 * 
 * When adding NEW API ENDPOINTS, consider:
 * - Use generic terminology (main/companion) not character-specific names
 * - Check config for feature flags before exposing feature-specific endpoints
 * - Document any new endpoints in this file
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_DIR = path.join(__dirname, 'config');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure directories exist
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(CONFIG_DIR);

// File paths
const currentFilePath = path.join(DATA_DIR, 'current.json');
const snapshotsFilePath = path.join(DATA_DIR, 'snapshots.json');
const configFilePath = path.join(CONFIG_DIR, 'character.json');

/**
 * Load character configuration
 * Used for getting default names and feature flags
 */
const loadConfig = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      return fs.readJsonSync(configFilePath);
    }
  } catch (err) {
    console.warn('Could not load config file, using defaults');
  }
  
  // Default config if file doesn't exist
  return {
    mainCharacter: { name: 'Character' },
    companion: { enabled: false, name: 'Companion' }
  };
};

/**
 * Default character template
 * Used when initializing a new character
 * 
 * TEMPLATE NOTE: This structure should match what the frontend expects.
 * Add new fields here when adding features.
 */
const createDefaultCharacter = (name) => ({
  name: name,
  level: 1,
  class: '',
  classAdvancement: false,
  hp: { current: 100, max: 100 },
  mp: { current: 100, max: 100 },
  classHistory: [],
  levelSnapshots: {},
  freePoints: {
    strength: 0,
    agility: 0,
    constitution: 0,
    vitality: 0,
    intellect: 0,
    willpower: 0,
    mana: 0,
    wisdom: 0
  },
  statDerivations: [],
  traits: { current: 0, max: 3, items: [] },
  titles: [],
  bondSkills: [],
  activeSkills: [],
  passiveSkills: [],
  boundItems: [],
  statBoosts: []
});

/**
 * Initialize data files if they don't exist
 * Uses config for character names
 */
const initializeDataFiles = async () => {
  const config = loadConfig();
  
  if (!await fs.pathExists(currentFilePath)) {
    const initialData = {
      // TEMPLATE NOTE: Data uses generic keys "main" and "companion"
      // The actual names come from config and are stored in the character object
      main: createDefaultCharacter(config.mainCharacter?.name || 'Character'),
    };
    
    // Only add companion if enabled in config
    if (config.companion?.enabled) {
      initialData.companion = createDefaultCharacter(config.companion?.name || 'Companion');
    }
    
    await fs.writeJson(currentFilePath, initialData, { spaces: 2 });
  }
  
  if (!await fs.pathExists(snapshotsFilePath)) {
    await fs.writeJson(snapshotsFilePath, { snapshots: [] }, { spaces: 2 });
  }
};

// ============================================================================
// API Routes
// ============================================================================

/**
 * GET /api/config
 * Returns the character configuration
 * Used by frontend to adapt UI to character settings
 */
app.get('/api/config', async (req, res) => {
  try {
    const config = loadConfig();
    res.json(config);
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

/**
 * GET /api/current
 * Returns current character state
 * Response shape: { main: {...}, companion: {...} } (companion only if enabled)
 */
app.get('/api/current', async (req, res) => {
  try {
    const data = await fs.readJson(currentFilePath);
    res.json(data);
  } catch (error) {
    console.error('Error reading current data:', error);
    res.status(500).json({ error: 'Failed to load current data' });
  }
});

/**
 * POST /api/update
 * Updates current character state
 * Expects: { main: {...}, companion: {...} }
 */
app.post('/api/update', async (req, res) => {
  try {
    const data = req.body;
    await fs.writeJson(currentFilePath, data, { spaces: 2 });
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
});

/**
 * POST /api/save
 * Saves a new snapshot
 */
app.post('/api/save', async (req, res) => {
  try {
    const { name, data } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Snapshot name is required' });
    }

    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    const newSnapshot = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      data: data
    };

    snapshotsData.snapshots.unshift(newSnapshot);
    await fs.writeJson(snapshotsFilePath, snapshotsData, { spaces: 2 });

    res.json({ 
      success: true, 
      message: 'Snapshot saved successfully',
      snapshot: newSnapshot 
    });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

/**
 * GET /api/snapshots
 * Returns all snapshots (metadata only for list view)
 */
app.get('/api/snapshots', async (req, res) => {
  try {
    const snapshotsData = await fs.readJson(snapshotsFilePath);
    const config = loadConfig();
    
    // Return metadata with preview info
    // TEMPLATE NOTE: Preview uses generic "main" key
    const snapshotsList = snapshotsData.snapshots.map(snapshot => ({
      id: snapshot.id,
      name: snapshot.name,
      createdAt: snapshot.createdAt,
      preview: {
        mainLevel: snapshot.data?.main?.level || 0,
        mainClass: snapshot.data?.main?.class || '',
        companionLevel: snapshot.data?.companion?.level || 0
      }
    }));
    
    res.json(snapshotsList);
  } catch (error) {
    console.error('Error reading snapshots:', error);
    res.status(500).json({ error: 'Failed to load snapshots' });
  }
});

/**
 * GET /api/snapshot/:id
 * Returns a specific snapshot by ID
 */
app.get('/api/snapshot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    const snapshot = snapshotsData.snapshots.find(s => s.id === id);
    
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    res.json(snapshot);
  } catch (error) {
    console.error('Error reading snapshot:', error);
    res.status(500).json({ error: 'Failed to load snapshot' });
  }
});

/**
 * DELETE /api/snapshot/:id
 * Deletes a snapshot
 */
app.delete('/api/snapshot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    const index = snapshotsData.snapshots.findIndex(s => s.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    snapshotsData.snapshots.splice(index, 1);
    await fs.writeJson(snapshotsFilePath, snapshotsData, { spaces: 2 });
    
    res.json({ success: true, message: 'Snapshot deleted successfully' });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

/**
 * POST /api/snapshot/:id/load
 * Loads a snapshot into current state
 */
app.post('/api/snapshot/:id/load', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    const snapshot = snapshotsData.snapshots.find(s => s.id === id);
    
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    await fs.writeJson(currentFilePath, snapshot.data, { spaces: 2 });
    
    res.json({ 
      success: true, 
      message: 'Snapshot loaded successfully',
      data: snapshot.data
    });
  } catch (error) {
    console.error('Error loading snapshot:', error);
    res.status(500).json({ error: 'Failed to load snapshot' });
  }
});

/**
 * GET /api/snapshot/:id/export
 * Exports a snapshot as JSON file download
 */
app.get('/api/snapshot/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    const snapshot = snapshotsData.snapshots.find(s => s.id === id);
    
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    const filename = `${snapshot.name.replace(/[^a-z0-9]/gi, '_')}_${snapshot.id.slice(0, 8)}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(snapshot);
  } catch (error) {
    console.error('Error exporting snapshot:', error);
    res.status(500).json({ error: 'Failed to export snapshot' });
  }
});

/**
 * POST /api/import
 * Imports a snapshot from JSON
 */
app.post('/api/import', async (req, res) => {
  try {
    const importedSnapshot = req.body;
    
    if (!importedSnapshot.data) {
      return res.status(400).json({ error: 'Invalid snapshot format' });
    }

    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    const newSnapshot = {
      id: uuidv4(),
      name: importedSnapshot.name || `Imported ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      importedFrom: importedSnapshot.id || null,
      data: importedSnapshot.data
    };

    snapshotsData.snapshots.unshift(newSnapshot);
    await fs.writeJson(snapshotsFilePath, snapshotsData, { spaces: 2 });

    res.json({ 
      success: true, 
      message: 'Snapshot imported successfully',
      snapshot: newSnapshot 
    });
  } catch (error) {
    console.error('Error importing snapshot:', error);
    res.status(500).json({ error: 'Failed to import snapshot' });
  }
});

/**
 * POST /api/shutdown
 * Gracefully stops the server
 */
app.post('/api/shutdown', (req, res) => {
  console.log('Shutdown requested via API');
  res.json({ success: true, message: 'Server shutting down...' });
  
  // Give time for response to be sent, then exit
  setTimeout(() => {
    console.log('Goodbye!');
    process.exit(0);
  }, 500);
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Initialize and start server
initializeDataFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
    console.log(`Config directory: ${CONFIG_DIR}`);
  });
});
