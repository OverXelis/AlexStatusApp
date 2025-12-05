/**
 * Comprehensive stat calculation engine for litRPG leveling system
 * 
 * ============================================================================
 * TEMPLATE NOTE FOR DEVELOPERS:
 * ============================================================================
 * This utility is FULLY GENERIC and works with any character object. It does
 * not contain any character-specific logic. When adding new calculation
 * features, keep them generic by operating on character objects rather than
 * specific named characters.
 * 
 * All functions expect a character object with structure matching the schema
 * defined in data/current.json (under "main" or "companion" keys).
 * ============================================================================
 */

/**
 * Physical stat names for grouping
 */
export const PHYSICAL_STATS = ['strength', 'agility', 'constitution', 'vitality'];

/**
 * Magical stat names for grouping
 */
export const MAGICAL_STATS = ['intellect', 'willpower', 'mana', 'wisdom'];

/**
 * All stat names
 */
export const ALL_STATS = [...PHYSICAL_STATS, ...MAGICAL_STATS];

/**
 * Display names for stats
 */
export const STAT_DISPLAY_NAMES = {
  strength: 'Strength',
  agility: 'Agility',
  constitution: 'Constitution',
  vitality: 'Vitality',
  intellect: 'Intellect',
  willpower: 'Willpower',
  mana: 'Mana',
  wisdom: 'Wisdom',
};

/**
 * Skill rank order for sorting and comparison
 */
export const SKILL_RANKS = ['Novice', 'Journeyman', 'Adept', 'Expert', 'Master', 'Grandmaster'];

/**
 * Passive skill tiers
 */
export const PASSIVE_TIERS = ['I', 'II', 'III', 'IV', 'V'];

/**
 * Trait effect types
 */
export const TRAIT_EFFECT_TYPES = [
  { value: 'stat_multiplier', label: 'Stat Multiplier (×N for all gains)' },
  { value: 'redirect_free_points', label: 'Redirect Free Points to Stat' },
  { value: 'stat_derivation', label: 'Derive % of One Stat to Another' },
];

/**
 * Get the most recent snapshot level that is <= current level
 */
export function getMostRecentSnapshotLevel(levelSnapshots, currentLevel) {
  if (!levelSnapshots) return null;
  
  const levels = Object.keys(levelSnapshots)
    .map(Number)
    .filter(lvl => lvl <= currentLevel)
    .sort((a, b) => b - a);
  
  return levels.length > 0 ? levels[0] : null;
}

/**
 * Get the stat value from a snapshot, handling both old format (direct values) and new format (nested stats)
 * Old format: { strength: 10, agility: 15, ... }
 * New format: { stats: { strength: 10, ... }, includedTitleBonuses: { ... }, ... }
 */
export function getSnapshotStatValue(snapshot, statName) {
  if (!snapshot) return 0;
  
  // New format with nested stats object
  if (snapshot.stats && typeof snapshot.stats === 'object') {
    return Number(snapshot.stats[statName]) || 0;
  }
  
  // Old format with direct values
  return Number(snapshot[statName]) || 0;
}

/**
 * Get the title bonuses that were baked into a snapshot
 * Returns { additive: number, multiplier: number, rawAdditive: number, traitMultiplier: number } for the given stat
 */
export function getSnapshotIncludedTitleBonuses(snapshot, statName) {
  if (!snapshot) return { additive: 0, multiplier: 0, rawAdditive: 0, traitMultiplier: 1 };
  
  // New format stores raw values and trait multipliers
  const rawAdditive = snapshot.rawTitleBonuses?.[statName] || 0;
  const traitMult = snapshot.includedTraitMultipliers?.[statName] || 1;
  
  // For backwards compatibility, also check old format
  const additive = snapshot.includedTitleBonuses?.[statName] || (rawAdditive * traitMult);
  const multiplier = snapshot.includedTitleMultipliers?.[statName] || 0;
  
  return { additive, multiplier, rawAdditive, traitMultiplier: traitMult };
}

/**
 * Get derivation bonuses that were baked into a snapshot
 * Returns the derivation bonus for the given stat
 */
