import React from 'react';
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
} from '@mui/material';
import { useCharacter } from '../context/CharacterContext';
import {
  PHYSICAL_STATS,
  MAGICAL_STATS,
  STAT_DISPLAY_NAMES,
  getStatBreakdown,
} from '../utils/statCalculator';

function StatInput({ label, value, bonus, onChange, synced, syncedFrom, syncedValue }) {
  const breakdown = getStatBreakdown(label, value, bonus);
  const hasBonus = bonus > 0;
  const hasSynced = synced && syncedValue > 0;

  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2">Base: {value}</Typography>
      {hasBonus && <Typography variant="body2">Title Bonus: +{bonus}</Typography>}
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
            color: hasBonus || hasSynced ? 'success.main' : 'text.secondary',
            fontFamily: '"JetBrains Mono", monospace',
            cursor: 'help',
          }}
        >
          = {breakdown.total + (hasSynced ? syncedValue : 0)}
          {(hasBonus || hasSynced) && (
            <Typography
              component="span"
              sx={{ color: 'success.light', fontSize: '0.85rem', ml: 0.5 }}
            >
              (+{bonus + (hasSynced ? syncedValue : 0)})
            </Typography>
          )}
        </Typography>
      </Tooltip>
    </Box>
  );
}

function BasicStats() {
  const {
    alex,
    updateAlex,
    updateAlexStat,
    alexTitleBonuses,
    syncedManaForAlex,
  } = useCharacter();

  if (!alex) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Basic Info Section */}
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
              value={alex.level || 0}
              onChange={(e) => updateAlex({ level: Number(e.target.value) || 0 })}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={8} md={4}>
            <TextField
              fullWidth
              label="Class"
              value={alex.class || ''}
              onChange={(e) => updateAlex({ class: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={alex.classAdvancement || false}
                  onChange={(e) => updateAlex({ classAdvancement: e.target.checked })}
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
                  color: alex.classAdvancement ? 'warning.main' : 'text.secondary',
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* HP/MP Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Resources
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ width: 40, fontWeight: 600 }}>HP:</Typography>
              <TextField
                label="Current"
                type="number"
                value={alex.hp?.current || 0}
                onChange={(e) =>
                  updateAlex({
                    hp: { ...alex.hp, current: Number(e.target.value) || 0 },
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
                value={alex.hp?.max || 0}
                onChange={(e) =>
                  updateAlex({
                    hp: { ...alex.hp, max: Number(e.target.value) || 0 },
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
                value={alex.mp?.current || 0}
                onChange={(e) =>
                  updateAlex({
                    mp: { ...alex.mp, current: Number(e.target.value) || 0 },
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
                value={alex.mp?.max || 0}
                onChange={(e) =>
                  updateAlex({
                    mp: { ...alex.mp, max: Number(e.target.value) || 0 },
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
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Physical Stats
        </Typography>
        <Grid container spacing={2}>
          {PHYSICAL_STATS.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat}>
              <StatInput
                label={stat}
                value={alex.baseStats?.[stat] || 0}
                bonus={alexTitleBonuses[stat] || 0}
                onChange={(value) => updateAlexStat(stat, value)}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Magical Stats Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
          Magical Stats
        </Typography>
        <Grid container spacing={2}>
          {MAGICAL_STATS.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat}>
              <StatInput
                label={stat}
                value={alex.baseStats?.[stat] || 0}
                bonus={alexTitleBonuses[stat] || 0}
                onChange={(value) => updateAlexStat(stat, value)}
                synced={stat === 'mana'}
                syncedFrom="Valtherion"
                syncedValue={stat === 'mana' ? syncedManaForAlex : 0}
              />
            </Grid>
          ))}
        </Grid>
        {syncedManaForAlex > 0 && (
          <Typography variant="body2" sx={{ mt: 2, color: 'success.light', fontStyle: 'italic' }}>
            * Mana includes +{syncedManaForAlex} from bond with Valtherion (half of Val's Mana stat)
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default BasicStats;

