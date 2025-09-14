import { chaliceData } from '../data/chaliceData.js';
import items from '../data/items.json';
import effects from '../data/effects.json';

/**
 * Calculates the best relic combination for a given set of desired effects, available relics, and selected chalices.
 * @param {Array} desiredEffects - An array of desired effect objects, including name, weight, isRequired, and isForbidden properties.
 * @param {Object} characterRelicData - The relic data for the selected character from the user's save file.
 * @param {Array} selectedChalices - An array of names of the selected chalices.
 * @param {string} selectedNightfarer - The name of the selected Nightfarer (e.g., 'wylder').
 * @returns {Object|null} - The best relic combination found, or null if none could be determined.
 */
export function calculateBestRelics(desiredEffects, characterRelicData, selectedChalices, selectedNightfarer) {
  // Input validation
  if (!desiredEffects || !characterRelicData || !selectedChalices || !selectedNightfarer) {
    console.error('Missing required parameters for calculation');
    return null;
  }

  if (!characterRelicData.relics || characterRelicData.relics.length === 0) {
    console.warn('No relics found for character');
    return null;
  }

  // Filter out invalid relics early
  const validRelics = characterRelicData.relics.filter(relic => {
    const relicInfo = items[relic.item_id?.toString()];
    return relicInfo && !relicInfo.name?.startsWith('Deep');
  });

  if (validRelics.length === 0) {
    console.warn('No valid relics found for character');
    return null;
  }

  console.log(`Processing ${validRelics.length} valid relics across ${selectedChalices.length} chalices`);

  let bestCombination = null;
  let highestScore = -Infinity;

  // Get chalice data
  const chaliceDataForCharacter = chaliceData[selectedNightfarer];
  if (!chaliceDataForCharacter) {
    console.error(`No chalice data found for character: ${selectedNightfarer}`);
    return null;
  }

  const allChalices = selectedChalices.map(chaliceName =>
    chaliceDataForCharacter.find(c => c.name === chaliceName)
  ).filter(Boolean);

  if (allChalices.length === 0) {
    console.warn('No valid chalices found');
    return null;
  }

  for (const chalice of allChalices) {
    console.log(`Processing chalice: ${chalice.name} with ${chalice.slots.length} slots`);
    
    const combination = findBestCombinationForChalice(chalice, validRelics, desiredEffects);
    if (combination && combination.score > highestScore) {
      highestScore = combination.score;
      bestCombination = combination;
    }
  }

  console.log(`Best combination found with score: ${highestScore}`);
  return bestCombination;
}

/**
 * Finds the best relic combination for a single chalice using optimized search.
 * @param {Object} chalice - The chalice object, including its name and slots.
 * @param {Array} relics - The list of available relics.
 * @param {Array} desiredEffects - The user's desired effects.
 * @returns {Object|null} - The best combination for the chalice, including the relics and score.
 */
function findBestCombinationForChalice(chalice, relics, desiredEffects) {
  const numSlots = chalice.slots.length;
  
  const relicsToConsider = relics;
  
  let bestCombination = null;
  let highestScore = -Infinity;
  let combinationsChecked = 0;
  const MAX_COMBINATIONS = Infinity;

  // Use iterative approach instead of recursive to avoid stack overflow
  const combinations = getRelicCombinationsIterative(relicsToConsider, numSlots, MAX_COMBINATIONS);
  
  for (const combination of combinations) {
    combinationsChecked++;
    
    if (combinationsChecked > MAX_COMBINATIONS) {
      console.warn(`Reached maximum combination limit (${MAX_COMBINATIONS}), stopping search`);
      break;
    }

    if (isValidCombination(combination, chalice.slots)) {
      const score = calculateScore(combination, desiredEffects);
      
      // Early termination for forbidden effects
      if (score === -Infinity) {
        continue;
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestCombination = {
          chalice: chalice,
          relics: combination,
          score: score,
        };
      }
    }
  }

  console.log(`Checked ${combinationsChecked} combinations for chalice ${chalice.name}`);
  return bestCombination;
}

/**
 * Calculates the score of a given relic combination based on desired effects.
 * @param {Array} relics - An array of relic objects.
 * @param {Array} desiredEffects - An array of desired effect objects.
 * @returns {number} - The calculated score for the relic combination.
 */
