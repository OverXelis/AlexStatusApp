import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Tooltip,
  Checkbox,
  FormControlLabel,
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
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  LocalHospital as HpIcon,
  Science as MpIcon,
  CameraAlt as SnapshotIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import {
  PHYSICAL_STATS,
  MAGICAL_STATS,
  STAT_DISPLAY_NAMES,
  ALL_STATS,
  getTitleAdditiveBonuses,
  getTitleMultiplierBonuses,
  getSnapshotStatValue,
} from '../utils/statCalculator';
import { STAT_ICONS } from '../utils/statIcons';

// Stat display with breakdown tooltip and icon
function StatDisplay({ statName, finalValue, breakdown, freePoints, onFreePointsChange, syncedValue, syncedFrom, showFreePoints = true }) {
  const hasSynced = syncedValue !== undefined && syncedValue > 0;
  const totalWithSync = finalValue + (hasSynced ? syncedValue : 0);
  
  // Get the icon component for this stat
  const IconComponent = STAT_ICONS[statName];
  
  const breakdownLines = [];
  if (breakdown) {
    if (breakdown.snapshotLevel !== null) {
      breakdownLines.push(`Base (Lvl ${breakdown.snapshotLevel}): ${breakdown.snapshotBase}`);
    }
    // Show redirected free points (from traits like Primordial Will)
    if (breakdown.redirectedFreePoints > 0) {
      breakdownLines.push(`Auto Free Pts: +${breakdown.redirectedFreePoints}`);
    }
    if (breakdown.classScaling > 0) {
      breakdownLines.push(`Class: +${breakdown.classScaling}`);
      if (breakdown.classScalingDetail) {
        breakdownLines.push(`  (${breakdown.classScalingDetail})`);
      }
    }
    if (breakdown.freePoints > 0) {
      breakdownLines.push(`Manual Free Pts: +${breakdown.freePoints}`);
    }
    if (breakdown.traitMultiplier !== 1) {
      const gainsLabel = breakdown.gainsBeforeTrait || 0;
      breakdownLines.push(`Gains ×${breakdown.traitMultiplier}: ${gainsLabel} → ${Math.floor(breakdown.gainsAfterTrait || 0)}`);
    }
    if (breakdown.titleAdditive > 0) {
      if (breakdown.traitMultiplier !== 1) {
        breakdownLines.push(`Title Bonus: +${breakdown.titleAdditive} ×${breakdown.traitMultiplier} = +${Math.floor(breakdown.titleAdditiveAfterTrait || 0)}`);
      } else {
        breakdownLines.push(`Title Bonus: +${breakdown.titleAdditive}`);
      }
    }
    if (breakdown.titleMultiplier > 0) {
      if (breakdown.titleMultiplierEnhanced) {
        // Show that the trait multiplier was applied to the title multiplier (level 30+)
        breakdownLines.push(`Title Mult: ×${(1 + breakdown.titleMultiplier).toFixed(2)} ×${breakdown.traitMultiplier} = ×${(1 + breakdown.effectiveTitleMultiplier).toFixed(2)}`);
      } else {
        breakdownLines.push(`Title Mult: ×${(1 + breakdown.titleMultiplier).toFixed(2)}`);
      }
    }
    if (breakdown.derivationBonus > 0) {
      breakdownLines.push(`Derived: +${breakdown.derivationBonus} (${breakdown.derivationDetail})`);
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
              color: 'primary.main',
              cursor: 'help',
              minWidth: 80,
            }}
          >
            {totalWithSync}
          </Typography>
        </Tooltip>
        {showFreePoints && (
          <TextField
            type="number"
            label="Free Pts"
            value={freePoints || 0}
            onChange={(e) => onFreePointsChange(Number(e.target.value) || 0)}
            size="small"
            sx={{ width: 90 }}
            inputProps={{ min: 0 }}
          />
        )}
      </Box>
      {hasSynced && (
        <Typography variant="caption" sx={{ color: 'success.light', ml: IconComponent ? 5.5 : 13 }}>
          Includes +{syncedValue} from {syncedFrom}
        </Typography>
      )}
    </Box>
  );
}