export function getSnapshotIncludedDerivation(snapshot, statName) {
  if (!snapshot) return 0;
  return snapshot.includedDerivationBonuses?.[statName] || 0;
}

/**
 * Get the stat boosts that were baked into a snapshot (for Valtherion)
 */
export function getSnapshotIncludedStatBoosts(snapshot, statName) {
  if (!snapshot) return { additive: 0, multiplier: 0 };
  
  const additive = snapshot.includedStatBoostBonuses?.[statName] || 0;
  const multiplier = snapshot.includedStatBoostMultipliers?.[statName] || 0;
  
  return { additive, multiplier };
}

/**
 * Get the current class based on level
 */
export function getCurrentClass(classHistory, level) {
  if (!classHistory || classHistory.length === 0) return null;
  
  // Find the class that covers the current level
  for (const cls of classHistory) {
    const start = cls.startLevel || 0;
    const end = cls.endLevel || Infinity;
    if (level >= start && level <= end) {
      return cls;
    }
  }
  
  // If no match, return the last class (current one with null endLevel)
  return classHistory[classHistory.length - 1];
}

/**
 * Get all trait multipliers for a specific stat
 */
export function getTraitMultiplier(traits, statName) {
  let multiplier = 1;
  
  if (!traits?.items) return multiplier;
  
  traits.items.forEach(trait => {
    if (trait.effects) {
      trait.effects.forEach(effect => {
        if (effect.type === 'stat_multiplier' && effect.stat === statName) {
          multiplier *= (effect.multiplier || 1);
        }
      });
    }
  });
  
  return multiplier;
}

/**
 * Get all stat derivations from traits
 * Returns array of { sourceStat, targetStat, percent }
 */
export function getStatDerivations(traits) {
  const derivations = [];
  
  if (!traits?.items) return derivations;
  
  traits.items.forEach(trait => {
    if (trait.effects) {
      trait.effects.forEach(effect => {
        if (effect.type === 'stat_derivation') {
          derivations.push({
            sourceStat: effect.sourceStat,
            targetStat: effect.targetStat,
            percent: effect.percent || 0,
          });
        }
      });
    }
  });
  
  return derivations;
}

/**
 * Get redirected free points from traits
 * If a trait has 'redirect_free_points' effect, calculate automatic free points
 * Characters earn 3 free points per level-up
 * @param {object} traits - Character traits
 * @param {number} level - Current character level
 * @param {number} fromLevel - Starting level for calculation (defaults to 1, but should be snapshot level)
 * @returns {object} - { targetStat: string|null, points: number }
 */
export function getRedirectedFreePoints(traits, level, fromLevel = 1) {
  if (!traits?.items) return { targetStat: null, points: 0 };
  
  for (const trait of traits.items) {
    if (trait.effects) {
      const redirect = trait.effects.find(e => e.type === 'redirect_free_points');
      if (redirect && redirect.toStat) {
        // 3 free points per level-up from fromLevel to current level
        const freePointsPerLevel = 3;
        const levelUps = Math.max(0, level - fromLevel);
        return { 
          targetStat: redirect.toStat, 
          points: freePointsPerLevel * levelUps 
        };
      }
    }
  }
  
  return { targetStat: null, points: 0 };
}

/**
 * Calculate title additive bonuses per stat
 * Only includes enabled titles (enabled !== false)
 */
export function getTitleAdditiveBonuses(titles) {
  const bonuses = {};
  ALL_STATS.forEach(stat => bonuses[stat] = 0);
  
  if (!titles || !Array.isArray(titles)) return bonuses;
  
  titles.forEach(title => {
    // Skip disabled titles (enabled === false means disabled, undefined means enabled)
    if (title.enabled === false) return;
    
    if (title.bonuses && Array.isArray(title.bonuses)) {
      title.bonuses.forEach(bonus => {
        if (bonus.stat && bonuses.hasOwnProperty(bonus.stat)) {
          bonuses[bonus.stat] += Number(bonus.additive) || Number(bonus.value) || 0;
        }
      });
    }
  });
  
  return bonuses;
}

