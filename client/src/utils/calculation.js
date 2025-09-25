import { chaliceData } from '../data/chaliceData.js';
import items from '../data/items.json';
import baseRelicEffects from '../data/baseRelicEffects.json';

const effectMap = new Map();
baseRelicEffects.forEach(effect => {
  effect.ids.forEach(id => {
    effectMap.set(id, effect);
  });
});

/**
 * Calculates the best relic combination for a given set of desired effects, available relics, and selected chalices.
 * @param {Array} desiredEffects - An array of desired effect objects, including name, weight, isRequired, and isForbidden properties.
 * @param {Object} characterRelicData - The relic data for the selected character from the user's save file.
 * @param {Array} selectedChalices - An array of names of the selected chalices.
 * @param {string} selectedNightfarer - The name of the selected Nightfarer (e.g., 'wylder').
 * @returns {Object|null} - The best relic combination found, or null if none could be determined.
 */
export function calculateBestRelics(desiredEffects, characterRelicData, selectedChalices, selectedNightfarer) {
  console.log("--- Starting Relic Calculation ---");

  // input validation
  if (!desiredEffects || !characterRelicData || !selectedChalices || !selectedNightfarer) {
    console.error('Missing required parameters for calculation:', { desiredEffects, characterRelicData, selectedChalices, selectedNightfarer });
    return null;
  }

  if (!characterRelicData.relics || characterRelicData.relics.length === 0) {
    console.warn('No relics found for character');
    return null;
  }

  const processedRelics = characterRelicData.relics.map(relic => {
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
      color: relicInfo.color ? relicInfo.color.toLowerCase() : 'white'
    };
  }).filter(Boolean);


  if (processedRelics.length === 0) {
    console.warn('No valid relics found for character after filtering');
    return null;
  }

  console.log(`Processing ${processedRelics.length} valid relics for ${selectedChalices.length} selected chalices.`);

  // score each relic based on desired effects and filter out forbidden/zero-score relics.
  console.log("--- Step 1: Scoring and Filtering Relics ---");
  const scoredRelics = processedRelics.map(relic => {
    const relicEffects = getRelicEffects(relic);
    const score = calculateRelicScore(relicEffects, desiredEffects);
    const isForbidden = desiredEffects.some(de => de.isForbidden && relicEffects.some(effect => effect && de.ids.includes(effect.ids[0])));
    return { ...relic, score, isForbidden };
  }).filter(relic => !relic.isForbidden && relic.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("Scored and Filtered Relics:", JSON.parse(JSON.stringify(scoredRelics)));


  // for each chalice, find the best combination of relics.
  console.log("--- Step 2: Finding Best Combination for Each Chalice ---");
  let bestCombination = null;
  let highestScore = -Infinity;

  const chaliceDataForCharacter = chaliceData[selectedNightfarer];
  if (!chaliceDataForCharacter) {
    console.error(`No chalice data found for character: ${selectedNightfarer}`);
    return null;
  }

  for (const chaliceName of selectedChalices) {
    const chalice = chaliceDataForCharacter.find(c => c.name === chaliceName);
    if (!chalice) {
        console.warn(`Could not find data for chalice: ${chaliceName}`);
        continue;
    }

    const combination = findBestCombinationForChalice(chalice, scoredRelics);
    if (combination) {
      console.log(`Best combination found for ${chalice.name}:`, JSON.parse(JSON.stringify(combination)));
      if (combination.score > highestScore) {
        highestScore = combination.score;
        bestCombination = combination;
      }
    } else {
        console.log(`No valid combination found for ${chalice.name}.`);
    }
  }

  console.log("--- Step 3: Final Result ---");
  console.log("Best overall combination found:", JSON.parse(JSON.stringify(bestCombination)));
  return bestCombination;
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
    if (relicEffects.some(effect => effect && effect.ids.some(id => desiredEffect.ids.includes(id)))) {
      score += desiredEffect.weight || 1;
    }
  }
  return score;
}

/**
 * Finds the best relic combination for a single chalice by picking the highest-scored relic for each slot.
 * @param {Object} chalice - The chalice object, including its name and slots.
 * @param {Array} scoredRelics - The list of all scored and filtered relics.
 * @returns {Object|null} - The best combination for the chalice, or null if slots cannot be filled.
 */
function findBestCombinationForChalice(chalice, scoredRelics) {
    const bestRelicsForChalice = [];
    let totalScore = 0;
    const usedRelicIds = new Set();

    const relicsByColor = {
        red: scoredRelics.filter(r => r.color === 'red'),
        blue: scoredRelics.filter(r => r.color === 'blue'),
        yellow: scoredRelics.filter(r => r.color === 'yellow'),
        green: scoredRelics.filter(r => r.color === 'green'),
        white: scoredRelics.filter(r => r.color === 'white'),
    };

    for (const slotColor of chalice.slots) {
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
            bestRelicsForChalice.push(bestRelicForSlot);
            totalScore += bestRelicForSlot.score;
            usedRelicIds.add(bestRelicForSlot.sorting);
        } else {
            console.warn(`Could not find a unique relic for a ${slotColor} slot in ${chalice.name}.`);
            return null; // not enough unique relics to fill this chalice
        }
    }

    return {
        chalice: {
            name: chalice.name,
            slots: chalice.slots,
            description: chalice.description
        },
        relics: bestRelicsForChalice,
        score: totalScore,
    };
}

// HELPER FUNCTIONS

// gets all effect objects for a relic
function getRelicEffects(relic) {
  if (!relic) return [];
  
  return [
    relic['effect 1'],
    relic['effect 2'],
    relic['effect 3'],
    relic['sec_effect1'],
    relic['sec_effect2'],
    relic['sec_effect3'],
  ].filter(Boolean);
}