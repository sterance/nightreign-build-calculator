import items from '../data/relics.json';
import baseRelicEffects from '../data/effects.json';
import { getRelicInfo } from './utils.js';

/**
 * Calculates the best relic combination for a given set of desired effects, available relics, and selected vessels.
 * @param {Array} desiredEffects - An array of desired effect objects, including name, weight, isRequired, and isForbidden properties.
 * @param {Object} characterRelicData - The relic data for the selected character from the user's save file.
 * @param {Array} selectedVessels - An array of names of the selected vessels.
 * @param {string} selectedNightfarer - The name of the selected Nightfarer (e.g., 'wylder').
 * @param {Map} effectMap - Map of effect IDs to effect names.
 * @param {boolean} showDeepOfNight - Whether to calculate deep relics as well.
 * @param {boolean} showForsakenHollows - Whether to calculate forsaken relics as well.
 * @param {Object} vesselData - Map of character names to their available vessels.
 * @returns {Array|null} - Array of best relic combinations with max score, or null if none could be determined.
 */
export function calculateBestRelics(desiredEffects,
  characterRelicData,
  selectedVessels,
  selectedNightfarer,
  effectMap,
  showDeepOfNight = false,
  showForsakenHollows = false,
  vesselData) {
    
  console.log("--- Starting Relic Calculation ---");
  // input validation
  if (!desiredEffects || !characterRelicData || !selectedVessels || !selectedNightfarer || !effectMap) {
    console.error('Missing required parameters for calculation:', { desiredEffects, characterRelicData, selectedVessels, selectedNightfarer, effectMap });
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
    const relicInfo = getRelicInfo(relic.item_id, items);
    if (!relicInfo || relicInfo.name?.startsWith('Deep')) {
      return null;
    }
    // filter out forsaken relics if showForsakenHollows is false
    if (!showForsakenHollows && relicInfo.forsaken === true) {
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
      const relicInfo = getRelicInfo(relic.item_id, items);
      if (!relicInfo || !relicInfo.name?.startsWith('Deep')) {
        return null;
      }
      // filter out forsaken relics if showForsakenHollows is false
      if (!showForsakenHollows && relicInfo.forsaken === true) {
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
    const { score, effectContributions } = calculateRelicScore(relic, effectMap, desiredEffects);
    const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effectId =>
      de.ids.includes(effectId)
    ));

    return { ...relic, score, isForbidden, effectScores: effectContributions };
  }).filter(relic => !relic.isForbidden)
    .sort((a, b) => b.score - a.score);

  console.log(`Scored ${scoredBaseRelics.length} base relics (${scoredBaseRelics.filter(r => r.score > 0).length} with score > 0)`);

  // score deep relics (if showDeepOfNight is true)
  let scoredDeepRelics = [];
  if (showDeepOfNight && processedDeepRelics.length > 0) {
    scoredDeepRelics = processedDeepRelics.map(relic => {
      const relicEffects = getRelicEffects(relic, effectMap);
      const { score, effectContributions } = calculateRelicScore(relic, effectMap, desiredEffects);
      const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effectId =>
        de.ids.includes(effectId)
      ));

      return { ...relic, score, isForbidden, effectScores: effectContributions };
    }).filter(relic => !relic.isForbidden)
      .sort((a, b) => b.score - a.score);
    
    console.log(`Scored ${scoredDeepRelics.length} deep relics (${scoredDeepRelics.filter(r => r.score > 0).length} with score > 0)`);
  }

  // for each vessel, find the best combination of relics.
  const allCombinations = [];

  const vesselDataForCharacter = vesselData[selectedNightfarer];
  if (!vesselDataForCharacter) {
    console.error(`No vessel data found for character: ${selectedNightfarer}`);
    return null;
  }

  // log relics by color once before processing vessels
  const relicsByColor = {
    red: scoredBaseRelics.filter(r => r.color === 'red' && r.score > 0),
    blue: scoredBaseRelics.filter(r => r.color === 'blue' && r.score > 0),
    yellow: scoredBaseRelics.filter(r => r.color === 'yellow' && r.score > 0),
    green: scoredBaseRelics.filter(r => r.color === 'green' && r.score > 0),
  };
  console.log(`Base relics by color - Red: ${relicsByColor.red.length}, Blue: ${relicsByColor.blue.length}, Yellow: ${relicsByColor.yellow.length}, Green: ${relicsByColor.green.length}`);

  if (showDeepOfNight && scoredDeepRelics.length > 0) {
    const deepRelicsByColor = {
      red: scoredDeepRelics.filter(r => r.color === 'red' && r.score > 0),
      blue: scoredDeepRelics.filter(r => r.color === 'blue' && r.score > 0),
      yellow: scoredDeepRelics.filter(r => r.color === 'yellow' && r.score > 0),
      green: scoredDeepRelics.filter(r => r.color === 'green' && r.score > 0),
    };
    console.log(`Deep relics by color - Red: ${deepRelicsByColor.red.length}, Blue: ${deepRelicsByColor.blue.length}, Yellow: ${deepRelicsByColor.yellow.length}, Green: ${deepRelicsByColor.green.length}`);
  }

  // first pass: collect all valid combinations
  for (const vesselName of selectedVessels) {
    const vessel = vesselDataForCharacter.find(c => c.name === vesselName);
    if (!vessel) {
      console.warn(`Could not find data for vessel: ${vesselName}`);
      continue;
    }

    console.log(`--- Calculating Best Combination for ${vessel.name} ---`);
    const combinations = findBestCombinationForVessel(vessel, scoredBaseRelics, scoredDeepRelics, showDeepOfNight, desiredEffects, effectMap);
    if (combinations && combinations.length > 0) {
      console.log(`Best combination/s found for ${vessel.name} (${combinations.length} with max score):`, JSON.parse(JSON.stringify(combinations)));
      allCombinations.push(...combinations);
    } else {
      console.log(`No valid combination found for ${vessel.name}.`);
    }
  }

  console.log(`--- Calculating Overall Best Combinations ---`);
  console.log(`Found ${allCombinations.length} total combinations across all vessels`);

  if (allCombinations.length === 0) {
    return null;
  }

  // second pass: find maximum score and return all combinations with that score
  const maxScore = Math.max(...allCombinations.map(combo => combo.score));
  console.log(`Maximum score: ${maxScore}`);
  const bestCombinations = allCombinations.filter(combo => combo.score === maxScore);
  console.log(`Returning ${bestCombinations.length} combination(s) with max score`);

  return bestCombinations;
}