/**
 * Calculate title multiplicative bonuses per stat
 * Returns the sum of multipliers (to be used as: value * (1 + multiplierSum))
 * Only includes enabled titles (enabled !== false)
 */
export function getTitleMultiplierBonuses(titles) {
  const multipliers = {};
  ALL_STATS.forEach(stat => multipliers[stat] = 0);
  
  if (!titles || !Array.isArray(titles)) return multipliers;
  
  titles.forEach(title => {
    // Skip disabled titles (enabled === false means disabled, undefined means enabled)
    if (title.enabled === false) return;
    
    if (title.bonuses && Array.isArray(title.bonuses)) {
      title.bonuses.forEach(bonus => {
        if (bonus.stat && multipliers.hasOwnProperty(bonus.stat)) {
          multipliers[bonus.stat] += Number(bonus.multiplier) || 0;
        }
      });
    }
  });
  
  return multipliers;
}

/**
 * Calculate stat boost additive bonuses per stat (for beasts - body tempering, fruits, etc.)
 * Only includes enabled boosts (enabled !== false)
 */
export function getStatBoostAdditiveBonuses(statBoosts) {
  const bonuses = {};
  ALL_STATS.forEach(stat => bonuses[stat] = 0);
  
  if (!statBoosts || !Array.isArray(statBoosts)) return bonuses;
  
  statBoosts.forEach(boost => {
    // Skip disabled boosts
    if (boost.enabled === false) return;
    
    if (boost.stat && bonuses.hasOwnProperty(boost.stat)) {
      bonuses[boost.stat] += Number(boost.additive) || 0;
    }
  });
  
  return bonuses;
}

/**
 * Calculate stat boost multiplicative bonuses per stat (for beasts)
 * Only includes enabled boosts (enabled !== false)
 */
export function getStatBoostMultiplierBonuses(statBoosts) {
  const multipliers = {};
  ALL_STATS.forEach(stat => multipliers[stat] = 0);
  
  if (!statBoosts || !Array.isArray(statBoosts)) return multipliers;
  
  statBoosts.forEach(boost => {
    // Skip disabled boosts
    if (boost.enabled === false) return;
    
    if (boost.stat && multipliers.hasOwnProperty(boost.stat)) {
      multipliers[boost.stat] += Number(boost.multiplier) || 0;
    }
  });
  
  return multipliers;
}

/**
 * Calculate class scaling by iterating through ALL classes that cover levels between snapshot and current
 * This properly handles cases where different classes cover different level ranges
 */
function calculateClassScaling(character, statName, snapshotLevel) {
  let totalScaling = 0;
  const details = [];

  if (!character.classHistory || character.classHistory.length === 0 || snapshotLevel === null) {
    return { scaling: 0, detail: '' };
  }

  // For each class, calculate how many levels it contributes
  for (const cls of character.classHistory) {
    const classStart = cls.startLevel || 1;
    const classEnd = cls.endLevel === null ? Infinity : cls.endLevel;
    const perLevel = Number(cls.statsPerLevel?.[statName]) || 0;

    // Find overlap between [snapshotLevel + 1, currentLevel] and [classStart + 1, classEnd]
    // - snapshotLevel + 1: snapshot already includes that level's stats
    // - classStart + 1: you don't get stats on the level you receive the class
    // - classEnd is inclusive: you DO get stats on the level the class ends
    const rangeStart = snapshotLevel + 1;
    const rangeEnd = character.level;

    const effectiveStart = Math.max(rangeStart, classStart + 1);
    const effectiveEnd = Math.min(rangeEnd, classEnd);

    if (effectiveStart <= effectiveEnd && perLevel > 0) {
      const levelsInClass = effectiveEnd - effectiveStart + 1;
      const classContribution = perLevel * levelsInClass;
      totalScaling += classContribution;
      details.push(`${cls.name}: ${perLevel}/lvl × ${levelsInClass} lvls`);
    }
  }

  return {
    scaling: totalScaling,
    detail: details.join(', ') || 'No class gains',
  };
}

