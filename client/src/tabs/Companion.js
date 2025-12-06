/**
 * Companion Tab Component
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This tab displays the bonded companion's stats and abilities. It uses GENERIC
 * variable names (companion) internally, with display names from config.
 * 
 * This tab is only shown when config.companion.enabled = true.
 * 
 * When adding NEW FEATURES for companions:
 * - Use updateCompanion() for state changes
 * - Use getCompanionName() for display labels
 * - Consider if the feature should also exist for the main character
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
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
  Alert,
  Chip,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Popper,
  Fade,
  Divider,
  Snackbar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  Link as BondIcon,
  Info as InfoIcon,
  Pets as EvolutionIcon,
  LocalHospital as HpIcon,
  Science as MpIcon,
  CameraAlt as SnapshotIcon,
  FitnessCenter as BoostIcon,
  FlashOn as ActiveIcon,
  Shield as PassiveIcon,
  ContentCopy as CopyIcon,
  CardGiftcard as SkillOfferedIcon,
  TrendingUp as LevelUpIcon,
  Upgrade as AdvanceIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import {
  PHYSICAL_STATS,
  MAGICAL_STATS,
  STAT_DISPLAY_NAMES,
  ALL_STATS,
  SKILL_RANKS,
  PASSIVE_TIERS,
  getTitleAdditiveBonuses,
  getTitleMultiplierBonuses,
  getStatBoostAdditiveBonuses,
  getStatBoostMultiplierBonuses,
  getSnapshotStatValue,
} from '../utils/statCalculator';
import { STAT_ICONS } from '../utils/statIcons';

// Stat display with breakdown tooltip and icon (no free points for beasts)
function StatDisplay({ statName, finalValue, breakdown, syncedValue, syncedFrom }) {
  const hasSynced = syncedValue !== undefined && syncedValue > 0;
  const totalWithSync = finalValue + (hasSynced ? syncedValue : 0);
  
  // Get the icon component for this stat
  const IconComponent = STAT_ICONS[statName];
  
  const breakdownLines = [];
  if (breakdown) {
    if (breakdown.snapshotLevel !== null) {
      breakdownLines.push(`Base (Lvl ${breakdown.snapshotLevel}): ${breakdown.snapshotBase}`);
    }
    if (breakdown.classScaling > 0) {
      breakdownLines.push(`Evolution: +${breakdown.classScaling}`);
      if (breakdown.classScalingDetail) {
        breakdownLines.push(`  (${breakdown.classScalingDetail})`);
      }
    }
    if (breakdown.traitMultiplier && breakdown.traitMultiplier !== 1) {
      breakdownLines.push(`Trait Mult: ×${breakdown.traitMultiplier}`);
    }
    if (breakdown.titleAdditive > 0) {
      breakdownLines.push(`Title Bonus: +${breakdown.titleAdditive}`);
    }
    if (breakdown.statBoostAdditive > 0) {
      breakdownLines.push(`Stat Boost: +${breakdown.statBoostAdditive}`);
    }
    if (breakdown.titleMultiplier > 0 || breakdown.statBoostMultiplier > 0) {
      const totalMult = (breakdown.titleMultiplier || 0) + (breakdown.statBoostMultiplier || 0);
      breakdownLines.push(`Multiplier: ×${(1 + totalMult).toFixed(2)}`);
    }
    if (hasSynced) {
      breakdownLines.push(`Bond (${syncedFrom}): +${syncedValue}`);
    }
    breakdownLines.push(`──────────`);
    breakdownLines.push(`Final: ${totalWithSync}`);
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {IconComponent && (
          <IconComponent sx={{ color: 'text.secondary', fontSize: 20 }} />
        )}
        <Typography sx={{ width: 100, fontWeight: 600 }}>
          {STAT_DISPLAY_NAMES[statName]}:
        </Typography>
        <Tooltip 
          title={<pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px' }}>{breakdownLines.join('\n')}</pre>}
          arrow
          placement="right"
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'secondary.main',
              cursor: 'help',
              minWidth: 80,
            }}
          >
            {totalWithSync}
          </Typography>
        </Tooltip>
      </Box>
      {hasSynced && (
        <Typography variant="caption" sx={{ color: 'success.light', ml: IconComponent ? 5.5 : 13 }}>
          Includes +{syncedValue} from {syncedFrom}
        </Typography>
      )}
    </Box>
  );
}

// Evolution Dialog (similar to Class Dialog but for beasts)
function EvolutionDialog({ open, onClose, evolutionData, onSave, isEdit }) {
  const [name, setName] = useState(evolutionData?.name || '');
  const [startLevel, setStartLevel] = useState(evolutionData?.startLevel || 1);
  const [endLevel, setEndLevel] = useState(evolutionData?.endLevel || '');
  const [statsPerLevel, setStatsPerLevel] = useState(evolutionData?.statsPerLevel || {});

  React.useEffect(() => {
    if (open) {
      setName(evolutionData?.name || '');
      setStartLevel(evolutionData?.startLevel || 1);
      setEndLevel(evolutionData?.endLevel || '');
      setStatsPerLevel(evolutionData?.statsPerLevel || {});
    }
  }, [open, evolutionData]);

  const handleSave = () => {
    onSave({
      name,
      startLevel: Number(startLevel),
      endLevel: endLevel === '' ? null : Number(endLevel),
      statsPerLevel,
    });
    onClose();
  };

  const updateStatPerLevel = (stat, value) => {
    setStatsPerLevel(prev => ({
      ...prev,
      [stat]: Number(value) || 0,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Evolution' : 'Add Evolution'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Evolution Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Celestial Familiar (Tier 2)"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Start Level"
              value={startLevel}
              onChange={(e) => setStartLevel(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="End Level (empty = current)"
              value={endLevel}
              onChange={(e) => setEndLevel(e.target.value)}
              placeholder="Leave empty for current evolution"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2, mt: 1 }}>
              Stats Gained Per Level:
            </Typography>
            <Grid container spacing={2}>
              {ALL_STATS.map(stat => (
                <Grid item xs={6} sm={3} key={stat}>
                  <TextField
                    fullWidth
                    type="number"
                    label={STAT_DISPLAY_NAMES[stat]}
                    value={statsPerLevel[stat] || 0}
                    onChange={(e) => updateStatPerLevel(stat, e.target.value)}
                    size="small"
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
              ))}
            </Grid>
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

// Snapshot Dialog for Companion
function SnapshotDialog({ open, onClose, level, currentSnapshot, onSave }) {
  const [snapshotLevel, setSnapshotLevel] = useState(level || 1);
  const [stats, setStats] = useState({});

  React.useEffect(() => {
    if (open) {
      setSnapshotLevel(level || 1);
      // Handle both old and new snapshot formats
      const initialStats = {};
      ALL_STATS.forEach(stat => {
        initialStats[stat] = getSnapshotStatValue(currentSnapshot, stat);
      });
      setStats(initialStats);
    }
  }, [open, level, currentSnapshot]);

  const handleSave = () => {
    onSave(snapshotLevel, stats);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create/Edit Level Snapshot</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          type="number"
          label="Snapshot Level"
          value={snapshotLevel}
          onChange={(e) => setSnapshotLevel(Number(e.target.value) || 1)}
          sx={{ mb: 3, mt: 1 }}
        />
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Base Stats at Level {snapshotLevel}:
        </Typography>
        <Grid container spacing={2}>
          {ALL_STATS.map(stat => (
            <Grid item xs={6} sm={3} key={stat}>
              <TextField
                fullWidth
                type="number"
                label={STAT_DISPLAY_NAMES[stat]}
                value={stats[stat] || 0}
                onChange={(e) => setStats(prev => ({ ...prev, [stat]: Number(e.target.value) || 0 }))}
                size="small"
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Snapshot
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Skill Hover Panel Component for Companion
function CompanionSkillHoverPanel({ anchorEl, skill, isPassive = false }) {
  const open = Boolean(anchorEl) && Boolean(skill);
  
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="right-start"
      transition
      sx={{ zIndex: 1300 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Paper
            elevation={8}
            sx={{
              ml: 2,
              minWidth: 280,
              maxWidth: 400,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: isPassive ? 'info.dark' : 'warning.dark',
              borderRadius: 2,
              overflow: 'hidden',
              animation: 'slideIn 0.2s ease-out',
              '@keyframes slideIn': {
                '0%': { opacity: 0, transform: 'translateX(-10px)' },
                '100%': { opacity: 1, transform: 'translateX(0)' },
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: isPassive ? 'rgba(41, 121, 255, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: isPassive ? 'info.light' : 'warning.light',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                [{skill?.name}]
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
              >
                {isPassive ? `Passive Skill • Tier ${skill?.tier}` : `${skill?.rank} • Level ${skill?.level}`}
              </Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.5 }}>
              {skill?.description ? (
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {skill.description}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  No description available.
                </Typography>
              )}
            </Box>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
}

// Skill Name Cell with Hover for Companion
function CompanionSkillNameCell({ skill, isPassive = false }) {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Box
      component="span"
      onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
      onMouseLeave={() => setAnchorEl(null)}
      sx={{
        display: 'inline-block',
        cursor: 'default',
        py: 0.5,
        px: 0.5,
        mx: -0.5,
        borderRadius: 0.5,
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' },
        borderBottom: skill.description ? '1px dotted rgba(255, 152, 0, 0.5)' : 'none',
      }}
    >
      [{skill.name}]
      <CompanionSkillHoverPanel anchorEl={anchorEl} skill={skill} isPassive={isPassive} />
    </Box>
  );
}

// Helper to get next tier
const getNextTier = (currentTier) => {
  const tiers = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex >= tiers.length - 1) return currentTier;
  return tiers[currentIndex + 1];
};

// System Prompt Dialog for Companion Skills
function CompanionSystemPromptDialog({ open, onClose, type, skill, onCopySuccess }) {
  const getPromptContent = () => {
    if (!skill) return '';
    const skillName = skill.name;
    const skillTier = skill.tier || 'I';
    const nextTier = getNextTier(skillTier);
    
    switch (type) {
      case 'offered':
        return `***\n\n**New Skill Learned:** ${skillName} (Novice - Level 1)\n\n**Do you accept? Yes/ No?**\n\n***`;
      case 'levelup':
        return `***\n\n**Congratulations, ${skillName} has leveled up!**\n\n***`;
      case 'advancement':
        return `***\n\n**Congratulations, ${skillName} has leveled up!**\n\nYou have reached the Tier threshold of an active skill. Would you like to advance or evolve this skill?\n\nAdvance: This skill stays the same and advances to an improved version in the same tree.\n\nEvolve: This skill changes based on the different ways you may have used it or pushed the bounds of its purpose. You will lose levels in this skill if you choose this option.\n\nAdvance / Evolve?\n\n***\n\n---\n\n***\n\nAnalyzing skill usage…\n\n**New Skill Learned:** [insert skill name] ([insert rank])\n\n**[insert skill name] -** [skill description]\n\n***`;
      case 'passive_offered':
        return `***\n\n**New Skill Learned:** ${skillName} (Tier I)\n\n**Do you accept? Yes/ No?**\n\n***`;
      case 'passive_levelup':
        return `***\n\n**Congratulations, ${skillName} (Tier ${skillTier}) has advanced to (Tier ${nextTier})!**\n\n***`;
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'offered': return 'Skill Offered Prompt';
      case 'levelup': return 'Skill Level Up Prompt';
      case 'advancement': return 'Skill Advancement Prompt';
      case 'passive_offered': return 'Passive Skill Offered Prompt';
      case 'passive_levelup': return 'Passive Tier Advance Prompt';
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
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 2, borderRadius: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {getPromptContent()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleCopy} variant="contained" color="success" startIcon={<CopyIcon />}>
          Copy to Clipboard
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Active Skill Dialog for Companion
function CompanionActiveSkillDialog({ open, onClose, skill, onSave }) {
  const [name, setName] = useState(skill?.name || '');
  const [rank, setRank] = useState(skill?.rank || 'Novice');
  const [level, setLevel] = useState(skill?.level || 1);
  const [advancement, setAdvancement] = useState(skill?.advancement || false);
  const [description, setDescription] = useState(skill?.description || '');
  const [isOld, setIsOld] = useState(skill?.isOld || false);

  React.useEffect(() => {
    if (open) {
      setName(skill?.name || '');
      setRank(skill?.rank || 'Novice');
      setLevel(skill?.level || 1);
      setAdvancement(skill?.advancement || false);
      setDescription(skill?.description || '');
      setIsOld(skill?.isOld || false);
    }
  }, [open, skill]);

  const handleSave = () => {
    onSave({ name, rank, level, advancement, description, isOld });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{skill ? 'Edit Active Skill' : 'Add Active Skill'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField autoFocus label="Skill Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Proficiency</InputLabel>
              <Select value={rank} onChange={(e) => setRank(e.target.value)} label="Proficiency">
                {SKILL_RANKS.map((r) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField type="number" label="Level" fullWidth value={level} onChange={(e) => setLevel(Number(e.target.value) || 1)} inputProps={{ min: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter a description (shown on hover)" helperText="This description will appear when hovering over the skill" />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel control={<Checkbox checked={advancement} onChange={(e) => setAdvancement(e.target.checked)} sx={{ color: 'warning.main', '&.Mui-checked': { color: 'warning.main' } }} />} label="Advancement Offered" />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel control={<Checkbox checked={isOld} onChange={(e) => setIsOld(e.target.checked)} sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'text.secondary' } }} />} label="Old Skill (Archive)" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

// Passive Skill Dialog for Companion
function CompanionPassiveSkillDialog({ open, onClose, skill, onSave }) {
  const [name, setName] = useState(skill?.name || '');
  const [tier, setTier] = useState(skill?.tier || 'I');
  const [description, setDescription] = useState(skill?.description || '');
  const [isOld, setIsOld] = useState(skill?.isOld || false);

  React.useEffect(() => {
    if (open) {
      setName(skill?.name || '');
      setTier(skill?.tier || 'I');
      setDescription(skill?.description || '');
      setIsOld(skill?.isOld || false);
    }
  }, [open, skill]);

  const handleSave = () => {
    onSave({ name, tier, description, isOld });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{skill ? 'Edit Passive Skill' : 'Add Passive Skill'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={8}>
            <TextField autoFocus label="Skill Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select value={tier} onChange={(e) => setTier(e.target.value)} label="Tier">
                {PASSIVE_TIERS.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter a description (shown on hover)" helperText="This description will appear when hovering over the skill" />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox checked={isOld} onChange={(e) => setIsOld(e.target.checked)} sx={{ color: 'text.secondary', '&.Mui-checked': { color: 'text.secondary' } }} />} label="Old Skill (Archive)" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

// Stat Boost Dialog for body tempering, fruits, etc.
function StatBoostDialog({ open, onClose, boost, onSave }) {
  const [description, setDescription] = useState(boost?.description || '');
  const [stat, setStat] = useState(boost?.stat || 'strength');
  const [additive, setAdditive] = useState(boost?.additive || 0);
  const [multiplier, setMultiplier] = useState(boost?.multiplier || 0);

  React.useEffect(() => {
    if (open) {
      setDescription(boost?.description || '');
      setStat(boost?.stat || 'strength');
      setAdditive(boost?.additive || 0);
      setMultiplier(boost?.multiplier || 0);
    }
  }, [open, boost]);

  const handleSave = () => {
    onSave({
      description,
      stat,
      additive: Number(additive) || 0,
      multiplier: Number(multiplier) || 0,
      enabled: boost?.enabled !== false,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{boost ? 'Edit Stat Boost' : 'Add Stat Boost'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Description (how was this gained?)"
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Body Tempering Stage 1, Ate Fire Lotus Fruit, etc."
          sx={{ mb: 2 }}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Stat</InputLabel>
              <Select
                value={stat}
                onChange={(e) => setStat(e.target.value)}
                label="Stat"
              >
                {ALL_STATS.map((s) => (
                  <MenuItem key={s} value={s}>{STAT_DISPLAY_NAMES[s]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Tooltip title="Flat bonus added to stat" arrow>
              <TextField
                type="number"
                label="Additive (+)"
                fullWidth
                size="small"
                value={additive}
                onChange={(e) => setAdditive(e.target.value)}
                inputProps={{ step: 1 }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Tooltip title="Multiplier bonus (0.1 = +10%)" arrow>
              <TextField
                type="number"
                label="Multiplier (×)"
                fullWidth
                size="small"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Get current evolution based on level
function getCurrentEvolution(classHistory, level) {
  if (!classHistory || classHistory.length === 0) return null;
  
  for (const evo of classHistory) {
    const start = evo.startLevel || 0;
    const end = evo.endLevel || Infinity;
    if (level >= start && level <= end) {
      return evo;
    }
  }
  
  return classHistory[classHistory.length - 1];
}

function Companion() {
  // Use GENERIC context values (preferred) with LEGACY aliases for backwards compatibility
  const {
    // Generic names (preferred)
    companion,
    main,
    updateCompanion,
    companionFinalStats,
    companionStatBreakdowns,
    companionDerivedStats,
    syncedWillpowerForCompanion,
    syncedManaForMain,
    mainFinalStats,
    getMainName,
    getCompanionName,
    hasBond,
  } = useCharacter();

  const [evolutionDialogOpen, setEvolutionDialogOpen] = useState(false);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [activeSkillDialogOpen, setActiveSkillDialogOpen] = useState(false);
  const [passiveSkillDialogOpen, setPassiveSkillDialogOpen] = useState(false);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [editingEvolution, setEditingEvolution] = useState(null);
  const [editingEvolutionIndex, setEditingEvolutionIndex] = useState(-1);
  const [editingSnapshotLevel, setEditingSnapshotLevel] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingSkillIndex, setEditingSkillIndex] = useState(-1);
  const [editingBoost, setEditingBoost] = useState(null);
  const [editingBoostIndex, setEditingBoostIndex] = useState(-1);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptType, setPromptType] = useState('');
  const [promptSkill, setPromptSkill] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Get display names from config
  const mainName = main?.name || getMainName();
  const companionDisplayName = companion?.name || getCompanionName();

  if (!companion) {
    return <Typography>Loading...</Typography>;
  }

  // Get current evolution
  const currentEvolution = getCurrentEvolution(companion.classHistory, companion.level);

  // Evolution handlers
  const handleAddEvolution = () => {
    setEditingEvolution(null);
    setEditingEvolutionIndex(-1);
    setEvolutionDialogOpen(true);
  };

  const handleEditEvolution = (evo, index) => {
    setEditingEvolution(evo);
    setEditingEvolutionIndex(index);
    setEvolutionDialogOpen(true);
  };

  const handleSaveEvolution = (evolutionData) => {
    const history = [...(companion.classHistory || [])];
    if (editingEvolutionIndex >= 0) {
      history[editingEvolutionIndex] = evolutionData;
    } else {
      history.push(evolutionData);
    }
    history.sort((a, b) => a.startLevel - b.startLevel);
    updateCompanion({ classHistory: history });
    setEvolutionDialogOpen(false);
  };

  const handleDeleteEvolution = (index) => {
    const history = (companion.classHistory || []).filter((_, i) => i !== index);
    updateCompanion({ classHistory: history });
  };

  // Snapshot handlers
  const handleAddSnapshot = () => {
    setEditingSnapshotLevel(null);
    setSnapshotDialogOpen(true);
  };

  const handleEditSnapshot = (level) => {
    setEditingSnapshotLevel(level);
    setSnapshotDialogOpen(true);
  };

  const handleSaveSnapshot = (level, stats) => {
    const snapshots = { ...(companion.levelSnapshots || {}) };
    snapshots[level] = stats;
    updateCompanion({ levelSnapshots: snapshots });
    setSnapshotDialogOpen(false);
  };

  const handleDeleteSnapshot = (level) => {
    const snapshots = { ...(companion.levelSnapshots || {}) };
    delete snapshots[level];
    updateCompanion({ levelSnapshots: snapshots });
  };

  // Take a snapshot of current TOTAL stats at current level (includes all bonuses)
  const handleTakeSnapshot = () => {
    const snapshots = { ...(companion.levelSnapshots || {}) };
    
    // Get current title bonuses (raw values)
    const rawTitleBonuses = getTitleAdditiveBonuses(companion.titles);
    const titleMultiplierBonuses = getTitleMultiplierBonuses(companion.titles);
    
    // Get current stat boost bonuses
    const statBoostAdditiveBonuses = getStatBoostAdditiveBonuses(companion.statBoosts);
    const statBoostMultiplierBonuses = getStatBoostMultiplierBonuses(companion.statBoosts);
    
    // Get trait multipliers and derivation bonuses for each stat
    const traitMultipliers = {};
    const includedTitleBonuses = {};
    const includedDerivationBonuses = {};
    ALL_STATS.forEach(stat => {
      const traitMult = companionStatBreakdowns[stat]?.traitMultiplier || 1;
      traitMultipliers[stat] = traitMult;
      includedTitleBonuses[stat] = (rawTitleBonuses[stat] || 0) * traitMult;
      includedDerivationBonuses[stat] = companionStatBreakdowns[stat]?.derivationBonus || 0;
    });
    
    // Store the full snapshot with tracking of what's included
    snapshots[companion.level] = {
      stats: { ...companionFinalStats },
      rawTitleBonuses: { ...rawTitleBonuses },
      includedTraitMultipliers: traitMultipliers,
      includedTitleBonuses: includedTitleBonuses,
      includedTitleMultipliers: { ...titleMultiplierBonuses },
      includedStatBoostBonuses: { ...statBoostAdditiveBonuses },
      includedStatBoostMultipliers: { ...statBoostMultiplierBonuses },
      includedDerivationBonuses: includedDerivationBonuses,
    };
    
    updateCompanion({ levelSnapshots: snapshots });
  };

  // Active skill handlers
  const handleAddActiveSkill = () => {
    setEditingSkill(null);
    setEditingSkillIndex(-1);
    setActiveSkillDialogOpen(true);
  };

  const handleEditActiveSkill = (skill, index) => {
    setEditingSkill(skill);
    setEditingSkillIndex(index);
    setActiveSkillDialogOpen(true);
  };

  const handleSaveActiveSkill = (data) => {
    const skills = [...(companion.activeSkills || [])];
    if (editingSkillIndex >= 0) {
      skills[editingSkillIndex] = data;
    } else {
      skills.push(data);
    }
    updateCompanion({ activeSkills: skills });
    setActiveSkillDialogOpen(false);
  };

  const handleDeleteActiveSkill = (index) => {
    const skills = (companion.activeSkills || []).filter((_, i) => i !== index);
    updateCompanion({ activeSkills: skills });
  };

  // Passive skill handlers
  const handleAddPassiveSkill = () => {
    setEditingSkill(null);
    setEditingSkillIndex(-1);
    setPassiveSkillDialogOpen(true);
  };

  const handleEditPassiveSkill = (skill, index) => {
    setEditingSkill(skill);
    setEditingSkillIndex(index);
    setPassiveSkillDialogOpen(true);
  };

  const handleSavePassiveSkill = (data) => {
    const skills = [...(companion.passiveSkills || [])];
    if (editingSkillIndex >= 0) {
      skills[editingSkillIndex] = data;
    } else {
      skills.push(data);
    }
    updateCompanion({ passiveSkills: skills });
    setPassiveSkillDialogOpen(false);
  };

  const handleDeletePassiveSkill = (index) => {
    const skills = (companion.passiveSkills || []).filter((_, i) => i !== index);
    updateCompanion({ passiveSkills: skills });
  };

  // System prompt handler
  const openPromptDialog = (type, skill) => {
    setPromptType(type);
    setPromptSkill(skill);
    setPromptDialogOpen(true);
  };

  // Copy description handler
  const copyDescription = async (type, item) => {
    let text = '';
    switch (type) {
      case 'active':
        text = `***\n\n**[${item.name}]** - ${item.description || '[No description]'}\n\n***`;
        break;
      case 'passive':
        text = `***\n\n**[${item.name}](Tier ${item.tier})** - ${item.description || '[No description]'}\n\n***`;
        break;
      default:
        text = item.description || '[No description]';
    }
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: `${item.name} description copied!` });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Stat boost handlers (body tempering, fruits, etc.)
  const handleAddBoost = () => {
    setEditingBoost(null);
    setEditingBoostIndex(-1);
    setBoostDialogOpen(true);
  };

  const handleEditBoost = (boost, index) => {
    setEditingBoost(boost);
    setEditingBoostIndex(index);
    setBoostDialogOpen(true);
  };

  const handleSaveBoost = (data) => {
    const boosts = [...(companion.statBoosts || [])];
    if (editingBoostIndex >= 0) {
      boosts[editingBoostIndex] = data;
    } else {
      boosts.push(data);
    }
    updateCompanion({ statBoosts: boosts });
    setBoostDialogOpen(false);
  };

  const handleDeleteBoost = (index) => {
    const boosts = (companion.statBoosts || []).filter((_, i) => i !== index);
    updateCompanion({ statBoosts: boosts });
  };

  const handleToggleBoost = (index) => {
    const boosts = [...(companion.statBoosts || [])];
    const currentEnabled = boosts[index].enabled !== false;
    boosts[index] = { ...boosts[index], enabled: !currentEnabled };
    updateCompanion({ statBoosts: boosts });
  };

  const handleLevelChange = (newLevel) => {
    updateCompanion({ level: Number(newLevel) || 1 });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Bond Sync Info - Only show if bond is enabled */}
      {hasBond && (
        <Alert
          severity="info"
          icon={<SyncIcon />}
          sx={{
            bgcolor: 'rgba(107, 91, 149, 0.1)',
            border: '1px solid',
            borderColor: 'secondary.main',
          }}
        >
          <Typography variant="body2">
            <strong>Bond Sync Active:</strong><br />
            {mainName} receives +{syncedManaForMain} Mana (half of {companionDisplayName}'s {companionFinalStats.mana || 0}).<br />
            {companionDisplayName} receives +{syncedWillpowerForCompanion} Willpower (half of {mainName}'s {mainFinalStats.willpower || 0}).
          </Typography>
        </Alert>
      )}

      {/* Basic Info */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
          Companion Info
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Name"
              value={companion.name || ''}
              onChange={(e) => updateCompanion({ name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Level"
              type="number"
              value={companion.level || 1}
              onChange={(e) => handleLevelChange(e.target.value)}
              inputProps={{ min: 1 }}
              helperText="Change to recalculate"
            />
          </Grid>
          <Grid item xs={12} sm={8} md={4}>
            <TextField
              fullWidth
              label="Current Evolution"
              value={currentEvolution?.name || 'No evolution set'}
              disabled
              helperText="Set in Evolution History below"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Derived Stats (HP/MP) */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="h5" sx={{ color: 'secondary.main' }}>
            Resources
          </Typography>
          <Tooltip title="HP = Constitution × 10 | MP = Mana × 10" arrow>
            <InfoIcon sx={{ color: 'text.secondary', fontSize: 18, cursor: 'help' }} />
          </Tooltip>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <HpIcon sx={{ color: 'error.main', fontSize: 24 }} />
              <Typography sx={{ width: 50, fontWeight: 600 }}>HP:</Typography>
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: 'error.main',
                }}
              >
                {companionDerivedStats.hp?.max || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MpIcon sx={{ color: 'info.main', fontSize: 24 }} />
              <Typography sx={{ width: 50, fontWeight: 600 }}>MP:</Typography>
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: 'info.main',
                }}
              >
                {companionDerivedStats.mp?.max || 0}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Physical Stats - No free points for beasts */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
          Physical Stats
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Hover over values to see calculation breakdown. Stats increase based on evolution.
        </Typography>
        {PHYSICAL_STATS.map(stat => (
          <StatDisplay
            key={stat}
            statName={stat}
            finalValue={companionFinalStats[stat] || 0}
            breakdown={companionStatBreakdowns[stat]}
          />
        ))}
      </Paper>

      {/* Magical Stats */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
          Magical Stats
        </Typography>
        {MAGICAL_STATS.map(stat => (
          <StatDisplay
            key={stat}
            statName={stat}
            finalValue={companionFinalStats[stat] || 0}
            breakdown={companionStatBreakdowns[stat]}
            syncedValue={stat === 'willpower' && hasBond ? syncedWillpowerForCompanion : undefined}
            syncedFrom={stat === 'willpower' && hasBond ? mainName : undefined}
          />
        ))}
      </Paper>

      {/* Evolution History */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EvolutionIcon sx={{ color: 'secondary.main' }} />
            <Typography variant="h6">Evolution History</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Define evolutions and the stats they provide per level. Current evolution should have empty "End Level".
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddEvolution}
            size="small"
            sx={{ mb: 2 }}
            color="secondary"
          >
            Add Evolution
          </Button>
          {companion.classHistory?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Evolution Name</TableCell>
                    <TableCell>Levels</TableCell>
                    <TableCell>Stats/Level</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companion.classHistory.map((evo, index) => (
                    <TableRow 
                      key={index}
                      sx={{
                        bgcolor: evo.endLevel === null ? 'rgba(107, 91, 149, 0.1)' : 'inherit',
                      }}
                    >
                      <TableCell>
                        {evo.name}
                        {evo.endLevel === null && (
                          <Typography component="span" sx={{ color: 'secondary.main', ml: 1 }}>
                            (Current)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {evo.startLevel} - {evo.endLevel || 'Now'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {ALL_STATS
                            .filter(stat => (evo.statsPerLevel?.[stat] || 0) > 0)
                            .map(stat => `${STAT_DISPLAY_NAMES[stat].slice(0,3)}: ${evo.statsPerLevel[stat]}`)
                            .join(', ') || 'None'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditEvolution(evo, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteEvolution(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No evolutions defined yet.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Level Snapshots */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography variant="h6">Level Snapshots</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Snapshots record base stat values at specific levels (e.g., when evolving).
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<SnapshotIcon />}
              onClick={handleTakeSnapshot}
              size="small"
              color="secondary"
            >
              Take Snapshot (Level {companion.level})
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddSnapshot}
              size="small"
              color="secondary"
            >
              Add Manual Snapshot
            </Button>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'info.main' }}>
            ℹ️ "Take Snapshot" captures the current total stats including all bonuses at this level.
          </Typography>
          {companion.levelSnapshots && Object.keys(companion.levelSnapshots).length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Level</TableCell>
                    <TableCell>Stats</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(companion.levelSnapshots)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([level, snapshot]) => (
                      <TableRow key={level}>
                        <TableCell>Level {level}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {ALL_STATS
                              .filter(stat => getSnapshotStatValue(snapshot, stat) > 0)
                              .map(stat => `${STAT_DISPLAY_NAMES[stat].slice(0,3)}: ${getSnapshotStatValue(snapshot, stat)}`)
                              .join(', ')}
                          </Typography>
                          {(snapshot.includedTitleBonuses || snapshot.includedStatBoostBonuses) && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                              (includes bonuses)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditSnapshot(Number(level))}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSnapshot(level)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No snapshots yet.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Active Skills */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ActiveIcon sx={{ color: 'warning.main' }} />
            <Typography variant="h6">
              {companionDisplayName}'s Active Skills ({(companion.activeSkills || []).filter(s => !s.isOld).length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddActiveSkill}
            size="small"
            sx={{ mb: 2 }}
            color="warning"
          >
            Add Active Skill
          </Button>
          {(companion.activeSkills || []).some(s => !s.isOld) ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Proficiency</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell sx={{ width: 200 }}>Prompts</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                    <TableCell width={60}>Copy</TableCell>
                    <TableCell width={50}>Adv</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(companion.activeSkills || []).map((skill, index) => !skill.isOld && (
                    <TableRow key={index}>
                      <TableCell><CompanionSkillNameCell skill={skill} /></TableCell>
                      <TableCell>{skill.rank}</TableCell>
                      <TableCell>{skill.level}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Skill Offered Prompt">
                            <IconButton size="small" onClick={() => openPromptDialog('offered', skill)} sx={{ color: 'success.main' }}>
                              <SkillOfferedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Skill Level Up Prompt">
                            <IconButton size="small" onClick={() => openPromptDialog('levelup', skill)} sx={{ color: 'info.main' }}>
                              <LevelUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Skill Advancement Prompt">
                            <IconButton size="small" onClick={() => openPromptDialog('advancement', skill)} sx={{ color: 'warning.main' }}>
                              <AdvanceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditActiveSkill(skill, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteActiveSkill(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Copy Description">
                          <IconButton size="small" onClick={() => copyDescription('active', skill)} sx={{ color: 'secondary.main' }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {skill.advancement && (
                          <Chip label="!" size="small" color="warning" sx={{ fontWeight: 'bold', minWidth: 28 }} />
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

      {/* Passive Skills */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PassiveIcon sx={{ color: 'info.main' }} />
            <Typography variant="h6">
              {companionDisplayName}'s Passive Skills ({(companion.passiveSkills || []).filter(s => !s.isOld).length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddPassiveSkill}
            size="small"
            sx={{ mb: 2 }}
            color="info"
          >
            Add Passive Skill
          </Button>
          {(companion.passiveSkills || []).some(s => !s.isOld) ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell sx={{ width: 140 }}>Prompts</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                    <TableCell width={60}>Copy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(companion.passiveSkills || []).map((skill, index) => !skill.isOld && (
                    <TableRow key={index}>
                      <TableCell><CompanionSkillNameCell skill={skill} isPassive /></TableCell>
                      <TableCell>{skill.tier}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Passive Skill Offered Prompt">
                            <IconButton size="small" onClick={() => openPromptDialog('passive_offered', skill)} sx={{ color: 'success.main' }}>
                              <SkillOfferedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Passive Tier Up Prompt">
                            <IconButton size="small" onClick={() => openPromptDialog('passive_levelup', skill)} sx={{ color: 'info.main' }}>
                              <LevelUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditPassiveSkill(skill, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeletePassiveSkill(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Copy Description">
                          <IconButton size="small" onClick={() => copyDescription('passive', skill)} sx={{ color: 'secondary.main' }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      {/* Old Skills (Archived) */}
      {((companion.activeSkills || []).some(s => s.isOld) || (companion.passiveSkills || []).some(s => s.isOld)) && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                {companionDisplayName}'s Old Skills (Archived)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {/* Old Active Skills */}
            {(companion.activeSkills || []).some(s => s.isOld) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.main' }}>
                  Old Active Skills
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Skill</TableCell>
                        <TableCell>Proficiency</TableCell>
                        <TableCell>Level</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(companion.activeSkills || []).map((skill, index) => skill.isOld && (
                        <TableRow key={index} sx={{ opacity: 0.7 }}>
                          <TableCell><CompanionSkillNameCell skill={skill} /></TableCell>
                          <TableCell>{skill.rank}</TableCell>
                          <TableCell>{skill.level}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleEditActiveSkill(skill, index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteActiveSkill(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            {/* Old Passive Skills */}
            {(companion.passiveSkills || []).some(s => s.isOld) && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.main' }}>
                  Old Passive Skills
                </Typography>
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
                      {(companion.passiveSkills || []).map((skill, index) => skill.isOld && (
                        <TableRow key={index} sx={{ opacity: 0.7 }}>
                          <TableCell><CompanionSkillNameCell skill={skill} isPassive /></TableCell>
                          <TableCell>{skill.tier}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleEditPassiveSkill(skill, index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeletePassiveSkill(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Stat Boosts (Body Tempering, Fruits, etc.) */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BoostIcon sx={{ color: 'secondary.main' }} />
            <Typography variant="h6">
              Stat Boosts ({companion.statBoosts?.filter(b => b.enabled !== false).length || 0} active)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Track permanent stat gains from body tempering, consuming fruits, or other sources.
            These do not appear on the Status Screen output.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddBoost}
            size="small"
            sx={{ mb: 2 }}
            color="secondary"
          >
            Add Stat Boost
          </Button>
          {companion.statBoosts?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 70 }}>Enabled</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Stat</TableCell>
                    <TableCell>Bonus</TableCell>
                    <TableCell sx={{ width: 80 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companion.statBoosts.map((boost, index) => (
                    <TableRow 
                      key={index}
                      sx={{ opacity: boost.enabled === false ? 0.5 : 1 }}
                    >
                      <TableCell>
                        <Switch
                          checked={boost.enabled !== false}
                          onChange={() => handleToggleBoost(index)}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 250 }}>
                          {boost.description || '(No description)'}
                        </Typography>
                      </TableCell>
                      <TableCell>{STAT_DISPLAY_NAMES[boost.stat]}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {boost.additive !== 0 && (
                            <Chip
                              label={`+${boost.additive}`}
                              size="small"
                              sx={{ bgcolor: 'rgba(76, 175, 80, 0.2)', color: 'success.light' }}
                            />
                          )}
                          {boost.multiplier !== 0 && (
                            <Chip
                              label={`×${(1 + boost.multiplier).toFixed(2)}`}
                              size="small"
                              sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: 'warning.light' }}
                            />
                          )}
                          {boost.additive === 0 && boost.multiplier === 0 && (
                            <Typography variant="body2" color="text.disabled">None</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditBoost(boost, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteBoost(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No stat boosts yet.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Dialogs */}
      <EvolutionDialog
        open={evolutionDialogOpen}
        onClose={() => setEvolutionDialogOpen(false)}
        evolutionData={editingEvolution}
        onSave={handleSaveEvolution}
        isEdit={editingEvolutionIndex >= 0}
      />
      <SnapshotDialog
        open={snapshotDialogOpen}
        onClose={() => setSnapshotDialogOpen(false)}
        level={editingSnapshotLevel}
        currentSnapshot={editingSnapshotLevel ? companion.levelSnapshots?.[editingSnapshotLevel] : null}
        onSave={handleSaveSnapshot}
      />
      <CompanionActiveSkillDialog
        open={activeSkillDialogOpen}
        onClose={() => setActiveSkillDialogOpen(false)}
        skill={editingSkill}
        onSave={handleSaveActiveSkill}
      />
      <CompanionPassiveSkillDialog
        open={passiveSkillDialogOpen}
        onClose={() => setPassiveSkillDialogOpen(false)}
        skill={editingSkill}
        onSave={handleSavePassiveSkill}
      />
      <CompanionSystemPromptDialog
        open={promptDialogOpen}
        onClose={() => setPromptDialogOpen(false)}
        type={promptType}
        skill={promptSkill}
        onCopySuccess={(msg) => setSnackbar({ open: true, message: msg })}
      />
      <StatBoostDialog
        open={boostDialogOpen}
        onClose={() => setBoostDialogOpen(false)}
        boost={editingBoost}
        onSave={handleSaveBoost}
      />
      
      {/* Copy Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Companion;

