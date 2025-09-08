import React, { useState, useEffect, useRef } from 'react';
import { relicEffects } from '../data/effectData';
import { characters } from '../data/chaliceData';

const DesiredEffects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isListVisible, setListVisible] = useState(false);
  const containerRef = useRef(null);

  // Hide the list when clicking outside the component
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
                  {filteredEffects[category].map((effect, index) => (
                    <li key={index}>{formatEffectName(effect)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesiredEffects;