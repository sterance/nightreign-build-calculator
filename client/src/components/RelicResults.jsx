import React from 'react';
import RelicSlot from './RelicSlot';

const RelicResults = ({ selectedChalices, calculationResult }) => {

  const getRelicImage = (relicName) => {
    if (!relicName) return 'scenic-flatstone.png';
    const cleanedName = relicName
      .toLowerCase()
      .replace(/[<>:'"/\\|?*']/g, '') // Remove special characters
      .replace(/ /g, '-'); // Replace spaces with hyphens
    return `${cleanedName}.png`;
  };

  const isEnabled = selectedChalices && selectedChalices.length > 0;
  
  const renderContent = () => {
    if (calculationResult) {
      const { "chalice name": chaliceName, "chalice slots": chaliceSlots, ...relics } = calculationResult;
      const relicEntries = Object.entries(relics);
      
      return (
        <>
          <div className="chalice-result-card">
            <img src="/chalices/placeholder-chalice.png" alt="Chalice" style={{ width: '60px', height: '60px' }} />
            <span id='chalice-name'>{chaliceName}</span>
            <div className="relic-slots-container">
              {chaliceSlots && chaliceSlots.map((color, index) => (
                <RelicSlot key={index} color={color} />
              ))}
            </div>
          </div>
          {relicEntries.map(([relicName, relicData], index) => (
            <div className={`relic-result-card color-${relicData.color}`} key={index}>
              <img src={`/relics/${getRelicImage(relicName)}`} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
              <span>{relicName}</span>
              <table className="relic-stats-table">
                <tbody>
                  <tr><td>{relicData.effects['effect 1']}</td></tr>
                  <tr><td>{relicData.effects['effect 2']}</td></tr>
                  <tr><td>{relicData.effects['effect 3']}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </>
      );
    } else {
      // Placeholder content
      return (
        <>
          <div className="chalice-result-card">
            <img src="/chalices/placeholder-chalice.png" alt="Chalice" style={{ width: '60px', height: '60px' }} />
            <span id='chalice-name'></span>
          </div>
          {['scenic-flatstone.png', 'scenic-flatstone.png', 'scenic-flatstone.png'].map((relic, index) => (
            <div className="relic-result-card" key={index}>
              <img src={`/relics/${relic}`} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
              <span></span>
              <table className="relic-stats-table">
                <tbody>
                  <tr><td>Effect 1</td></tr>
                  <tr><td>Effect 2</td></tr>
                  <tr><td>Effect 3</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </>
      );
    }
  };

  return (
    <div id="relics-card" className={`card ${!isEnabled ? 'disabled' : ''}`}>
      <h2>Recommended Relics</h2>
      <div className="relic-result-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default RelicResults;