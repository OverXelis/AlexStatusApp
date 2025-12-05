/**
 * Formats a character's status screen for copying to Notion
 * Preserves the exact formatting from the original
 */

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
 * @returns {string} - Formatted status screen string
 */
export function formatStatusScreen(character, options = {}) {
  if (!character) return '';

  const lines = [];

  // Header
  lines.push('***');
  lines.push('');

  // Status section
  lines.push('**Status**');
  lines.push('');
  
  // Name and Level
  const classAdvancement = character.classAdvancement ? ' + Advancement Offered' : '';
  lines.push(`Name: ${character.name} - Level ${character.level}`);
  lines.push('');
  
  // Class
  if (character.class) {
    lines.push(`Class: ${character.class}${classAdvancement}`);
    lines.push('');
  }

  // HP/MP
  lines.push(`HP: ${character.hp?.current || 0}/${character.hp?.max || 0}`);
  lines.push('');
  lines.push(`MP: ${character.mp?.current || 0}/${character.mp?.max || 0}`);
  lines.push('');

  // Traits
  if (character.traits) {
    lines.push(`**Traits: (${character.traits.current}/${character.traits.max})** `);
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

  // Physical Stats
  lines.push('**Physical Stats:** ');
  lines.push('');
  lines.push(`Strength: ${character.baseStats?.strength || 0}`);
  lines.push('');
  lines.push(`Agility: ${character.baseStats?.agility || 0}`);
  lines.push('');
  lines.push(`Constitution: ${character.baseStats?.constitution || 0}`);
  lines.push('');
  lines.push(`Vitality: ${character.baseStats?.vitality || 0}`);
  lines.push('');

  // Magical Stats
  lines.push('**Magical Stats:** ');
  lines.push('');
  lines.push(`Intellect: ${character.baseStats?.intellect || 0}`);
  lines.push('');
  lines.push(`Willpower: ${character.baseStats?.willpower || 0}`);
  lines.push('');
  lines.push(`Mana: ${character.baseStats?.mana || 0}`);
  lines.push('');
  lines.push(`Wisdom: ${character.baseStats?.wisdom || 0}`);
  lines.push('');

  // Bond Skills
  if (character.bondSkills && character.bondSkills.length > 0) {
    lines.push('**Bond Skills:**');
    lines.push('');
    character.bondSkills.forEach((skill) => {
      lines.push(formatSkill(skill));
      lines.push('');
      if (skill.primaryStatShared) {
        lines.push(`Primary Stat Shared - ${skill.primaryStatShared}`);
        lines.push('');
      }
    });
  }

  // Active Skills
  if (character.activeSkills && character.activeSkills.length > 0) {
    lines.push('**Active Skills:** ');
    lines.push('');
    character.activeSkills.forEach((skill) => {
      lines.push(formatSkill(skill));
      lines.push('');
    });
  }

  // Passive Skills
  if (character.passiveSkills && character.passiveSkills.length > 0) {
    lines.push('**Passive Skills:** ');
    lines.push('');
    character.passiveSkills.forEach((skill) => {
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
 * @returns {string} - Combined formatted status screens
 */
export function formatBothStatusScreens(alex, valtherion) {
  const alexScreen = formatStatusScreen(alex);
  const valScreen = valtherion?.name ? formatStatusScreen(valtherion) : '';
  
  if (valScreen) {
    return `${alexScreen}\n\n${valScreen}`;
  }
  return alexScreen;
}

export default formatStatusScreen;