function calculateScore(relics, desiredEffects) {
  if (!relics || !desiredEffects) return 0;
  
  let score = 0;
  const allRelicEffects = new Set(); // Use Set for faster lookups
  
  // Collect all effects from relics
  for (const relic of relics) {
    const relicEffects = getRelicEffects(relic);
    relicEffects.forEach(effect => allRelicEffects.add(effect));
  }

  // Check for required and forbidden effects first (early termination)
  for (const desiredEffect of desiredEffects) {
    const hasEffect = allRelicEffects.has(desiredEffect.name);
    
    if (desiredEffect.isRequired && !hasEffect) {
      return -Infinity; // Invalid combination if a required effect is missing
    }
    if (desiredEffect.isForbidden && hasEffect) {
      return -Infinity; // Invalid combination if a forbidden effect is present
    }
  }

  // Calculate positive score
  for (const desiredEffect of desiredEffects) {
    if (allRelicEffects.has(desiredEffect.name)) {
      score += desiredEffect.weight || 1;
    }
  }

  return score;
}

// Helper functions

/**
 * Gets all effect names for a relic, handling null/undefined values
 */
function getRelicEffects(relic) {
  if (!relic) return [];
  
  const EMPTY_SLOT_ID = 4294967295; // 2^32 - 1 (unsigned 32-bit integer)
  
  const effectIds = [
    relic.effect1_id,
    relic.effect2_id,
    relic.effect3_id,
    relic.sec_effect1_id,
    relic.sec_effect2_id,
    relic.sec_effect3_id,
  ];

  return effectIds
    .filter(id => id && id !== 0 && id !== EMPTY_SLOT_ID)
    .map(id => effects[id?.toString()]?.name)
    .filter(Boolean);
}

/**
 * Gets the color of a relic, with fallback to 'white'
 */
function getRelicColor(relic) {
  if (!relic || !relic.item_id) return 'white';
  
  const relicInfo = items[relic.item_id.toString()];
  if (relicInfo && relicInfo.color) {
    return relicInfo.color.toLowerCase();
  }
  return 'white'; // Default color if not specified
}

/**
 * Checks if a relic combination is valid for the given chalice slots
 */
function isValidCombination(relics, slots) {
  if (!relics || !slots || relics.length !== slots.length) {
    return false;
  }

  const relicColors = relics.map(getRelicColor);
  const slotColors = [...slots]; // Create a copy

  for (const color of relicColors) {
    const index = slotColors.indexOf(color);
    if (index === -1) {
      return false; // No available slot for this relic's color
    }
    slotColors.splice(index, 1);
  }

  return true;
}

/**
 * Generates relic combinations using iterative approach to prevent stack overflow
 * Limited by maxCombinations to prevent infinite loops
 */
function getRelicCombinationsIterative(relics, size, maxCombinations = 1000) {
  const combinations = [];
  
  if (!relics || relics.length === 0 || size <= 0) {
    return combinations;
  }

  // For small sizes, use simple iteration
  if (size === 1) {
    return relics.slice(0, maxCombinations).map(relic => [relic]);
  }

  if (size === 2) {
    for (let i = 0; i < relics.length && combinations.length < maxCombinations; i++) {
      for (let j = i + 1; j < relics.length && combinations.length < maxCombinations; j++) {
        combinations.push([relics[i], relics[j]]);
      }
    }
    return combinations;
  }

  if (size === 3) {
    for (let i = 0; i < relics.length && combinations.length < maxCombinations; i++) {
      for (let j = i + 1; j < relics.length && combinations.length < maxCombinations; j++) {
        for (let k = j + 1; k < relics.length && combinations.length < maxCombinations; k++) {
          combinations.push([relics[i], relics[j], relics[k]]);
        }
      }
    }
    return combinations;
  }

  // For larger sizes, use a more controlled approach
  // This is a simplified version that won't generate all combinations
  // but will generate a reasonable subset
  const step = Math.max(1, Math.floor(relics.length / 10));
  
  for (let i = 0; i < relics.length && combinations.length < maxCombinations; i += step) {
    const combination = [];
    for (let j = 0; j < size && i + j < relics.length; j++) {
      combination.push(relics[i + j]);
    }
    if (combination.length === size) {
      combinations.push(combination);
    }
  }

  return combinations;
}