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
  Divider,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
  Link as BondIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import {
  PHYSICAL_STATS,
  MAGICAL_STATS,
  STAT_DISPLAY_NAMES,
  getStatBreakdown,
  SKILL_RANKS,
  PASSIVE_TIERS,
} from '../utils/statCalculator';

function StatInput({ label, value, bonus = 0, onChange, synced, syncedFrom, syncedValue }) {
  const breakdown = getStatBreakdown(label, value, bonus);
  const hasSynced = synced && syncedValue > 0;

  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2">Base: {value}</Typography>
      {hasSynced && (
        <Typography variant="body2">
          From {syncedFrom}: +{syncedValue}
        </Typography>
      )}
      <Divider sx={{ my: 0.5 }} />
      <Typography variant="body2" fontWeight="bold">
        Total: {breakdown.total + (hasSynced ? syncedValue : 0)}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        label={STAT_DISPLAY_NAMES[label] || label}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        sx={{ width: 140 }}
        inputProps={{ min: 0 }}
      />
      <Tooltip title={tooltipContent} arrow placement="right">
        <Typography
          sx={{
            minWidth: 80,
            color: hasSynced ? 'success.main' : 'text.secondary',
            fontFamily: '"JetBrains Mono", monospace',
            cursor: 'help',
          }}
        >
          = {breakdown.total + (hasSynced ? syncedValue : 0)}
          {hasSynced && (
            <Typography
              component="span"
              sx={{ color: 'success.light', fontSize: '0.85rem', ml: 0.5 }}
            >
              (+{syncedValue})
            </Typography>
          )}
        </Typography>
      </Tooltip>
    </Box>
  );
}

// Skill Dialog (reused from Abilities)
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

function Valtherion() {
  const {
    valtherion,
    alex,
    updateValtherion,
    updateValStat,
    syncedWillpowerForVal,
    syncedManaForAlex,
  } = useCharacter();

  const [bondDialogOpen, setBondDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  if (!valtherion) {
    return <Typography>Loading...</Typography>;
  }

  const handleAddBondSkill = () => {
    setEditingSkill(null);
    setEditingIndex(-1);
    setBondDialogOpen(true);
  };

  const handleEditBondSkill = (skill, index) => {
    setEditingSkill(skill);
    setEditingIndex(index);
    setBondDialogOpen(true);
  };

  const handleSaveBondSkill = (data) => {
    const skills = [...(valtherion.bondSkills || [])];
    if (editingIndex >= 0) {
      skills[editingIndex] = data;
    } else {
      skills.push(data);
    }
    updateValtherion({ bondSkills: skills });
    setBondDialogOpen(false);
  };

  const handleDeleteBondSkill = (index) => {
    const skills = (valtherion.bondSkills || []).filter((_, i) => i !== index);
    updateValtherion({ bondSkills: skills });
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
          <strong>Bond Sync Active:</strong> Alex receives +{syncedManaForAlex} Mana (half of Val's {valtherion.baseStats?.mana || 0}).
          Valtherion receives +{syncedWillpowerForVal} Willpower (half of Alex's {alex?.baseStats?.willpower || 0}).
        </Typography>
      </Alert>

      {/* Basic Info Section */}
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
              value={valtherion.level || 0}
              onChange={(e) => updateValtherion({ level: Number(e.target.value) || 0 })}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={8} md={4}>
            <TextField
              fullWidth
              label="Class/Type"
              value={valtherion.class || ''}
              onChange={(e) => updateValtherion({ class: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={valtherion.classAdvancement || false}
                  onChange={(e) => updateValtherion({ classAdvancement: e.target.checked })}
                  sx={{
                    color: 'warning.main',
                    '&.Mui-checked': {
                      color: 'warning.main',
                    },
                  }}
                />
              }
              label="Advancement"
              sx={{
                mt: 1,
                '& .MuiFormControlLabel-label': {
                  color: valtherion.classAdvancement ? 'warning.main' : 'text.secondary',
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* HP/MP Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
          Resources
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ width: 40, fontWeight: 600 }}>HP:</Typography>
              <TextField
                label="Current"
                type="number"
                value={valtherion.hp?.current || 0}
                onChange={(e) =>
                  updateValtherion({
                    hp: { ...valtherion.hp, current: Number(e.target.value) || 0 },
                  })
                }
                size="small"
                sx={{ width: 120 }}
                inputProps={{ min: 0 }}
              />
              <Typography sx={{ color: 'text.secondary' }}>/</Typography>
              <TextField
                label="Max"
                type="number"
                value={valtherion.hp?.max || 0}
                onChange={(e) =>
                  updateValtherion({
                    hp: { ...valtherion.hp, max: Number(e.target.value) || 0 },
                  })
                }
                size="small"
                sx={{ width: 120 }}
                inputProps={{ min: 0 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ width: 40, fontWeight: 600 }}>MP:</Typography>
              <TextField
                label="Current"
                type="number"
                value={valtherion.mp?.current || 0}
                onChange={(e) =>
                  updateValtherion({
                    mp: { ...valtherion.mp, current: Number(e.target.value) || 0 },
                  })
                }
                size="small"
                sx={{ width: 120 }}
                inputProps={{ min: 0 }}
              />
              <Typography sx={{ color: 'text.secondary' }}>/</Typography>
              <TextField
                label="Max"
                type="number"
                value={valtherion.mp?.max || 0}
                onChange={(e) =>
                  updateValtherion({
                    mp: { ...valtherion.mp, max: Number(e.target.value) || 0 },
                  })
                }
                size="small"
                sx={{ width: 120 }}
                inputProps={{ min: 0 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Physical Stats Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
          Physical Stats
        </Typography>
        <Grid container spacing={2}>
          {PHYSICAL_STATS.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat}>
              <StatInput
                label={stat}
                value={valtherion.baseStats?.[stat] || 0}
                onChange={(value) => updateValStat(stat, value)}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Magical Stats Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
          Magical Stats
        </Typography>
        <Grid container spacing={2}>
          {MAGICAL_STATS.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat}>
              <StatInput
                label={stat}
                value={valtherion.baseStats?.[stat] || 0}
                onChange={(value) => updateValStat(stat, value)}
                synced={stat === 'willpower'}
                syncedFrom="Alex"
                syncedValue={stat === 'willpower' ? syncedWillpowerForVal : 0}
              />
            </Grid>
          ))}
        </Grid>
        {syncedWillpowerForVal > 0 && (
          <Typography variant="body2" sx={{ mt: 2, color: 'success.light', fontStyle: 'italic' }}>
            * Willpower includes +{syncedWillpowerForVal} from bond with Alex (half of Alex's Willpower stat)
          </Typography>
        )}
      </Paper>

      {/* Bond Skills Section */}
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
                    <TableCell>Adv.</TableCell>
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
                        {skill.advancement && (
                          <Chip label="+" size="small" sx={{ bgcolor: 'warning.main', color: 'black' }} />
                        )}
                      </TableCell>
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

      {/* Bond Skill Dialog */}
      <SkillDialog
        open={bondDialogOpen}
        onClose={() => setBondDialogOpen(false)}
        skill={editingSkill}
        onSave={handleSaveBondSkill}
        isBondSkill
      />
    </Box>
  );
}

export default Valtherion;

