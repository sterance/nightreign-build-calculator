import React, { useState, useEffect, useRef } from 'react';
import relicEffects from '../data/effects.json';
import nightfarers from '../data/nightfarers.json';
import DesiredEffectCard from './DesiredEffectCard';
import NameSaveCard from './NameSaveCard';
import { SelectAllIcon, CalculatorIcon, SaveIcon, TrashIcon } from './Icons';
import { formatEffectName } from '../utils/utils';

const DesiredEffects = ({
  desiredEffects,
  onChange,
  selectedCharacter,
  selectedVessels,
  handleCalculate,
  setHasSavedBuilds,
  showDeepOfNight,
  showForsakenHollows,
  addToast,
  isCalculating }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEffects, setSelectedEffects] = useState(desiredEffects);
  const [isListVisible, setListVisible] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const searchContainerRef = useRef(null);
  const [isSorting, setIsSorting] = useState(false);
  const sortTimeoutRef = useRef(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [showNameSaveCard, setShowNameSaveCard] = useState(false);
  const prevSelectedEffectsRef = useRef(selectedEffects);

  const categoryOrder = [
    'Character Specific',
    'Attributes',
    'Offensive',
    'Defensive',
    'Regen',
    'Starting Bonus',
    'Exploration',
    'Dormant Power',
    'Debuff'
  ];

  useEffect(() => {
    setSelectedEffects(desiredEffects);
  }, [desiredEffects]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setListVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Only call onChange if the effects have actually changed
    const prevEffects = prevSelectedEffectsRef.current;
    if (JSON.stringify(selectedEffects) !== JSON.stringify(prevEffects)) {
      prevSelectedEffectsRef.current = selectedEffects;
      onChange(selectedEffects);
    }
  }, [selectedEffects]);

  const triggerSortAnimation = () => {
    if (sortTimeoutRef.current) {
      clearTimeout(sortTimeoutRef.current);
    }
    setIsSorting(true);
    sortTimeoutRef.current = setTimeout(() => {
      setIsSorting(false);
    }, 300);
  };

  const processEffects = (effects) => {
    const categorized = effects.reduce((acc, effect) => {
      if (!effect.category) return acc;
      if (!acc[effect.category]) {
        acc[effect.category] = { groups: {}, singles: [] };
      }

      if (!acc[effect.category].groups) {
        acc[effect.category].groups = {};
      }

      if (effect.display_group && effect.level_group) {
        // both display_group and level_group exist - create nested structure
        if (!acc[effect.category].groups[effect.display_group]) {
          acc[effect.category].groups[effect.display_group] = {
            type: 'nested',
            subgroups: {},
            singles: []
          };
        } else if (acc[effect.category].groups[effect.display_group].type === 'simple') {
          // convert existing simple group to nested group
          const existingEffects = acc[effect.category].groups[effect.display_group].effects || [];
          acc[effect.category].groups[effect.display_group] = {
            type: 'nested',
            subgroups: {},
            singles: existingEffects
          };
        }
        // ensure subgroups object exists
        if (!acc[effect.category].groups[effect.display_group].subgroups) {
          acc[effect.category].groups[effect.display_group].subgroups = {};
        }
        if (!acc[effect.category].groups[effect.display_group].subgroups[effect.level_group]) {
          acc[effect.category].groups[effect.display_group].subgroups[effect.level_group] = [];
        }
        acc[effect.category].groups[effect.display_group].subgroups[effect.level_group].push(effect);
      } else if (effect.display_group) {
        // only display_group exists
        if (!acc[effect.category].groups[effect.display_group]) {
          acc[effect.category].groups[effect.display_group] = {
            type: 'simple',
            effects: []
          };
        } else if (acc[effect.category].groups[effect.display_group].type === 'nested') {
          // add to singles if it's already a nested group
          if (!acc[effect.category].groups[effect.display_group].singles) {
            acc[effect.category].groups[effect.display_group].singles = [];
          }
          acc[effect.category].groups[effect.display_group].singles.push(effect);
          return acc;
        }
        // ensure effects array exists
        if (!acc[effect.category].groups[effect.display_group].effects) {
          acc[effect.category].groups[effect.display_group].effects = [];
        }
        acc[effect.category].groups[effect.display_group].effects.push(effect);
      } else if (effect.level_group) {
        // only level_group exists (fallback for old data)
        if (!acc[effect.category].groups[effect.level_group]) {
          acc[effect.category].groups[effect.level_group] = {
            type: 'simple',
            effects: []
          };
        } else if (acc[effect.category].groups[effect.level_group].type === 'nested') {
          // add to singles if it's already a nested group
          if (!acc[effect.category].groups[effect.level_group].singles) {
            acc[effect.category].groups[effect.level_group].singles = [];
          }
          acc[effect.category].groups[effect.level_group].singles.push(effect);
          return acc;
        }
        // ensure effects array exists
        if (!acc[effect.category].groups[effect.level_group].effects) {
          acc[effect.category].groups[effect.level_group].effects = [];
        }
        acc[effect.category].groups[effect.level_group].effects.push(effect);
      } else {
        acc[effect.category].singles.push(effect);
      }
      return acc;
    }, {});

    // flatten single-child stack groups in nested structures
    Object.keys(categorized).forEach(category => {
      Object.keys(categorized[category].groups).forEach(groupName => {
        const group = categorized[category].groups[groupName];
        if (group.type === 'nested' && group.subgroups) {
          // check if any stack group has only one child
          Object.keys(group.subgroups).forEach(stackGroupName => {
            if (group.subgroups[stackGroupName].length === 1) {
              // move the single effect to the parent group's singles
              const singleEffect = group.subgroups[stackGroupName][0];
              if (!group.singles) {
                group.singles = [];
              }
              group.singles.push(singleEffect);
              delete group.subgroups[stackGroupName];
            }
          });

          // if no subgroups remain, convert to simple group
          if (Object.keys(group.subgroups).length === 0) {
            group.type = 'simple';
            group.effects = group.singles || [];
            delete group.subgroups;
            delete group.singles;
          }
        }
      });
    });

    // flatten single-child display groups
    Object.keys(categorized).forEach(category => {
      const groupsToFlatten = [];
      Object.keys(categorized[category].groups).forEach(groupName => {
        const group = categorized[category].groups[groupName];

        // check if this group should be flattened
        let shouldFlatten = false;
        let effectsToMove = [];

        if (group.type === 'simple' && group.effects && group.effects.length === 1) {
          // simple group with only one effect
          shouldFlatten = true;
          effectsToMove = group.effects;
        } else if (group.type === 'nested') {
          // nested group - check if it only has one subgroup or only singles
          const subgroupCount = group.subgroups ? Object.keys(group.subgroups).length : 0;
          const singlesCount = group.singles ? group.singles.length : 0;

          if (subgroupCount === 1 && singlesCount === 0) {
            // only one subgroup, move its effects
            const subgroupName = Object.keys(group.subgroups)[0];
            effectsToMove = group.subgroups[subgroupName];
            shouldFlatten = true;
          } else if (subgroupCount === 0 && singlesCount === 1) {
            // only singles, move them
            effectsToMove = group.singles;
            shouldFlatten = true;
          }
        }

        if (shouldFlatten) {
          // move effects to category singles
          if (!categorized[category].singles) {
            categorized[category].singles = [];
          }
          categorized[category].singles.push(...effectsToMove);
          groupsToFlatten.push(groupName);
        }
      });

      // remove flattened groups
      groupsToFlatten.forEach(groupName => {
        delete categorized[category].groups[groupName];
      });
    });

    if (categorized['Character Specific']) {
      const characterSpecificGroups = categorized['Character Specific'].groups;
      const sortedGroupNames = Object.keys(characterSpecificGroups).sort((a, b) => {
        // If a character is selected, put it first
        if (selectedCharacter) {
          if (a.toLowerCase() === selectedCharacter) return -1;
          if (b.toLowerCase() === selectedCharacter) return 1;
        }
        // Always maintain the defined character order
        const aIndex = nightfarers.nightfarers.indexOf(a.toLowerCase());
        const bIndex = nightfarers.nightfarers.indexOf(b.toLowerCase());
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        return 0;
      });

      const sortedGroups = {};
      sortedGroupNames.forEach(name => {
        sortedGroups[name] = characterSpecificGroups[name];
      });
      categorized['Character Specific'].groups = sortedGroups;
    }

    return categorized;
  };


  const filteredEffects = processEffects(
    relicEffects.filter(effect => {
      const matchesSearch = effect.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isDeepEffect = effect.deep === true;
      const shouldShowDeep = showDeepOfNight || !isDeepEffect;
      const isForsakenEffect = effect.forsaken === true;
      const shouldShowForsaken = showForsakenHollows || !isForsakenEffect;
      return matchesSearch && shouldShowDeep && shouldShowForsaken;
    })
  );


  const handleSelectEffect = (effect) => {
    // check if effect already exists in selected effects, dont add duplicate
    const effectExists = selectedEffects.some(selectedEffect => selectedEffect.name === effect.name);
    if (effectExists) {
      // show toast notification and hide search menu
      addToast(`${effect.name} already in desired effects`, 'error');
      setSearchTerm('');
      setListVisible(false);
      return;
    }

    const newEffect = {
      id: Date.now(),
      name: effect.name,
      ids: effect.ids,
      weight: effect.debuff === true ? -1.0 : 1.0,
      isRequired: false,
      isForbidden: false,
      isDebuff: effect.debuff === true,
    };
    setSelectedEffects((prev) => [...prev, newEffect].sort((a, b) => b.weight - a.weight));
    triggerSortAnimation();
    setSearchTerm('');
    setListVisible(false);
  };

  const handleSelectAllFromGroup = (groupEffects) => {
    // filter out effects that already exist in selected effects
    const effectsToAdd = groupEffects.filter(effect => 
      !selectedEffects.some(selectedEffect => selectedEffect.name === effect.name)
    );
    
    const duplicateCount = groupEffects.length - effectsToAdd.length;
    if (duplicateCount > 0) {
      if (effectsToAdd.length === 0) {
        addToast(`All effects already in desired effects`, 'error');
        setListVisible(false);
        setHoveredGroup(null);
        return;
      } else {
        addToast(`${duplicateCount} effect${duplicateCount > 1 ? 's' : ''} already in desired effects, added ${effectsToAdd.length} new effect${effectsToAdd.length > 1 ? 's' : ''}`, 'warning');
      }
    }
    
    if (effectsToAdd.length === 0) {
      return;
    }

    const newEffects = effectsToAdd.map(effect => ({
      id: Date.now() + Math.random(),
      name: effect.name,
      ids: effect.ids,
      weight: effect.debuff === true ? -1.0 : 1.0,
      isRequired: false,
      isForbidden: false,
      isDebuff: effect.debuff === true,
    }));
    setSelectedEffects(prev => [...prev, ...newEffects].sort((a, b) => b.weight - a.weight));
    triggerSortAnimation();
    setListVisible(false);
    setHoveredGroup(null);
  }

  const handleUpdateEffect = (id, updatedEffect) => {
    if (updatedEffect.isRequired && updatedEffect.isForbidden) {
      addToast('Effects cannot be both forbidden and required', 'error');
      return;
    }
    
    setSelectedEffects((prev) =>
      prev.map((effect) => (effect.id === id ? updatedEffect : effect))
    );
  };

  const handleSortEffects = () => {
    setSelectedEffects((prev) => {
      const sorted = [...prev].sort((a, b) => b.weight - a.weight);
      if (JSON.stringify(prev.map(e => e.id)) !== JSON.stringify(sorted.map(e => e.id))) {
        triggerSortAnimation();
      }
      return sorted;
    });
  }

  const handleDeleteEffect = (id) => {
    setSelectedEffects((prev) => prev.filter((effect) => effect.id !== id));
    triggerSortAnimation();
  };

  const toggleGroup = (category, group) => {
    const key = `${category}-${group}`;
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveBuild = (buildName) => {
    const savedBuilds = JSON.parse(localStorage.getItem('savedBuilds') || '{}');
    savedBuilds[buildName] = {
      effects: selectedEffects,
      isDeepOfNight: showDeepOfNight
    };
    localStorage.setItem('savedBuilds', JSON.stringify(savedBuilds));
    setShowNameSaveCard(false);
    setHasSavedBuilds(true);
  };

  return (
    <div id="effects-card" className="card">
      {showNameSaveCard && (
        <NameSaveCard
          onSave={handleSaveBuild}
          onCancel={() => setShowNameSaveCard(false)}
        />
      )}
      <button
        className="corner-button-left"
        title="Clear all effects"
        onClick={() => setSelectedEffects([])}
        disabled={selectedEffects.length === 0}
      >
        <TrashIcon />
      </button>
      <button
        className="corner-button"
        title={desiredEffects.length === 0 ? 'Select effects to save build' : 'Save current build'}
        onClick={() => setShowNameSaveCard(true)}
        disabled={desiredEffects.length === 0}
      >
        <SaveIcon />
      </button>
      <div className="card-content">
        <h2>Desired Effects</h2>
        <div className="search-container" ref={searchContainerRef}>
          <input
            id="relic-effect-search"
            type="search"
            placeholder="Search for relic effects..."
            value={searchTerm}
            onClick={() => setListVisible(true)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isListVisible && (
            <div className="effects-list-container">
              {Object.entries(filteredEffects)
                .sort(([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
                .map(([category, data]) => (
                  <div key={category} className="effects-category">
                    <h3>{category}</h3>
                    <ul>
                      {data.singles.map((effect) => (
                        <li key={effect.name} onClick={() => handleSelectEffect(effect)}>
                          {formatEffectName(effect, nightfarers.nightfarers)}
                        </li>
                      ))}
                      {Object.entries(data.groups).map(([groupName, groupData]) => (
                        <li key={groupName} className={`group-item ${hoveredGroup === groupName ? 'hovered' : ''}`}>
                          <div onClick={() => toggleGroup(category, groupName)} className="group-header">
                            <span>{groupName}</span>
                            <div className="group-header-controls">
                              {expandedGroups[`${category}-${groupName}`] && (
                                <button
                                  className="icon-button select-all-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (groupData.type === 'simple') {
                                      handleSelectAllFromGroup(groupData.effects);
                                    } else if (groupData.type === 'nested') {
                                      // collect all effects from subgroups and singles
                                      const allEffects = [];
                                      if (groupData.singles) {
                                        allEffects.push(...groupData.singles);
                                      }
                                      if (groupData.subgroups) {
                                        Object.values(groupData.subgroups).forEach(subGroupEffects => {
                                          allEffects.push(...subGroupEffects);
                                        });
                                      }
                                      handleSelectAllFromGroup(allEffects);
                                    }
                                  }}
                                  onMouseEnter={() => setHoveredGroup(groupName)}
                                  onMouseLeave={() => setHoveredGroup(null)}
                                  title="Add all effects"
                                >
                                  <SelectAllIcon />
                                </button>
                              )}
                              <span className={`arrow ${expandedGroups[`${category}-${groupName}`] ? 'expanded' : ''}`}>▼</span>
                            </div>
                          </div>
                          {expandedGroups[`${category}-${groupName}`] && (
                            <ul className="sub-list">
                              {groupData.type === 'nested' ? (
                                // render nested groups
                                <>
                                  {/* render singles first if any */}
                                  {groupData.singles && groupData.singles.length > 0 && (
                                    groupData.singles.map(effect => (
                                      <li key={effect.name} onClick={() => handleSelectEffect(effect)}>
                                        {formatEffectName(effect, nightfarers.nightfarers)}
                                      </li>
                                    ))
                                  )}
                                  {/* render subgroups */}
                                  {Object.entries(groupData.subgroups).map(([subGroupName, subGroupEffects]) => (
                                    <li key={subGroupName} className={`subgroup-item ${hoveredGroup === `${groupName}-${subGroupName}` ? 'hovered' : ''}`}>
                                      <div onClick={() => toggleGroup(category, `${groupName}-${subGroupName}`)} className="subgroup-header">
                                        <span>{subGroupName}</span>
                                        <div className="group-header-controls">
                                          {expandedGroups[`${category}-${groupName}-${subGroupName}`] && (
                                            <button
                                              className="icon-button select-all-button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectAllFromGroup(subGroupEffects);
                                              }}
                                              onMouseEnter={() => setHoveredGroup(`${groupName}-${subGroupName}`)}
                                              onMouseLeave={() => setHoveredGroup(null)}
                                              title="Add all effects"
                                            >
                                              <SelectAllIcon />
                                            </button>
                                          )}
                                          <span className={`arrow ${expandedGroups[`${category}-${groupName}-${subGroupName}`] ? 'expanded' : ''}`}>▼</span>
                                        </div>
                                      </div>
                                      {expandedGroups[`${category}-${groupName}-${subGroupName}`] && (
                                        <ul className="sub-sub-list">
                                          {subGroupEffects.map(effect => (
                                            <li key={effect.name} onClick={() => handleSelectEffect(effect)}>
                                              {formatEffectName(effect, nightfarers.nightfarers)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </>
                              ) : (
                                // render simple groups
                                groupData.effects.map(effect => (
                                  <li key={effect.name} onClick={() => handleSelectEffect(effect)}>
                                    {formatEffectName(effect, nightfarers.nightfarers)}
                                  </li>
                                ))
                              )}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className={`selected-effects-container ${isSorting ? 'reordering' : ''}`}>
          <div className="selected-effects-list">
            {selectedEffects.map((effect) => (
              <DesiredEffectCard key={effect.id} effect={effect} onUpdate={handleUpdateEffect} onDelete={handleDeleteEffect} onSort={handleSortEffects} />
            ))}
          </div>
        </div>
      </div>
      <div className="bottom-bar-effects">
        <button
          className='calculate-button'
          title={(() => {
            const missing = [];
            if (desiredEffects.length === 0) missing.push('desired effects');
            if (!selectedCharacter) missing.push('character');
            if (!selectedVessels || selectedVessels.length === 0) missing.push('vessels');
            
            if (missing.length === 0) return 'Calculate optimal relics';
            if (missing.length === 1) return `Select ${missing[0]} to enable calculation`;
            if (missing.length === 2) return `Select ${missing[0]} and ${missing[1]} to enable calculation`;
            return `Select ${missing[0]}, ${missing[1]} and ${missing[2]} to enable calculation`;
          })()}
          onClick={handleCalculate}
          disabled={desiredEffects.length === 0 || !selectedCharacter || !selectedVessels || selectedVessels.length === 0 || isCalculating}
        >
          {isCalculating ? (
            <>
              <div className="loader"></div>
              <span style={{ marginLeft: '0.5rem' }}>Calculating...</span>
            </>
          ) : (
            <>
              <CalculatorIcon />
              <span style={{ marginLeft: '0.5rem' }}>Calculate</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DesiredEffects;