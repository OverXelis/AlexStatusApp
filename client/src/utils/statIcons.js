/**
 * Stat icons for visual representation
 */
import React from 'react';
import { SvgIcon } from '@mui/material';
import {
  FitnessCenter,
  Bolt,
  Shield,
  Favorite,
  Psychology,
  Whatshot,
  AutoAwesome,
  MenuBook,
  LocalHospital,
  Science,
} from '@mui/icons-material';

// Stat icons mapping
export const STAT_ICONS = {
  strength: FitnessCenter,      // Dumbbell/weight icon
  agility: Bolt,                 // Lightning bolt
  constitution: Shield,          // Shield
  vitality: Favorite,            // Heart
  intellect: Psychology,         // Brain icon
  willpower: Whatshot,           // Fire/flame
  mana: AutoAwesome,             // Sparkles/magic
  wisdom: MenuBook,              // Book
};

// Resource icons
export const RESOURCE_ICONS = {
  hp: LocalHospital,             // Medical cross for HP
  mp: Science,                   // Potion/flask for MP
};

// Custom Mana Potion Icon
export function ManaIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6 3h12v2H6V3zm2 4h8v2H8V7zm-1 4l-2 9h14l-2-9H7zm3 2h4v1h-4v-1zm0 2h4v1h-4v-1z"/>
    </SvgIcon>
  );
}

// Get icon component for a stat
export function getStatIcon(statName) {
  return STAT_ICONS[statName] || AutoAwesome;
}

// Get icon component for a resource
export function getResourceIcon(resourceName) {
  return RESOURCE_ICONS[resourceName] || Favorite;
}