/**
 * Calculate a single stat with full breakdown
 * Handles snapshots that may have title/boost bonuses "baked in" to avoid double-counting
 * 
 * @param {string} statName - The stat to calculate
 * @param {object} character - Character data object
 * @returns {object} - { value, breakdown }
 */
export function calculateStatWithBreakdown(statName, character) {
  const breakdown = {
    snapshotBase: 0,
    snapshotLevel: null,
    snapshotIncludedTitleAdditive: 0,
    snapshotIncludedTitleMultiplier: 0,
    snapshotIncludedBoostAdditive: 0,
    snapshotIncludedBoostMultiplier: 0,
    snapshotRawTitleAdditive: 0,      // Raw title bonus (before trait) in snapshot
    snapshotTraitMultiplier: 1,        // Trait multiplier that was active at snapshot time
    redirectedFreePoints: 0,
    classScaling: 0,
    classScalingDetail: '',
    freePoints: 0,
    traitMultiplier: 1,
    gainsBeforeTrait: 0,
    gainsAfterTrait: 0,
    titleAdditive: 0,
    titleAdditiveAfterTrait: 0,
    titleMultiplier: 0,
    titleMultiplierEnhanced: false, // True if trait multiplier was applied to title multiplier (level 30+)
    effectiveTitleMultiplier: 0,    // The actual multiplier used after trait enhancement
    statBoostAdditive: 0,
    statBoostMultiplier: 0,
    preFinalValue: 0,
    derivationBonus: 0,
    derivationDetail: '',
    final: 0,
  };

  // 1. Get base from most recent snapshot
  const snapshotLevel = getMostRecentSnapshotLevel(character.levelSnapshots, character.level);
  let snapshot = null;
  if (snapshotLevel !== null && character.levelSnapshots[snapshotLevel]) {
    snapshot = character.levelSnapshots[snapshotLevel];
    breakdown.snapshotBase = getSnapshotStatValue(snapshot, statName);
    breakdown.snapshotLevel = snapshotLevel;
    
    // Get what title/boost bonuses were baked into the snapshot (to avoid double-counting)
    const includedTitles = getSnapshotIncludedTitleBonuses(snapshot, statName);
    breakdown.snapshotIncludedTitleAdditive = includedTitles.additive;
    breakdown.snapshotIncludedTitleMultiplier = includedTitles.multiplier;
    breakdown.snapshotRawTitleAdditive = includedTitles.rawAdditive;
    breakdown.snapshotTraitMultiplier = includedTitles.traitMultiplier;
    
    const includedBoosts = getSnapshotIncludedStatBoosts(snapshot, statName);
    breakdown.snapshotIncludedBoostAdditive = includedBoosts.additive;
    breakdown.snapshotIncludedBoostMultiplier = includedBoosts.multiplier;
  }

  // 2. Check for redirected free points (from traits like Primordial Will)
  // Calculate from snapshot level, not from level 1 (snapshot already includes earlier gains)
  const redirected = getRedirectedFreePoints(character.traits, character.level, snapshotLevel || 1);
  if (redirected.targetStat === statName) {
    breakdown.redirectedFreePoints = redirected.points;
  }

  // 3. Calculate class scaling from ALL applicable classes
  const classResult = calculateClassScaling(character, statName, snapshotLevel);
  breakdown.classScaling = classResult.scaling;
  breakdown.classScalingDetail = classResult.detail;

  // 4. Add manual free points (only if NOT redirected to another stat)
  if (redirected.targetStat === null || redirected.targetStat === statName) {
    breakdown.freePoints = Number(character.freePoints?.[statName]) || 0;
  }

  // 5. Calculate total gains (these get multiplied by trait)
  breakdown.gainsBeforeTrait = breakdown.redirectedFreePoints + breakdown.classScaling + breakdown.freePoints;

  // 6. Get trait multiplier for this stat
  breakdown.traitMultiplier = getTraitMultiplier(character.traits, statName);
  
  // Apply trait multiplier to gains only (NOT to base)
  breakdown.gainsAfterTrait = breakdown.gainsBeforeTrait * breakdown.traitMultiplier;

  // 7. Get CURRENT title additive bonuses (multiplied by trait)
  breakdown.titleAdditive = getTitleAdditiveBonuses(character.titles)[statName] || 0;
  breakdown.titleAdditiveAfterTrait = breakdown.titleAdditive * breakdown.traitMultiplier;

  // 8. Get CURRENT stat boost bonuses (for beasts)
  breakdown.statBoostAdditive = getStatBoostAdditiveBonuses(character.statBoosts)[statName] || 0;
  breakdown.statBoostMultiplier = getStatBoostMultiplierBonuses(character.statBoosts)[statName] || 0;

  // 9. Calculate the NET new title/boost bonuses (current minus what's already in snapshot)
  // This prevents double-counting when snapshot already includes these bonuses
  // 
  // For titles: if trait changed since snapshot, we need to calculate properly:
  // - Snapshot has: snapshotRawTitle × snapshotTrait baked in
  // - Current wants: currentRawTitle × currentTrait
  // - Net = (currentRaw × currentTrait) - (snapshotRaw × snapshotTrait)
  //
  // If we have raw values stored (new format), use them for accurate calculation
  // Otherwise fall back to comparing effective values (old format - may be inaccurate if trait changed)
  let netTitleAdditive;
  if (breakdown.snapshotRawTitleAdditive > 0 || breakdown.snapshotTraitMultiplier !== 1) {
    // New format: we have raw title values and trait info from snapshot
    // Compare raw title values to see if titles changed
    const currentRaw = breakdown.titleAdditive;
    const snapshotRaw = breakdown.snapshotRawTitleAdditive;
    
    // If raw title values are the same, titles haven't changed - net should be 0
    // (the snapshot already has the full title contribution baked in)
    if (currentRaw === snapshotRaw) {
      netTitleAdditive = 0;
    } else {
      // Titles changed: add new titles with current trait, remove old with snapshot trait
      netTitleAdditive = (currentRaw * breakdown.traitMultiplier) - (snapshotRaw * breakdown.snapshotTraitMultiplier);
    }
  } else {
    // Old format: just compare effective values (may be wrong if trait changed, but backwards compatible)
    netTitleAdditive = breakdown.titleAdditiveAfterTrait - breakdown.snapshotIncludedTitleAdditive;
  }
  
  const netBoostAdditive = breakdown.statBoostAdditive - breakdown.snapshotIncludedBoostAdditive;

  // 10. Calculate pre-multiplier value: base + gains×trait + NET title/boost additives
  breakdown.preFinalValue = breakdown.snapshotBase + breakdown.gainsAfterTrait + netTitleAdditive + netBoostAdditive;

  // 11. Get CURRENT multipliers
  breakdown.titleMultiplier = getTitleMultiplierBonuses(character.titles)[statName] || 0;
  
  // Calculate NET multiplier (current minus what's in snapshot)
  let netTitleMultiplier = breakdown.titleMultiplier - breakdown.snapshotIncludedTitleMultiplier;
  const netBoostMultiplier = breakdown.statBoostMultiplier - breakdown.snapshotIncludedBoostMultiplier;
  
  // Special case: At level 30+, trait multiplier also applies to title multipliers
  // This allows traits like Primordial Will to multiply ALL bonuses at higher levels
  if (character.level >= 30 && breakdown.traitMultiplier > 1 && netTitleMultiplier > 0) {
    breakdown.titleMultiplierEnhanced = true;
    netTitleMultiplier = netTitleMultiplier * breakdown.traitMultiplier;
  }
  breakdown.effectiveTitleMultiplier = netTitleMultiplier;
  
  const totalNetMultiplier = netTitleMultiplier + netBoostMultiplier;
  
  // 12. Apply NET multiplicative bonuses
  let finalValue = breakdown.preFinalValue;
  if (totalNetMultiplier > 0) {
    finalValue = finalValue * (1 + totalNetMultiplier);
  }

  breakdown.final = Math.round(finalValue);
  return { value: breakdown.final, breakdown };
}

