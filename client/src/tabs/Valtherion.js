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
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import {
  PHYSICAL_STATS,
  MAGICAL_STATS,
  STAT_DISPLAY_NAMES,
  ALL_STATS,
  SKILL_RANKS,
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

// Snapshot Dialog for Valtherion
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

// Skill Dialog for Valtherion
function SkillDialog({ open, onClose, skill, onSave }) {
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
    onSave({ name, rank, level, advancement, primaryStatShared });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{skill ? 'Edit Bond Skill' : 'Add Bond Skill'}</DialogTitle>
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
            <TextField
              select
              fullWidth
              label="Rank"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              SelectProps={{ native: true }}
            >
              {SKILL_RANKS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </TextField>
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
              label="Primary Stat Shared"
              fullWidth
              value={primaryStatShared}
              onChange={(e) => setPrimaryStatShared(e.target.value)}
              placeholder="e.g., Mana"
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

function Valtherion() {
  const {
    valtherion,
    alex,
    updateValtherion,
    valFinalStats,
    valStatBreakdowns,
    valDerivedStats,
    syncedWillpowerForVal,
    syncedManaForAlex,
    alexFinalStats,
  } = useCharacter();

  const [evolutionDialogOpen, setEvolutionDialogOpen] = useState(false);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [editingEvolution, setEditingEvolution] = useState(null);
  const [editingEvolutionIndex, setEditingEvolutionIndex] = useState(-1);
  const [editingSnapshotLevel, setEditingSnapshotLevel] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingSkillIndex, setEditingSkillIndex] = useState(-1);
  const [editingBoost, setEditingBoost] = useState(null);
  const [editingBoostIndex, setEditingBoostIndex] = useState(-1);

  if (!valtherion) {
    return <Typography>Loading...</Typography>;
  }

  // Get current evolution
  const currentEvolution = getCurrentEvolution(valtherion.classHistory, valtherion.level);

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
    const history = [...(valtherion.classHistory || [])];
    if (editingEvolutionIndex >= 0) {
      history[editingEvolutionIndex] = evolutionData;
    } else {
      history.push(evolutionData);
    }
    history.sort((a, b) => a.startLevel - b.startLevel);
    updateValtherion({ classHistory: history });
    setEvolutionDialogOpen(false);
  };

  const handleDeleteEvolution = (index) => {
    const history = (valtherion.classHistory || []).filter((_, i) => i !== index);
    updateValtherion({ classHistory: history });
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
    const snapshots = { ...(valtherion.levelSnapshots || {}) };
    snapshots[level] = stats;
    updateValtherion({ levelSnapshots: snapshots });
    setSnapshotDialogOpen(false);
  };

  const handleDeleteSnapshot = (level) => {
    const snapshots = { ...(valtherion.levelSnapshots || {}) };
    delete snapshots[level];
    updateValtherion({ levelSnapshots: snapshots });
  };

  // Take a snapshot of current TOTAL stats at current level (includes all bonuses)
  // Track title/boost bonuses, trait multipliers, AND derivation bonuses to avoid double-counting later
  const handleTakeSnapshot = () => {
    const snapshots = { ...(valtherion.levelSnapshots || {}) };
    
    // Get current title bonuses (raw values - Valtherion might not have titles, but handle it anyway)
    const rawTitleBonuses = getTitleAdditiveBonuses(valtherion.titles);
    const titleMultiplierBonuses = getTitleMultiplierBonuses(valtherion.titles);
    
    // Get current stat boost bonuses
    const statBoostAdditiveBonuses = getStatBoostAdditiveBonuses(valtherion.statBoosts);
    const statBoostMultiplierBonuses = getStatBoostMultiplierBonuses(valtherion.statBoosts);
    
    // Get trait multipliers and derivation bonuses for each stat
    const traitMultipliers = {};
    const includedTitleBonuses = {};
    const includedDerivationBonuses = {};
    ALL_STATS.forEach(stat => {
      const traitMult = valStatBreakdowns[stat]?.traitMultiplier || 1;
      traitMultipliers[stat] = traitMult;
      // Also store the effective (trait-multiplied) value for backwards compatibility
      includedTitleBonuses[stat] = (rawTitleBonuses[stat] || 0) * traitMult;
      // Store derivation bonuses (e.g., % of one stat → another)
      includedDerivationBonuses[stat] = valStatBreakdowns[stat]?.derivationBonus || 0;
    });
    
    // Store the full snapshot with tracking of what's included
    snapshots[valtherion.level] = {
      stats: { ...valFinalStats },
      rawTitleBonuses: { ...rawTitleBonuses },           // Raw title bonuses (before trait)
      includedTraitMultipliers: traitMultipliers,        // Trait multipliers at snapshot time
      includedTitleBonuses: includedTitleBonuses,        // Effective title bonuses (for backwards compat)
      includedTitleMultipliers: { ...titleMultiplierBonuses },
      includedStatBoostBonuses: { ...statBoostAdditiveBonuses },
      includedStatBoostMultipliers: { ...statBoostMultiplierBonuses },
      includedDerivationBonuses: includedDerivationBonuses, // Derivation bonuses baked into stats
    };
    
    updateValtherion({ levelSnapshots: snapshots });
  };

  // Bond skill handlers
  const handleAddBondSkill = () => {
    setEditingSkill(null);
    setEditingSkillIndex(-1);
    setSkillDialogOpen(true);
  };

  const handleEditBondSkill = (skill, index) => {
    setEditingSkill(skill);
    setEditingSkillIndex(index);
    setSkillDialogOpen(true);
  };

  const handleSaveBondSkill = (data) => {
    const skills = [...(valtherion.bondSkills || [])];
    if (editingSkillIndex >= 0) {
      skills[editingSkillIndex] = data;
    } else {
      skills.push(data);
    }
    updateValtherion({ bondSkills: skills });
    setSkillDialogOpen(false);
  };

  const handleDeleteBondSkill = (index) => {
    const skills = (valtherion.bondSkills || []).filter((_, i) => i !== index);
    updateValtherion({ bondSkills: skills });
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
    const boosts = [...(valtherion.statBoosts || [])];
    if (editingBoostIndex >= 0) {
      boosts[editingBoostIndex] = data;
    } else {
      boosts.push(data);
    }
    updateValtherion({ statBoosts: boosts });
    setBoostDialogOpen(false);
  };

  const handleDeleteBoost = (index) => {
    const boosts = (valtherion.statBoosts || []).filter((_, i) => i !== index);
    updateValtherion({ statBoosts: boosts });
  };

  const handleToggleBoost = (index) => {
    const boosts = [...(valtherion.statBoosts || [])];
    const currentEnabled = boosts[index].enabled !== false;
    boosts[index] = { ...boosts[index], enabled: !currentEnabled };
    updateValtherion({ statBoosts: boosts });
  };

  const handleLevelChange = (newLevel) => {
    updateValtherion({ level: Number(newLevel) || 1 });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Bond Sync Info */}
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
          Alex receives +{syncedManaForAlex} Mana (half of Val's {valFinalStats.mana || 0}).<br />
          Valtherion receives +{syncedWillpowerForVal} Willpower (half of Alex's {alexFinalStats.willpower || 0}).
        </Typography>
      </Alert>

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
              value={valtherion.name || ''}
              onChange={(e) => updateValtherion({ name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Level"
              type="number"
              value={valtherion.level || 1}
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
                {valDerivedStats.hp?.max || 0}
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
                {valDerivedStats.mp?.max || 0}
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
            finalValue={valFinalStats[stat] || 0}
            breakdown={valStatBreakdowns[stat]}
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
            finalValue={valFinalStats[stat] || 0}
            breakdown={valStatBreakdowns[stat]}
            syncedValue={stat === 'willpower' ? syncedWillpowerForVal : undefined}
            syncedFrom={stat === 'willpower' ? 'Alex' : undefined}
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
          {valtherion.classHistory?.length > 0 ? (
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
                  {valtherion.classHistory.map((evo, index) => (
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
            Snapshots record Valtherion's base stat values at specific levels (e.g., when evolving).
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<SnapshotIcon />}
              onClick={handleTakeSnapshot}
              size="small"
              color="secondary"
            >
              Take Snapshot (Level {valtherion.level})
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
          {valtherion.levelSnapshots && Object.keys(valtherion.levelSnapshots).length > 0 ? (
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
                  {Object.entries(valtherion.levelSnapshots)
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

      {/* Bond Skills */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BondIcon sx={{ color: 'secondary.main' }} />
            <Typography variant="h6">
              Valtherion's Bond Skills ({valtherion.bondSkills?.length || 0})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddBondSkill}
            size="small"
            sx={{ mb: 2 }}
            color="secondary"
          >
            Add Bond Skill
          </Button>
          {valtherion.bondSkills?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Rank</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Primary Stat</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {valtherion.bondSkills.map((skill, index) => (
                    <TableRow key={index}>
                      <TableCell>[{skill.name}]</TableCell>
                      <TableCell>{skill.rank}</TableCell>
                      <TableCell>{skill.level}</TableCell>
                      <TableCell>{skill.primaryStatShared || '-'}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditBondSkill(skill, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteBondSkill(index)}>
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

      {/* Stat Boosts (Body Tempering, Fruits, etc.) */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BoostIcon sx={{ color: 'secondary.main' }} />
            <Typography variant="h6">
              Stat Boosts ({valtherion.statBoosts?.filter(b => b.enabled !== false).length || 0} active)
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
          {valtherion.statBoosts?.length > 0 ? (
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
                  {valtherion.statBoosts.map((boost, index) => (
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
        currentSnapshot={editingSnapshotLevel ? valtherion.levelSnapshots?.[editingSnapshotLevel] : null}
        onSave={handleSaveSnapshot}
      />
      <SkillDialog
        open={skillDialogOpen}
        onClose={() => setSkillDialogOpen(false)}
        skill={editingSkill}
        onSave={handleSaveBondSkill}
      />
      <StatBoostDialog
        open={boostDialogOpen}
        onClose={() => setBoostDialogOpen(false)}
        boost={editingBoost}
        onSave={handleSaveBoost}
      />
    </Box>
  );
}

export default Valtherion;
