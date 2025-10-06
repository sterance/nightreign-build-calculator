import { chaliceData } from './vesselData.js';
import items from '../data/relics.json';
import baseRelicEffects from '../data/effects.json';

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

  // process base relics
  const processedBaseRelics = characterRelicData.relics.map(relic => {
    const relicInfo = items[relic.item_id?.toString()];
    if (!relicInfo || relicInfo.name?.startsWith('Deep')) {
      return null;
    }

    const getEffect = (id) => effectMap.get(id) || null;

    const color = relicInfo.color ? relicInfo.color.toLowerCase() : null;
    if (!color) {
      console.warn(`Relic ${relicInfo.name} (ID: ${relic.item_id}) has no color defined, skipping`);
      return null;
    }

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
      color: color,
      type: 'base',
      ...(relic.source && { source: relic.source })
    };
  }).filter(Boolean);

  // process deep relics (only when showDeepOfNight is true)
  let processedDeepRelics = [];
  if (showDeepOfNight) {
    processedDeepRelics = characterRelicData.relics.map(relic => {
      const relicInfo = items[relic.item_id?.toString()];
      if (!relicInfo || !relicInfo.name?.startsWith('Deep')) {
        return null;
      }

      const getEffect = (id) => effectMap.get(id) || null;

      const color = relicInfo.color ? relicInfo.color.toLowerCase() : null;
      if (!color) {
        console.warn(`Deep relic ${relicInfo.name} (ID: ${relic.item_id}) has no color defined, skipping`);
        return null;
      }

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
        color: color,
        type: 'deep',
        ...(relic.source && { source: relic.source })
      };
    }).filter(Boolean);
  }

  // score base relics
  const scoredBaseRelics = processedBaseRelics.map(relic => {
    const relicEffects = getRelicEffects(relic, effectMap);
    const score = calculateRelicScore(relicEffects, desiredEffects);
    const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effectId =>
      de.ids.includes(effectId)
    ));
    const effectScores = calculateEffectScores(relic, effectMap, desiredEffects);

    return { ...relic, score, isForbidden, effectScores };
  }).filter(relic => !relic.isForbidden)
    .sort((a, b) => b.score - a.score);

  console.log(`Scored ${scoredBaseRelics.length} base relics (${scoredBaseRelics.filter(r => r.score > 0).length} with score > 0)`);

  // score deep relics (if showDeepOfNight is true)
  let scoredDeepRelics = [];
  if (showDeepOfNight && processedDeepRelics.length > 0) {
    scoredDeepRelics = processedDeepRelics.map(relic => {
      const relicEffects = getRelicEffects(relic, effectMap);
      const score = calculateRelicScore(relicEffects, desiredEffects);
      const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effectId =>
        de.ids.includes(effectId)
      ));
      const effectScores = calculateEffectScores(relic, effectMap, desiredEffects);

      return { ...relic, score, isForbidden, effectScores };
    }).filter(relic => !relic.isForbidden)
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

    const combination = findBestCombinationForChalice(chalice, scoredBaseRelics, scoredDeepRelics, showDeepOfNight, desiredEffects, effectMap);
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
    // check if any of the relic's effect IDs match any of the desired effect's IDs
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
 * Calculates individual effect scores for each effect on a relic
 * @param {Object} relic - The relic object
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @param {Array} desiredEffects - Array of desired effects for scoring
 * @returns {Object} - Object with effect details including id, name, and score
 */
function calculateEffectScores(relic, effectMap, desiredEffects) {
  const effectFields = ['effect 1', 'sec_effect1', 'effect 2', 'sec_effect2', 'effect 3', 'sec_effect3'];
  const effectKeys = ['effect1', 'sec_effect1', 'effect2', 'sec_effect2', 'effect3', 'sec_effect3'];
  const effectScores = {};

  effectFields.forEach((field, index) => {
    const effectName = relic[field];
    if (!effectName) {
      return;
    }

    // find the effect ID from the effectMap
    let effectId = null;
    for (const [id, name] of effectMap.entries()) {
      if (name === effectName) {
        effectId = parseInt(id);
        break;
      }
    }

    // calculate the score for this specific effect
    let score = 0;
    if (effectId !== null) {
      for (const desiredEffect of desiredEffects) {
        if (desiredEffect.ids.includes(effectId)) {
          score = desiredEffect.weight || 1;
          break;
        }
      }
    }

    effectScores[effectKeys[index]] = {
      id: effectId,
      name: effectName,
      score: score
    };
  });

  return effectScores;
}

