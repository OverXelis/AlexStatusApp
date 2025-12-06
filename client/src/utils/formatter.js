/**
 * Formats a character's status screen for copying to Notion
 * Preserves the exact formatting from the original
 */

import { calculateAllStats, calculateDerivedStats, getCurrentClass } from './statCalculator';

/**
 * Format a single skill for output
 * @param {Object} skill - Skill object
 * @returns {string} - Formatted skill string
 */
function formatSkill(skill) {
  const advancement = skill.advancement ? ' + Advancement Offered' : '';
  return `[${skill.name}] (${skill.rank} - Level ${skill.level})${advancement}`;
}

/**
 * Format a passive skill for output
 * @param {Object} skill - Passive skill object
 * @returns {string} - Formatted passive skill string
 */
function formatPassiveSkill(skill) {
  return `[${skill.name}] (Tier ${skill.tier})`;
}

/**
 * Format a bound item for output
 * @param {Object} item - Bound item object
 * @returns {string} - Formatted bound item string
 */
function formatBoundItem(item) {
  return `${item.rank} Rank ${item.type} - ${item.name}`;
}

/**
 * Format the complete status screen for a character
 * @param {Object} character - Character data object
 * @param {Object} options - Formatting options
 * @param {Object} options.calculatedStats - Pre-calculated final stats (if available)
 * @param {Object} options.derivedStats - Pre-calculated HP/MP (if available)
 * @param {number} options.bondedMana - Additional mana from bond (for MP calculation)
 * @returns {string} - Formatted status screen string
 */
export function formatStatusScreen(character, options = {}) {
  if (!character) return '';

  // Use pre-calculated stats if provided, otherwise calculate them
  let finalStats = options.calculatedStats;
  let derivedStats = options.derivedStats;
  
  if (!finalStats) {
    const calculation = calculateAllStats(character);
    finalStats = calculation.stats;
  }
  
  if (!derivedStats) {
    derivedStats = calculateDerivedStats(finalStats, character, options.bondedMana || 0);
  }

  // Get current class name
  const currentClass = getCurrentClass(character.classHistory, character.level);
  const className = currentClass?.name || character.class || '';
  
  // Check for class advancement
  const classAdvancement = currentClass?.endLevel === null && character.classAdvancement 
    ? ' + Advancement Offered' 
    : '';

  const lines = [];

  // Header
  lines.push('***');
  lines.push('');

  // Status section
  lines.push('**Status**');
  lines.push('');
  
  // Name and Level
  lines.push(`Name: ${character.name} - Level ${character.level}`);
  lines.push('');
  
  // Class
  if (className) {
    lines.push(`Class: ${className}${classAdvancement}`);
    lines.push('');
  }

  // HP/MP - use derived stats
  lines.push(`HP: ${derivedStats.hp?.max || 0}/${derivedStats.hp?.max || 0}`);
  lines.push('');
  lines.push(`MP: ${derivedStats.mp?.max || 0}/${derivedStats.mp?.max || 0}`);
  lines.push('');

  // Traits
  if (character.traits) {
    lines.push(`**Traits: (${character.traits.current || character.traits.items?.length || 0}/${character.traits.max})** `);
    lines.push('');
    if (character.traits.items && character.traits.items.length > 0) {
      character.traits.items.forEach((trait) => {
        lines.push(`{${trait.name}}`);
        lines.push('');
      });
    }
  }

  // Titles
  if (character.titles && character.titles.length > 0) {
    const primaryTitle = character.titles.find((t) => t.isPrimary);
    const primaryDisplay = primaryTitle ? ` < ${primaryTitle.name} >` : '';
    lines.push(`**Titles:${primaryDisplay}**`);
    lines.push('');
    character.titles.forEach((title) => {
      lines.push(title.name);
      lines.push('');
    });
  }

  // Physical Stats - use calculated final stats
  lines.push('**Physical Stats:** ');
  lines.push('');
  lines.push(`Strength: ${finalStats.strength || 0}`);
  lines.push('');
  lines.push(`Agility: ${finalStats.agility || 0}`);
  lines.push('');
  lines.push(`Constitution: ${finalStats.constitution || 0}`);
  lines.push('');
  lines.push(`Vitality: ${finalStats.vitality || 0}`);
  lines.push('');

  // Magical Stats - use calculated final stats
  lines.push('**Magical Stats:** ');
  lines.push('');
  lines.push(`Intellect: ${finalStats.intellect || 0}`);
  lines.push('');
  lines.push(`Willpower: ${finalStats.willpower || 0}`);
  lines.push('');
  lines.push(`Mana: ${finalStats.mana || 0}`);
  lines.push('');
  lines.push(`Wisdom: ${finalStats.wisdom || 0}`);
  lines.push('');

  // Bond Skills (filter out old skills)
  const currentBondSkills = character.bondSkills?.filter(s => !s.isOld) || [];
  if (currentBondSkills.length > 0) {
    lines.push('**Bond Skills:**');
    lines.push('');
    currentBondSkills.forEach((skill) => {
      lines.push(formatSkill(skill));
      lines.push('');
      if (skill.primaryStatShared) {
        lines.push(`Primary Stat Shared - ${skill.primaryStatShared}`);
        lines.push('');
      }
    });
  }

  // Active Skills (filter out old skills)
  const currentActiveSkills = character.activeSkills?.filter(s => !s.isOld) || [];
  if (currentActiveSkills.length > 0) {
    lines.push('**Active Skills:** ');
    lines.push('');
    currentActiveSkills.forEach((skill) => {
      lines.push(formatSkill(skill));
      lines.push('');
    });
  }

  // Passive Skills (filter out old skills)
  const currentPassiveSkills = character.passiveSkills?.filter(s => !s.isOld) || [];
  if (currentPassiveSkills.length > 0) {
    lines.push('**Passive Skills:** ');
    lines.push('');
    currentPassiveSkills.forEach((skill) => {
      lines.push(formatPassiveSkill(skill));
      lines.push('');
    });
  }

  // Bound Items
  if (character.boundItems && character.boundItems.length > 0) {
    lines.push('**Bound Items:**');
    lines.push('');
    character.boundItems.forEach((item) => {
      lines.push(formatBoundItem(item));
      lines.push('');
    });
  }

  // Footer
  lines.push('***');

  return lines.join('\n');
}

/**
 * Format both characters' status screens
 * @param {Object} alex - Alex's character data
 * @param {Object} valtherion - Valtherion's character data
 * @param {Object} options - Additional options with pre-calculated stats
 * @returns {string} - Combined formatted status screens
 */
export function formatBothStatusScreens(alex, valtherion, options = {}) {
  const alexScreen = formatStatusScreen(alex, {
    calculatedStats: options.alexStats,
    derivedStats: options.alexDerived,
    bondedMana: options.alexBondedMana,
  });
  
  const valScreen = valtherion?.name ? formatStatusScreen(valtherion, {
    calculatedStats: options.valStats,
    derivedStats: options.valDerived,
  }) : '';
  
  if (valScreen) {
    return `${alexScreen}\n\n${valScreen}`;
  }
  return alexScreen;
}

export default formatStatusScreen;
