import React, { useState, useEffect, useRef } from 'react';
import relicEffects from '../data/baseRelicEffects.json';
import { characters } from '../data/chaliceData';
import DesiredEffectCard from './DesiredEffectCard';

const DesiredEffects = ({ onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEffects, setSelectedEffects] = useState([]);
    const [isListVisible, setListVisible] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const containerRef = useRef(null);

    const categoryOrder = [
        'Attributes',
        'Offensive',
        'Defensive',
        'Regen',
        'Starting Bonus',
        'Exploration',
        'Character Specific'
    ];


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
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

        return categorized;
    };


    const filteredEffects = processEffects(
        relicEffects.filter(effect => effect.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    const formatEffectName = (effect) => {
        const characterName = characters.find(char => effect.toLowerCase().startsWith(char));
        if (characterName) {
            const restOfEffect = effect.slice(characterName.length).trim();
            const capitalizedChar = characterName.charAt(0).toUpperCase() + characterName.slice(1);
            return `[${capitalizedChar}] ${restOfEffect}`;
        }
        return effect;
    };
    const handleSelectEffect = (effectName) => {
        const newEffect = {
            id: Date.now(),
            name: effectName,
            weight: 1.0,
            isRequired: false,
            isForbidden: false,
        };
        setSelectedEffects((prev) => [...prev, newEffect].sort((a, b) => b.weight - a.weight));
        setSearchTerm('');
        setListVisible(false);
    };

    const handleUpdateEffect = (id, updatedEffect) => {
        setSelectedEffects((prev) =>
            prev.map((effect) => (effect.id === id ? updatedEffect : effect)).sort((a, b) => b.weight - a.weight)
        );
    };

    const handleDeleteEffect = (id) => {
        setSelectedEffects((prev) => prev.filter((effect) => effect.id !== id));
    };

    const toggleGroup = (category, group) => {
        const key = `${category}-${group}`;
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div id="effects-card" className="card" ref={containerRef}>
            <h2>Desired Effects</h2>
            <div className="search-container">
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
                                            <li key={effect.name} onClick={() => handleSelectEffect(formatEffectName(effect.name))}>
                                                {formatEffectName(effect.name)}
                                            </li>
                                        ))}
                                        {Object.entries(data.groups).map(([groupName, groupEffects]) => (
                                            <li key={groupName} className="group-item">
                                                <div onClick={() => toggleGroup(category, groupName)} className="group-header">
                                                    <span>{groupName}</span>
                                                    <span className={`arrow ${expandedGroups[`${category}-${groupName}`] ? 'expanded' : ''}`}>▼</span>
                                                </div>
                                                {expandedGroups[`${category}-${groupName}`] && (
                                                    <ul className="sub-list">
                                                        {groupEffects.map(effect => (
                                                            <li key={effect.name} onClick={() => handleSelectEffect(formatEffectName(effect.name))}>
                                                                {formatEffectName(effect.name)}
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
            <div className="selected-effects-container">
                {selectedEffects.map((effect) => (
                    <DesiredEffectCard key={effect.id} effect={effect} onUpdate={handleUpdateEffect} onDelete={handleDeleteEffect} />
                ))}
            </div>
        </div>
    );
};

export default DesiredEffects;