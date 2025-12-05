/**
 * Character Configuration
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This file loads character-specific configuration. When creating a new
 * character app from this template:
 * 
 * 1. Edit /config/character.json to set character names and features
 * 2. The app will automatically adapt to use those names
 * 3. Set companion.enabled = false if the character has no companion
 * 
 * When adding NEW FEATURES, consider:
 * - Should this feature be toggle-able in the config?
 * - Does it apply to main character, companion, or both?
 * - Use getMainName()/getCompanionName() instead of hardcoded names
 * ============================================================================
 */

// Default configuration (used if config file isn't loaded yet)
const defaultConfig = {
  appTitle: "Status Screen",
  mainCharacter: {
    name: "Character",
    defaultClass: "",
    pronouns: "they/them"
  },
  companion: {
    enabled: false,
    name: "Companion",
    type: "companion",
    bondType: null,
    pronouns: "they/them"
  },
  bond: {
    enabled: false,
    syncRules: []
  },
  features: {
    traits: true,
    titles: true,
    bondSkills: true,
    activeSkills: true,
    passiveSkills: true,
    boundItems: true,
    statBoosts: true,
    classHistory: true,
    levelSnapshots: true
  },
  ui: {
    theme: "dark-fantasy",
    primaryColor: "#C9A227",
    accentColor: "#6B5B95"
  }
};

// This will be populated by the API call
let loadedConfig = null;

/**
 * Load configuration from the server
 * Called once at app startup
 */
export async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      loadedConfig = await response.json();
    }
  } catch (err) {
    console.warn('Could not load character config, using defaults:', err);
  }
  return getConfig();
}

/**
 * Get the current configuration
 * Returns loaded config or defaults
 */
export function getConfig() {
  return loadedConfig || defaultConfig;
}

/**
 * Get the main character's display name
 * USE THIS instead of hardcoding character names!
 */
export function getMainName() {
  return getConfig().mainCharacter?.name || 'Character';
}

/**
 * Get the companion's display name
 * USE THIS instead of hardcoding companion names!
 */
export function getCompanionName() {
  return getConfig().companion?.name || 'Companion';
}

/**
 * Check if companion feature is enabled
 */
export function hasCompanion() {
  return getConfig().companion?.enabled === true;
}

/**
 * Check if bond/sync features are enabled
 */
export function hasBond() {
  return getConfig().bond?.enabled === true && hasCompanion();
}

/**
 * Check if a specific feature is enabled
 * @param {string} featureName - Feature key from config.features
 */
export function isFeatureEnabled(featureName) {
  const features = getConfig().features || {};
  // Default to true if not specified (backwards compatibility)
  return features[featureName] !== false;
}

/**
 * Get bond sync rules
 * Returns array of sync rules or empty array
 */
export function getBondSyncRules() {
  if (!hasBond()) return [];
  return getConfig().bond?.syncRules || [];
}

/**
 * Get UI theme settings
 */
export function getUIConfig() {
  return getConfig().ui || defaultConfig.ui;
}

const characterConfigExports = {
  loadConfig,
  getConfig,
  getMainName,
  getCompanionName,
  hasCompanion,
  hasBond,
  isFeatureEnabled,
  getBondSyncRules,
  getUIConfig,
};

export default characterConfigExports;

