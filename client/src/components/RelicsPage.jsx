import React, { useState, useEffect } from 'react';
import items from '../data/items.json';
import effects from '../data/relicEffects.json';
import { CloseIcon } from './Icons';
import RelicFilters from './RelicFilters';

const createEffectMap = (showDeepOfNight) => {
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

const RelicCard = ({ relic, items, effectMap }) => {
  const relicInfo = items[relic.item_id.toString()];

  if (!relicInfo) {
    return null;
  }

  const getEffectName = (id) => {
    const EMPTY_SLOT_ID = 4294967295; // 2^32 - 1 (unsigned 32-bit integer)
    if (id === 0 || id === EMPTY_SLOT_ID) return null;

    return effectMap.get(id) || `Unknown Effect (ID: ${id})`;
  };

  const allEffects = [
    relic.effect1_id,
    relic.effect2_id,
    relic.effect3_id,
    relic.sec_effect1_id,
    relic.sec_effect2_id,
    relic.sec_effect3_id,
  ];

  const validEffectNames = allEffects.map(getEffectName).filter(name => name !== null);

  const color = relicInfo.color ? relicInfo.color.toLowerCase() : 'white';
  const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
  const relicType = isDeepRelic ? 'deep' : 'base';

  return (
    <div className={`${relicType}-relic-card color-${color}`}>
      <h4>{relicInfo.name}</h4>
      <ul>
        {validEffectNames.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    </div>
  );
};

const CharacterRelics = ({ characterData,
  items,
  onSaveNameSelect,
  selectedSaveName,
  showRadio,
  showDeepOfNight,
  showUnknownRelics,
  baseRelicColorFilters,
  deepRelicColorFilters,
  effectMap }) => {
  const filteredRelics = characterData.relics.filter(relic => {
    const relicInfo = items[relic.item_id.toString()];
    // toggle unknown relics based on checkbox
    if (!showUnknownRelics && (!relicInfo || !relicInfo.name)) {
      return false;
    }
    // toggle "Deep" relics based on checkbox
    if (!showDeepOfNight && relicInfo && relicInfo.name && relicInfo.name.startsWith('Deep')) {
      return false;
    }
    // filter by relic color - use appropriate filter based on relic type
    if (relicInfo && relicInfo.color) {
      const color = relicInfo.color.toLowerCase();
      const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
      const colorFilters = isDeepRelic ? deepRelicColorFilters : baseRelicColorFilters;

      if (!colorFilters[color]) {
        return false;
      }
    }
    return true;
  });

  if (filteredRelics.length === 0) {
    return null; // dont render the character section if they have no visible relics
  }

  return (
    <div className="character-relics">
      <label>
        {showRadio && (
          <input
            type="radio"
            name="saveName"
            value={characterData.character_name}
            checked={selectedSaveName === characterData.character_name}
            onChange={() => onSaveNameSelect(characterData.character_name)}
          />
        )}
        <h3>{characterData.character_name}</h3>
      </label>
      <div className="relics-grid">
        {filteredRelics.sort((a, b) => a.sorting - b.sorting).map((relic, index) => (
          <RelicCard key={index} relic={relic} items={items} effectMap={effectMap} />
        ))}
      </div>
    </div>
  )
};

const RelicsPage = ({ onBack, selectedSaveName, onSaveNameSelect, showDeepOfNight, showUnknownRelics, baseRelicColorFilters, deepRelicColorFilters, onBaseRelicColorFilterChange, onDeepRelicColorFilterChange }) => {
  const [relicData, setRelicData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [effectMap, setEffectMap] = useState(new Map());

  useEffect(() => {
    setEffectMap(createEffectMap(showDeepOfNight));
  }, [showDeepOfNight]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedRelicData = localStorage.getItem('saveData');
        if (storedRelicData) {
          const parsedData = JSON.parse(storedRelicData);
          setRelicData(parsedData);

          const unknownEffectIds = new Set();
          const EMPTY_SLOT_ID = 4294967295;

          parsedData.forEach(character => {
            character.relics.forEach(relic => {
              const effectIds = [
                relic.effect1_id,
                relic.effect2_id,
                relic.effect3_id,
                relic.sec_effect1_id,
                relic.sec_effect2_id,
                relic.sec_effect3_id,
              ];
              effectIds.forEach(id => {
                if (id && id !== 0 && id !== EMPTY_SLOT_ID && !effectMap.has(id)) {
                  unknownEffectIds.add(id);
                }
              });
            });
          });

          if (unknownEffectIds.size > 0) {
            console.log("Unknown Effect IDs found:", Array.from(unknownEffectIds));
          }
        }
      } catch (error) {
        console.error("Failed to load relic data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [effectMap]);

  const renderContent = (children) => (
    <div className="relic-page-backdrop">
      <div className="relic-page card">
        <div className='card-header'>
          <button className="corner-button" onClick={onBack}><CloseIcon /></button>
        </div>
        <h2>Your Relics</h2>
        <RelicFilters
          baseRelicColorFilters={baseRelicColorFilters}
          deepRelicColorFilters={deepRelicColorFilters}
          onBaseRelicColorFilterChange={onBaseRelicColorFilterChange}
          onDeepRelicColorFilterChange={onDeepRelicColorFilterChange}
          showDeepOfNight={showDeepOfNight}
        />
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="relic-page-backdrop"><div className="relic-page card"><p>Loading relic data...</p></div></div>;
  }

  const hasVisibleRelics = relicData && items && relicData.some(character =>
    character.relics.some(relic => {
      const relicInfo = items[relic.item_id.toString()];
      if (!showUnknownRelics && (!relicInfo || !relicInfo.name)) return false;
      if (!showDeepOfNight && relicInfo && relicInfo.name && relicInfo.name.startsWith('Deep')) return false;
      if (relicInfo && relicInfo.color) {
        const color = relicInfo.color.toLowerCase();
        const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
        const colorFilters = isDeepRelic ? deepRelicColorFilters : baseRelicColorFilters;
        if (!colorFilters[color]) return false;
      }
      return true;
    })
  );

  if (!relicData || !hasVisibleRelics) {
    return renderContent(<p>No displayable relic data found. Upload a save file or check your filters.</p>);
  }

  const charactersWithRelics = relicData.filter(character =>
    character.relics.some(relic => {
      const relicInfo = items[relic.item_id.toString()];
      if (!showUnknownRelics && (!relicInfo || !relicInfo.name)) return false;
      if (!showDeepOfNight && relicInfo && relicInfo.name && relicInfo.name.startsWith('Deep')) return false;
      if (relicInfo && relicInfo.color) {
        const color = relicInfo.color.toLowerCase();
        const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
        const colorFilters = isDeepRelic ? deepRelicColorFilters : baseRelicColorFilters;
        if (!colorFilters[color]) return false;
      }
      return true;
    })
  );

  return renderContent(
    <div className="relic-data-container">
      {relicData.map(character => (
        <CharacterRelics
          key={character.section_number}
          characterData={character}
          items={items}
          selectedSaveName={selectedSaveName}
          onSaveNameSelect={onSaveNameSelect}
          showRadio={charactersWithRelics.length > 1}
          showDeepOfNight={showDeepOfNight}
          showUnknownRelics={showUnknownRelics}
          baseRelicColorFilters={baseRelicColorFilters}
          deepRelicColorFilters={deepRelicColorFilters}
          effectMap={effectMap}
        />
      ))}
    </div>
  );
};

export default RelicsPage;