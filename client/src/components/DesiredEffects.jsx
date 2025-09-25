import React, { useState, useEffect, useRef } from 'react';
import relicEffects from '../data/baseRelicEffects.json';
import { characters } from '../data/chaliceData';
import DesiredEffectCard from './DesiredEffectCard';
import { SelectAllIcon, CalculatorIcon, SaveIcon } from './Icons';

const DesiredEffects = ({ onChange, selectedCharacter, handleCalculate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEffects, setSelectedEffects] = useState([]);
    const [isListVisible, setListVisible] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const searchContainerRef = useRef(null);
    const [isSorting, setIsSorting] = useState(false);
    const sortTimeoutRef = useRef(null);
    const [hoveredGroup, setHoveredGroup] = useState(null);

    const categoryOrder = [
        'Character Specific',
        'Attributes',
        'Offensive',
        'Defensive',
        'Regen',
        'Starting Bonus',
        'Exploration'
    ];


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
        onChange(selectedEffects);
    }, [selectedEffects, onChange]);

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

            if (effect.group) {
                if (!acc[effect.category].groups[effect.group]) {
                    acc[effect.category].groups[effect.group] = [];
                }
                acc[effect.category].groups[effect.group].push(effect);
            } else {
                acc[effect.category].singles.push(effect);
            }
            return acc;
        }, {});

        if (selectedCharacter && categorized['Character Specific']) {
            const characterSpecificGroups = categorized['Character Specific'].groups;
            const sortedGroupNames = Object.keys(characterSpecificGroups).sort((a, b) => {
                if (a.toLowerCase() === selectedCharacter) return -1;
                if (b.toLowerCase() === selectedCharacter) return 1;
                // Keep original order for other characters
                const aIndex = characters.indexOf(a.toLowerCase());
                const bIndex = characters.indexOf(b.toLowerCase());
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
        relicEffects.filter(effect => effect.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    const formatEffectName = (effect) => {
        const characterName = characters.find(char => effect.name.toLowerCase().startsWith(`[${char}]`));
        if (characterName) {
            const restOfEffect = effect.name.slice(characterName.length + 3).trim();
            const capitalizedChar = characterName.charAt(0).toUpperCase() + characterName.slice(1);
            return `[${capitalizedChar}] ${restOfEffect}`;
        }
        return effect.name;
    };
    const handleSelectEffect = (effect) => {
        const newEffect = {
            id: Date.now(),
            name: effect.name,
            ids: effect.ids,
            weight: 1.0,
            isRequired: false,
            isForbidden: false,
        };
        setSelectedEffects((prev) => [...prev, newEffect].sort((a, b) => b.weight - a.weight));
        triggerSortAnimation();
        setSearchTerm('');
        setListVisible(false);
    };

    const handleSelectAllFromGroup = (groupEffects) => {
        const newEffects = groupEffects.map(effect => ({
            id: Date.now() + Math.random(),
            name: effect.name,
            ids: effect.ids,
            weight: 1.0,
            isRequired: false,
            isForbidden: false,
        }));
        setSelectedEffects(prev => [...prev, ...newEffects].sort((a, b) => b.weight - a.weight));
        triggerSortAnimation();
        setListVisible(false);
        setHoveredGroup(null);
    }

    const handleUpdateEffect = (id, updatedEffect) => {
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

    return (
        <div id="effects-card" className="card">
            <button className="corner-button" title='Save current build'>
                <SaveIcon />
            </button>
            <div className="card-content">
                <h2>Desired Effects</h2>
                <div className="search-container" ref={searchContainerRef}>
                    <input
                        type="text"
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
                                                    {formatEffectName(effect)}
                                                </li>
                                            ))}
                                            {Object.entries(data.groups).map(([groupName, groupEffects]) => (
                                                <li key={groupName} className={`group-item ${hoveredGroup === groupName ? 'hovered' : ''}`}>
                                                    <div onClick={() => toggleGroup(category, groupName)} className="group-header">
                                                        <span>{groupName}</span>
                                                        <div className="group-header-controls">
                                                            {expandedGroups[`${category}-${groupName}`] && (
                                                                <button
                                                                    className="icon-button select-all-button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectAllFromGroup(groupEffects);
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
                                                            {groupEffects.map(effect => (
                                                                <li key={effect.name} onClick={() => handleSelectEffect(effect)}>
                                                                    {formatEffectName(effect)}
                                                                </li>
                                                            ))}
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
                    {selectedEffects.map((effect) => (
                        <DesiredEffectCard key={effect.id} effect={effect} onUpdate={handleUpdateEffect} onDelete={handleDeleteEffect} onSort={handleSortEffects} />
                    ))}
                </div>
            </div>
            <div className="bottom-bar-effects">
                <button
                    className='calculate-button'
                    title='Calculate optimal relics'
                    onClick={handleCalculate}
                    disabled={selectedEffects.length === 0}
                >
                    <CalculatorIcon />
                    <span style={{ marginLeft: '0.5rem' }}>Calculate</span>
                </button>
            </div>
        </div>
    );
};

export default DesiredEffects;