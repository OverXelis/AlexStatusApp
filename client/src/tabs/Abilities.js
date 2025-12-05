/**
 * Abilities Tab Component (Skills, Traits, Items)
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This tab manages skills, traits, and bound items for the main character.
 * It currently uses LEGACY variable names (alex, updateAlex) via context aliases.
 * 
 * For NEW CODE, prefer using generic names:
 * - main instead of alex
 * - updateMain instead of updateAlex
 * 
 * See DEVELOPMENT.md for full guidelines on template-aware development.
 * ============================================================================
 */

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
  Tooltip,
  Snackbar,
  Alert,
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
  ContentCopy as CopyIcon,
  CardGiftcard as SkillOfferedIcon,
  TrendingUp as LevelUpIcon,
  Upgrade as AdvanceIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import { 
  SKILL_RANKS, 
  PASSIVE_TIERS, 
  STAT_DISPLAY_NAMES,
  TRAIT_EFFECT_TYPES,
  ALL_STATS,
} from '../utils/statCalculator';

// Trait Effect Editor Component
function TraitEffectEditor({ effects, onChange }) {
  const addEffect = () => {
    onChange([...effects, { type: 'stat_multiplier', stat: 'willpower', multiplier: 1 }]);
  };

  const updateEffect = (index, updates) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    onChange(newEffects);
  };

  const removeEffect = (index) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  const renderEffectFields = (effect, index) => {
    switch (effect.type) {
      case 'stat_multiplier':
        return (
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Stat</InputLabel>
              <Select
                value={effect.stat || 'willpower'}
                onChange={(e) => updateEffect(index, { stat: e.target.value })}
                label="Stat"
              >
                {ALL_STATS.map((stat) => (
                  <MenuItem key={stat} value={stat}>{STAT_DISPLAY_NAMES[stat]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="number"
              label="Multiplier"
              value={effect.multiplier || 1}
              onChange={(e) => updateEffect(index, { multiplier: Number(e.target.value) || 1 })}
              size="small"
              sx={{ width: 100 }}
              helperText="e.g., 3 = triple"
            />
          </>
        );
      case 'redirect_free_points':
        return (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Redirect To</InputLabel>
            <Select
              value={effect.toStat || 'willpower'}
              onChange={(e) => updateEffect(index, { toStat: e.target.value })}
              label="Redirect To"
            >
              {ALL_STATS.map((stat) => (
                <MenuItem key={stat} value={stat}>{STAT_DISPLAY_NAMES[stat]}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'stat_derivation':
        return (
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Source</InputLabel>
              <Select
                value={effect.sourceStat || 'willpower'}
                onChange={(e) => updateEffect(index, { sourceStat: e.target.value })}
                label="Source"
              >
                {ALL_STATS.map((stat) => (
                  <MenuItem key={stat} value={stat}>{STAT_DISPLAY_NAMES[stat]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="number"
              label="Percent"
              value={effect.percent || 0}
              onChange={(e) => updateEffect(index, { percent: Number(e.target.value) || 0 })}
              size="small"
              sx={{ width: 80 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Target</InputLabel>
              <Select
                value={effect.targetStat || 'intellect'}
                onChange={(e) => updateEffect(index, { targetStat: e.target.value })}
                label="Target"
              >
                {ALL_STATS.map((stat) => (
                  <MenuItem key={stat} value={stat}>{STAT_DISPLAY_NAMES[stat]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        Trait Effects
      </Typography>
      {effects.map((effect, index) => (
        <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Effect Type</InputLabel>
              <Select
                value={effect.type}
                onChange={(e) => updateEffect(index, { type: e.target.value })}
                label="Effect Type"
              >
                {TRAIT_EFFECT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {renderEffectFields(effect, index)}
            <IconButton onClick={() => removeEffect(index)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            size="small"
            label="Description (optional)"
            value={effect.description || ''}
            onChange={(e) => updateEffect(index, { description: e.target.value })}
            placeholder="e.g., All Willpower gains are tripled"
          />
        </Box>
      ))}
      <Button startIcon={<AddIcon />} onClick={addEffect} size="small" variant="outlined">
        Add Effect
      </Button>
    </Box>
  );
}

// Trait Dialog
function TraitDialog({ open, onClose, trait, onSave }) {
  const [name, setName] = useState(trait?.name || '');
  const [effects, setEffects] = useState(trait?.effects || []);

  React.useEffect(() => {
    if (open) {
      setName(trait?.name || '');
      setEffects(trait?.effects || []);
    }
  }, [open, trait]);

  const handleSave = () => {
    onSave({ name, effects });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <TraitEffectEditor effects={effects} onChange={setEffects} />
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

// System Prompt Dialog - for copying skill-related story prompts
function SystemPromptDialog({ open, onClose, type, skill, onCopySuccess }) {
  const getPromptContent = () => {
    if (!skill) return '';
    
    const skillName = skill.name;
    
    switch (type) {
      case 'offered':
        return `***



**New Skill Learned:** ${skillName} (Novice - Level 1)

**Do you accept? Yes/ No?**

***`;
      
      case 'levelup':
        return `***



**Congratulations, ${skillName} has leveled up!**

***`;
      
      case 'advancement':
        return `***



**Congratulations, ${skillName} has leveled up!**

You have reached the Tier threshold of an active skill. Would you like to advance or evolve this skill? 



Advance: This skill stays the same and advances to an improved version in the same tree.



Evolve: This skill changes based on the different ways you may have used it or pushed the bounds of its purpose. You will lose levels in this skill if you choose this option. 



Advance / Evolve?



***



---



***



Analyzing skill usage…

**New Skill Learned:** [insert skill name] ([insert rank])



 **[insert skill name] -** [skill description]



***`;
      
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'offered': return 'Skill Offered Prompt';
      case 'levelup': return 'Skill Level Up Prompt';
      case 'advancement': return 'Skill Advancement Prompt';
      default: return 'System Prompt';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPromptContent());
      onCopySuccess?.('Prompt copied to clipboard!');
      onClose();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: 'primary.main' }}>{getTitle()}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Copy this prompt for <strong>{skill?.name}</strong> and paste into Notion.
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: '"JetBrains Mono", "Courier New", monospace',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'text.primary',
            m: 0,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {getPromptContent()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          onClick={handleCopy} 
          variant="contained" 
          startIcon={<CopyIcon />}
          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
        >
          Copy to Clipboard
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
  const [description, setDescription] = useState(skill?.description || '');
  const [primaryStatShared, setPrimaryStatShared] = useState(skill?.primaryStatShared || '');

  React.useEffect(() => {
    if (open) {
      setName(skill?.name || '');
      setRank(skill?.rank || 'Novice');
      setLevel(skill?.level || 1);
      setAdvancement(skill?.advancement || false);
      setDescription(skill?.description || '');
      setPrimaryStatShared(skill?.primaryStatShared || '');
    }
  }, [open, skill]);

  const handleSave = () => {
    const skillData = { name, rank, level, advancement, description };
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
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this skill (shown on hover)"
              helperText="This description will appear when hovering over the skill"
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
  const [description, setDescription] = useState(skill?.description || '');

  React.useEffect(() => {
    if (open) {
      setName(skill?.name || '');
      setTier(skill?.tier || 'I');
      setDescription(skill?.description || '');
    }
  }, [open, skill]);

  const handleSave = () => {
    onSave({ name, tier, description });
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
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this skill (shown on hover)"
              helperText="This description will appear when hovering over the skill"
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
  const { alex, updateAlex, updateAlexTraits } = useCharacter();
  
  // Dialog states
  const [traitDialogOpen, setTraitDialogOpen] = useState(false);
  const [bondDialogOpen, setBondDialogOpen] = useState(false);
  const [activeDialogOpen, setActiveDialogOpen] = useState(false);
  const [passiveDialogOpen, setPassiveDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  
  // System prompt dialog state
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptType, setPromptType] = useState('offered');
  const [promptSkill, setPromptSkill] = useState(null);
  
  // Snackbar state for copy feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  
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

  // System prompt handlers
  const openPromptDialog = (skill, type) => {
    setPromptSkill(skill);
    setPromptType(type);
    setPromptDialogOpen(true);
  };

  const handleCopySuccess = (message) => {
    setSnackbar({ open: true, message });
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
    updateAlexTraits(traits);
    setTraitDialogOpen(false);
  };

  const handleDeleteTrait = (index) => {
    const traits = { ...alex.traits };
    traits.items = (traits.items || []).filter((_, i) => i !== index);
    traits.current = traits.items.length;
    updateAlexTraits(traits);
  };

  const updateTraitMax = (value) => {
    updateAlexTraits({
      ...alex.traits,
      max: Number(value) || 3,
    });
  };

  const getEffectSummary = (effect) => {
    switch (effect.type) {
      case 'stat_multiplier':
        return `${STAT_DISPLAY_NAMES[effect.stat]} ×${effect.multiplier}`;
      case 'redirect_free_points':
        return `Free pts → ${STAT_DISPLAY_NAMES[effect.toStat]}`;
      case 'stat_derivation':
        return `${effect.percent}% ${STAT_DISPLAY_NAMES[effect.sourceStat]} → ${STAT_DISPLAY_NAMES[effect.targetStat]}`;
      default:
        return effect.description || 'Unknown effect';
    }
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alex.traits.items.map((trait, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(107, 91, 149, 0.15)',
                    border: '1px solid',
                    borderColor: 'secondary.dark',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ color: 'secondary.light', mb: 1 }}
                      >
                        {`{${trait.name}}`}
                      </Typography>
                      {trait.effects && trait.effects.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {trait.effects.map((effect, i) => (
                            <Chip
                              key={i}
                              label={getEffectSummary(effect)}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(201, 162, 39, 0.2)',
                                color: 'primary.light',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(trait, index, setTraitDialogOpen)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTrait(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
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
                    <TableCell>Actions</TableCell>
                    <TableCell>Prompts</TableCell>
                    <TableCell>Adv.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.bondSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {skill.description ? (
                          <Tooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  [{skill.name}]
                                </Typography>
                                <Typography variant="body2">{skill.description}</Typography>
                              </Box>
                            }
                            arrow
                            placement="right"
                          >
                            <span style={{ cursor: 'help' }}>[{skill.name}]</span>
                          </Tooltip>
                        ) : (
                          <span>[{skill.name}]</span>
                        )}
                      </TableCell>
                      <TableCell>{skill.rank}</TableCell>
                      <TableCell>{skill.level}</TableCell>
                      <TableCell>{skill.primaryStatShared || '-'}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(skill, index, setBondDialogOpen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('bondSkills', index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Skill Offered Prompt">
                            <IconButton 
                              size="small" 
                              onClick={() => openPromptDialog(skill, 'offered')}
                              sx={{ color: 'success.main' }}
                            >
                              <SkillOfferedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Skill Level Up Prompt">
                            <IconButton 
                              size="small" 
                              onClick={() => openPromptDialog(skill, 'levelup')}
                              sx={{ color: 'info.main' }}
                            >
                              <LevelUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Advancement Offered Prompt">
                            <IconButton 
                              size="small" 
                              onClick={() => openPromptDialog(skill, 'advancement')}
                              sx={{ color: 'warning.main' }}
                            >
                              <AdvanceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {skill.advancement && (
                          <Chip label="+" size="small" sx={{ bgcolor: 'warning.main', color: 'black' }} />
                        )}
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
                    <TableCell>Actions</TableCell>
                    <TableCell>Prompts</TableCell>
                    <TableCell>Adv.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.activeSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {skill.description ? (
                          <Tooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  [{skill.name}]
                                </Typography>
                                <Typography variant="body2">{skill.description}</Typography>
                              </Box>
                            }
                            arrow
                            placement="right"
                          >
                            <span style={{ cursor: 'help' }}>[{skill.name}]</span>
                          </Tooltip>
                        ) : (
                          <span>[{skill.name}]</span>
                        )}
                      </TableCell>
                      <TableCell>{skill.rank}</TableCell>
                      <TableCell>{skill.level}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(skill, index, setActiveDialogOpen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('activeSkills', index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Skill Offered Prompt">
                            <IconButton 
                              size="small" 
                              onClick={() => openPromptDialog(skill, 'offered')}
                              sx={{ color: 'success.main' }}
                            >
                              <SkillOfferedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Skill Level Up Prompt">
                            <IconButton 
                              size="small" 
                              onClick={() => openPromptDialog(skill, 'levelup')}
                              sx={{ color: 'info.main' }}
                            >
                              <LevelUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Advancement Offered Prompt">
                            <IconButton 
                              size="small" 
                              onClick={() => openPromptDialog(skill, 'advancement')}
                              sx={{ color: 'warning.main' }}
                            >
                              <AdvanceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {skill.advancement && (
                          <Chip label="+" size="small" sx={{ bgcolor: 'warning.main', color: 'black' }} />
                        )}
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
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.passiveSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {skill.description ? (
                          <Tooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  [{skill.name}]
                                </Typography>
                                <Typography variant="body2">{skill.description}</Typography>
                              </Box>
                            }
                            arrow
                            placement="right"
                          >
                            <span style={{ cursor: 'help' }}>[{skill.name}]</span>
                          </Tooltip>
                        ) : (
                          <span>[{skill.name}]</span>
                        )}
                      </TableCell>
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
      
      {/* System Prompt Dialog */}
      <SystemPromptDialog
        open={promptDialogOpen}
        onClose={() => setPromptDialogOpen(false)}
        type={promptType}
        skill={promptSkill}
        onCopySuccess={handleCopySuccess}
      />
      
      {/* Copy Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Abilities;
