import React, { useState } from 'react';
import { items } from '../data/items';
import { effects } from '../data/effects';

const RelicCard = ({ relic }) => {
  const relicInfo = items[relic.item_id.toString()];

  if (!relicInfo) {
    return (
      <div className="relic-card">
        <p>Unknown Relic (ID: {relic.item_id})</p>
      </div>
    );
  }

  const getEffectName = (id) => {
    const effect = effects[id.toString()];
    return effect ? effect.name : `Unknown Effect (ID: ${id})`;
  };

  return (
    <div className={`relic-card color-${relicInfo.color.toLowerCase()}`}>
      <h4>{relicInfo.name}</h4>
      <ul>
        <li>{getEffectName(relic.effect1_id)}</li>
        <li>{getEffectName(relic.effect2_id)}</li>
        <li>{getEffectName(relic.effect3_id)}</li>
      </ul>
    </div>
  );
};

const CharacterRelics = ({ characterData }) => (
  <div className="character-relics">
    <h3>{characterData.character_name}</h3>
    <div className="relics-grid">
      {characterData.relics.map((relic, index) => (
        <RelicCard key={index} relic={relic} />
      ))}
    </div>
  </div>
);

const Relics = ({ onBack }) => {
  const [relicData, setRelicData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      // Here you would typically send the file to a backend to be processed
      // by the python script. For this example, we'll simulate that process.
      // Replace this with your actual backend call.
      try {
        // MOCK DATA - replace with actual extracted data
        const mockData = await new Promise(resolve => setTimeout(() => resolve([
          {
            "section_number": 1,
            "character_name": "Wylder",
            "relics": [
              { "item_id": 100, "effect1_id": 312300, "effect2_id": 320000, "effect3_id": 6610800 },
              { "item_id": 109, "effect1_id": 330000, "effect2_id": 330600, "effect3_id": 7000501 },
              { "item_id": 118, "effect1_id": 310100, "effect2_id": 7000101, "effect3_id": 350600 }
            ]
          }
        ]), 1000));
        setRelicData(mockData);
      } catch {
        setError("Failed to process the save file.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relics-modal-backdrop">
      <div className="relics-modal card">
        <div className='card-header'>
            <h2>Your Relics</h2>
            <button className="close-button" onClick={onBack}>X</button>
        </div>
        <p>Upload your Elden Ring Nightreign save file (`.sl2`) to see your relics.</p>
        <input type="file" accept=".sl2" onChange={handleFileChange} />
        {isLoading && <p>Loading...</p>}
        {error && <p className='error'>{error}</p>}
        {relicData && (
          <div className="relic-data-container">
            {relicData.map(character => (
              <CharacterRelics key={character.section_number} characterData={character} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Relics;