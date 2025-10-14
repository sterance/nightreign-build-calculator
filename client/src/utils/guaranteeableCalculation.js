import { calculateBestRelics } from './calculation.js';
import items from '../data/relics.json';

/**
 * extract all guaranteeable relics from relics.json
 * guaranteeable relics are identified by having a 'fixedEffects' field
 * @param {boolean} showDeepOfNight - whether to include deep relics
 * @returns {Array} array of { itemId, name, color, fixedEffects }
 */
export function getGuaranteeableRelicDefinitions(showDeepOfNight = false) {
  const guaranteeableRelics = [];

  for (const [itemId, itemData] of Object.entries(items)) {
    if (!itemData.fixedEffects) {
      continue;
    }

    const isDeepRelic = itemData.name?.startsWith('Deep');
    
    if (isDeepRelic && !showDeepOfNight) {
      continue;
    }

    if (!itemData.color) {
      console.warn(`Guaranteeable relic ${itemData.name} (ID: ${itemId}) has no color defined, skipping`);
      continue;
    }

    guaranteeableRelics.push({
      itemId: parseInt(itemId),
      name: itemData.name,
      color: itemData.color,
      fixedEffects: itemData.fixedEffects,
      isDeep: isDeepRelic
    });
  }

  return guaranteeableRelics;
}

/**
 * check if save file already has a specific guaranteeable relic by item_id
 * @param {Array} saveFileRelics - array of relics from characterRelicData.relics
 * @param {number} itemId - the item_id to check
 * @returns {boolean}
 */
export function hasRelicInSaveFile(saveFileRelics, itemId) {
  return saveFileRelics.some(relic => relic.item_id === itemId);
}

/**
 * find which guaranteeable relics are missing from save file
 * @param {Array} saveFileRelics - array of relics from characterRelicData.relics
 * @param {boolean} showDeepOfNight - whether to include deep relics
 * @returns {Array} array of missing guaranteeable relic definitions
 */
export function getMissingGuaranteeableRelics(saveFileRelics, showDeepOfNight = false) {
  const allGuaranteeable = getGuaranteeableRelicDefinitions(showDeepOfNight);
  const missingRelics = allGuaranteeable.filter(
    guaranteeableRelic => !hasRelicInSaveFile(saveFileRelics, guaranteeableRelic.itemId)
  );

  return missingRelics;
}

/**
 * convert guaranteeable relic definition to processed relic format
 * matching the format from calculation.js processedBaseRelics/processedDeepRelics
 * @param {number} itemId - the item id
 * @param {string} name - the relic name
 * @param {string} color - the relic color
 * @param {Array} fixedEffects - array of effect ids
 * @param {Map} effectMap - map of effect IDs to effect names
 * @param {string} type - 'base' or 'deep'
 * @returns {Object} synthetic relic object
 */
export function createSyntheticRelic(itemId, name, color, fixedEffects, effectMap, type) {
  const getEffect = (id) => effectMap.get(id) || null;

  return {
    'relic id': itemId,
    'relic name': name,
    'effect 1': getEffect(fixedEffects[0] || null),
    'effect 2': getEffect(fixedEffects[1] || null),
    'effect 3': getEffect(fixedEffects[2] || null),
    'sec_effect1': null,
    'sec_effect2': null,
    'sec_effect3': null,
    sorting: 999999,
    color: color.toLowerCase(),
    type: type,
    source: 'guaranteeable'
  };
}

/**
 * generate synthetic relics for missing guaranteeables
 * @param {Array} missingRelics - array of missing guaranteeable relic definitions
 * @param {Map} effectMap - map of effect IDs to effect names
 * @returns {Array} array of synthetic relic objects
 */
export function generateMissingGuaranteeableRelics(missingRelics, effectMap) {
  return missingRelics.map(relic => {
    const type = relic.isDeep ? 'deep' : 'base';
    return createSyntheticRelic(
      relic.itemId,
      relic.name,
      relic.color,
      relic.fixedEffects,
      effectMap,
      type
    );
  });
}

/**
 * merge save file processed relics with synthetic guaranteeable relics
 * @param {Array} processedRelics - processed relics from save file
 * @param {Array} syntheticGuaranteeableRelics - synthetic guaranteeable relics
 * @returns {Array} merged array of relics
 */
export function mergeRelicsWithGuaranteeable(processedRelics, syntheticGuaranteeableRelics) {
  return [...processedRelics, ...syntheticGuaranteeableRelics];
}

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
 * @param {Array} selectedVessels - array of selected vessel names
 * @param {string} selectedNightfarer - name of the selected character
 * @param {Map} effectMap - map of effect IDs to effect names
 * @param {boolean} showDeepOfNight - whether to include deep relics
 * @param {Object} vesselData - map of character names to their available vessels
 * @returns {Array|Object|null} - either array (old format), { owned, potential } (new format), or null
 */
export function calculateWithGuaranteeableRelics(
  desiredEffects,
  characterRelicData,
  selectedVessels,
  selectedNightfarer,
  effectMap,
  showDeepOfNight = false,
  vesselData
) {
  // pass 1: calculate with save file relics only
  const ownedResults = calculateBestRelics(
    desiredEffects,
    characterRelicData,
    selectedVessels,
    selectedNightfarer,
    effectMap,
    showDeepOfNight,
    vesselData
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
    selectedVessels,
    selectedNightfarer,
    effectMap,
    showDeepOfNight,
    vesselData
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

