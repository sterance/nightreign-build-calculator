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
  let bestCombination = null;
  let highestScore = -Infinity;

  const allChalices = selectedChalices.map(chaliceName =>
    chaliceData[selectedNightfarer].find(c => c.name === chaliceName)
  ).filter(Boolean);

  for (const chalice of allChalices) {
    const combination = findBestCombinationForChalice(chalice, characterRelicData.relics, desiredEffects);
    if (combination && combination.score > highestScore) {
      highestScore = combination.score;
      bestCombination = combination;
    }
  }

  return bestCombination;
}

/**
 * Finds the best relic combination for a single chalice.
 * @param {Object} chalice - The chalice object, including its name and slots.
 * @param {Array} relics - The list of available relics.
 * @param {Array} desiredEffects - The user's desired effects.
 * @returns {Object|null} - The best combination for the chalice, including the relics and score.
 */
function findBestCombinationForChalice(chalice, relics, desiredEffects) {
  let bestCombination = null;
  let highestScore = -Infinity;

  const relicCombinations = getRelicCombinations(relics, chalice.slots.length);

  for (const combination of relicCombinations) {
    if (isValidCombination(combination, chalice.slots)) {
      const score = calculateScore(combination, desiredEffects);
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

  return bestCombination;
}

/**
 * Calculates the score of a given relic combination based on desired effects.
 * @param {Array} relics - An array of relic objects.
 * @param {Array} desiredEffects - An array of desired effect objects.
 * @returns {number} - The calculated score for the relic combination.
 */
function calculateScore(relics, desiredEffects) {
  let score = 0;
  const allRelicEffects = relics.flatMap(relic => getRelicEffects(relic));

  for (const desiredEffect of desiredEffects) {
    if (allRelicEffects.includes(desiredEffect.name)) {
      score += desiredEffect.weight;
    }
  }

  // Handle required and forbidden effects
  for (const desiredEffect of desiredEffects) {
    if (desiredEffect.isRequired && !allRelicEffects.includes(desiredEffect.name)) {
      return -Infinity; // Invalid combination if a required effect is missing
    }
    if (desiredEffect.isForbidden && allRelicEffects.includes(desiredEffect.name)) {
      return -Infinity; // Invalid combination if a forbidden effect is present
    }
  }

  return score;
}

// Helper functions (not exported)

function getRelicEffects(relic) {
  const effectIds = [
    relic.effect1_id,
    relic.effect2_id,
    relic.effect3_id,
    relic.sec_effect1_id,
    relic.sec_effect2_id,
    relic.sec_effect3_id,
  ];

  return effectIds.map(id => effects[id]?.name).filter(Boolean);
}

function getRelicColor(relic) {
  const relicInfo = items[relic.item_id.toString()];
  if (relicInfo && relicInfo.color) {
    return relicInfo.color.toLowerCase();
  }
  return 'white'; // Default color if not specified
}

function isValidCombination(relics, slots) {
  const relicColors = relics.map(getRelicColor);
  const slotColors = [...slots];

  for (const color of relicColors) {
    const index = slotColors.indexOf(color);
    if (index === -1) {
      return false; // No available slot for this relic's color
    }
    slotColors.splice(index, 1);
  }

  return true;
}

function getRelicCombinations(relics, size) {
  const combinations = [];

  function generate(startIndex, currentCombination) {
    if (currentCombination.length === size) {
      combinations.push([...currentCombination]);
      return;
    }

    for (let i = startIndex; i < relics.length; i++) {
      currentCombination.push(relics[i]);
      generate(i + 1, currentCombination);
      currentCombination.pop();
    }
  }

  generate(0, []);
  return combinations;
}