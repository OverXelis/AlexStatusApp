# Development Guide - Character Status App

This document provides guidelines for developing features in a **template-aware** manner. The app is designed to be copied and customized for different characters.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Template-Aware Development](#template-aware-development)
- [Creating a New Character App](#creating-a-new-character-app)
- [Key Files Reference](#key-files-reference)

---

## Architecture Overview

### Data Flow
```
config/character.json  →  Server loads config
                          ↓
data/current.json      →  { main: {...}, companion: {...} }
                          ↓
CharacterContext.js    →  Provides state & calculations to React
                          ↓
Tab Components         →  Display & edit character data
```

### Naming Convention
- **Internal/Code**: Use `main` and `companion` (generic)
- **Display/UI**: Use names from config (`getMainName()`, `getCompanionName()`)
- **Legacy aliases**: `alex`/`valtherion` still work for backwards compatibility but should be avoided in new code

---

## Template-Aware Development

### DO: Use Generic Names in Code

```javascript
// ✅ GOOD - Generic names
const { main, companion, updateMain } = useCharacter();

// ❌ AVOID - Character-specific names (these are legacy aliases)
const { alex, valtherion, updateAlex } = useCharacter();
```

### DO: Use Config for Display Names

```javascript
// ✅ GOOD - Names from config
const { getMainName, getCompanionName } = useCharacter();
return <Typography>{getMainName()}'s Stats</Typography>;

// ❌ AVOID - Hardcoded names
return <Typography>Alex's Stats</Typography>;
```

### DO: Check Feature Flags

```javascript
import { isFeatureEnabled, hasCompanion, hasBond } from '../config/characterConfig';

// ✅ GOOD - Conditional rendering based on config
{hasCompanion() && <CompanionTab />}
{hasBond() && <BondSyncAlert />}
{isFeatureEnabled('traits') && <TraitsSection />}
```

### DO: Add New Features to Config

When adding a feature that might be optional for some characters:

1. Add a flag to `config/character.json`:
```json
{
  "features": {
    "yourNewFeature": true
  }
}
```

2. Check the flag in your component:
```javascript
{isFeatureEnabled('yourNewFeature') && <YourFeature />}
```

### DON'T: Hardcode Character-Specific Logic

```javascript
// ❌ BAD - Character-specific logic
if (character.name === 'Alex') {
  // special Alex handling
}

// ✅ GOOD - Config-driven logic
if (config.companion?.bondType === 'dragon-rider') {
  // Bond-type specific handling
}
```

---

## Creating a New Character App

### Quick Start

1. **Copy the project folder** to a new location
2. **Edit `config/character.json`**:
   ```json
   {
     "mainCharacter": {
       "name": "New Character Name"
     },
     "companion": {
       "enabled": false  // or configure companion
     }
   }
   ```
3. **Delete `data/current.json`** (will regenerate with new defaults)
4. **Delete `data/snapshots.json`** (start fresh)
5. **Run `npm run install-all` and `npm start`**

### Configuration Options

#### Main Character
```json
{
  "mainCharacter": {
    "name": "Character Name",
    "defaultClass": "",
    "pronouns": "they/them"
  }
}
```

#### Companion (Optional)
```json
{
  "companion": {
    "enabled": true,        // Set false to disable companion tab
    "name": "Companion Name",
    "type": "familiar",     // For display purposes
    "bondType": "soul-bond" // Defines sync behavior
  }
}
```

#### Bond/Sync Rules
```json
{
  "bond": {
    "enabled": true,
    "syncRules": [
      {
        "from": "companion",
        "to": "main",
        "sourceStat": "mana",
        "targetStat": "mana",
        "formula": "half"
      }
    ]
  }
}
```

#### Feature Toggles
```json
{
  "features": {
    "traits": true,
    "titles": true,
    "bondSkills": true,
    "activeSkills": true,
    "passiveSkills": true,
    "boundItems": true,
    "statBoosts": true
  }
}
```

---

## Key Files Reference

| File | Purpose | Template Notes |
|------|---------|----------------|
| `config/character.json` | Character configuration | Edit first when creating new app |
| `client/src/config/characterConfig.js` | Config loader & helpers | Use `getMainName()`, `hasCompanion()`, etc. |
| `client/src/context/CharacterContext.js` | State management | Use generic names (`main`, `companion`) |
| `client/src/App.js` | Main app structure | Tabs are config-driven |
| `client/src/tabs/Companion.js` | Companion tab | Only shows if `companion.enabled` |
| `server.js` | Backend API | Reads config for defaults |
| `data/current.json` | Current character data | Uses `main`/`companion` keys |

---

## Adding New Features Checklist

When adding a new feature, consider:

- [ ] Does it use generic names (`main`/`companion`) in code?
- [ ] Does it use config names for display (`getMainName()`)?
- [ ] Should it be optional? Add to `config.features`
- [ ] Does it apply to main character, companion, or both?
- [ ] If companion-specific, is it wrapped in `hasCompanion()` check?
- [ ] Did you add appropriate comments for future developers?

---

## Legacy Code Migration

The codebase maintains backwards compatibility with legacy variable names:

| Legacy Name | Generic Name |
|-------------|--------------|
| `alex` | `main` |
| `valtherion` | `companion` |
| `updateAlex` | `updateMain` |
| `updateValtherion` | `updateCompanion` |
| `alexFinalStats` | `mainFinalStats` |
| `valFinalStats` | `companionFinalStats` |
| `syncedManaForAlex` | `syncedManaForMain` |
| `syncedWillpowerForVal` | `syncedWillpowerForCompanion` |

**New code should use the generic names.** Legacy names are preserved for backwards compatibility but may be deprecated in future versions.


