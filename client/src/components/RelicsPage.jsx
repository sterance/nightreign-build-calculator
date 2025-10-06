import React, { useState, useEffect } from 'react';
import items from '../data/relics.json';
import effects from '../data/effects.json';
import { CloseIcon, InformationIcon } from './Icons';
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

const RelicCard = ({ relic, items, effectMap, showRelicIdToggle }) => {
  const [showRelicId, setShowRelicId] = useState(false)
  const EMPTY_SLOT_ID = 4294967295; // 2^32 - 1 (unsigned 32-bit integer)

  const relicInfo = items[relic.item_id.toString()];

  if (!relicInfo) {
    return null;
  }

  const getEffectName = (id) => {
    if (id === 0 || id === EMPTY_SLOT_ID) return null;

    return effectMap.get(id) || `Unknown Effect (ID: ${id})`;
  };


  const allEffects = [
    { id: relic.effect1_id, isSecondary: false },
    { id: relic.sec_effect1_id, isSecondary: true },
    { id: relic.effect2_id, isSecondary: false },
    { id: relic.sec_effect2_id, isSecondary: true },
    { id: relic.effect3_id, isSecondary: false },
    { id: relic.sec_effect3_id, isSecondary: true },
  ];

  const validEffects = allEffects
    .map(effect => ({
      name: getEffectName(effect.id),
      isSecondary: effect.isSecondary
    }))
    .filter(effect => effect.name !== null);

  const color = relicInfo.color ? relicInfo.color.toLowerCase() : 'white';
  const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
  const relicType = isDeepRelic ? 'deep' : 'base';

  return (
    <div className={`${relicType}-relic-card color-${color}`}>
      <h4>{relicInfo.name}</h4>
      <ul>
        {validEffects.map((effect, index) => (
          <li
            key={index}
            className={effect.isSecondary ? 'secondary-effect' : ''}
          >
            {effect.name}
          </li>
        ))}
      </ul>
      {showRelicIdToggle && (
        <div className="corner-info-icon-container">
          {showRelicId && (
            <div className="relic-id-tooltip">
              Relic ID: {relic.item_id}
              {relic.effect1_id !== EMPTY_SLOT_ID && `\nEffect 1 ID: ${relic.effect1_id}`}
              {relic.sec_effect1_id !== EMPTY_SLOT_ID && `\nDebuff 1 ID: ${relic.sec_effect1_id}`}
              {relic.effect2_id !== EMPTY_SLOT_ID && `\nEffect 2 ID: ${relic.effect2_id}`}
              {relic.sec_effect2_id !== EMPTY_SLOT_ID && `\nDebuff 2 ID: ${relic.sec_effect2_id}`}
              {relic.effect3_id !== EMPTY_SLOT_ID && `\nEffect 3 ID: ${relic.effect3_id}`}
              {relic.sec_effect3_id !== EMPTY_SLOT_ID && `\nDebuff 3 ID: ${relic.sec_effect3_id}`}
            </div>
          )}
          <div
            className="corner-info-icon"
            onClick={() => setShowRelicId(prev => !prev)}
          >
            <InformationIcon />
          </div>
        </div>
      )}
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
  showRelicIdToggle,
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
          <RelicCard key={index} relic={relic} items={items} effectMap={effectMap} showRelicIdToggle={showRelicIdToggle} />
        ))}
      </div>
    </div>
  )
};

const RelicsPage = ({ onBack,
  selectedSaveName,
  onSaveNameSelect,
  showDeepOfNight,
  showUnknownRelics,
  showRelicIdToggle,
  baseRelicColorFilters,
  deepRelicColorFilters,
  onBaseRelicColorFilterChange,
  onDeepRelicColorFilterChange }) => {
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
          showRelicIdToggle={showRelicIdToggle}
          baseRelicColorFilters={baseRelicColorFilters}
          deepRelicColorFilters={deepRelicColorFilters}
          effectMap={effectMap}
        />
      ))}
    </div>
  );
};

export default RelicsPage;