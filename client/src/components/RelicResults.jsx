import React, { useState } from 'react';
import RelicSlot from './RelicSlot';
import { InformationIcon, LeftArrowIcon, RightArrowIcon } from './Icons';

const RelicResults = ({ calculationResult }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getImageUrl = (name, type) => {
    const cleanedName = name
      .toLowerCase()
      .replace(/[<>:'"/\\|?*']/g, '') // remove special characters
      .replace(/ /g, '-'); // replace spaces with hyphens
    return `/${type}/${cleanedName}.png`;
  };

  const isEnabled = !!calculationResult;

  if (!isEnabled) {
    return (
      <div
        id="relics-card"
        className="card disabled"
        title='Select Nightfarer, Vessels, and desired effects. Then click "Calculate" to see results.'
      >
        <h2>Recommended Relics</h2>
        <div className="centered-text-container">
          <p>Select Nightfarer, Vessels, and desired effects.</p>
          <p>Then click "Calculate" to see results.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="relics-card"
      className="card"
    >
      <div className="relic-result-header">
        <button className="arrow-button">
          <LeftArrowIcon />
        </button>
        <h2>Recommended Relics</h2>
        <button className="arrow-button">
          <RightArrowIcon />
        </button>
      </div>
      <div className="relic-result-container">
        <div className="chalice-result-card">
          <img src={getImageUrl(calculationResult["chalice name"], 'chalices')} alt="Chalice" style={{ width: '60px', height: '60px' }} />
          <span id='chalice-name'>{calculationResult["chalice name"]}</span>
          <div className="relic-slots-container">
            {calculationResult["chalice slots"].map((color, index) => (
              <RelicSlot key={index} color={color} />
            ))}
          </div>
          <div className="info-button-container">
            <button className="info-button" onClick={() => setShowTooltip(prev => !prev)}>
              <InformationIcon />
            </button>
            {showTooltip && (
              <div className="info-tooltip">
                <p>
                  {calculationResult["chalice description"].split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>
        {calculationResult.relics.map((relic, index) => {
          const slotColor = calculationResult["chalice slots"][index];
          if (relic) {
            return (
              <div className={`relic-result-card color-${slotColor}`} key={index}>
                <img src={getImageUrl(relic.name, 'relics')} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
                <span>{relic.name}</span>
                <table className="relic-stats-table">
                  <tbody>
                    <tr><td>{relic.effects['effect 1'] && <>• {relic.effects['effect 1']}</>}</td></tr>
                    <tr><td>{relic.effects['effect 2'] && <>• {relic.effects['effect 2']}</>}</td></tr>
                    <tr><td>{relic.effects['effect 3'] && <>• {relic.effects['effect 3']}</>}</td></tr>
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
      </div>
    </div>
  );
};

export default RelicResults;