/**
 * Calculates the score of a single relic and individual effect contributions.
 * Splits weight equally when multiple effects on the same relic match the same desired effect group.
 * @param {Object} relic - The relic object with effect fields.
 * @param {Map} effectMap - Map of effect IDs to effect names.
 * @param {Array} desiredEffects - An array of desired effect objects from the user.
 * @returns {Object} - { score: number, effectContributions: object } where effectContributions maps effect slots to their scores.
 */
function calculateRelicScore(relic, effectMap, desiredEffects) {
  const effectFields = ['effect 1', 'sec_effect1', 'effect 2', 'sec_effect2', 'effect 3', 'sec_effect3'];
  const effectKeys = ['effect1', 'sec_effect1', 'effect2', 'sec_effect2', 'effect3', 'sec_effect3'];
  
  // map each effect slot to its effect ID
  const slotToEffectId = {};
  effectFields.forEach((field, index) => {
    const effectName = relic[field];
    if (!effectName) {
      return;
    }
    
    // find the effect ID from the effectMap
    for (const [id, name] of effectMap.entries()) {
      if (name === effectName) {
        slotToEffectId[effectKeys[index]] = {
          id: parseInt(id),
          name: effectName
        };
        break;
      }
    }
  });
  
  // initialize all slots with effect data and 0 score
  const effectContributions = {};
  effectKeys.forEach(key => {
    if (slotToEffectId[key]) {
      effectContributions[key] = {
        id: slotToEffectId[key].id,
        name: slotToEffectId[key].name,
        score: 0
      };
    }
  });
  
  // group effect slots by which desired effect group they match
  const desiredEffectToSlots = new Map();
  
  Object.entries(slotToEffectId).forEach(([slot, effectData]) => {
    for (const desiredEffect of desiredEffects) {
      if (desiredEffect.ids.includes(effectData.id)) {
        if (!desiredEffectToSlots.has(desiredEffect)) {
          desiredEffectToSlots.set(desiredEffect, []);
        }
        desiredEffectToSlots.get(desiredEffect).push(slot);
        break;
      }
    }
  });
  
  // calculate total score and distribute weight among matching slots
  let totalScore = 0;
  
  desiredEffectToSlots.forEach((slots, desiredEffect) => {
    const weight = desiredEffect.weight || 1;
    const contribution = weight / slots.length;
    
    slots.forEach(slot => {
      effectContributions[slot].score = contribution;
    });
    
    totalScore += weight;
  });
  
  return { score: totalScore, effectContributions };
}


