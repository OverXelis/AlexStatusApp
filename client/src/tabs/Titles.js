import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import { STAT_DISPLAY_NAMES } from '../utils/statCalculator';

const STAT_OPTIONS = Object.entries(STAT_DISPLAY_NAMES).map(([key, label]) => ({
  value: key,
  label,
}));

function TitleBonusEditor({ bonuses, onChange }) {
  const addBonus = () => {
    onChange([...bonuses, { stat: 'strength', value: 0 }]);
  };

  const updateBonus = (index, field, value) => {
    const newBonuses = [...bonuses];
    newBonuses[index] = { ...newBonuses[index], [field]: value };
    onChange(newBonuses);
  };

  const removeBonus = (index) => {
    onChange(bonuses.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        Stat Bonuses
      </Typography>
      {bonuses.map((bonus, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={bonus.stat}
              onChange={(e) => updateBonus(index, 'stat', e.target.value)}
            >
              {STAT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            label="Bonus"
            value={bonus.value}
            onChange={(e) => updateBonus(index, 'value', Number(e.target.value) || 0)}
            size="small"
            sx={{ width: 100 }}
            inputProps={{ min: 0 }}
          />
          <IconButton
            onClick={() => removeBonus(index)}
            size="small"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={addBonus}
        size="small"
        variant="outlined"
        sx={{ mt: 1 }}
      >
        Add Bonus
      </Button>
    </Box>
  );
}

function TitleDialog({ open, onClose, title, onSave }) {
  const [name, setName] = useState(title?.name || '');
  const [bonuses, setBonuses] = useState(title?.bonuses || []);

  React.useEffect(() => {
    if (open) {
      setName(title?.name || '');
      setBonuses(title?.bonuses || []);
    }
  }, [open, title]);

  const handleSave = () => {
    onSave({
      name,
      bonuses,
      isPrimary: title?.isPrimary || false,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title ? 'Edit Title' : 'Add New Title'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TitleBonusEditor bonuses={bonuses} onChange={setBonuses} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Titles() {
  const { alex, updateAlexTitles, alexTitleBonuses } = useCharacter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  const titles = alex?.titles || [];

  const handleAddTitle = () => {
    setEditingTitle(null);
    setEditingIndex(-1);
    setDialogOpen(true);
  };

  const handleEditTitle = (title, index) => {
    setEditingTitle(title);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleSaveTitle = (titleData) => {
    const newTitles = [...titles];
    if (editingIndex >= 0) {
      newTitles[editingIndex] = { ...newTitles[editingIndex], ...titleData };
    } else {
      newTitles.push(titleData);
    }
    updateAlexTitles(newTitles);
  };

  const handleDeleteTitle = (index) => {
    const newTitles = titles.filter((_, i) => i !== index);
    updateAlexTitles(newTitles);
  };

  const handleSetPrimary = (index) => {
    const newTitles = titles.map((t, i) => ({
      ...t,
      isPrimary: i === index,
    }));
    updateAlexTitles(newTitles);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newTitles = [...titles];
    [newTitles[index - 1], newTitles[index]] = [newTitles[index], newTitles[index - 1]];
    updateAlexTitles(newTitles);
  };

  const handleMoveDown = (index) => {
    if (index === titles.length - 1) return;
    const newTitles = [...titles];
    [newTitles[index], newTitles[index + 1]] = [newTitles[index + 1], newTitles[index]];
    updateAlexTitles(newTitles);
  };

  // Calculate total bonuses for display
  const totalBonusDisplay = Object.entries(alexTitleBonuses)
    .filter(([_, value]) => value > 0)
    .map(([stat, value]) => `${STAT_DISPLAY_NAMES[stat]}: +${value}`)
    .join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ color: 'primary.main' }}>
            Titles
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTitle}
          >
            Add Title
          </Button>
        </Box>
        
        {totalBonusDisplay && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'success.main', mb: 1 }}>
              Total Stat Bonuses from Titles:
            </Typography>
            <Typography variant="body1" sx={{ color: 'success.light' }}>
              {totalBonusDisplay}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Titles List */}
      <Paper sx={{ p: 3 }}>
        {titles.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
            No titles yet. Click "Add Title" to create one.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>Primary</TableCell>
                  <TableCell sx={{ width: 60 }}>Order</TableCell>
                  <TableCell>Title Name</TableCell>
                  <TableCell>Stat Bonuses</TableCell>
                  <TableCell sx={{ width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {titles.map((title, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      bgcolor: title.isPrimary ? 'rgba(201, 162, 39, 0.08)' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Radio
                        checked={title.isPrimary}
                        onChange={() => handleSetPrimary(index)}
                        sx={{
                          color: 'primary.main',
                          '&.Mui-checked': {
                            color: 'primary.main',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <UpIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === titles.length - 1}
                        >
                          <DownIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {title.isPrimary && (
                          <StarIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                        )}
                        <Typography
                          sx={{
                            fontWeight: title.isPrimary ? 600 : 400,
                            color: title.isPrimary ? 'primary.main' : 'text.primary',
                          }}
                        >
                          {title.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {title.bonuses && title.bonuses.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {title.bonuses.map((bonus, i) => (
                            <Chip
                              key={i}
                              label={`${STAT_DISPLAY_NAMES[bonus.stat]}: +${bonus.value}`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(76, 175, 80, 0.2)',
                                color: 'success.light',
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          No bonuses
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditTitle(title, index)}
                        size="small"
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteTitle(index)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Title Dialog */}
      <TitleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingTitle}
        onSave={handleSaveTitle}
      />
    </Box>
  );
}

export default Titles;

