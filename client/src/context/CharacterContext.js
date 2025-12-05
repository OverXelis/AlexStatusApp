import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { calculateTitleBonuses, calculateTotalStats } from '../utils/statCalculator';

const CharacterContext = createContext(null);

const API_BASE = '/api';

// Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export function CharacterProvider({ children }) {
  const [alex, setAlex] = useState(null);
  const [valtherion, setValtherion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/current`);
        setAlex(response.data.alex);
        setValtherion(response.data.valtherion);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load character data:', err);
        setError('Failed to load character data. Make sure the server is running.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-save debounced
  const saveToServer = useCallback(
    debounce(async (alexData, valData) => {
      try {
        await axios.post(`${API_BASE}/update`, {
          alex: alexData,
          valtherion: valData,
        });
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to auto-save:', err);
      }
    }, 1000),
    []
  );

  // Trigger auto-save when data changes
  useEffect(() => {
    if (alex && valtherion && isDirty) {
      saveToServer(alex, valtherion);
    }
  }, [alex, valtherion, isDirty, saveToServer]);

  // Update Alex's data
  const updateAlex = useCallback((updates) => {
    setAlex((prev) => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  // Update Valtherion's data
  const updateValtherion = useCallback((updates) => {
    setValtherion((prev) => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  // Update Alex's base stats
  const updateAlexStat = useCallback((statName, value) => {
    setAlex((prev) => ({
      ...prev,
      baseStats: {
        ...prev.baseStats,
        [statName]: Number(value) || 0,
      },
    }));
    setIsDirty(true);
  }, []);

  // Update Valtherion's base stats
  const updateValStat = useCallback((statName, value) => {
    setValtherion((prev) => ({
      ...prev,
      baseStats: {
        ...prev.baseStats,
        [statName]: Number(value) || 0,
      },
    }));
    setIsDirty(true);
  }, []);

  // Update Alex's titles
  const updateAlexTitles = useCallback((titles) => {
    setAlex((prev) => ({
      ...prev,
      titles: titles,
    }));
    setIsDirty(true);
  }, []);

  // Calculate Alex's title bonuses
  const alexTitleBonuses = useMemo(() => {
    if (!alex?.titles) return {};
    return calculateTitleBonuses(alex.titles);
  }, [alex?.titles]);

  // Calculate Alex's total stats (base + title bonuses)
  const alexTotalStats = useMemo(() => {
    if (!alex?.baseStats) return {};
    return calculateTotalStats(alex.baseStats, alexTitleBonuses);
  }, [alex?.baseStats, alexTitleBonuses]);

  // Calculate Valtherion's title bonuses
  const valTitleBonuses = useMemo(() => {
    if (!valtherion?.titles) return {};
    return calculateTitleBonuses(valtherion.titles);
  }, [valtherion?.titles]);

  // Calculate Valtherion's total stats
  const valTotalStats = useMemo(() => {
    if (!valtherion?.baseStats) return {};
    return calculateTotalStats(valtherion.baseStats, valTitleBonuses);
  }, [valtherion?.baseStats, valTitleBonuses]);

  // Calculate synced stats
  // Alex gets half of Valtherion's Mana
  const syncedManaForAlex = useMemo(() => {
    if (!valtherion?.baseStats?.mana) return 0;
    return Math.floor(valtherion.baseStats.mana / 2);
  }, [valtherion?.baseStats?.mana]);

  // Valtherion gets half of Alex's Willpower
  const syncedWillpowerForVal = useMemo(() => {
    if (!alex?.baseStats?.willpower) return 0;
    return Math.floor(alex.baseStats.willpower / 2);
  }, [alex?.baseStats?.willpower]);

  // Save snapshot
  const saveSnapshot = useCallback(async (name) => {
    try {
      const response = await axios.post(`${API_BASE}/save`, {
        name,
        data: { alex, valtherion },
      });
      setNotification({ type: 'success', message: `Saved: ${name}` });
      return response.data.snapshot;
    } catch (err) {
      console.error('Failed to save snapshot:', err);
      setNotification({ type: 'error', message: 'Failed to save snapshot' });
      throw err;
    }
  }, [alex, valtherion]);

  // Load snapshot
  const loadSnapshot = useCallback(async (id) => {
    try {
      const response = await axios.post(`${API_BASE}/snapshot/${id}/load`);
      setAlex(response.data.data.alex);
      setValtherion(response.data.data.valtherion);
      setNotification({ type: 'success', message: 'Snapshot loaded' });
      return response.data;
    } catch (err) {
      console.error('Failed to load snapshot:', err);
      setNotification({ type: 'error', message: 'Failed to load snapshot' });
      throw err;
    }
  }, []);

  // Clear notification
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Show notification
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const value = {
    alex,
    valtherion,
    loading,
    error,
    notification,
    isDirty,
    
    // Update functions
    updateAlex,
    updateValtherion,
    updateAlexStat,
    updateValStat,
    updateAlexTitles,
    
    // Calculated values
    alexTitleBonuses,
    alexTotalStats,
    valTitleBonuses,
    valTotalStats,
    syncedManaForAlex,
    syncedWillpowerForVal,
    
    // Snapshot functions
    saveSnapshot,
    loadSnapshot,
    
    // Notification functions
    clearNotification,
    showNotification,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

export default CharacterContext;

