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
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
  AutoAwesome as TraitIcon,
  Link as BondIcon,
  FlashOn as ActiveIcon,
  Shield as PassiveIcon,
  Inventory as ItemIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import { SKILL_RANKS, PASSIVE_TIERS, STAT_DISPLAY_NAMES } from '../utils/statCalculator';

// Trait Dialog
function TraitDialog({ open, onClose, trait, onSave }) {
  const [name, setName] = useState(trait?.name || '');

  React.useEffect(() => {
    if (open) setName(trait?.name || '');
  }, [open, trait]);

  const handleSave = () => {
    onSave({ name });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{trait ? 'Edit Trait' : 'Add New Trait'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Trait Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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

// Skill Dialog (for Active and Bond skills)
function SkillDialog({ open, onClose, skill, onSave, isBondSkill = false }) {
  const [name, setName] = useState(skill?.name || '');
  const [rank, setRank] = useState(skill?.rank || 'Novice');
  const [level, setLevel] = useState(skill?.level || 1);
  const [advancement, setAdvancement] = useState(skill?.advancement || false);
  const [primaryStatShared, setPrimaryStatShared] = useState(skill?.primaryStatShared || '');

  React.useEffect(() => {
    if (open) {
      setName(skill?.name || '');
      setRank(skill?.rank || 'Novice');
      setLevel(skill?.level || 1);
      setAdvancement(skill?.advancement || false);
      setPrimaryStatShared(skill?.primaryStatShared || '');
    }
  }, [open, skill]);

  const handleSave = () => {
    const skillData = { name, rank, level, advancement };
    if (isBondSkill) {
      skillData.primaryStatShared = primaryStatShared;
    }
    onSave(skillData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{skill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              label="Skill Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Rank</InputLabel>
              <Select value={rank} onChange={(e) => setRank(e.target.value)} label="Rank">
                {SKILL_RANKS.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              type="number"
              label="Level"
              fullWidth
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) || 1)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={advancement}
                  onChange={(e) => setAdvancement(e.target.checked)}
                  sx={{ color: 'warning.main', '&.Mui-checked': { color: 'warning.main' } }}
                />
              }
              label="Advancement Offered"
            />
          </Grid>
          {isBondSkill && (
            <Grid item xs={12}>
              <TextField
                label="Primary Stat Shared"
                fullWidth
                value={primaryStatShared}
                onChange={(e) => setPrimaryStatShared(e.target.value)}
                placeholder="e.g., Mana"
              />
            </Grid>
          )}
        </Grid>
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

// Passive Skill Dialog
function PassiveDialog({ open, onClose, skill, onSave }) {
  const [name, setName] = useState(skill?.name || '');
  const [tier, setTier] = useState(skill?.tier || 'I');

  React.useEffect(() => {
    if (open) {
      setName(skill?.name || '');
      setTier(skill?.tier || 'I');
    }
  }, [open, skill]);

  const handleSave = () => {
    onSave({ name, tier });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{skill ? 'Edit Passive Skill' : 'Add New Passive Skill'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={8}>
            <TextField
              autoFocus
              label="Skill Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select value={tier} onChange={(e) => setTier(e.target.value)} label="Tier">
                {PASSIVE_TIERS.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
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

// Bound Item Dialog
function ItemDialog({ open, onClose, item, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [rank, setRank] = useState(item?.rank || 'D');
  const [type, setType] = useState(item?.type || 'Growth Item');

  React.useEffect(() => {
    if (open) {
      setName(item?.name || '');
      setRank(item?.rank || 'D');
      setType(item?.type || 'Growth Item');
    }
  }, [open, item]);

  const handleSave = () => {
    onSave({ name, rank, type });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{item ? 'Edit Bound Item' : 'Add New Bound Item'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              label="Item Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Rank</InputLabel>
              <Select value={rank} onChange={(e) => setRank(e.target.value)} label="Rank">
                {['F', 'E', 'D', 'C', 'B', 'A', 'S', 'Unique'].map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={8}>
            <TextField
              label="Type"
              fullWidth
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., Growth Item, Growth Item (Unique)"
            />
          </Grid>
        </Grid>
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

function Abilities() {
  const { alex, updateAlex } = useCharacter();
  
  // Dialog states
  const [traitDialogOpen, setTraitDialogOpen] = useState(false);
  const [bondDialogOpen, setBondDialogOpen] = useState(false);
  const [activeDialogOpen, setActiveDialogOpen] = useState(false);
  const [passiveDialogOpen, setPassiveDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  
  // Editing states
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Generic handlers
  const handleAdd = (type, setDialogOpen) => {
    setEditingItem(null);
    setEditingIndex(-1);
    setDialogOpen(true);
  };

  const handleEdit = (item, index, setDialogOpen) => {
    setEditingItem(item);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleSave = (type, data, setDialogOpen) => {
    const fieldName = type;
    const items = [...(alex[fieldName] || [])];
    
    if (editingIndex >= 0) {
      items[editingIndex] = data;
    } else {
      items.push(data);
    }
    
    updateAlex({ [fieldName]: items });
    setDialogOpen(false);
  };

  const handleDelete = (type, index) => {
    const items = (alex[type] || []).filter((_, i) => i !== index);
    updateAlex({ [type]: items });
  };

  // Traits handlers
  const handleSaveTrait = (data) => {
    const traits = { ...alex.traits };
    const items = [...(traits.items || [])];
    
    if (editingIndex >= 0) {
      items[editingIndex] = data;
    } else {
      items.push(data);
    }
    
    traits.items = items;
    traits.current = items.length;
    updateAlex({ traits });
    setTraitDialogOpen(false);
  };

  const handleDeleteTrait = (index) => {
    const traits = { ...alex.traits };
    traits.items = (traits.items || []).filter((_, i) => i !== index);
    traits.current = traits.items.length;
    updateAlex({ traits });
  };

  const updateTraitMax = (value) => {
    updateAlex({
      traits: { ...alex.traits, max: Number(value) || 3 },
    });
  };

  if (!alex) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Traits Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TraitIcon sx={{ color: 'secondary.main' }} />
            <Typography variant="h6">
              Traits ({alex.traits?.current || 0}/{alex.traits?.max || 3})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="number"
              label="Max Traits"
              value={alex.traits?.max || 3}
              onChange={(e) => updateTraitMax(e.target.value)}
              size="small"
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleAdd('traits', setTraitDialogOpen)}
              size="small"
            >
              Add Trait
            </Button>
          </Box>
          {alex.traits?.items?.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {alex.traits.items.map((trait, index) => (
                <Chip
                  key={index}
                  label={`{${trait.name}}`}
                  onDelete={() => handleDeleteTrait(index)}
                  onClick={() => handleEdit(trait, index, setTraitDialogOpen)}
                  sx={{
                    bgcolor: 'rgba(107, 91, 149, 0.2)',
                    color: 'secondary.light',
                    fontSize: '1rem',
                    py: 2,
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">No traits yet</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Bond Skills Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BondIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">Bond Skills ({alex.bondSkills?.length || 0})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAdd('bondSkills', setBondDialogOpen)}
            size="small"
            sx={{ mb: 2 }}
          >
            Add Bond Skill
          </Button>
          {alex.bondSkills?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Rank</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Primary Stat</TableCell>
                    <TableCell>Adv.</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.bondSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>[{skill.name}]</TableCell>
                      <TableCell>{skill.rank}</TableCell>
                      <TableCell>{skill.level}</TableCell>
                      <TableCell>{skill.primaryStatShared || '-'}</TableCell>
                      <TableCell>
                        {skill.advancement && (
                          <Chip label="+" size="small" sx={{ bgcolor: 'warning.main', color: 'black' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(skill, index, setBondDialogOpen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('bondSkills', index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No bond skills yet</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Active Skills Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ActiveIcon sx={{ color: 'warning.main' }} />
            <Typography variant="h6">Active Skills ({alex.activeSkills?.length || 0})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAdd('activeSkills', setActiveDialogOpen)}
            size="small"
            sx={{ mb: 2 }}
          >
            Add Active Skill
          </Button>
          {alex.activeSkills?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Rank</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Adv.</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.activeSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>[{skill.name}]</TableCell>
                      <TableCell>{skill.rank}</TableCell>
                      <TableCell>{skill.level}</TableCell>
                      <TableCell>
                        {skill.advancement && (
                          <Chip label="+" size="small" sx={{ bgcolor: 'warning.main', color: 'black' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(skill, index, setActiveDialogOpen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('activeSkills', index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No active skills yet</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Passive Skills Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PassiveIcon sx={{ color: 'info.main' }} />
            <Typography variant="h6">Passive Skills ({alex.passiveSkills?.length || 0})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAdd('passiveSkills', setPassiveDialogOpen)}
            size="small"
            sx={{ mb: 2 }}
          >
            Add Passive Skill
          </Button>
          {alex.passiveSkills?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.passiveSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>[{skill.name}]</TableCell>
                      <TableCell>Tier {skill.tier}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(skill, index, setPassiveDialogOpen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('passiveSkills', index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No passive skills yet</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Bound Items Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ItemIcon sx={{ color: 'success.main' }} />
            <Typography variant="h6">Bound Items ({alex.boundItems?.length || 0})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAdd('boundItems', setItemDialogOpen)}
            size="small"
            sx={{ mb: 2 }}
          >
            Add Bound Item
          </Button>
          {alex.boundItems?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Rank</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.boundItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.rank}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(item, index, setItemDialogOpen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('boundItems', index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No bound items yet</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Dialogs */}
      <TraitDialog
        open={traitDialogOpen}
        onClose={() => setTraitDialogOpen(false)}
        trait={editingItem}
        onSave={handleSaveTrait}
      />
      <SkillDialog
        open={bondDialogOpen}
        onClose={() => setBondDialogOpen(false)}
        skill={editingItem}
        onSave={(data) => handleSave('bondSkills', data, setBondDialogOpen)}
        isBondSkill
      />
      <SkillDialog
        open={activeDialogOpen}
        onClose={() => setActiveDialogOpen(false)}
        skill={editingItem}
        onSave={(data) => handleSave('activeSkills', data, setActiveDialogOpen)}
      />
      <PassiveDialog
        open={passiveDialogOpen}
        onClose={() => setPassiveDialogOpen(false)}
        skill={editingItem}
        onSave={(data) => handleSave('passiveSkills', data, setPassiveDialogOpen)}
      />
      <ItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        item={editingItem}
        onSave={(data) => handleSave('boundItems', data, setItemDialogOpen)}
      />
    </Box>
  );
}

export default Abilities;