/**
 * Finds the best relic combinations for a single vessel using exhaustive search with stacking-aware scoring.
 * @param {Object} vessel - The vessel object, including its name and slots.
 * @param {Array} scoredBaseRelics - The list of all scored and filtered base relics.
 * @param {Array} scoredDeepRelics - The list of all scored and filtered deep relics.
 * @param {boolean} showDeepOfNight - Whether to calculate deep relics as well.
 * @param {Array} desiredEffects - Array of desired effects for true score calculation.
 * @param {Map} effectMap - Map of effect IDs to effect names.
 * @returns {Array|null} - Array of best combinations for the vessel, or null if slots cannot be filled.
 */
function findBestCombinationForVessel(vessel, scoredBaseRelics, scoredDeepRelics = [], showDeepOfNight = false, desiredEffects, effectMap) {
  if (showDeepOfNight && vessel.deepSlots && scoredDeepRelics.length > 0) {
    // when showDeepOfNight is true, validate the combined build
    return findBestCombinedRelicsWithFallback(vessel, scoredBaseRelics, scoredDeepRelics, desiredEffects, effectMap);
  } else {
    // base relics only
    const bestBaseRelics = findBestRelicsForSlots(vessel.baseSlots, scoredBaseRelics, desiredEffects, effectMap);
    if (!bestBaseRelics) {
      return null;
    }

    // bestBaseRelics is now an array of all max-scoring combinations
    const results = bestBaseRelics.map(combo => ({
      vessel: {
        name: vessel.name,
        baseSlots: vessel.baseSlots,
        deepSlots: vessel.deepSlots || [],
        description: vessel.description
      },
      baseRelics: combo.relics,
      deepRelics: [],
      relics: combo.relics,
      score: combo.score,
    }));

    return results;
  }
}

/**
 * Finds the best combined base + deep relics with comprehensive fallback behavior
 * Tries base combinations in order of score, and for each base combination,
 * tries to find deep relics that work with it. Returns all combinations with max score.
 */
function findBestCombinedRelicsWithFallback(vessel, scoredBaseRelics, scoredDeepRelics, desiredEffects, effectMap) {
  // get all base combinations (with fallback behavior)
  const allBaseCombinations = generateAllBaseCombinations(vessel.baseSlots, scoredBaseRelics, desiredEffects, effectMap);
  if (!allBaseCombinations || allBaseCombinations.length === 0) {
    return null;
  }

  const allValidResults = [];

  // try each base combination in order of score
  for (const baseCombo of allBaseCombinations) {
    // try to find deep relics that work with this base combination
    const deepCombos = findBestDeepRelicsForBase(vessel.deepSlots, scoredDeepRelics, baseCombo.relics, desiredEffects, effectMap);
    
    if (deepCombos && deepCombos.length > 0) {
      // found valid combinations - create result for each deep combo
      for (const deepCombo of deepCombos) {
        const result = {
          vessel: {
            name: vessel.name,
            baseSlots: vessel.baseSlots,
            deepSlots: vessel.deepSlots || [],
            description: vessel.description
          },
          baseRelics: baseCombo.relics,
          deepRelics: deepCombo.relics,
          relics: baseCombo.relics,
          score: baseCombo.score + deepCombo.score,
        };
        allValidResults.push(result);
      }
    }
  }

  if (allValidResults.length === 0) {
    return null;
  }

  // filter to only return combinations with maximum score
  const maxScore = Math.max(...allValidResults.map(r => r.score));
  return allValidResults.filter(r => r.score === maxScore);
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
  const allCombinations = generateRelicCombinations(slots, scoredRelics, desiredEffects, effectMap, {
    baseRelics: baseRelics,
    returnAll: true,
    validateRequired: true
  });
  
  if (!allCombinations || allCombinations.length === 0) {
    return null;
  }
  
  // filter to only return combinations with maximum score
  const maxScore = Math.max(...allCombinations.map(c => c.score));
  return allCombinations.filter(c => c.score === maxScore);
}