/**
 * Finds the best relic combination for a single chalice using exhaustive search with stacking-aware scoring.
 * @param {Object} chalice - The chalice object, including its name and slots.
 * @param {Array} scoredBaseRelics - The list of all scored and filtered base relics.
 * @param {Array} scoredDeepRelics - The list of all scored and filtered deep relics.
 * @param {boolean} showDeepOfNight - Whether to calculate deep relics as well.
 * @param {Array} desiredEffects - Array of desired effects for true score calculation.
 * @param {Map} effectMap - Map of effect IDs to effect names.
 * @returns {Object|null} - The best combination for the chalice, or null if slots cannot be filled.
 */
function findBestCombinationForChalice(chalice, scoredBaseRelics, scoredDeepRelics = [], showDeepOfNight = false, desiredEffects, effectMap) {
  if (showDeepOfNight && chalice.deepSlots && scoredDeepRelics.length > 0) {
    // when showDeepOfNight is true, validate the combined build
    return findBestCombinedRelicsWithFallback(chalice, scoredBaseRelics, scoredDeepRelics, desiredEffects, effectMap);
  } else {
    // base relics only
    const bestBaseRelics = findBestRelicsForSlots(chalice.baseSlots, scoredBaseRelics, desiredEffects, effectMap);
    if (!bestBaseRelics) {
      return null;
    }

    const result = {
      chalice: {
        name: chalice.name,
        baseSlots: chalice.baseSlots,
        deepSlots: chalice.deepSlots || [],
        description: chalice.description
      },
      baseRelics: bestBaseRelics.relics,
      deepRelics: [],
      relics: bestBaseRelics.relics,
      score: bestBaseRelics.score,
    };

    return result;
  }
}

/**
 * Finds the best combined base + deep relics with comprehensive fallback behavior
 * Tries base combinations in order of score, and for each base combination,
 * tries to find deep relics that work with it
 */
function findBestCombinedRelicsWithFallback(chalice, scoredBaseRelics, scoredDeepRelics, desiredEffects, effectMap) {
  // get all base combinations (with fallback behavior)
  const allBaseCombinations = generateAllBaseCombinations(chalice.baseSlots, scoredBaseRelics, desiredEffects, effectMap);
  if (!allBaseCombinations || allBaseCombinations.length === 0) {
    return null;
  }

  // try each base combination in order of score
  for (const baseCombo of allBaseCombinations) {
    // try to find deep relics that work with this base combination
    const deepCombo = findBestDeepRelicsForBase(chalice.deepSlots, scoredDeepRelics, baseCombo.relics, desiredEffects, effectMap);
    
    if (deepCombo) {
      // found a valid combination
      const result = {
        chalice: {
          name: chalice.name,
          baseSlots: chalice.baseSlots,
          deepSlots: chalice.deepSlots || [],
          description: chalice.description
        },
        baseRelics: baseCombo.relics,
        deepRelics: deepCombo.relics,
        relics: baseCombo.relics,
        score: baseCombo.score + deepCombo.score,
      };
      return result;
    }
  }

  // no valid combination found
  return null;
}


// generates all base combinations with comprehensive fallback behavior
function generateAllBaseCombinations(slots, scoredRelics, desiredEffects, effectMap) {
  return generateRelicCombinations(slots, scoredRelics, desiredEffects, effectMap, {
    returnAll: true,
    validateRequired: false
  });
}


// finds the best deep relics that work with a given base combination
function findBestDeepRelicsForBase(slots, scoredRelics, baseRelics, desiredEffects, effectMap) {
  return generateRelicCombinations(slots, scoredRelics, desiredEffects, effectMap, {
    baseRelics: baseRelics,
    returnAll: false,
    validateRequired: true
  });
}

/**
 * Helper function to find the best relics for a set of slots using exhaustive search with stacking-aware scoring
 * @param {Array} slots - Array of slot colors
 * @param {Array} scoredRelics - Array of scored relics
 * @param {Array} desiredEffects - Array of desired effects for true score calculation
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @returns {Object|null} - Object with relics array and total score, or null if slots cannot be filled
 */
function findBestRelicsForSlots(slots, scoredRelics, desiredEffects, effectMap) {
  return generateRelicCombinations(slots, scoredRelics, desiredEffects, effectMap, {
    returnAll: false,
    validateRequired: true
  });
}

/**
 * Calculates the true score of a relic combination, accounting for non-stacking effects
 * @param {Array} relics - Array of relics in the combination
 * @param {Array} desiredEffects - Array of desired effects
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @returns {number} - The true combination score
 */
