/**
 * Calculates the total bonuses from all titles
 * @param {Array} titles - Array of title objects with bonuses
 * @returns {Object} - Object mapping stat names to total bonus values
 */
export function calculateTitleBonuses(titles) {
  const bonuses = {
    strength: 0,
    agility: 0,
    constitution: 0,
    vitality: 0,
    intellect: 0,
    willpower: 0,
    mana: 0,
    wisdom: 0,
  };

  if (!titles || !Array.isArray(titles)) {
    return bonuses;
  }

  titles.forEach((title) => {
    if (title.bonuses && Array.isArray(title.bonuses)) {
      title.bonuses.forEach((bonus) => {
        if (bonus.stat && bonuses.hasOwnProperty(bonus.stat)) {
          bonuses[bonus.stat] += Number(bonus.value) || 0;
        }
      });
    }
  });

  return bonuses;
}

/**
 * Calculates total stats by adding base stats and title bonuses
 * @param {Object} baseStats - Base stat values
 * @param {Object} titleBonuses - Bonus values from titles
 * @returns {Object} - Object with total stat values
 */
export function calculateTotalStats(baseStats, titleBonuses) {
  const total = {};
  
  const statNames = [
    'strength',
    'agility',
    'constitution',
    'vitality',
    'intellect',
    'willpower',
    'mana',
    'wisdom',
  ];

  statNames.forEach((stat) => {
    const base = Number(baseStats?.[stat]) || 0;
    const bonus = Number(titleBonuses?.[stat]) || 0;
    total[stat] = base + bonus;
  });

  return total;
}

/**
 * Get stat breakdown for display
 * @param {string} statName - Name of the stat
 * @param {number} baseValue - Base stat value
 * @param {number} bonusValue - Bonus from titles
 * @returns {Object} - Object with base, bonus, total, and formatted string
 */
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

/**
 * Physical stat names for grouping
 */
export const PHYSICAL_STATS = ['strength', 'agility', 'constitution', 'vitality'];

/**
 * Magical stat names for grouping
 */
export const MAGICAL_STATS = ['intellect', 'willpower', 'mana', 'wisdom'];

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

