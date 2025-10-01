import { chaliceData } from '../data/chaliceData.js';
import items from '../data/items.json';
import baseRelicEffects from '../data/relicEffects.json';

// effectMap is now passed as a parameter to the function

/**
 * Calculates the best relic combination for a given set of desired effects, available relics, and selected chalices.
 * @param {Array} desiredEffects - An array of desired effect objects, including name, weight, isRequired, and isForbidden properties.
 * @param {Object} characterRelicData - The relic data for the selected character from the user's save file.
 * @param {Array} selectedChalices - An array of names of the selected chalices.
 * @param {string} selectedNightfarer - The name of the selected Nightfarer (e.g., 'wylder').
 * @param {Map} effectMap - Map of effect IDs to effect names.
 * @param {boolean} showDeepOfNight - Whether to calculate deep relics as well.
 * @returns {Array|null} - Array of best relic combinations with max score, or null if none could be determined.
 */
export function calculateBestRelics(desiredEffects,
  characterRelicData,
  selectedChalices,
  selectedNightfarer,
  effectMap,
  showDeepOfNight = false) {
    
  console.log("--- Starting Relic Calculation ---");
  // input validation
  if (!desiredEffects || !characterRelicData || !selectedChalices || !selectedNightfarer || !effectMap) {
    console.error('Missing required parameters for calculation:', { desiredEffects, characterRelicData, selectedChalices, selectedNightfarer, effectMap });
    throw new Error('Missing required parameters for calculation');
  }

  if (!Array.isArray(desiredEffects) || desiredEffects.length === 0) {
    throw new Error('No desired effects provided');
  }

  if (!characterRelicData.relics || !Array.isArray(characterRelicData.relics)) {
    throw new Error('Invalid character relic data');
  }

  if (characterRelicData.relics.length === 0) {
    console.warn('No relics found for character');
    return null;
  }

  // Process base relics (always needed)
  const processedBaseRelics = characterRelicData.relics.map(relic => {
    const relicInfo = items[relic.item_id?.toString()];
    if (!relicInfo || relicInfo.name?.startsWith('Deep')) {
      return null;
    }

    const getEffect = (id) => effectMap.get(id) || null;

    return {
      'relic id': relic.item_id,
      'relic name': relicInfo.name,
      'effect 1': getEffect(relic.effect1_id),
      'effect 2': getEffect(relic.effect2_id),
      'effect 3': getEffect(relic.effect3_id),
      'sec_effect1': getEffect(relic.sec_effect1_id),
      'sec_effect2': getEffect(relic.sec_effect2_id),
      'sec_effect3': getEffect(relic.sec_effect3_id),
      sorting: relic.sorting,
      color: relicInfo.color ? relicInfo.color.toLowerCase() : 'white',
      type: 'base'
    };
  }).filter(Boolean);

  // Process deep relics (only when showDeepOfNight is true)
  let processedDeepRelics = [];
  if (showDeepOfNight) {
    processedDeepRelics = characterRelicData.relics.map(relic => {
      const relicInfo = items[relic.item_id?.toString()];
      if (!relicInfo || !relicInfo.name?.startsWith('Deep')) {
        return null;
      }

      const getEffect = (id) => effectMap.get(id) || null;

      return {
        'relic id': relic.item_id,
        'relic name': relicInfo.name,
        'effect 1': getEffect(relic.effect1_id),
        'effect 2': getEffect(relic.effect2_id),
        'effect 3': getEffect(relic.effect3_id),
        'sec_effect1': getEffect(relic.sec_effect1_id),
        'sec_effect2': getEffect(relic.sec_effect2_id),
        'sec_effect3': getEffect(relic.sec_effect3_id),
        sorting: relic.sorting,
        color: relicInfo.color ? relicInfo.color.toLowerCase() : 'white',
        type: 'deep'
      };
    }).filter(Boolean);
  }

  if (processedBaseRelics.length === 0) {
    console.warn('No valid base relics found for character after filtering');
    return null;
  }

  // Score base relics
  const scoredBaseRelics = processedBaseRelics.map(relic => {
    const relicEffects = getRelicEffects(relic, effectMap);
    const score = calculateRelicScore(relicEffects, desiredEffects);
    const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effectId =>
      de.ids.includes(effectId)
    ));

    return { ...relic, score, isForbidden };
  }).filter(relic => !relic.isForbidden && relic.score > 0)
    .sort((a, b) => b.score - a.score);

  // Score deep relics (if showDeepOfNight is true)
  let scoredDeepRelics = [];
  if (showDeepOfNight && processedDeepRelics.length > 0) {
    scoredDeepRelics = processedDeepRelics.map(relic => {
      const relicEffects = getRelicEffects(relic, effectMap);
      const score = calculateRelicScore(relicEffects, desiredEffects);
      const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effectId =>
        de.ids.includes(effectId)
      ));

      return { ...relic, score, isForbidden };
    }).filter(relic => !relic.isForbidden && relic.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // for each chalice, find the best combination of relics.
  const allCombinations = [];

  const chaliceDataForCharacter = chaliceData[selectedNightfarer];
  if (!chaliceDataForCharacter) {
    console.error(`No chalice data found for character: ${selectedNightfarer}`);
    return null;
  }

  // first pass: collect all valid combinations
  for (const chaliceName of selectedChalices) {
    const chalice = chaliceDataForCharacter.find(c => c.name === chaliceName);
    if (!chalice) {
      console.warn(`Could not find data for chalice: ${chaliceName}`);
      continue;
    }

    const combination = findBestCombinationForChalice(chalice, scoredBaseRelics, scoredDeepRelics, showDeepOfNight);
    if (combination) {
      console.log(`Best combination found for ${chalice.name}:`, JSON.parse(JSON.stringify(combination)));
      allCombinations.push(combination);
    } else {
      console.log(`No valid combination found for ${chalice.name}.`);
    }
  }

  if (allCombinations.length === 0) {
    return null;
  }

  // second pass: find maximum score and return all combinations with that score
  const maxScore = Math.max(...allCombinations.map(combo => combo.score));
  const bestCombinations = allCombinations.filter(combo => combo.score === maxScore);

  return bestCombinations;
}