function calculateTrueCombinationScore(relics, desiredEffects, effectMap) {
  // collect all effects from all relics in the combination
  const allEffectIds = [];
  for (const relic of relics) {
    const relicEffects = getRelicEffects(relic, effectMap);
    allEffectIds.push(...relicEffects);
  }

  let totalScore = 0;

  // for each desired effect, calculate its contribution to the score
  for (const desiredEffect of desiredEffects) {
    // count how many times this desired effect appears in the combination
    const matchingEffectCount = allEffectIds.filter(effectId => 
      desiredEffect.ids.includes(effectId)
    ).length;

    if (matchingEffectCount > 0) {
      // check if any of the effect IDs in this desired effect group are non-stacking
      const isNonStacking = desiredEffect.ids.some(effectId => {
        const effectData = baseRelicEffects.find(effect => effect.ids.includes(effectId));
        return effectData && effectData.stacks === false;
      });

      if (isNonStacking) {
        // non-stacking effect: only count once regardless of how many times it appears
        totalScore += desiredEffect.weight || 1;
      } else {
        // stacking effect: count each occurrence
        totalScore += (desiredEffect.weight || 1) * matchingEffectCount;
      }
    }
  }

  return totalScore;
}

/**
 * Validates that a relic combination contains all required effects
 * @param {Array} relics - Array of relics in the combination
 * @param {Array} desiredEffects - Array of desired effects
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @returns {boolean} - True if all required effects are present
 */
function validateRequiredEffects(relics, desiredEffects, effectMap) {
  // get all effects from the combination
  const allEffectIds = [];
  for (const relic of relics) {
    const relicEffects = getRelicEffects(relic, effectMap);
    allEffectIds.push(...relicEffects);
  }

  // check that all required effects are present
  for (const desiredEffect of desiredEffects) {
    if (desiredEffect.isRequired) {
      const hasRequiredEffect = desiredEffect.ids.some(effectId => 
        allEffectIds.includes(effectId)
      );
      
      if (!hasRequiredEffect) {
        return false; // missing a required effect
      }
    }
  }

  return true; // all required effects are present
}

/**
 * Unified function to generate relic combinations with flexible validation
 * @param {Array} slots - Array of slot colors
 * @param {Array} scoredRelics - Array of scored relics
 * @param {Array} desiredEffects - Array of desired effects for true score calculation
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @param {Object} options - Configuration options
 * @param {Array} options.baseRelics - Base relics to check compatibility with (for deep relic validation)
 * @param {boolean} options.returnAll - If true, return all combinations; if false, return only the first valid one
 * @param {boolean} options.validateRequired - If true, validate required effects; if false, skip validation
 * @returns {Array|Object|null} - Array of combinations, single combination object, or null
 */