/**
 * Helper function to find the best relics for a set of slots using exhaustive search with stacking-aware scoring
 * @param {Array} slots - Array of slot colors
 * @param {Array} scoredRelics - Array of scored relics
 * @param {Array} desiredEffects - Array of desired effects for true score calculation
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @returns {Array|null} - Array of combination objects with relics array and total score, or null if slots cannot be filled
 */
function findBestRelicsForSlots(slots, scoredRelics, desiredEffects, effectMap) {
  const allCombinations = generateRelicCombinations(slots, scoredRelics, desiredEffects, effectMap, {
    returnAll: true,
    validateRequired: true
  });
  
  if (!allCombinations || allCombinations.length === 0) {
    return null;
  }
  
  // filter to only return combinations with maximum score
  const maxScore = Math.max(...allCombinations.map(c => c.score));
  return allCombinations.filter(c => c.score === maxScore);
}

/**
 * Calculates the true score of a relic combination, accounting for non-stacking effects.
 * Also adjusts individual effect contributions for vessel-level display.
 * @param {Array} relics - Array of relics in the combination
 * @param {Array} desiredEffects - Array of desired effects
 * @param {Map} effectMap - Map of effect IDs to effect names
 * @returns {Object} - { score: number, relicEffectScores: Array } with vessel-level adjusted effect scores
 */