/**
 * Calculates the score of a single relic based on its effects and the user's desired effects.
 * @param {Array} relicEffects - An array of effect objects for the relic.
 * @param {Array} desiredEffects - An array of desired effect objects from the user.
 * @returns {number} - The calculated score for the relic.
 */
function calculateRelicScore(relicEffects, desiredEffects) {
  let score = 0;
  for (const desiredEffect of desiredEffects) {
    // Check if any of the relic's effect IDs match any of the desired effect's IDs
    const hasMatch = relicEffects.some(effectId =>
      desiredEffect.ids.includes(effectId)
    );
    if (hasMatch) {
      score += desiredEffect.weight || 1;
    }
  }
  return score;
}

/**
 * Finds the best relic combination for a single chalice by picking the highest-scored relic for each slot.
 * @param {Object} chalice - The chalice object, including its name and slots.
 * @param {Array} scoredBaseRelics - The list of all scored and filtered base relics.
 * @param {Array} scoredDeepRelics - The list of all scored and filtered deep relics.
 * @param {boolean} showDeepOfNight - Whether to calculate deep relics as well.
 * @returns {Object|null} - The best combination for the chalice, or null if slots cannot be filled.
 */
function findBestCombinationForChalice(chalice, scoredBaseRelics, scoredDeepRelics = [], showDeepOfNight = false) {
  // Find best base relics
  const bestBaseRelics = findBestRelicsForSlots(chalice.baseSlots, scoredBaseRelics);
  if (!bestBaseRelics) {
    return null;
  }

  let bestDeepRelics = null;
  let deepScore = 0;

  // Find best deep relics if showDeepOfNight is true and chalice has deep slots
  if (showDeepOfNight && chalice.deepSlots && scoredDeepRelics.length > 0) {
    bestDeepRelics = findBestRelicsForSlots(chalice.deepSlots, scoredDeepRelics);
    if (bestDeepRelics) {
      deepScore = bestDeepRelics.score;
    }
  }

  const result = {
    chalice: {
      name: chalice.name,
      baseSlots: chalice.baseSlots,
      deepSlots: chalice.deepSlots || [],
      description: chalice.description
    },
    baseRelics: bestBaseRelics.relics,
    deepRelics: bestDeepRelics ? bestDeepRelics.relics : [],
    relics: bestBaseRelics.relics, // Keep for backward compatibility
    score: bestBaseRelics.score + deepScore,
  };

  return result;
}

/**
 * Helper function to find the best relics for a set of slots
 * @param {Array} slots - Array of slot colors
 * @param {Array} scoredRelics - Array of scored relics
 * @returns {Object|null} - Object with relics array and total score, or null if slots cannot be filled
 */
function findBestRelicsForSlots(slots, scoredRelics) {
  const bestRelicsForSlots = [];
  let totalScore = 0;
  const usedRelicIds = new Set();

  const relicsByColor = {
    red: scoredRelics.filter(r => r.color === 'red'),
    blue: scoredRelics.filter(r => r.color === 'blue'),
    yellow: scoredRelics.filter(r => r.color === 'yellow'),
    green: scoredRelics.filter(r => r.color === 'green'),
    white: scoredRelics.filter(r => r.color === 'white'),
  };

  for (const slotColor of slots) {
    let bestRelicForSlot = null;
    // white slots are wildcards
    if (slotColor === 'white') {
      let bestOverallRelic = null;
      // find the best relic from any color that hasn't been used yet
      for (const color of Object.keys(relicsByColor)) {
        const availableRelics = relicsByColor[color].filter(r => !usedRelicIds.has(r.sorting));
        if (availableRelics.length > 0) {
          if (!bestOverallRelic || availableRelics[0].score > bestOverallRelic.score) {
            bestOverallRelic = availableRelics[0];
          }
        }
      }
      bestRelicForSlot = bestOverallRelic;
    } else {
      // find the best relic for the specific color that hasn't been used yet
      bestRelicForSlot = relicsByColor[slotColor].find(r => !usedRelicIds.has(r.sorting)) || null;
    }

    if (bestRelicForSlot) {
      bestRelicsForSlots.push(bestRelicForSlot);
      totalScore += bestRelicForSlot.score;
      usedRelicIds.add(bestRelicForSlot.sorting);
    } else {
      console.warn(`Could not find a unique relic for a ${slotColor} slot.`);
      return null; // not enough unique relics to fill these slots
    }
  }

  return {
    relics: bestRelicsForSlots,
    score: totalScore
  };
}

// HELPER FUNCTIONS

// gets all effect IDs for a relic by converting effect names to IDs using effectMap
function getRelicEffects(relic, effectMap) {
  if (!relic) return [];

  const effectNames = [
    relic['effect 1'],
    relic['effect 2'],
    relic['effect 3'],
    relic['sec_effect1'],
    relic['sec_effect2'],
    relic['sec_effect3'],
  ].filter(Boolean);

  // Convert effect names to IDs using the effectMap
  const effectIds = [];
  for (const [effectId, effectName] of effectMap.entries()) {
    if (effectNames.includes(effectName)) {
      effectIds.push(parseInt(effectId));
    }
  }

  return effectIds;
}