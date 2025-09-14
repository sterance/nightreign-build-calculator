import React, { useState, useEffect, useRef } from 'react';
import { relicEffects } from '../data/effectData';
import { characters } from '../data/chaliceData';
import { StarIcon, ProhibitionIcon, TrashIcon, PlusIcon, MinusIcon } from './Icons';

const EffectCard = ({ effect, onUpdate, onDelete }) => {
  const [weight, setWeight] = useState(effect.weight.toFixed(1));

  const handleWeightChange = (e) => {
    setWeight(e.target.value);
  };

  const handleWeightBlur = () => {
    const newWeight = parseFloat(weight);
    if (!isNaN(newWeight)) {
      onUpdate(effect.id, { ...effect, weight: newWeight });
    } else {
      setWeight(effect.weight.toFixed(1));
    }
  };

  const adjustWeight = (amount) => {
    const currentWeight = parseFloat(weight);
    if (!isNaN(currentWeight)) {
      const newWeight = Math.max(0, currentWeight + amount);
      setWeight(newWeight.toFixed(1));
      onUpdate(effect.id, { ...effect, weight: newWeight });
    }
  };

  return (
    <div className="effect-card">
      <span className="effect-name">{effect.name}</span>
      <div className="effect-controls">
        <div className="effect-icons">
          <button
            className={`icon-button ${effect.isRequired ? 'required' : ''}`}
            onClick={() => onUpdate(effect.id, { ...effect, isRequired: !effect.isRequired })}
            title={effect.isRequired ? 'Required' : 'Optional'}
          >
            <StarIcon isRequired={effect.isRequired} />
          </button>
          <button
            className={`icon-button ${effect.isForbidden ? 'forbidden' : ''}`}
            onClick={() => onUpdate(effect.id, { ...effect, isForbidden: !effect.isForbidden })}
            title={effect.isForbidden ? 'Forbidden' : 'Allowed'}
          >
            <ProhibitionIcon />
          </button>
          <button className="icon-button" onClick={() => onDelete(effect.id)} title="Delete">
            <TrashIcon />
          </button>
        </div>
        <div className="weight-control">
          <button className="icon-button" onClick={() => adjustWeight(-0.5)}>
            <MinusIcon />
          </button>
          <input
            type="number"
            value={weight}
            onChange={handleWeightChange}
            onBlur={handleWeightBlur}
            step="0.1"
          />
          <button className="icon-button" onClick={() => adjustWeight(0.5)}>
            <PlusIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const DesiredEffects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [isListVisible, setListVisible] = useState(false);
  const containerRef = useRef(null);

  // hide the list when clicking outside the component
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

  const filteredEffects = Object.keys(relicEffects).reduce((acc, category) => {
    const filtered = relicEffects[category].filter((effect) =>
      effect.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

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
            {Object.keys(filteredEffects).map((category) => (
              <div key={category} className="effects-category">
                <h3>{category}</h3>
                <ul>
                  {filteredEffects[category].map((effect) => (
                    <li key={effect} onClick={() => handleSelectEffect(formatEffectName(effect))}>
                      {formatEffectName(effect)}
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
          <EffectCard key={effect.id} effect={effect} onUpdate={handleUpdateEffect} onDelete={handleDeleteEffect} />
        ))}
      </div>
    </div>
  );
};

export default DesiredEffects;