// Class History Dialog
function ClassDialog({ open, onClose, classData, onSave, isEdit }) {
  const [name, setName] = useState(classData?.name || '');
  const [startLevel, setStartLevel] = useState(classData?.startLevel || 10);
  const [endLevel, setEndLevel] = useState(classData?.endLevel || '');
  const [statsPerLevel, setStatsPerLevel] = useState(classData?.statsPerLevel || {});

  React.useEffect(() => {
    if (open) {
      setName(classData?.name || '');
      setStartLevel(classData?.startLevel || 10);
      setEndLevel(classData?.endLevel || '');
      setStatsPerLevel(classData?.statsPerLevel || {});
    }
  }, [open, classData]);

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
      <DialogTitle>{isEdit ? 'Edit Class' : 'Add Class'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Class Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spell Weaver (Novice)"
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
              placeholder="Leave empty for current class"
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

// Snapshot Dialog
function SnapshotDialog({ open, onClose, level, currentSnapshot, onSave }) {
  const [snapshotLevel, setSnapshotLevel] = useState(level || 1);
  const [stats, setStats] = useState({});

  React.useEffect(() => {
    if (open) {
      setSnapshotLevel(level || 1);
      // Initialize with zeros or current values (handle both old and new snapshot formats)
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
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          A snapshot records the character's base stats at a specific level (usually when changing classes).
          Stats will scale from this snapshot level forward.
        </Typography>
        <TextField
          fullWidth
          type="number"
          label="Snapshot Level"
          value={snapshotLevel}
          onChange={(e) => setSnapshotLevel(Number(e.target.value) || 1)}
          sx={{ mb: 3 }}
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

function BasicStats() {
  const {
    alex,
    updateAlex,
    updateAlexLevel,
    updateAlexFreePoints,
    updateAlexClassHistory,
    updateAlexLevelSnapshots,
    alexFinalStats,
    alexStatBreakdowns,
    alexDerivedStats,
    alexCurrentClass,
    syncedManaForAlex,
  } = useCharacter();

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingClassIndex, setEditingClassIndex] = useState(-1);
  const [editingSnapshotLevel, setEditingSnapshotLevel] = useState(null);

  // Calculate free points available
  // Characters earn 3 free points per level (starting from level 1)
  // Check if trait redirects free points (like Primordial Will)
  const hasRedirectFreePoints = alex?.traits?.items?.some(trait => 
    trait.effects?.some(effect => effect.type === 'redirect_free_points')
  );
  
  const totalFreePointsEarned = (alex?.level || 1) * 3;
  const totalFreePointsSpent = ALL_STATS.reduce((sum, stat) => 
    sum + (alex?.freePoints?.[stat] || 0), 0
  );
  const freePointsAvailable = totalFreePointsEarned - totalFreePointsSpent;

  if (!alex) {
    return <Typography>Loading...</Typography>;
  }

  // Class handlers
  const handleAddClass = () => {
    setEditingClass(null);
    setEditingClassIndex(-1);
    setClassDialogOpen(true);
  };

  const handleEditClass = (cls, index) => {
    setEditingClass(cls);
    setEditingClassIndex(index);
    setClassDialogOpen(true);
  };

  const handleSaveClass = (classData) => {
    const history = [...(alex.classHistory || [])];
    if (editingClassIndex >= 0) {
      history[editingClassIndex] = classData;
    } else {
      history.push(classData);
    }
    // Sort by start level
    history.sort((a, b) => a.startLevel - b.startLevel);
    updateAlexClassHistory(history);
    setClassDialogOpen(false);
  };

  const handleDeleteClass = (index) => {
    const history = (alex.classHistory || []).filter((_, i) => i !== index);
    updateAlexClassHistory(history);
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
    const snapshots = { ...(alex.levelSnapshots || {}) };
    snapshots[level] = stats;
    updateAlexLevelSnapshots(snapshots);
    setSnapshotDialogOpen(false);
  };

  const handleDeleteSnapshot = (level) => {
    const snapshots = { ...(alex.levelSnapshots || {}) };
    delete snapshots[level];
    updateAlexLevelSnapshots(snapshots);
  };

  // Take a snapshot of current TOTAL stats at current level (includes all bonuses)
  // Also track what title bonuses are "baked in" to avoid double-counting later
  const handleTakeSnapshot = () => {
    const snapshots = { ...(alex.levelSnapshots || {}) };
    
    // Get current title bonuses that will be included in this snapshot
    const titleAdditiveBonuses = getTitleAdditiveBonuses(alex.titles);
    const titleMultiplierBonuses = getTitleMultiplierBonuses(alex.titles);
    
    // Apply trait multiplier to title additives (to match what's in alexFinalStats)
    const includedTitleBonuses = {};
    ALL_STATS.forEach(stat => {
      const traitMult = alexStatBreakdowns[stat]?.traitMultiplier || 1;
      includedTitleBonuses[stat] = (titleAdditiveBonuses[stat] || 0) * traitMult;
    });
    
    // Store the full snapshot with tracking of what's included
    snapshots[alex.level] = {
      stats: { ...alexFinalStats },
      includedTitleBonuses: includedTitleBonuses,
      includedTitleMultipliers: { ...titleMultiplierBonuses },
    };
    
    updateAlexLevelSnapshots(snapshots);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Character Info & Level */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Character Info
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Name"
              value={alex.name || ''}
              onChange={(e) => updateAlex({ name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Level"
              type="number"
              value={alex.level || 1}
              onChange={(e) => updateAlexLevel(e.target.value)}
              inputProps={{ min: 1 }}
              helperText="Change to recalculate stats"
            />
          </Grid>
          <Grid item xs={12} sm={8} md={4}>
            <TextField
              fullWidth
              label="Current Class"
              value={alexCurrentClass?.name || 'No class set'}
              disabled
              helperText="Set in Class History below"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={alexCurrentClass ? true : false}
                  disabled
                />
              }
              label={alexCurrentClass?.endLevel === null ? 'Active' : 'Historical'}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Derived Stats (HP/MP) - Calculated automatically */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="h5" sx={{ color: 'primary.main' }}>
            Resources
          </Typography>
          <Tooltip title="HP = Constitution × 10 | MP = (Mana + Bond Mana) × 10" arrow>
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
                {alexDerivedStats.hp?.max || 0}
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
                {alexDerivedStats.mp?.max || 0}
              </Typography>
              {syncedManaForAlex > 0 && (
                <Typography variant="body2" sx={{ color: 'success.light' }}>
                  (includes bond mana)
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Free Points Available */}
      {!hasRedirectFreePoints && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ color: 'primary.main' }}>
                Free Points Available
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Gain 3 points per level. Allocate in the stat sections below.
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: freePointsAvailable >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {freePointsAvailable}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ({totalFreePointsEarned} earned - {totalFreePointsSpent} spent)
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Physical Stats */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Physical Stats
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Hover over values to see calculation breakdown.{!hasRedirectFreePoints && ' Use "Free Pts" for manual point allocation.'}
        </Typography>
        {PHYSICAL_STATS.map(stat => (
          <StatDisplay
            key={stat}
            statName={stat}
            finalValue={alexFinalStats[stat] || 0}
            breakdown={alexStatBreakdowns[stat]}
            freePoints={alex.freePoints?.[stat] || 0}
            onFreePointsChange={(value) => updateAlexFreePoints(stat, value)}
            showFreePoints={!hasRedirectFreePoints}
          />
        ))}
      </Paper>

      {/* Magical Stats */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Magical Stats
        </Typography>
        {MAGICAL_STATS.map(stat => (
          <StatDisplay
            key={stat}
            statName={stat}
            finalValue={alexFinalStats[stat] || 0}
            breakdown={alexStatBreakdowns[stat]}
            freePoints={alex.freePoints?.[stat] || 0}
            onFreePointsChange={(value) => updateAlexFreePoints(stat, value)}
            showFreePoints={!hasRedirectFreePoints}
            syncedValue={stat === 'mana' ? syncedManaForAlex : undefined}
            syncedFrom={stat === 'mana' ? 'Valtherion' : undefined}
          />
        ))}
      </Paper>

      {/* Class History */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography variant="h6">Class History</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Define classes and the stats they provide per level. Current class should have empty "End Level".
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddClass}
            size="small"
            sx={{ mb: 2 }}
          >
            Add Class
          </Button>
          {alex.classHistory?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Class Name</TableCell>
                    <TableCell>Levels</TableCell>
                    <TableCell>Stats/Level</TableCell>
                    <TableCell width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alex.classHistory.map((cls, index) => (
                    <TableRow 
                      key={index}
                      sx={{
                        bgcolor: cls.endLevel === null ? 'rgba(76, 175, 80, 0.1)' : 'inherit',
                      }}
                    >
                      <TableCell>
                        {cls.name}
                        {cls.endLevel === null && (
                          <Typography component="span" sx={{ color: 'success.main', ml: 1 }}>
                            (Current)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {cls.startLevel} - {cls.endLevel || 'Now'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {ALL_STATS
                            .filter(stat => (cls.statsPerLevel?.[stat] || 0) > 0)
                            .map(stat => `${STAT_DISPLAY_NAMES[stat].slice(0,3)}: ${cls.statsPerLevel[stat]}`)
                            .join(', ') || 'None'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditClass(cls, index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteClass(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No classes defined yet.</Typography>
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
            Snapshots record base stat values at specific levels. Stats scale from the most recent snapshot.
            Create one when changing classes to capture the character's state at that point.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<SnapshotIcon />}
              onClick={handleTakeSnapshot}
              size="small"
              color="primary"
            >
              Take Snapshot (Level {alex.level})
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddSnapshot}
              size="small"
            >
              Add Manual Snapshot
            </Button>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'info.main' }}>
            ℹ️ "Take Snapshot" captures the current total stats including all bonuses at this level.
          </Typography>
          {alex.levelSnapshots && Object.keys(alex.levelSnapshots).length > 0 ? (
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
                  {Object.entries(alex.levelSnapshots)
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
                          {snapshot.includedTitleBonuses && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                              (includes title bonuses)
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
            <Typography color="text.secondary">No snapshots yet. Add one at your first class level.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Dialogs */}
      <ClassDialog
        open={classDialogOpen}
        onClose={() => setClassDialogOpen(false)}
        classData={editingClass}
        onSave={handleSaveClass}
        isEdit={editingClassIndex >= 0}
      />
      <SnapshotDialog
        open={snapshotDialogOpen}
        onClose={() => setSnapshotDialogOpen(false)}
        level={editingSnapshotLevel}
        currentSnapshot={editingSnapshotLevel ? alex.levelSnapshots?.[editingSnapshotLevel] : null}
        onSave={handleSaveSnapshot}
      />
    </Box>
  );
}

export default BasicStats;
