export const EMPTY_SLOT_ID = 4294967295; // 2^32 - 1 (unsigned 32-bit integer)

// UI utilities
export const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
});

export const getRelativeLuminance = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const rsrgb = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsrgb = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsrgb = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsrgb + 0.7152 * gsrgb + 0.0722 * bsrgb;
};

export const shouldUseDarkText = (hexColor) => {
  const luminance = getRelativeLuminance(hexColor);
  return luminance > 0.5;
};

// string utilities
export const capitalize = (s) => {
  if (typeof s !== 'string' || !s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const formatEffectName = (effect, nightfarers) => {
  const characterName = nightfarers.find(char => effect.name.toLowerCase().startsWith(`[${char}]`));
  if (characterName) {
    const restOfEffect = effect.name.slice(characterName.length + 3).trim();
    const capitalizedChar = characterName.charAt(0).toUpperCase() + characterName.slice(1);
    return `[${capitalizedChar}] ${restOfEffect}`;
  }
  return effect.name;
};

// image/asset utilities
export const getImageUrl = (name, type) => {
  if (!name) return '';
  const cleanedName = name
    .toLowerCase()
    .replace(/[<>:'"/\\|?*']/g, '')
    .replace(/ /g, '-');
  return `/${type}/${cleanedName}.png`;
};

export const getRelicDescription = (relicId, relicsData) => {
  if (!relicId) return null;
  const relicEntry = relicsData[relicId.toString()];
  return relicEntry?.description || null;
};

// effect/relic data processing
export const createEffectMap = (showDeepOfNight, effects) => {
  const effectMap = new Map();
  effects.forEach(effect => {
    // filter out deep effects if showDeepOfNight is false
    if (effect.deep === true && !showDeepOfNight) {
      return;
    }
    effect.ids.forEach(id => {
      effectMap.set(id, effect.name);
    });
  });
  return effectMap;
};

export const isEffectIdKnown = (id, effects) => {
  return effects.some(effect => effect.ids.includes(id));
};

export const getEffectName = (id, effectMap) => {
  if (id === 0 || id === EMPTY_SLOT_ID) return null;
  return effectMap.get(id) || `Unknown Effect (ID: ${id})`;
};

const EFFECT_ICON_PATTERNS = [
  [/(?=.*improved)(?=.*, reduced)/i, '/effect-icons/up.png'],
  [/character skill/i, '/effect-icons/character-skill.png'],
  [/\bart\b/i, '/effect-icons/ultimate-art.png'],
  [/vigor/i, '/effect-icons/hp.png'],
  [/changes compatible armament's skill/i, '/effect-icons/change-skill.png'],
  [/in possession at start of expedition/i, '/effect-icons/item.png'],
  [/arcane/i, '/effect-icons/up.png'],
  [/strength/i, '/effect-icons/up.png'],
  [/dexterity/i, '/effect-icons/up.png'],
  [/endurance/i, '/effect-icons/stamina.png'],
  [/faith/i, '/effect-icons/int-faith.png'],
  [/intelligence/i, '/effect-icons/int-faith.png'],
  [/sorcery/i, '/effect-icons/int-faith.png'],
  [/sorceries/i, '/effect-icons/int-faith.png'],
  [/incantation/i, '/effect-icons/int-faith.png'],
  [/mind/i, '/effect-icons/int-faith.png'],
  [/poise/i, '/effect-icons/defensive.png'],
  [/resistance/i, '/effect-icons/defensive.png'],
  [/negation/i, '/effect-icons/defensive.png'],
  [/helps discover/i, '/effect-icons/item.png'],
  [/attack power/i, '/effect-icons/up.png'],
  [/physical attack/i, '/effect-icons/up.png'],
  [/rune/i, '/effect-icons/item.png'],
  [/hp recovery/i, '/effect-icons/hp-res.png'],
  [/hp restor/i, '/effect-icons/hp-res.png'],
  [/restore hp/i, '/effect-icons/hp-res.png'],
  [/hp/i, '/effect-icons/hp.png'],
  [/fp/i, '/effect-icons/fp.png'],
  [/stamina/i, '/effect-icons/stamina.png'],
  [/flask/i, '/effect-icons/hp.png'],
  [/confer/i, '/effect-icons/item.png'],
  [/treasure/i, '/effect-icons/item.png'],
  [/improved throwing/i, '/effect-icons/item.png'],
  [/\bimproved .+ stone damage\b/i, '/effect-icons/item.png'],
  [/conceals/i, '/effect-icons/invis.png'],
  [/critical hits/i, '/effect-icons/up.png'],
  [/draw/i, '/effect-icons/draw.png'],
  [/starting armament deals/i, '/effect-icons/up.png'],
  [/starting armament inflicts/i, '/effect-icons/up.png'],
  [/guard counters/i, '/effect-icons/up.png'],
  [/stance-breaking/i, '/effect-icons/up.png'],
  [/improved .* attack/i, '/effect-icons/up.png'],
  [/affinity attack/i, '/effect-icons/up.png'],
  [/madness/i, '/effect-icons/madness.png'],
  [/improved perfuming arts/i, '/effect-icons/item.png'],
  [/Duchess/i, '/effect-icons/invis.png'],
  [/Guardian/i, '/effect-icons/invis.png'],
  [/Ironeye/i, '/effect-icons/character-skill.png'],
  [/Recluse/i, '/effect-icons/character-skill.png'],
  [/Revenant/i, '/effect-icons/character-skill.png']
];

export const getEffectIcon = (effectName) => {
  if (!effectName) return '/effect-icons/placeholder.png';
  
  const name = effectName.toLowerCase();
  
  for (const [pattern, icon] of EFFECT_ICON_PATTERNS) {
    if (pattern.test(name)) return icon;
  }
  
  return '/effect-icons/placeholder.png';
};