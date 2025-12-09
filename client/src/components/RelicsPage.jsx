import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../utils/hooks';
import items from '../data/relics.json';
import effects from '../data/effects.json';
import { CloseIcon, InformationIcon } from './Icons';
import RelicFilters from './RelicFilters';
import { EMPTY_SLOT_ID, createEffectMap, isEffectIdKnown, getEffectName } from '../utils/utils';




const RelicCard = ({ relic, items, effectMap, showRelicIdToggle }) => {
  const [showRelicId, setShowRelicId] = useState(false)

  const relicInfo = items[relic.item_id.toString()];

  if (!relicInfo) {
    return null;
  }


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
      name: getEffectName(effect.id, effectMap),
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
  showDeepOfNight,
  showForsakenHollows,
  showUnknownRelics,
  showRelicIdToggle,
  baseRelicColorFilters,
  deepRelicColorFilters,
  effectMap,
  searchTerm }) => {

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
    // toggle forsaken relics based on checkbox
    if (!showForsakenHollows && relicInfo && relicInfo.forsaken === true) {
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
    // filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const relicName = relicInfo?.name?.toLowerCase() || '';
      const relicNameMatches = relicName.includes(searchLower);

      const allEffects = [
        relic.effect1_id,
        relic.sec_effect1_id,
        relic.effect2_id,
        relic.sec_effect2_id,
        relic.effect3_id,
        relic.sec_effect3_id,
      ];

      const effectMatches = allEffects.some(effectId => {
        const effectName = getEffectName(effectId, effectMap);
        return effectName && effectName.toLowerCase().includes(searchLower);
      });

      if (!relicNameMatches && !effectMatches) {
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
  showForsakenHollows,
  showUnknownRelics,
  showRelicIdToggle,
  baseRelicColorFilters,
  deepRelicColorFilters,
  onBaseRelicColorFilterChange,
  onDeepRelicColorFilterChange }) => {
  const [relicData, setRelicData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [effectMap, setEffectMap] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacterName, setSelectedCharacterName] = usePersistentState('selectedRelicsCharacter', '');
  const [characterFilters, setCharacterFilters] = useState({});

  useEffect(() => {
    setEffectMap(createEffectMap(showDeepOfNight, showForsakenHollows, effects));
  }, [showDeepOfNight, showForsakenHollows]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedRelicData = localStorage.getItem('saveData');
        if (storedRelicData) {
          const parsedData = JSON.parse(storedRelicData);
          setRelicData(parsedData);

          const relicsWithUnknownEffects = [];

          parsedData.forEach(character => {
            character.relics.forEach(relic => {
              const relicEntry = {
                item_id: relic.item_id,
                character_name: character.character_name,
                effect1_id: {
                  id: relic.effect1_id,
                  known: relic.effect1_id === 0 || relic.effect1_id === EMPTY_SLOT_ID || isEffectIdKnown(relic.effect1_id, effects)
                },
                effect2_id: {
                  id: relic.effect2_id,
                  known: relic.effect2_id === 0 || relic.effect2_id === EMPTY_SLOT_ID || isEffectIdKnown(relic.effect2_id, effects)
                },
                effect3_id: {
                  id: relic.effect3_id,
                  known: relic.effect3_id === 0 || relic.effect3_id === EMPTY_SLOT_ID || isEffectIdKnown(relic.effect3_id, effects)
                },
                sec_effect1_id: {
                  id: relic.sec_effect1_id,
                  known: relic.sec_effect1_id === 0 || relic.sec_effect1_id === EMPTY_SLOT_ID || isEffectIdKnown(relic.sec_effect1_id, effects)
                },
                sec_effect2_id: {
                  id: relic.sec_effect2_id,
                  known: relic.sec_effect2_id === 0 || relic.sec_effect2_id === EMPTY_SLOT_ID || isEffectIdKnown(relic.sec_effect2_id, effects)
                },
                sec_effect3_id: {
                  id: relic.sec_effect3_id,
                  known: relic.sec_effect3_id === 0 || relic.sec_effect3_id === EMPTY_SLOT_ID || isEffectIdKnown(relic.sec_effect3_id, effects)
                }
              };

              const hasUnknownEffects = Object.keys(relicEntry)
                .filter(key => key.includes('effect'))
                .some(key => !relicEntry[key].known);

              if (hasUnknownEffects) {
                relicsWithUnknownEffects.push(relicEntry);
              }
            });
          });

          if (relicsWithUnknownEffects.length > 0) {
            console.log("Relics with unknown effects:", relicsWithUnknownEffects);
          }
        }
      } catch (error) {
        console.error("Failed to load relic data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getCharacterFilters = (characterName) => {
    const existing = characterFilters[characterName];
    if (existing) return existing;
    const allTrue = (template) => Object.keys(template).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    const initial = {
      base: allTrue(baseRelicColorFilters),
      deep: allTrue(deepRelicColorFilters)
    };
    setCharacterFilters(prev => ({ ...prev, [characterName]: initial }));
    return initial;
  };

  const getVisibleRelicsForCharacter = (character) => {
    const filters = getCharacterFilters(character.character_name);
    return character.relics.filter(relic => {
      const relicInfo = items[relic.item_id.toString()];
      if (!showUnknownRelics && (!relicInfo || !relicInfo.name)) return false;
      if (!showDeepOfNight && relicInfo && relicInfo.name && relicInfo.name.startsWith('Deep')) return false;
      if (!showForsakenHollows && relicInfo && relicInfo.forsaken === true) return false;
      if (relicInfo && relicInfo.color) {
        const color = relicInfo.color.toLowerCase();
        const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
        const colorFilters = isDeepRelic ? filters.deep : filters.base;
        if (!colorFilters[color]) return false;
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const relicName = relicInfo?.name?.toLowerCase() || '';
        const relicNameMatches = relicName.includes(searchLower);
        const allEffects = [
          relic.effect1_id,
          relic.sec_effect1_id,
          relic.effect2_id,
          relic.sec_effect2_id,
          relic.effect3_id,
          relic.sec_effect3_id,
        ];
        const effectMatches = allEffects.some(effectId => {
          const effectName = getEffectName(effectId, effectMap);
          return effectName && effectName.toLowerCase().includes(searchLower);
        });
        if (!relicNameMatches && !effectMatches) return false;
      }
      return true;
    });
  };

  const visibleSortedCharacters = relicData ? [...relicData]
    .map(c => ({ character: c, visibleCount: getVisibleRelicsForCharacter(c).length }))
    .filter(x => x.visibleCount > 0)
    .sort((a, b) => b.visibleCount - a.visibleCount)
    .map(x => x.character) : [];

  const sortedCharacters = relicData ? [...relicData]
    .map(c => ({ character: c, visibleCount: getVisibleRelicsForCharacter(c).length }))
    .sort((a, b) => b.visibleCount - a.visibleCount)
    .map(x => x.character) : [];

  useEffect(() => {
    if (!relicData) return;
    // sync local selection from prop on initial render/open
    if (selectedSaveName && selectedSaveName !== selectedCharacterName) {
      setSelectedCharacterName(selectedSaveName);
    }

    const current = (selectedSaveName || selectedCharacterName) || null;
    const stillVisible = current ? visibleSortedCharacters.some(c => c.character_name === current) : false;
    const firstVisible = visibleSortedCharacters[0]?.character_name || null;
    const nextSelection = current && stillVisible ? current : firstVisible;
    if (nextSelection && nextSelection !== selectedCharacterName) {
      setSelectedCharacterName(nextSelection);
    }
    const target = (nextSelection || null);
    if (target && onSaveNameSelect) onSaveNameSelect(target);
  }, [relicData, showUnknownRelics, showDeepOfNight, characterFilters, searchTerm, selectedSaveName, selectedCharacterName]);

  const handleBaseRelicColorFilterChange = (color) => {
    if (!selectedCharacterName) return;
    setCharacterFilters(prev => {
      const existing = prev[selectedCharacterName] || {
        base: { ...baseRelicColorFilters },
        deep: { ...deepRelicColorFilters }
      };
      const current = Boolean(existing.base[color]);
      const next = !current;
      return {
        ...prev,
        [selectedCharacterName]: {
          base: { ...existing.base, [color]: next },
          deep: { ...existing.deep }
        }
      };
    });
    if (onBaseRelicColorFilterChange) onBaseRelicColorFilterChange(color);
  };

  const handleDeepRelicColorFilterChange = (color) => {
    if (!selectedCharacterName) return;
    setCharacterFilters(prev => {
      const existing = prev[selectedCharacterName] || {
        base: { ...baseRelicColorFilters },
        deep: { ...deepRelicColorFilters }
      };
      const current = Boolean(existing.deep[color]);
      const next = !current;
      return {
        ...prev,
        [selectedCharacterName]: {
          base: { ...existing.base },
          deep: { ...existing.deep, [color]: next }
        }
      };
    });
    if (onDeepRelicColorFilterChange) onDeepRelicColorFilterChange(color);
  };

  const renderContent = (children) => {
    // calculate counts for each color after filtering
    const colorCounts = {
      base: { red: 0, blue: 0, yellow: 0, green: 0, purple: 0 },
      deep: { red: 0, blue: 0, yellow: 0, green: 0, purple: 0 }
    };


    if (relicData && items) {
      const character = selectedCharacterName ? relicData.find(c => c.character_name === selectedCharacterName) : null;
      if (character) {
        character.relics.forEach(relic => {
          const relicInfo = items[relic.item_id.toString()];
          
          if (!showUnknownRelics && (!relicInfo || !relicInfo.name)) return;
          if (!showDeepOfNight && relicInfo && relicInfo.name && relicInfo.name.startsWith('Deep')) return;
          if (!showForsakenHollows && relicInfo && relicInfo.forsaken === true) return;
          
          // check search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const relicName = relicInfo?.name?.toLowerCase() || '';
            const relicNameMatches = relicName.includes(searchLower);

            const allEffects = [
              relic.effect1_id,
              relic.sec_effect1_id,
              relic.effect2_id,
              relic.sec_effect2_id,
              relic.effect3_id,
              relic.sec_effect3_id,
            ];

            const effectMatches = allEffects.some(effectId => {
              const effectName = getEffectName(effectId, effectMap);
              return effectName && effectName.toLowerCase().includes(searchLower);
            });

            if (!relicNameMatches && !effectMatches) return;
          }

          // count relics by color
          if (relicInfo && relicInfo.color) {
            const color = relicInfo.color.toLowerCase();
            const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
            
            if (isDeepRelic && colorCounts.deep[color] !== undefined) {
              colorCounts.deep[color]++;
            } else if (!isDeepRelic && colorCounts.base[color] !== undefined) {
              colorCounts.base[color]++;
            }
          }
        });
      }
    }

    return (
      <div className="relic-page-backdrop">
        <div className="relic-page card">
          <div className='card-header'>
            <button className="corner-button" onClick={onBack}><CloseIcon /></button>
          </div>
          <h2>Your Relics</h2>
          <RelicFilters
            baseRelicColorFilters={selectedCharacterName ? getCharacterFilters(selectedCharacterName).base : baseRelicColorFilters}
            deepRelicColorFilters={selectedCharacterName ? getCharacterFilters(selectedCharacterName).deep : deepRelicColorFilters}
            onBaseRelicColorFilterChange={handleBaseRelicColorFilterChange}
            onDeepRelicColorFilterChange={handleDeepRelicColorFilterChange}
            showDeepOfNight={showDeepOfNight}
            colorCounts={colorCounts}
          />
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for relics or effects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {sortedCharacters.length > 0 && (
            <div className="character-tabs">
              {sortedCharacters.map(c => (
                <button
                  key={c.section_number}
                  className={`character-tab${selectedCharacterName === c.character_name ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedCharacterName(c.character_name);
                    setCharacterFilters(prev => {
                      const allTrue = (template) => Object.keys(template).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                      return {
                        ...prev,
                        [c.character_name]: {
                          base: allTrue(baseRelicColorFilters),
                          deep: allTrue(deepRelicColorFilters)
                        }
                      };
                    });
                    if (onSaveNameSelect) onSaveNameSelect(c.character_name);
                  }}
                >
                  {c.character_name}
                </button>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="relic-page-backdrop"><div className="relic-page card"><p>Loading relic data...</p></div></div>;
  }

  const hasVisibleRelics = relicData && items && (() => {
    const character = selectedCharacterName ? relicData.find(c => c.character_name === selectedCharacterName) : null;
    if (!character) return false;
    return character.relics.some(relic => {
      const relicInfo = items[relic.item_id.toString()];
      if (!showUnknownRelics && (!relicInfo || !relicInfo.name)) return false;
      if (!showDeepOfNight && relicInfo && relicInfo.name && relicInfo.name.startsWith('Deep')) return false;
      if (!showForsakenHollows && relicInfo && relicInfo.forsaken === true) return false;
      if (relicInfo && relicInfo.color) {
        const color = relicInfo.color.toLowerCase();
        const isDeepRelic = relicInfo.name && relicInfo.name.startsWith('Deep');
        const filters = selectedCharacterName ? getCharacterFilters(selectedCharacterName) : { base: baseRelicColorFilters, deep: deepRelicColorFilters };
        const colorFilters = isDeepRelic ? filters.deep : filters.base;
        if (!colorFilters[color]) return false;
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const relicName = relicInfo?.name?.toLowerCase() || '';
        const relicNameMatches = relicName.includes(searchLower);
        const allEffects = [
          relic.effect1_id,
          relic.sec_effect1_id,
          relic.effect2_id,
          relic.sec_effect2_id,
          relic.effect3_id,
          relic.sec_effect3_id,
        ];
        const effectMatches = allEffects.some(effectId => {
          const effectName = getEffectName(effectId, effectMap);
          return effectName && effectName.toLowerCase().includes(searchLower);
        });
        if (!relicNameMatches && !effectMatches) return false;
      }
      return true;
    });
  })();

  if (!relicData || !hasVisibleRelics) {
    return renderContent(<p>No displayable relic data found. Upload a save file or check your filters.</p>);
  }

  const selectedCharacter = relicData && selectedCharacterName ? relicData.find(c => c.character_name === selectedCharacterName) : null;

  return renderContent(
    <div className="relic-data-container">
      {selectedCharacter && (
        <CharacterRelics
          key={selectedCharacter.section_number}
          characterData={selectedCharacter}
          items={items}
          showDeepOfNight={showDeepOfNight}
          showForsakenHollows={showForsakenHollows}
          showUnknownRelics={showUnknownRelics}
          showRelicIdToggle={showRelicIdToggle}
          baseRelicColorFilters={getCharacterFilters(selectedCharacter.character_name).base}
          deepRelicColorFilters={getCharacterFilters(selectedCharacter.character_name).deep}
          effectMap={effectMap}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
};

export default RelicsPage;