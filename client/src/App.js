/**
 * Main Application Component
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This app uses configuration from /config/character.json for character names
 * and feature flags. The companion tab is conditionally rendered based on
 * config.companion.enabled.
 * 
 * When adding NEW TABS or FEATURES:
 * - Check if the feature should be conditional (use isFeatureEnabled())
 * - Use getMainName()/getCompanionName() for display labels
 * - Add feature flags to config if the feature is optional
 * ============================================================================
 */

import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Container, Typography, Alert, Snackbar, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import {
  Assessment as StatsIcon,
  AutoAwesome as SkillsIcon,
  EmojiEvents as TitlesIcon,
  Pets as CompanionIcon,
  Preview as PreviewIcon,
  History as HistoryIcon,
  PowerSettingsNew as ShutdownIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { CharacterProvider, useCharacter } from './context/CharacterContext';
import BasicStats from './tabs/BasicStats';
import Abilities from './tabs/Abilities';
import Titles from './tabs/Titles';
import Companion from './tabs/Companion';
import OutputPreview from './tabs/OutputPreview';
import SaveHistory from './tabs/SaveHistory';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AppContent() {
  const [tabValue, setTabValue] = useState(0);
  const [shutdownDialogOpen, setShutdownDialogOpen] = useState(false);
  const { 
    main, 
    companion, 
    notification, 
    clearNotification, 
    loading, 
    error,
    hasCompanion,
    getMainName,
    getCompanionName,
  } = useCharacter();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleShutdown = async () => {
    try {
      await axios.post('/api/shutdown');
      setShutdownDialogOpen(false);
    } catch (err) {
      console.log('Server shutdown initiated');
    }
  };

  // Dynamic character and companion names from config
  const characterName = main?.name || getMainName();
  const companionName = companion?.name || getCompanionName();

  // Build tabs array - companion tab is conditional
  const tabs = [
    { label: 'Basic Stats', icon: <StatsIcon /> },
    { label: 'Skills', icon: <SkillsIcon /> },
    { label: 'Titles', icon: <TitlesIcon /> },
  ];
  
  // Only add companion tab if companion is enabled in config
  if (hasCompanion) {
    tabs.push({ label: companionName, icon: <CompanionIcon /> });
  }
  
  // Always add output and history tabs
  tabs.push(
    { label: 'Output', icon: <PreviewIcon /> },
    { label: 'History', icon: <HistoryIcon /> }
  );

  // Calculate tab indices (they shift if companion is disabled)
  const getTabIndex = (tabName) => {
    const tabNames = ['stats', 'skills', 'titles'];
    if (hasCompanion) tabNames.push('companion');
    tabNames.push('output', 'history');
    return tabNames.indexOf(tabName);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d0d14 0%, #1a1a2e 50%, #16213e 100%)',
        }}
      >
        <Typography variant="h4" sx={{ color: 'primary.main' }}>
          Loading Character Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d0d14 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg, rgba(201, 162, 39, 0.1) 0%, rgba(107, 91, 149, 0.1) 100%)',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 0,
          py: 2,
          px: 3,
          position: 'relative',
        }}
      >
        {/* Shutdown Button */}
        <Tooltip title="Shutdown Server">
          <IconButton
            onClick={() => setShutdownDialogOpen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.secondary',
              '&:hover': {
                color: 'error.main',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              },
            }}
          >
            <ShutdownIcon />
          </IconButton>
        </Tooltip>

        <Typography
          variant="h3"
          component="h1"
          sx={{
            textAlign: 'center',
            color: 'primary.main',
            textShadow: '0 0 20px rgba(201, 162, 39, 0.3)',
            letterSpacing: '0.1em',
          }}
        >
          {characterName}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mt: 0.5,
          }}
        >
          Status Screen
        </Typography>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(26, 26, 46, 0.8)',
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 3,
              },
              '& .MuiTab-root': {
                minHeight: 64,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
                '&:hover': {
                  color: 'primary.light',
                  backgroundColor: 'rgba(201, 162, 39, 0.05)',
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ gap: 1 }}
              />
            ))}
          </Tabs>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Container maxWidth="xl" sx={{ py: 3, height: '100%' }}>
          <TabPanel value={tabValue} index={getTabIndex('stats')}>
            <BasicStats />
          </TabPanel>
          <TabPanel value={tabValue} index={getTabIndex('skills')}>
            <Abilities />
          </TabPanel>
          <TabPanel value={tabValue} index={getTabIndex('titles')}>
            <Titles />
          </TabPanel>
          {hasCompanion && (
            <TabPanel value={tabValue} index={getTabIndex('companion')}>
              <Companion />
            </TabPanel>
          )}
          <TabPanel value={tabValue} index={getTabIndex('output')}>
            <OutputPreview />
          </TabPanel>
          <TabPanel value={tabValue} index={getTabIndex('history')}>
            <SaveHistory />
          </TabPanel>
        </Container>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={clearNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={clearNotification}
          severity={notification?.type || 'success'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      {/* Shutdown Confirmation Dialog */}
      <Dialog open={shutdownDialogOpen} onClose={() => setShutdownDialogOpen(false)}>
        <DialogTitle>Shutdown Server?</DialogTitle>
        <DialogContent>
          <Typography>
            This will stop both the backend server and close the app. You'll need to run <code>npm start</code> again to restart.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShutdownDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShutdown} color="error" variant="contained">
            Shutdown
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function App() {
  return (
    <CharacterProvider>
      <AppContent />
    </CharacterProvider>
  );
}

export default App;
