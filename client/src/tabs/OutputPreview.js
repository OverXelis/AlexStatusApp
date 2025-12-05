import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Person as AlexIcon,
  Pets as ValIcon,
  SelectAll as BothIcon,
} from '@mui/icons-material';
import { useCharacter } from '../context/CharacterContext';
import { formatStatusScreen, formatBothStatusScreens } from '../utils/formatter';

function OutputPreview() {
  const { 
    alex, 
    valtherion, 
    showNotification,
    alexFinalStats,
    valFinalStats,
    alexDerivedStats,
    valDerivedStats,
    syncedManaForAlex,
  } = useCharacter();
  
  const [viewMode, setViewMode] = useState('alex');
  const [copied, setCopied] = useState(false);

  // Generate formatted output based on view mode
  const formattedOutput = useMemo(() => {
    switch (viewMode) {
      case 'alex':
        return formatStatusScreen(alex, {
          calculatedStats: alexFinalStats,
          derivedStats: alexDerivedStats,
          bondedMana: syncedManaForAlex,
        });
      case 'valtherion':
        return formatStatusScreen(valtherion, {
          calculatedStats: valFinalStats,
          derivedStats: valDerivedStats,
        });
      case 'both':
        return formatBothStatusScreens(alex, valtherion, {
          alexStats: alexFinalStats,
          alexDerived: alexDerivedStats,
          alexBondedMana: syncedManaForAlex,
          valStats: valFinalStats,
          valDerived: valDerivedStats,
        });
      default:
        return '';
    }
  }, [alex, valtherion, viewMode, alexFinalStats, valFinalStats, alexDerivedStats, valDerivedStats, syncedManaForAlex]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedOutput);
      setCopied(true);
      showNotification('success', 'Status copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('error', 'Failed to copy to clipboard');
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'alex':
        return `${alex?.name || 'Alex'}'s Status Screen`;
      case 'valtherion':
        return `${valtherion?.name || 'Valtherion'}'s Status Screen`;
      case 'both':
        return 'Combined Status Screens';
      default:
        return 'Status Screen';
    }
  };

  // Quick stats preview
  const getQuickStats = () => {
    if (viewMode === 'alex' || viewMode === 'both') {
      return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>Alex:</strong> Lvl {alex?.level} | 
            HP: {alexDerivedStats?.hp?.max} | 
            MP: {alexDerivedStats?.mp?.max} | 
            Will: {alexFinalStats?.willpower} | 
            Int: {alexFinalStats?.intellect}
          </Typography>
        </Box>
      );
    }
    if (viewMode === 'valtherion') {
      return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>Valtherion:</strong> Lvl {valtherion?.level} | 
            HP: {valDerivedStats?.hp?.max} | 
            MP: {valDerivedStats?.mp?.max} | 
            Mana: {valFinalStats?.mana}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      {/* Controls */}
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ color: 'primary.main', mb: 1 }}>
              Output Preview
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Preview and copy the formatted status screen for your novel
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="alex">
                <AlexIcon sx={{ mr: 0.5 }} />
                Alex
              </ToggleButton>
              <ToggleButton value="valtherion">
                <ValIcon sx={{ mr: 0.5 }} />
                Valtherion
              </ToggleButton>
              <ToggleButton value="both">
                <BothIcon sx={{ mr: 0.5 }} />
                Both
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="contained"
              startIcon={<CopyIcon />}
              onClick={handleCopy}
              sx={{
                bgcolor: 'success.main',
                '&:hover': {
                  bgcolor: 'success.dark',
                },
              }}
            >
              Copy Status
            </Button>
          </Box>
        </Box>
        {getQuickStats()}
      </Paper>

      {/* Preview Panel */}
      <Paper
        sx={{
          p: 3,
          flex: 1,
          overflow: 'auto',
          bgcolor: 'rgba(13, 13, 20, 0.8)',
          border: '2px solid',
          borderColor: 'primary.dark',
        }}
      >
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
          {getTitle()}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box
          component="pre"
          sx={{
            fontFamily: '"JetBrains Mono", "Courier New", monospace',
            fontSize: '0.95rem',
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
            '& strong, & b': {
              color: 'primary.main',
              fontWeight: 600,
            },
          }}
        >
          {formattedOutput || 'No data to preview'}
        </Box>
      </Paper>

      {/* Helpful Tips */}
      <Paper sx={{ p: 2, bgcolor: 'rgba(201, 162, 39, 0.05)' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <strong>Tip:</strong> The output is formatted for Notion with proper spacing and markdown. 
          Click "Copy Status" and paste directly into your document. The **bold** markers and 
          spacing will render correctly in Notion. Stats are automatically calculated based on 
          level, class, titles, and traits.
        </Typography>
      </Paper>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setCopied(false)}>
          Status copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default OutputPreview;
