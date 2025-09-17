import React from 'react';
import RelicSlot from './RelicSlot';

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
    let chaliceName, chaliceSlots, relicEntries, relics;

    if (calculationResult) {
      ({ "chalice name": chaliceName, "chalice slots": chaliceSlots, ...relics } = calculationResult);
      relicEntries = Object.entries(relics);
    } else {
      chaliceName = "Placeholder chalice";
      chaliceSlots = ["white", "white", "white"];
      const placeholderRelic = {
        color: "white",
        effects: {
          "effect 1": "",
          "effect 2": "",
          "effect 3": "",
        }
      };
      relicEntries = [
        ["Scenic Flatstone", placeholderRelic],
        ["Scenic Flatstone", placeholderRelic],
        ["Scenic Flatstone", placeholderRelic],
      ]
    }

    return (
      <>
        <div className="chalice-result-card">
          <img src={getImageUrl(chaliceName, 'chalices')} alt="Chalice" style={{ width: '60px', height: '60px' }} />
          {chaliceName !== "Placeholder chalice" && <span id='chalice-name'>{chaliceName}</span>}
          <div className="relic-slots-container">
            {chaliceSlots && chaliceSlots.map((color, index) => (
              <RelicSlot key={index} color={color} />
            ))}
          </div>
        </div>
        {relicEntries.map(([relicName, relicData], index) => (
          <div className={`relic-result-card color-${relicData.color}`} key={index}>
            <img src={getImageUrl(relicName, 'relics')} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
            {relicName !== "Scenic Flatstone" && <span>{relicName}</span>}
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