function generateRelicCombinations(slots, scoredRelics, desiredEffects, effectMap, options = {}) {
  const { baseRelics = [], returnAll = false, validateRequired = true } = options;
  
  if (slots.length === 0) {
    const emptyResult = { relics: [], score: 0 };
    return returnAll ? [emptyResult] : emptyResult;
  }

  // group relics by color for efficient lookup
  const relicsByColor = {
    red: scoredRelics.filter(r => r.color === 'red'),
    blue: scoredRelics.filter(r => r.color === 'blue'),
    yellow: scoredRelics.filter(r => r.color === 'yellow'),
    green: scoredRelics.filter(r => r.color === 'green'),
  };

  console.log(`Relics by color - Red: ${relicsByColor.red.length}, Blue: ${relicsByColor.blue.length}, Yellow: ${relicsByColor.yellow.length}, Green: ${relicsByColor.green.length}`);
  console.log(`Slots needed: ${JSON.stringify(slots)}`);

  // get valid relics for each slot
  const validRelicsPerSlot = slots.map(slotColor => {
    if (slotColor === 'white') {
      // white slots can use any color
      return [...relicsByColor.red, ...relicsByColor.blue, ...relicsByColor.yellow, ...relicsByColor.green];
    } else {
      return relicsByColor[slotColor] || [];
    }
  });

  // check if all slots have no valid relics
  if (validRelicsPerSlot.every(relics => relics.length === 0)) {
    if (returnAll) {
      return [];
    } else {
      console.warn(`No valid relics found for any slots`);
      return null;
    }
  }
  
  // for slots with no valid relics, create a placeholder to allow partial combinations
  const emptySlotPlaceholder = {
    'relic id': null,
    'relic name': 'Empty Slot',
    'effect 1': null,
    'effect 2': null,
    'effect 3': null,
    'sec_effect1': null,
    'sec_effect2': null,
    'sec_effect3': null,
    sorting: -1,
    color: 'empty',
    type: 'empty',
    score: 0,
    effectScores: []
  };
  
  // add placeholder to empty slots with unique sorting values
  validRelicsPerSlot.forEach((relics, index) => {
    if (relics.length === 0) {
      const uniquePlaceholder = {
        ...emptySlotPlaceholder,
        sorting: -1 - index
      };
      validRelicsPerSlot[index] = [uniquePlaceholder];
    }
  });

  let allValidCombinations = [];
  let bestScoreSoFar = -1;

  // generate all valid combinations using recursive approach with pruning
  function generateCombinations(slotIndex, currentCombination, usedRelicIds, currentIndividualScore) {
    // upper bound pruning: check if this branch can possibly beat current best
    if (bestScoreSoFar >= 0) {
      const remainingSlots = slots.length - slotIndex;
      let maxPossibleFromRemaining = 0;
      
      // calculate maximum possible score from remaining slots
      for (let i = slotIndex; i < slots.length; i++) {
        const availableRelics = validRelicsPerSlot[i].filter(r => !usedRelicIds.has(r.sorting));
        if (availableRelics.length > 0) {
          maxPossibleFromRemaining += Math.max(...availableRelics.map(r => r.score));
        }
      }
      
      // if even the most optimistic scenario can't beat current best, prune
      if (currentIndividualScore + maxPossibleFromRemaining <= bestScoreSoFar) {
        return;
      }
    }

    // base case: all slots filled
    if (slotIndex === slots.length) {
      const trueScore = calculateTrueCombinationScore(currentCombination, desiredEffects, effectMap);
      
      // store this combination
      allValidCombinations.push({
        relics: [...currentCombination],
        score: trueScore
      });
      
      // update best score for pruning
      if (trueScore > bestScoreSoFar) {
        bestScoreSoFar = trueScore;
      }
      return;
    }

    // try each valid relic for current slot
    const availableRelics = validRelicsPerSlot[slotIndex].filter(r => !usedRelicIds.has(r.sorting));
    
    for (const relic of availableRelics) {
      currentCombination[slotIndex] = relic;
      usedRelicIds.add(relic.sorting);
      
      generateCombinations(
        slotIndex + 1, 
        currentCombination, 
        usedRelicIds, 
        currentIndividualScore + relic.score
      );
      
      // backtrack
      usedRelicIds.delete(relic.sorting);
    }
  }

  // start the recursive generation
  generateCombinations(0, new Array(slots.length), new Set(), 0);

  if (allValidCombinations.length === 0) {
    console.log(`No combinations could be generated for slots: ${JSON.stringify(slots)}`);
    return returnAll ? [] : null;
  }

  console.log(`Generated ${allValidCombinations.length} combinations, top score: ${Math.max(...allValidCombinations.map(c => c.score))}`);

  // sort by score (highest first)
  allValidCombinations.sort((a, b) => b.score - a.score);

  if (returnAll) {
    return allValidCombinations;
  }

  // find first combination that satisfies validation requirements
  for (const combination of allValidCombinations) {
    if (validateRequired) {
      if (baseRelics.length > 0) {
        // for deep relics: check if combined with base relics satisfies required effects
        const combinedRelics = [...baseRelics, ...combination.relics];
        const isValid = validateRequiredEffects(combinedRelics, desiredEffects, effectMap);
        if (!isValid) {
          console.log(`Combination failed required effects validation (with base relics)`);
        }
        if (isValid) {
          return combination;
        }
      } else {
        // for base relics: check if combination satisfies required effects
        const isValid = validateRequiredEffects(combination.relics, desiredEffects, effectMap);
        if (!isValid && allValidCombinations.indexOf(combination) === 0) {
          console.log(`Top combination score ${combination.score} failed required effects validation`);
          console.log(`Required effects:`, desiredEffects.filter(e => e.isRequired).map(e => e.name));
        }
        if (isValid) {
          return combination;
        }
      }
    } else {
      // no validation required, return first (highest scoring) combination
      return combination;
    }
  }

  console.warn(`All ${allValidCombinations.length} combinations failed validation`);
  return null;
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

  // convert effect names to IDs using the effectMap
  const effectIds = [];
  for (const [effectId, effectName] of effectMap.entries()) {
    if (effectNames.includes(effectName)) {
      effectIds.push(parseInt(effectId));
    }
  }

  return effectIds;
}