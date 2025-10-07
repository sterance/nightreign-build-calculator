import { calculateBestRelics } from './calculation.js';
import {
  getMissingGuaranteeableRelics,
  generateMissingGuaranteeableRelics,
  mergeRelicsWithGuaranteeable
} from './guaranteeableRelics.js';

/**
 * performs a two-pass calculation:
 * 1. calculate with save file relics only
 * 2. calculate with save file relics + missing guaranteeable relics
 * 
 * returns either the old format (array) or new format ({ owned, potential })
 * depending on whether potential upgrades are found
 * 
 * @param {Array} desiredEffects - array of desired effect objects
 * @param {Object} characterRelicData - relic data from save file
 * @param {Array} selectedChalices - array of selected chalice names
 * @param {string} selectedNightfarer - name of the selected character
 * @param {Map} effectMap - map of effect IDs to effect names
 * @param {boolean} showDeepOfNight - whether to include deep relics
 * @param {Object} chaliceData - map of character names to their available chalices
 * @returns {Array|Object|null} - either array (old format), { owned, potential } (new format), or null
 */
export function calculateWithGuaranteeableRelics(
  desiredEffects,
  characterRelicData,
  selectedChalices,
  selectedNightfarer,
  effectMap,
  showDeepOfNight = false,
  chaliceData
) {
  // pass 1: calculate with save file relics only
  const ownedResults = calculateBestRelics(
    desiredEffects,
    characterRelicData,
    selectedChalices,
    selectedNightfarer,
    effectMap,
    showDeepOfNight,
    chaliceData
  );

  // check for missing guaranteeable relics
  const missingGuaranteeableRelics = getMissingGuaranteeableRelics(
    characterRelicData.relics || [],
    showDeepOfNight
  );

  // if no missing guaranteeables, return owned results in original format
  if (missingGuaranteeableRelics.length === 0) {
    return ownedResults;
  }

  console.log(`Found ${missingGuaranteeableRelics.length} missing guaranteeable relics`);

  // create synthetic raw relics (in the format expected by calculateBestRelics)
  // each needs a unique sorting value to allow multiple guaranteeable relics in one build
  const syntheticRawRelics = missingGuaranteeableRelics.map((relic, index) => ({
    item_id: relic.itemId,
    effect1_id: relic.fixedEffects[0] || null,
    effect2_id: relic.fixedEffects[1] || null,
    effect3_id: relic.fixedEffects[2] || null,
    sec_effect1_id: null,
    sec_effect2_id: null,
    sec_effect3_id: null,
    sorting: 999999 + index,
    source: 'guaranteeable'
  }));

  console.log('Synthetic raw relics created:', syntheticRawRelics);

  // create modified character relic data with synthetic relics
  const augmentedRelicData = {
    ...characterRelicData,
    relics: [
      ...(characterRelicData.relics || []),
      ...syntheticRawRelics
    ]
  };

  // pass 2: calculate with augmented relic data
  const potentialResults = calculateBestRelics(
    desiredEffects,
    augmentedRelicData,
    selectedChalices,
    selectedNightfarer,
    effectMap,
    showDeepOfNight,
    chaliceData
  );

  // if pass 2 returned nothing, return pass 1 results in original format
  if (!potentialResults || potentialResults.length === 0) {
    return ownedResults;
  }

  // get max score from owned results (or 0 if no owned results)
  const maxOwnedScore = ownedResults && ownedResults.length > 0 
    ? Math.max(...ownedResults.map(r => r.score))
    : 0;

  // filter potential results to only include:
  // 1. combinations with score >= maxOwnedScore
  // 2. combinations that contain at least one guaranteeable relic
  const filteredPotentialResults = potentialResults.filter(result => {
    if (result.score < maxOwnedScore) {
      return false;
    }

    // check if any relic in this combination is guaranteeable
    const allRelics = [...result.baseRelics, ...result.deepRelics];
    const hasGuaranteeableRelic = allRelics.some(relic => relic.source === 'guaranteeable');

    return hasGuaranteeableRelic;
  });

  console.log(`Pass 1 max score: ${maxOwnedScore}`);
  console.log(`Pass 2 total results: ${potentialResults.length}`);
  console.log(`Pass 2 filtered results (with guaranteeable relics): ${filteredPotentialResults.length}`);

  // if no potential upgrades found after filtering, return owned results in original format
  if (filteredPotentialResults.length === 0) {
    return ownedResults;
  }

  // return new format with both owned and potential results
  return {
    owned: ownedResults || [],
    potential: filteredPotentialResults
  };
}

