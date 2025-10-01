import React, { useState } from 'react';
import RelicSlot from './RelicSlot';
import { InformationIcon, LeftArrowIcon, RightArrowIcon, MaximizeIcon } from './Icons';

const RelicResults = ({ calculationResult, showDeepOfNight }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingDeepRelics, setShowingDeepRelics] = useState(false);

  const getImageUrl = (name, type) => {
    const cleanedName = name
      .toLowerCase()
      .replace(/[<>:'"/\\|?*']/g, '') // remove special characters
      .replace(/ /g, '-'); // replace spaces with hyphens
    return `/${type}/${cleanedName}.png`;
  };

  // reset index and deep relic display when calculationResult changes (must be before any early returns)
  React.useEffect(() => {
    setCurrentIndex(0);
    setShowingDeepRelics(false);
  }, [calculationResult]);

  const isEnabled = !!calculationResult;
  const isMultipleResults = Array.isArray(calculationResult) && calculationResult.length > 1;
  const currentResult = Array.isArray(calculationResult) ? calculationResult[currentIndex] : calculationResult;

  if (!currentResult) {
    return (
      <div
        id="relics-card"
        className="card disabled"
        title='No calculation result available.'
      >
        <h2>Recommended Relics</h2>
        <div className="centered-text-container">
          <p>No calculation result available.</p>
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    const maxIndex = Array.isArray(calculationResult) ? calculationResult.length - 1 : 0;
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const showLeftArrow = isMultipleResults && currentIndex > 0;
  const showRightArrow = isMultipleResults && currentIndex < calculationResult.length - 1;

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
      {isMultipleResults && (
        <div className="position-indicator">
          {currentIndex + 1}/{calculationResult.length}
        </div>
      )}
      <div className="relic-result-header">
        <button
          className="arrow-button"
          onClick={handlePrevious}
          disabled={!showLeftArrow}
        >
          <LeftArrowIcon />
        </button>
        <h2>Recommended Relics</h2>
        <button
          className="arrow-button"
          onClick={handleNext}
          disabled={!showRightArrow}
        >
          <RightArrowIcon />
        </button>
        <button
          className="maximize-button"
          // onClick={() => setShowMaximize(prev => !prev)}
        >
          <MaximizeIcon />
        </button>
      </div>
      <div className="relic-result-container">
        <div className={`chalice-result-card${showDeepOfNight ? ' deep-mode' : ''}`}>
          <img src={getImageUrl(currentResult["chalice name"], 'chalices')} alt="Chalice" style={{ width: '75px', height: '75px' }} />
          <span id='chalice-name'>{currentResult["chalice name"]}</span>
          {showDeepOfNight ? (
            <div className='relic-slots-container'>
              <div 
                className={`base-relic-slots-container ${!showingDeepRelics ? 'active' : ''}`}
                onClick={() => setShowingDeepRelics(false)}
              >
                <div className="relic-slot-name">Base</div>
                {currentResult["chalice slots"].map((color, index) => (
                  <RelicSlot key={index} color={color} />
                ))}
              </div>
              <div 
                className={`deep-relic-slots-container ${showingDeepRelics ? 'active' : ''}`}
                onClick={() => setShowingDeepRelics(true)}
              >
                <div className="relic-slot-name">Deep</div>
                {(currentResult["chalice deep slots"] || []).map((color, index) => (
                  <RelicSlot key={`deep-${index}`} color={color} />
                ))}
              </div>
            </div>
          ) : (
            <div className="relic-slots-container">
              {currentResult["chalice slots"].map((color, index) => (
                <RelicSlot key={index} color={color} />
              ))}
            </div>
          )}
          <div className="info-button-container">
            <button className="info-button" onClick={() => setShowTooltip(prev => !prev)}>
              <InformationIcon />
            </button>
            {showTooltip && (
              <div className="info-tooltip">
                <p>
                  {currentResult["chalice description"].split('\n').map((line, i) => (
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
        {(() => {
          // Determine which relics to display and which slots to use
          let relicsToDisplay, slotsToUse;
          
          if (showDeepOfNight && showingDeepRelics) {
            relicsToDisplay = currentResult.deepRelics || [];
            slotsToUse = currentResult["chalice deep slots"] || [];
          } else {
            relicsToDisplay = currentResult.baseRelics || currentResult.relics || [];
            slotsToUse = currentResult["chalice slots"] || [];
          }

          return relicsToDisplay.map((relic, index) => {
            const slotColor = slotsToUse[index];
            if (relic) {
              return (
                <div className={`relic-result-card color-${slotColor}`} key={index}>
                  <img src={getImageUrl(relic.name, 'relics')} alt={`Relic ${index + 1}`} style={{ width: '100x', height: '100px' }} />
                  <span>{relic.name}</span>
                  <table className="relic-stats-table">
                    <tbody>
                      {relic.effects['effect 1'] && <tr><td>• {relic.effects['effect 1']}</td></tr>}
                      {relic.effects['sec_effect1'] && <tr><td className="sec-effect">• {relic.effects['sec_effect1']}</td></tr>}
                      {relic.effects['effect 2'] && <tr><td>• {relic.effects['effect 2']}</td></tr>}
                      {relic.effects['sec_effect2'] && <tr><td className="sec-effect">• {relic.effects['sec_effect2']}</td></tr>}
                      {relic.effects['effect 3'] && <tr><td>• {relic.effects['effect 3']}</td></tr>}
                      {relic.effects['sec_effect3'] && <tr><td className="sec-effect">• {relic.effects['sec_effect3']}</td></tr>}
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
          });
        })()}
      </div>
    </div>
  );
};

export default RelicResults;