/**
 * Calculate all stats for a character
 * @param {object} character - Character data object
 * @returns {object} - { stats: {statName: value}, breakdowns: {statName: breakdown} }
 */
export function calculateAllStats(character) {
  const stats = {};
  const breakdowns = {};

  // First pass: calculate all base stats
  ALL_STATS.forEach(statName => {
    const result = calculateStatWithBreakdown(statName, character);
    stats[statName] = result.value;
    breakdowns[statName] = result.breakdown;
  });

  // Second pass: apply stat derivations (e.g., 25% of Willpower to Intellect)
  // We need to avoid double-counting derivations that are already baked into snapshots
  const snapshotLevel = getMostRecentSnapshotLevel(character.levelSnapshots, character.level);
  const snapshot = snapshotLevel !== null ? character.levelSnapshots?.[snapshotLevel] : null;
  
  const derivations = getStatDerivations(character.traits);
  derivations.forEach(({ sourceStat, targetStat, percent }) => {
    if (stats[sourceStat] !== undefined && stats[targetStat] !== undefined) {
      const bonus = Math.floor(stats[sourceStat] * (percent / 100));
      
      // Get derivation bonus that was already included in the snapshot
      const snapshotDerivation = getSnapshotIncludedDerivation(snapshot, targetStat);
      
      // Net derivation = current derivation - what's already in snapshot
      const netBonus = bonus - snapshotDerivation;
      
      if (netBonus !== 0) {
        stats[targetStat] += netBonus;
      }
      
      breakdowns[targetStat].derivationBonus = bonus;
      breakdowns[targetStat].snapshotDerivation = snapshotDerivation;
      breakdowns[targetStat].netDerivation = netBonus;
      breakdowns[targetStat].derivationDetail = `${percent}% of ${STAT_DISPLAY_NAMES[sourceStat]}`;
      breakdowns[targetStat].final = stats[targetStat];
    }
  });

  // Also check character-level statDerivations array
  if (character.statDerivations) {
    character.statDerivations.forEach(({ sourceStat, targetStat, percent }) => {
      if (stats[sourceStat] !== undefined && stats[targetStat] !== undefined) {
        const bonus = Math.floor(stats[sourceStat] * (percent / 100));
        
        // Get derivation bonus that was already included in the snapshot
        const snapshotDerivation = getSnapshotIncludedDerivation(snapshot, targetStat);
        
        // Net derivation = current derivation - what's already in snapshot
        const netBonus = bonus - snapshotDerivation;
        
        if (netBonus !== 0) {
          stats[targetStat] += netBonus;
        }
        
        breakdowns[targetStat].derivationBonus = (breakdowns[targetStat].derivationBonus || 0) + bonus;
        breakdowns[targetStat].snapshotDerivation = snapshotDerivation;
        breakdowns[targetStat].netDerivation = (breakdowns[targetStat].netDerivation || 0) + netBonus;
        breakdowns[targetStat].derivationDetail = `${percent}% of ${STAT_DISPLAY_NAMES[sourceStat]}`;
        breakdowns[targetStat].final = stats[targetStat];
      }
    });
  }

  return { stats, breakdowns };
}

