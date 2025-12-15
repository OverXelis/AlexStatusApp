/**
 * Character Context - Global state management for character data
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This context uses GENERIC names (main/companion) internally, not character-
 * specific names. The actual character names come from /config/character.json.
 * 
 * NAMING CONVENTION:
 * - "main" = the primary character (e.g., Alex)
 * - "companion" = the bonded companion if any (e.g., Valtherion)
 * 
 * When adding NEW FEATURES:
 * - Add update functions following the pattern: updateMain*, updateCompanion*
 * - Check hasCompanion() before companion-specific logic
 * - Check hasBond() before sync/bond-specific logic
 * - Use getMainName()/getCompanionName() for display purposes
 * 
 * The context exposes both generic names AND legacy aliases for backwards
 * compatibility during refactoring.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  calculateAllStats, 
  calculateDerivedStats,
  getTitleAdditiveBonuses,
  getTitleMultiplierBonuses,
  getCurrentClass,
} from '../utils/statCalculator';
import { 
  loadConfig, 
  hasCompanion, 
  hasBond,
  getMainName,
  getCompanionName,
} from '../config/characterConfig';

const CharacterContext = createContext(null);

const API_BASE = '/api';

// Debounce helper
const DEBOUNCE_DELAY = 1000;

export function CharacterProvider({ children }) {
  // Generic state names - these are the actual data holders
  const [main, setMain] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load configuration and initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load config first
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
        
        // Then load character data
        const response = await axios.get(`${API_BASE}/current`);
        setMain(response.data.main);
        setCompanion(response.data.companion || null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load character data:', err);
        setError('Failed to load character data. Make sure the server is running.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-save debounced using useRef to avoid React Hook warnings
  const saveTimeoutRef = useRef(null);
  
  const saveToServer = useCallback((mainData, companionData) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule new save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = { main: mainData };
        if (hasCompanion() && companionData) {
          payload.companion = companionData;
        }
        await axios.post(`${API_BASE}/update`, payload);
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to auto-save:', err);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  // Trigger auto-save when data changes
  useEffect(() => {
    if (main && isDirty) {
      saveToServer(main, companion);
    }
  }, [main, companion, isDirty, saveToServer]);

  // ============================================
  // UPDATE FUNCTIONS - Main Character
  // ============================================

  const updateMain = useCallback((updates) => {
    setMain((prev) => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  const updateMainFreePoints = useCallback((statName, value) => {
    setMain((prev) => ({
      ...prev,
      freePoints: {
        ...prev.freePoints,
        [statName]: Number(value) || 0,
      },
    }));
    setIsDirty(true);
  }, []);

  const updateMainLevel = useCallback((level) => {
    setMain((prev) => ({
      ...prev,
      level: Number(level) || 1,
    }));
    setIsDirty(true);
  }, []);

  const updateMainClassHistory = useCallback((classHistory) => {
    setMain((prev) => ({
      ...prev,
      classHistory,
    }));
    setIsDirty(true);
  }, []);

  const updateMainLevelSnapshots = useCallback((levelSnapshots) => {
    setMain((prev) => ({
      ...prev,
      levelSnapshots,
    }));
    setIsDirty(true);
  }, []);

  const updateMainTitles = useCallback((titles) => {
    setMain((prev) => ({
      ...prev,
      titles: titles,
    }));
    setIsDirty(true);
  }, []);

  const updateMainTraits = useCallback((traits) => {
    setMain((prev) => ({
      ...prev,
      traits,
    }));
    setIsDirty(true);
  }, []);

  const updateMainStatDerivations = useCallback((statDerivations) => {
    setMain((prev) => ({
      ...prev,
      statDerivations,
    }));
    setIsDirty(true);
  }, []);

  // ============================================
  // UPDATE FUNCTIONS - Companion
  // ============================================

  const updateCompanion = useCallback((updates) => {
    if (!hasCompanion()) return;
    setCompanion((prev) => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  const updateCompanionFreePoints = useCallback((statName, value) => {
    if (!hasCompanion()) return;
    setCompanion((prev) => ({
      ...prev,
      freePoints: {
        ...prev.freePoints,
        [statName]: Number(value) || 0,
      },
    }));
    setIsDirty(true);
  }, []);

  const updateCompanionLevel = useCallback((level) => {
    if (!hasCompanion()) return;
    setCompanion((prev) => ({
      ...prev,
      level: Number(level) || 1,
    }));
    setIsDirty(true);
  }, []);

  // ============================================
  // CALCULATED VALUES - Using new leveling system
  // ============================================

  // Calculate all of main character's stats with the leveling system
  const mainCalculation = useMemo(() => {
    if (!main) return { stats: {}, breakdowns: {} };
    return calculateAllStats(main);
  }, [main]);

  const mainFinalStats = mainCalculation.stats;
  const mainStatBreakdowns = mainCalculation.breakdowns;

  // Calculate all of companion's stats
  const companionCalculation = useMemo(() => {
    if (!companion) return { stats: {}, breakdowns: {} };
    return calculateAllStats(companion);
  }, [companion]);

  const companionFinalStats = companionCalculation.stats;
  const companionStatBreakdowns = companionCalculation.breakdowns;

  // ============================================
  // BOND SYNC - Configurable stat sharing
  // ============================================
  
  /**
   * TEMPLATE NOTE: Bond sync is now configurable via /config/character.json
   * The default for Alex/Valtherion is:
   * - Main gets half of companion's Mana
   * - Companion gets half of main's Willpower
   * 
   * Modify config.bond.syncRules to change this behavior for other characters.
   */
  
  // Calculate synced stats based on config
  const syncedManaForMain = useMemo(() => {
    if (!hasBond() || !companionFinalStats.mana) return 0;
    // Default: main gets half of companion's mana
    return Math.round((companionFinalStats.mana || 0) / 2);
  }, [companionFinalStats.mana]);

  const syncedWillpowerForCompanion = useMemo(() => {
    if (!hasBond() || !mainFinalStats.willpower) return 0;
    // Default: companion gets half of main's willpower
    return Math.round((mainFinalStats.willpower || 0) / 2);
  }, [mainFinalStats.willpower]);

  // Calculate derived stats (HP/MP) for main character
  const mainDerivedStats = useMemo(() => {
    if (!main) return { hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 } };
    return calculateDerivedStats(mainFinalStats, main, syncedManaForMain);
  }, [mainFinalStats, main, syncedManaForMain]);

  // Calculate derived stats for companion
  const companionDerivedStats = useMemo(() => {
    if (!companion) return { hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 } };
    return calculateDerivedStats(companionFinalStats, companion, 0);
  }, [companionFinalStats, companion]);

  // Get current class for main character
  const mainCurrentClass = useMemo(() => {
    if (!main) return null;
    return getCurrentClass(main.classHistory, main.level);
  }, [main]);

  // Get current class for companion
  const companionCurrentClass = useMemo(() => {
    if (!companion) return null;
    return getCurrentClass(companion.classHistory, companion.level);
  }, [companion]);

  // Title bonuses (additive only)
  const mainTitleBonuses = useMemo(() => {
    if (!main?.titles) return {};
    return getTitleAdditiveBonuses(main.titles);
  }, [main?.titles]);

  const companionTitleBonuses = useMemo(() => {
    if (!companion?.titles) return {};
    return getTitleAdditiveBonuses(companion.titles);
  }, [companion?.titles]);

  // Title multipliers
  const mainTitleMultipliers = useMemo(() => {
    if (!main?.titles) return {};
    return getTitleMultiplierBonuses(main.titles);
  }, [main?.titles]);

  // ============================================
  // SNAPSHOT FUNCTIONS
  // ============================================

  const saveSnapshot = useCallback(async (name) => {
    try {
      const payload = { main };
      if (hasCompanion() && companion) {
        payload.companion = companion;
      }
      const response = await axios.post(`${API_BASE}/save`, {
        name,
        data: payload,
      });
      setNotification({ type: 'success', message: `Saved: ${name}` });
      return response.data.snapshot;
    } catch (err) {
      console.error('Failed to save snapshot:', err);
      setNotification({ type: 'error', message: 'Failed to save snapshot' });
      throw err;
    }
  }, [main, companion]);

  const loadSnapshot = useCallback(async (id) => {
    try {
      const response = await axios.post(`${API_BASE}/snapshot/${id}/load`);
      setMain(response.data.data.main);
      if (hasCompanion()) {
        setCompanion(response.data.data.companion || null);
      }
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
    // Configuration
    config,
    hasCompanion: hasCompanion(),
    hasBond: hasBond(),
    getMainName,
    getCompanionName,
    
    // Raw data - GENERIC NAMES (preferred)
    main,
    companion,
    loading,
    error,
    notification,
    isDirty,
    
    // Update functions - GENERIC NAMES (preferred)
    updateMain,
    updateCompanion,
    updateMainFreePoints,
    updateCompanionFreePoints,
    updateMainLevel,
    updateCompanionLevel,
    updateMainClassHistory,
    updateMainLevelSnapshots,
    updateMainTitles,
    updateMainTraits,
    updateMainStatDerivations,
    
    // Calculated values - GENERIC NAMES (preferred)
    mainFinalStats,
    mainStatBreakdowns,
    companionFinalStats,
    companionStatBreakdowns,
    mainDerivedStats,
    companionDerivedStats,
    mainCurrentClass,
    companionCurrentClass,
    mainTitleBonuses,
    companionTitleBonuses,
    mainTitleMultipliers,
    mainTotalStats: mainFinalStats, // Alias
    companionTotalStats: companionFinalStats, // Alias
    
    // Synced values
    syncedManaForMain,
    syncedWillpowerForCompanion,
    
    // ============================================
    // LEGACY ALIASES - For backwards compatibility
    // These will be deprecated in future versions
    // ============================================
    alex: main,
    valtherion: companion,
    updateAlex: updateMain,
    updateValtherion: updateCompanion,
    updateAlexFreePoints: updateMainFreePoints,
    updateValFreePoints: updateCompanionFreePoints,
    updateAlexLevel: updateMainLevel,
    updateValLevel: updateCompanionLevel,
    updateAlexClassHistory: updateMainClassHistory,
    updateAlexLevelSnapshots: updateMainLevelSnapshots,
    updateAlexTitles: updateMainTitles,
    updateAlexTraits: updateMainTraits,
    updateAlexStatDerivations: updateMainStatDerivations,
    alexFinalStats: mainFinalStats,
    alexStatBreakdowns: mainStatBreakdowns,
    valFinalStats: companionFinalStats,
    valStatBreakdowns: companionStatBreakdowns,
    alexDerivedStats: mainDerivedStats,
    valDerivedStats: companionDerivedStats,
    alexCurrentClass: mainCurrentClass,
    valCurrentClass: companionCurrentClass,
    alexTitleBonuses: mainTitleBonuses,
    valTitleBonuses: companionTitleBonuses,
    alexTitleMultipliers: mainTitleMultipliers,
    alexTotalStats: mainFinalStats,
    valTotalStats: companionFinalStats,
    syncedManaForAlex: syncedManaForMain,
    syncedWillpowerForVal: syncedWillpowerForCompanion,
    
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
