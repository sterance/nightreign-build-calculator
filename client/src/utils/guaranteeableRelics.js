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

