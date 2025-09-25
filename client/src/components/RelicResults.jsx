import React from 'react';
import RelicSlot from './RelicSlot';
import { InformationIcon } from './Icons';

const RelicResults = ({ selectedChalices, calculationResult }) => {

  const getImageUrl = (name, type) => {
    const cleanedName = name
      .toLowerCase()
      .replace(/[<>:'"/\\|?*']/g, '') // remove special characters
      .replace(/ /g, '-'); // replace spaces with hyphens
    return `/${type}/${cleanedName}.png`;
  };

  const isEnabled = selectedChalices && selectedChalices.length > 0;

  const renderContent = () => {
    return (
      <>
        {calculationResult ? (
          <>
            <div className="chalice-result-card">
              <img src={getImageUrl(calculationResult["chalice name"], 'chalices')} alt="Chalice" style={{ width: '60px', height: '60px' }} />
              <span id='chalice-name'>{calculationResult["chalice name"]}</span>
              <div className="relic-slots-container">
                {calculationResult["chalice slots"].map((color, index) => (
                  <RelicSlot key={index} color={color} />
                ))}
              </div>
              <buttton className="info-button">
                <InformationIcon />
              </buttton>
            </div>
            {calculationResult["chalice slots"].map((slotColor, index) => {
              const relicEntry = Object.entries(calculationResult).filter(([key]) => !["chalice name", "chalice slots"].includes(key))[index];
              if (relicEntry) {
                const [relicName, relicData] = relicEntry;
                return (
                  <div className={`relic-result-card color-${slotColor}`} key={index}>
                    <img src={getImageUrl(relicName, 'relics')} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
                    <span>{relicName}</span>
                    <table className="relic-stats-table">
                      <tbody>
                        <tr><td>{relicData.effects['effect 1'] && <>• {relicData.effects['effect 1']}</>}</td></tr>
                        <tr><td>{relicData.effects['effect 2'] && <>• {relicData.effects['effect 2']}</>}</td></tr>
                        <tr><td>{relicData.effects['effect 3'] && <>• {relicData.effects['effect 3']}</>}</td></tr>
                      </tbody>
                    </table>
                  </div>
                );
              } else {
                return (
                  <div className={`relic-result-card empty-relic-slot color-${slotColor}`} key={index}>
                    <span>No relic found for {slotColor} slot</span>
                  </div>
                );
              }
            })}
          </>
        ) : (
          <>
            <div className="chalice-result-card">
              <img src={getImageUrl("Placeholder chalice", 'chalices')} alt="Chalice" style={{ width: '60px', height: '60px' }} />
              <div className="relic-slots-container">
                {["white", "white", "white"].map((color, index) => (
                  <RelicSlot key={index} color={color} />
                ))}
              </div>
            </div>
            {[...Array(3)].map((_, index) => (
              <div className="relic-result-card empty-relic-slot color-white" key={index}>
              </div>
            ))}
          </>
        )}
      </>
    );
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