import React, { useState, useEffect } from 'react';

const RelicCard = ({ relic, items, effects }) => {
  const relicInfo = items[relic.item_id.toString()];

  if (!relicInfo) {
    return null;
  }

  const getEffectName = (id) => {
    const EMPTY_SLOT_ID = 4294967295; // 2^32 - 1 (unsigned 32-bit integer)
    if (id === 0 || id === EMPTY_SLOT_ID) return null;
    
    const effect = effects[id.toString()];
    return effect ? effect.name : `Unknown Effect (ID: ${id})`;
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

  return (
    <div className={`relic-card color-${color}`}>
      <h4>{relicInfo.name}</h4>
      <ul>
        {validEffectNames.map((name, index) => (
            <li key={index}>{name}</li>
        ))}
      </ul>
    </div>
  );
};

const CharacterRelics = ({ characterData, items, effects }) => {
  const filteredRelics = characterData.relics.filter(relic => {
    const relicInfo = items[relic.item_id.toString()];
    // hide unknown relics and "Deep" relics
    if (!relicInfo || relicInfo.name.startsWith('Deep')) {
      return false;
    }
    return true;
  });

  if (filteredRelics.length === 0) {
      return null; // dont render the character section if they have no visible relics
  }

  return (
      <div className="character-relics">
        <h3>{characterData.character_name}</h3>
        <div className="relics-grid">
          {filteredRelics.sort((a, b) => a.sorting - b.sorting).map((relic, index) => (
            <RelicCard key={index} relic={relic} items={items} effects={effects} />
          ))}
        </div>
      </div>
  )
};

const RelicsPage = ({ onBack }) => {
  const [relicData, setRelicData] = useState(null);
  const [items, setItems] = useState(null);
  const [effects, setEffects] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedRelicData = localStorage.getItem('relicData');
        if (storedRelicData) {
          setRelicData(JSON.parse(storedRelicData));
        }

        const [itemsRes, effectsRes] = await Promise.all([
          fetch('/items.json'),
          fetch('/effects.json')
        ]);

        const itemsData = await itemsRes.json();
        const effectsData = await effectsRes.json();
        
        setItems(itemsData);
        setEffects(effectsData);
      } catch (error) {
        console.error("Failed to load relic data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <div className="relic-page-backdrop"><div className="relic-page card"><p>Loading relic data...</p></div></div>;
  }
  
  const hasVisibleRelics = relicData && items && relicData.some(character => 
    character.relics.some(relic => {
        const relicInfo = items[relic.item_id.toString()];
        return relicInfo && !relicInfo.name.startsWith('Deep');
    })
  );
  
  if (!relicData || !hasVisibleRelics) {
     return (
       <div className="relic-page-backdrop">
         <div className="relic-page card">
           <div className="card-header">
             <h2>Your Relics</h2>
             <button className="close-button" onClick={onBack}>X</button>
           </div>
           <p>No displayable relic data found. Upload a save file or check your filters.</p>
         </div>
       </div>
     );
  }

  return (
    <div className="relic-page-backdrop">
      <div className="relic-page card">
        <div className='card-header'>
            <h2>Your Relics</h2>
            <button className="close-button" onClick={onBack}>X</button>
        </div>
        <div className="relic-data-container">
            {relicData.map(character => (
              <CharacterRelics key={character.section_number} characterData={character} items={items} effects={effects} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default RelicsPage;