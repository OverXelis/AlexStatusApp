import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as LoadIcon,
  Delete as DeleteIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useCharacter } from '../context/CharacterContext';
import { formatStatusScreen } from '../utils/formatter';

const API_BASE = '/api';

function SnapshotViewDialog({ open, onClose, snapshot }) {
  if (!snapshot) return null;

  const alexPreview = formatStatusScreen(snapshot.data?.alex);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {snapshot.name}
        <Typography variant="body2" color="text.secondary">
          Saved: {new Date(snapshot.createdAt).toLocaleString()}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          component="pre"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            bgcolor: 'rgba(0,0,0,0.3)',
            p: 2,
            borderRadius: 1,
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          {alexPreview}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function SaveHistory() {
  const { saveSnapshot, loadSnapshot, showNotification } = useCharacter();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [viewingSnapshot, setViewingSnapshot] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load snapshots
  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/snapshots`);
      setSnapshots(response.data);
    } catch (err) {
      console.error('Failed to load snapshots:', err);
      showNotification('error', 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Save new snapshot
  const handleSave = async () => {
    if (!snapshotName.trim()) {
      showNotification('warning', 'Please enter a name for the snapshot');
      return;
    }

    try {
      setSaving(true);
      await saveSnapshot(snapshotName.trim());
      setSnapshotName('');
      await fetchSnapshots();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  // Load snapshot
  const handleLoad = async (id) => {
    try {
      await loadSnapshot(id);
    } catch (err) {
      console.error('Failed to load:', err);
    }
  };

  // Delete snapshot
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/snapshot/${id}`);
      showNotification('success', 'Snapshot deleted');
      setConfirmDelete(null);
      await fetchSnapshots();
    } catch (err) {
      console.error('Failed to delete:', err);
      showNotification('error', 'Failed to delete snapshot');
    }
  };

  // View snapshot details
  const handleView = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/snapshot/${id}`);
      setViewingSnapshot(response.data);
    } catch (err) {
      console.error('Failed to load snapshot details:', err);
      showNotification('error', 'Failed to load snapshot');
    }
  };

  // Export snapshot
  const handleExport = async (id, name) => {
    try {
      const response = await axios.get(`${API_BASE}/snapshot/${id}`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Snapshot exported');
    } catch (err) {
      console.error('Failed to export:', err);
      showNotification('error', 'Failed to export snapshot');
    }
  };

  // Import snapshot
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await axios.post(`${API_BASE}/import`, data);
      showNotification('success', 'Snapshot imported');
      await fetchSnapshots();
    } catch (err) {
      console.error('Failed to import:', err);
      showNotification('error', 'Failed to import snapshot. Make sure the file is valid JSON.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Save New Snapshot */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Save Current State
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Snapshot Name"
            placeholder="e.g., Chapter 10 Status Screen"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            disabled={saving}
          />
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !snapshotName.trim()}
            sx={{ minWidth: 140, height: 56 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Paper>

      {/* Snapshot History */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ color: 'primary.main' }}>
            Saved Snapshots ({snapshots.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh list">
              <IconButton onClick={fetchSnapshots} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              component="label"
              startIcon={<ImportIcon />}
              size="small"
            >
              Import
              <input type="file" hidden accept=".json" onChange={handleImport} />
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : snapshots.length === 0 ? (
          <Alert severity="info">
            No snapshots saved yet. Save your first snapshot above!
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {snapshots.map((snapshot) => (
                  <TableRow key={snapshot.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{snapshot.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(snapshot.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={`Lvl ${snapshot.preview?.alexLevel || '?'}`}
                          size="small"
                          sx={{ bgcolor: 'primary.dark' }}
                        />
                        {snapshot.preview?.alexClass && (
                          <Chip
                            label={snapshot.preview.alexClass.split(' ')[0]}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleView(snapshot.id)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Load">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleLoad(snapshot.id)}
                        >
                          <LoadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export">
                        <IconButton
                          size="small"
                          onClick={() => handleExport(snapshot.id, snapshot.name)}
                        >
                          <ExportIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete(snapshot)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* View Snapshot Dialog */}
      <SnapshotViewDialog
        open={!!viewingSnapshot}
        onClose={() => setViewingSnapshot(null)}
        snapshot={viewingSnapshot}
      />

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Snapshot?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleDelete(confirmDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SaveHistory;

