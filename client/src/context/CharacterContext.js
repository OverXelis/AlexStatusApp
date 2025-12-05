import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  calculateAllStats, 
  calculateDerivedStats,
  getTitleAdditiveBonuses,
  getTitleMultiplierBonuses,
  getCurrentClass,
} from '../utils/statCalculator';

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

  // Update Alex's free points for a stat
  const updateAlexFreePoints = useCallback((statName, value) => {
    setAlex((prev) => ({
      ...prev,
      freePoints: {
        ...prev.freePoints,
        [statName]: Number(value) || 0,
      },
    }));
    setIsDirty(true);
  }, []);

  // Update Valtherion's free points
  const updateValFreePoints = useCallback((statName, value) => {
    setValtherion((prev) => ({
      ...prev,
      freePoints: {
        ...prev.freePoints,
        [statName]: Number(value) || 0,
      },
    }));
    setIsDirty(true);
  }, []);

  // Update Alex's level
  const updateAlexLevel = useCallback((level) => {
    setAlex((prev) => ({
      ...prev,
      level: Number(level) || 1,
    }));
    setIsDirty(true);
  }, []);

  // Update Valtherion's level
  const updateValLevel = useCallback((level) => {
    setValtherion((prev) => ({
      ...prev,
      level: Number(level) || 1,
    }));
    setIsDirty(true);
  }, []);

  // Update Alex's class history
  const updateAlexClassHistory = useCallback((classHistory) => {
    setAlex((prev) => ({
      ...prev,
      classHistory,
    }));
    setIsDirty(true);
  }, []);

  // Update Alex's level snapshots
  const updateAlexLevelSnapshots = useCallback((levelSnapshots) => {
    setAlex((prev) => ({
      ...prev,
      levelSnapshots,
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

  // Update Alex's traits
  const updateAlexTraits = useCallback((traits) => {
    setAlex((prev) => ({
      ...prev,
      traits,
    }));
    setIsDirty(true);
  }, []);

  // Update Alex's stat derivations
  const updateAlexStatDerivations = useCallback((statDerivations) => {
    setAlex((prev) => ({
      ...prev,
      statDerivations,
    }));
    setIsDirty(true);
  }, []);

  // ============================================
  // CALCULATED VALUES - Using new leveling system
  // ============================================

  // Calculate all of Alex's stats with the leveling system
  const alexCalculation = useMemo(() => {
    if (!alex) return { stats: {}, breakdowns: {} };
    return calculateAllStats(alex);
  }, [alex]);

  const alexFinalStats = alexCalculation.stats;
  const alexStatBreakdowns = alexCalculation.breakdowns;

  // Calculate all of Valtherion's stats
  const valCalculation = useMemo(() => {
    if (!valtherion) return { stats: {}, breakdowns: {} };
    return calculateAllStats(valtherion);
  }, [valtherion]);

  const valFinalStats = valCalculation.stats;
  const valStatBreakdowns = valCalculation.breakdowns;

  // Calculate synced stats
  // Alex gets half of Valtherion's final Mana
  const syncedManaForAlex = useMemo(() => {
    return Math.round((valFinalStats.mana || 0) / 2);
  }, [valFinalStats.mana]);

  // Valtherion gets half of Alex's final Willpower
  const syncedWillpowerForVal = useMemo(() => {
    return Math.round((alexFinalStats.willpower || 0) / 2);
  }, [alexFinalStats.willpower]);

  // Calculate derived stats (HP/MP) for Alex
  const alexDerivedStats = useMemo(() => {
    if (!alex) return { hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 } };
    return calculateDerivedStats(alexFinalStats, alex, syncedManaForAlex);
  }, [alexFinalStats, alex, syncedManaForAlex]);

  // Calculate derived stats for Valtherion
  const valDerivedStats = useMemo(() => {
    if (!valtherion) return { hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 } };
    return calculateDerivedStats(valFinalStats, valtherion, 0);
  }, [valFinalStats, valtherion]);

  // Get current class for Alex
  const alexCurrentClass = useMemo(() => {
    if (!alex) return null;
    return getCurrentClass(alex.classHistory, alex.level);
  }, [alex]);

  // Get current class for Valtherion
  const valCurrentClass = useMemo(() => {
    if (!valtherion) return null;
    return getCurrentClass(valtherion.classHistory, valtherion.level);
  }, [valtherion]);

  // Legacy: Title bonuses (additive only, for backwards compatibility)
  const alexTitleBonuses = useMemo(() => {
    if (!alex?.titles) return {};
    return getTitleAdditiveBonuses(alex.titles);
  }, [alex?.titles]);

  const valTitleBonuses = useMemo(() => {
    if (!valtherion?.titles) return {};
    return getTitleAdditiveBonuses(valtherion.titles);
  }, [valtherion?.titles]);

  // Title multipliers
  const alexTitleMultipliers = useMemo(() => {
    if (!alex?.titles) return {};
    return getTitleMultiplierBonuses(alex.titles);
  }, [alex?.titles]);

  // ============================================
  // SNAPSHOT FUNCTIONS
  // ============================================

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

  // ============================================
  // NOTIFICATION FUNCTIONS
  // ============================================

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    // Raw data
    alex,
    valtherion,
    loading,
    error,
    notification,
    isDirty,
    
    // Update functions
    updateAlex,
    updateValtherion,
    updateAlexFreePoints,
    updateValFreePoints,
    updateAlexLevel,
    updateValLevel,
    updateAlexClassHistory,
    updateAlexLevelSnapshots,
    updateAlexTitles,
    updateAlexTraits,
    updateAlexStatDerivations,
    
    // Calculated values - NEW leveling system
    alexFinalStats,
    alexStatBreakdowns,
    valFinalStats,
    valStatBreakdowns,
    alexDerivedStats,
    valDerivedStats,
    alexCurrentClass,
    valCurrentClass,
    
    // Synced values
    syncedManaForAlex,
    syncedWillpowerForVal,
    
    // Legacy compatibility
    alexTitleBonuses,
    valTitleBonuses,
    alexTitleMultipliers,
    alexTotalStats: alexFinalStats, // Alias for backwards compat
    valTotalStats: valFinalStats,
    
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
