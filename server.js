const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Initialize data files if they don't exist
const currentFilePath = path.join(DATA_DIR, 'current.json');
const snapshotsFilePath = path.join(DATA_DIR, 'snapshots.json');

const defaultCharacter = {
  name: '',
  level: 1,
  class: '',
  classAdvancement: false,
  hp: { current: 100, max: 100 },
  mp: { current: 100, max: 100 },
  baseStats: {
    strength: 10,
    agility: 10,
    constitution: 10,
    vitality: 10,
    intellect: 10,
    willpower: 10,
    mana: 10,
    wisdom: 10
  },
  traits: { current: 0, max: 3, items: [] },
  titles: [],
  bondSkills: [],
  activeSkills: [],
  passiveSkills: [],
  boundItems: []
};

const initializeDataFiles = async () => {
  if (!await fs.pathExists(currentFilePath)) {
    await fs.writeJson(currentFilePath, {
      alex: { ...defaultCharacter, name: 'Alex Moore' },
      valtherion: { ...defaultCharacter, name: 'Valtherion' }
    }, { spaces: 2 });
  }
  if (!await fs.pathExists(snapshotsFilePath)) {
    await fs.writeJson(snapshotsFilePath, { snapshots: [] }, { spaces: 2 });
  }
};

// API Routes

// Get current character state
app.get('/api/current', async (req, res) => {
  try {
    const data = await fs.readJson(currentFilePath);
    res.json(data);
  } catch (error) {
    console.error('Error reading current data:', error);
    res.status(500).json({ error: 'Failed to load current data' });
  }
});

// Update current character state
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

// Save a new snapshot
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

// Get all snapshots (metadata only for list view)
app.get('/api/snapshots', async (req, res) => {
  try {
    const snapshotsData = await fs.readJson(snapshotsFilePath);
    
    // Return metadata with preview info
    const snapshotsList = snapshotsData.snapshots.map(snapshot => ({
      id: snapshot.id,
      name: snapshot.name,
      createdAt: snapshot.createdAt,
      preview: {
        alexLevel: snapshot.data?.alex?.level || 0,
        alexClass: snapshot.data?.alex?.class || '',
        valLevel: snapshot.data?.valtherion?.level || 0
      }
    }));
    
    res.json(snapshotsList);
  } catch (error) {
    console.error('Error reading snapshots:', error);
    res.status(500).json({ error: 'Failed to load snapshots' });
  }
});

// Get a specific snapshot by ID
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

// Delete a snapshot
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

// Load a snapshot into current state
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

// Export snapshot as JSON file download
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

// Import a snapshot from JSON
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
  });
});