/**
 * Calculate derived stats (HP, MP)
 * @param {object} finalStats - Calculated final stats
 * @param {object} character - Character data
 * @param {number} bondedMana - Additional mana from bond (half of partner's mana)
 * @returns {object} - { hp: { current, max }, mp: { current, max } }
 */
export function calculateDerivedStats(finalStats, character, bondedMana = 0) {
  // HP = Constitution × 10
  const maxHp = (finalStats.constitution || 0) * 10;
  
  // MP = (Mana + Bonded Mana) × 10
  const maxMp = ((finalStats.mana || 0) + bondedMana) * 10;

  return {
    hp: {
      current: Math.min(character.hp?.current || maxHp, maxHp),
      max: maxHp,
    },
    mp: {
      current: Math.min(character.mp?.current || maxMp, maxMp),
      max: maxMp,
    },
  };
}

/**
 * Get a formatted breakdown string for display
 */
export function getBreakdownText(breakdown, statName) {
  const parts = [];
  
  if (breakdown.snapshotLevel !== null) {
    parts.push(`Base (Lvl ${breakdown.snapshotLevel}): ${breakdown.snapshotBase}`);
  }
  
  if (breakdown.classScaling > 0) {
    parts.push(`Class: +${breakdown.classScaling} (${breakdown.classScalingDetail})`);
  }
  
  if (breakdown.freePoints > 0) {
    parts.push(`Free Points: +${breakdown.freePoints}`);
  }
  
  if (breakdown.traitMultiplier !== 1) {
    parts.push(`Trait Multiplier: ×${breakdown.traitMultiplier}`);
  }
  
  if (breakdown.titleAdditive > 0) {
    parts.push(`Title Bonus: +${breakdown.titleAdditive}`);
  }
  
  if (breakdown.titleMultiplier > 0) {
    parts.push(`Title Multiplier: ×${(1 + breakdown.titleMultiplier).toFixed(2)}`);
  }
  
  if (breakdown.derivationBonus > 0) {
    parts.push(`Derived: +${breakdown.derivationBonus} (${breakdown.derivationDetail})`);
  }
  
  parts.push(`Final: ${breakdown.final}`);
  
  return parts.join('\n');
}