function calculateTrueCombinationScore(relics, desiredEffects, effectMap) {
  // initialize adjusted scores with all effects from all relics (including 0-score effects)
  const adjustedScores = relics.map(relic => {
    if (!relic || !relic.effectScores) return {};
    
    // copy all effects with their original data, will update scores for matching effects
    const relicScores = {};
    Object.entries(relic.effectScores).forEach(([slot, effectData]) => {
      if (effectData && effectData.id) {
        relicScores[slot] = {
          id: effectData.id,
          name: effectData.name,
          score: 0  // initialize to 0, will be updated for matching effects
        };
      }
    });
    return relicScores;
  });
  
  // collect all effect instances with their positions (relic index + slot)
  const effectInstances = [];
  
  relics.forEach((relic, relicIndex) => {
    if (!relic || !relic.effectScores) return;
    
    Object.entries(relic.effectScores).forEach(([slot, effectData]) => {
      if (effectData && effectData.id) {
        effectInstances.push({
          relicIndex,
          slot,
          effectId: effectData.id,
          effectName: effectData.name,
          originalScore: effectData.score
        });
      }
    });
  });

  let totalScore = 0;

  // for each desired effect, calculate its contribution and adjust scores
  for (const desiredEffect of desiredEffects) {
    // find all instances of this desired effect in the combination
    const matchingInstances = effectInstances.filter(instance =>
      desiredEffect.ids.includes(instance.effectId)
    );

    if (matchingInstances.length === 0) continue;

    // check if non-stacking
    const isNonStacking = desiredEffect.ids.some(effectId => {
      const effectData = baseRelicEffects.find(effect => effect.ids.includes(effectId));
      return effectData && effectData.stacks === false;
    });

    const weight = desiredEffect.weight || 1;

    if (isNonStacking) {
      // non-stacking: contribute weight once, split equally among all instances
      totalScore += weight;
      const perInstanceScore = weight / matchingInstances.length;
      
      matchingInstances.forEach(instance => {
        adjustedScores[instance.relicIndex][instance.slot].score = perInstanceScore;
      });
    } else {
      // stacking: each instance contributes its original score
      totalScore += weight * matchingInstances.length;
      
      matchingInstances.forEach(instance => {
        adjustedScores[instance.relicIndex][instance.slot].score = instance.originalScore;
      });
    }
  }

  return { score: totalScore, relicEffectScores: adjustedScores };
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

  console.log(`${baseRelics.length > 0 ? 'Deep slots' : 'Slots'} needed: ${JSON.stringify(slots)}`);

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
    effectScores: {}
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

  // sort relics by score descending to find better combinations early
  validRelicsPerSlot.forEach(relics => {
    relics.sort((a, b) => b.score - a.score);
  });

  let allValidCombinations = [];
  let bestScoreSoFar = -1;

  // generate all valid combinations using recursive approach with pruning
  function generateCombinations(slotIndex, currentCombination, usedRelicIds, currentIndividualScore) {
    // upper bound pruning: check if this branch can possibly beat current best
    if (bestScoreSoFar >= 0 && slotIndex > 0) {
      // build optimistic completion by adding best available relics for remaining slots
      const optimisticCombination = [...currentCombination];
      let canComplete = true;
      
      for (let i = slotIndex; i < slots.length; i++) {
        const availableRelics = validRelicsPerSlot[i].filter(r => !usedRelicIds.has(r.sorting));
        if (availableRelics.length > 0) {
          // take the first (highest scoring) available relic
          optimisticCombination[i] = availableRelics[0];
        } else {
          canComplete = false;
          break;
        }
      }
      
      if (canComplete) {
        // calculate true score of this optimistic completion
        const { score: upperBound } = calculateTrueCombinationScore(optimisticCombination, desiredEffects, effectMap);
        
        // if even the best possible completion can't beat current best, prune
        if (upperBound <= bestScoreSoFar) {
          return;
        }
      }
    }

    // base case: all slots filled
    if (slotIndex === slots.length) {
      const { score: trueScore, relicEffectScores } = calculateTrueCombinationScore(currentCombination, desiredEffects, effectMap);
      
      // create relics with vessel-level adjusted effect scores
      const relicsWithAdjustedScores = currentCombination.map((relic, index) => ({
        ...relic,
        vesselEffectScores: relicEffectScores[index]
      }));
      
      // store this combination
      allValidCombinations.push({
        relics: relicsWithAdjustedScores,
        score: trueScore
      });
      
      // update best score for pruning
      if (trueScore > bestScoreSoFar) {
        bestScoreSoFar = trueScore;
      }
      return;
    }

    // try each valid relic for current slot (already sorted by score descending)
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

  console.log(`Generated ${allValidCombinations.length} combination(s), top score: ${Math.max(...allValidCombinations.map(c => c.score))}`);

  // sort by score (highest first)
  allValidCombinations.sort((a, b) => b.score - a.score);

  // filter combinations based on required effects validation if needed
  let validCombinations = allValidCombinations;
  if (validateRequired) {
    validCombinations = allValidCombinations.filter(combination => {
      if (baseRelics.length > 0) {
        // for deep relics: check if combined with base relics satisfies required effects
        const combinedRelics = [...baseRelics, ...combination.relics];
        return validateRequiredEffects(combinedRelics, desiredEffects, effectMap);
      } else {
        // for base relics: check if combination satisfies required effects
        return validateRequiredEffects(combination.relics, desiredEffects, effectMap);
      }
    });

    if (validCombinations.length === 0) {
      console.warn(`All ${allValidCombinations.length} combinations failed required effects validation`);
      console.log(`Required effects:`, desiredEffects.filter(e => e.isRequired).map(e => e.name));
      return returnAll ? [] : null;
    }

    if (validCombinations.length < allValidCombinations.length) {
      console.log(`Filtered ${allValidCombinations.length - validCombinations.length} combinations that didn't meet required effects`);
    }
  }

  if (returnAll) {
    return validCombinations;
  }

  // return first (highest scoring) valid combination
  return validCombinations[0];
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