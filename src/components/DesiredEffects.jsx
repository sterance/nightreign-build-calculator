import React, { useState, useEffect, useRef } from 'react';
import { relicEffects } from '../data/effectData';

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
                    <li key={index}>{effect}</li>
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