/**
 * Calculate stats suitable for snapshotting (without titles/derivations)
 * This captures: base + (redirectedFreePoints + classScaling + manualFreePoints) × trait
 * But excludes: title bonuses, derivation bonuses, bond synced values
 * @param {object} character - Character data object
 * @returns {object} - Stats object suitable for saving as a snapshot
 */
export function calculateSnapshotStats(character) {
  const stats = {};
  
  // Get snapshot level once (same for all stats)
  const snapshotLevel = getMostRecentSnapshotLevel(character.levelSnapshots, character.level);
  
  // Calculate redirected free points from snapshot level, not level 1
  const redirected = getRedirectedFreePoints(character.traits, character.level, snapshotLevel || 1);

  ALL_STATS.forEach(statName => {
    // 1. Get base from most recent snapshot
    let snapshotBase = 0;
    if (snapshotLevel !== null && character.levelSnapshots[snapshotLevel]) {
      snapshotBase = Number(character.levelSnapshots[snapshotLevel][statName]) || 0;
    }

    // 2. Get redirected free points (if this is the target stat)
    let redirectedFreePoints = 0;
    if (redirected.targetStat === statName) {
      redirectedFreePoints = redirected.points;
    }

    // 3. Calculate class scaling from ALL applicable classes
    const classResult = calculateClassScaling(character, statName, snapshotLevel);
    const classScaling = classResult.scaling;

    // 4. Add manual free points (only if not redirected elsewhere)
    let freePoints = 0;
    if (redirected.targetStat === null || redirected.targetStat === statName) {
      freePoints = Number(character.freePoints?.[statName]) || 0;
    }

    // 5. Calculate total gains
    const totalGains = redirectedFreePoints + classScaling + freePoints;

    // 6. Apply trait multiplier to gains only (not to base)
    const traitMultiplier = getTraitMultiplier(character.traits, statName);
    const gainsAfterTrait = totalGains * traitMultiplier;

    // Final value: base + gains×trait (no title bonuses for snapshots)
    stats[statName] = Math.round(snapshotBase + gainsAfterTrait);
  });

  return stats;
}

// Legacy functions for backwards compatibility
export function calculateTitleBonuses(titles) {
  return getTitleAdditiveBonuses(titles);
}

export function calculateTotalStats(baseStats, titleBonuses) {
  const total = {};
  ALL_STATS.forEach(stat => {
    const base = Number(baseStats?.[stat]) || 0;
    const bonus = Number(titleBonuses?.[stat]) || 0;
    total[stat] = base + bonus;
  });
  return total;
}

export function getStatBreakdown(statName, baseValue, bonusValue) {
  const base = Number(baseValue) || 0;
  const bonus = Number(bonusValue) || 0;
  const total = base + bonus;

  return {
    base,
    bonus,
    total,
    formatted: bonus > 0 
      ? `${total} (Base: ${base} + Titles: ${bonus})`
      : `${total}`,
  };
}
