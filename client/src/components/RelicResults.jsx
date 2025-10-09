import React, { useState } from 'react';
import RelicSlot from './RelicSlot';
import RelicResultsPage from './RelicResultsPage';
import RelicResultsPopout from './RelicResultsPopout';
import { InformationIcon, LeftArrowIcon, RightArrowIcon, MaximizeIcon, ExternalLinkIcon } from './Icons';
import { numberFormatter } from '../utils/formatters';

const RelicResults = ({ calculationResult, showDeepOfNight, showScoreInfoToggle, openPopoutInNewTab }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingDeepRelics, setShowingDeepRelics] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showMaximized, setShowMaximized] = useState(false);
  const [showPopout, setShowPopout] = useState(false);


  const getImageUrl = (name, type) => {
    if (!name) return ''; // handle undefined/null names (empty slots)
    const cleanedName = name
      .toLowerCase()
      .replace(/[<>:'"/\\|?*']/g, '') // remove special characters
      .replace(/ /g, '-'); // replace spaces with hyphens
    return `/${type}/${cleanedName}.png`;
  };

  // reset index and deep relic display when calculationResult changes
  React.useEffect(() => {
    setCurrentIndex(0);
    setShowingDeepRelics(false);
    setShowScoreInfo(false);
    setShowMaximized(false);
    setShowPopout(false);
  }, [calculationResult]);

  const isEnabled = !!calculationResult;
  
  // check if calculationResult is the new format (object with owned/potential) or classic array
  const hasNewFormat = calculationResult && typeof calculationResult === 'object' && 'owned' in calculationResult && 'potential' in calculationResult;
  
  // flatten results and track source (owned vs potential)
  let flattenedResults = [];
  if (hasNewFormat) {
    flattenedResults = [
      ...calculationResult.owned.map(r => ({ ...r, _source: 'owned' })),
      ...calculationResult.potential.map(r => ({ ...r, _source: 'potential' }))
    ];
  } else if (Array.isArray(calculationResult)) {
    flattenedResults = calculationResult.map(r => ({ ...r, _source: 'owned' }));
  }
  
  const isMultipleResults = flattenedResults.length > 1;
  const currentResult = flattenedResults[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    const maxIndex = flattenedResults.length - 1;
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  if (!currentResult) {
    return (
      <div
        id="relics-card"
        className="card disabled"
        title='No calculation result available.'
      >
        <h2>Recommended Relics</h2>
        <div className="centered-text-container">
          <p>Select Nightfarer, Vessels, and desired effects.</p>
          <p>Then click "Calculate" to see results.</p>
        </div>
      </div>
    );
  }

  if (showMaximized) {
    return (
      <RelicResultsPage
        onBack={() => setShowMaximized(false)}
        currentResult={currentResult}
        showDeepOfNight={showDeepOfNight}
        showScoreInfo={showScoreInfo}
        setShowScoreInfo={setShowScoreInfo}
        showScoreInfoToggle={showScoreInfoToggle}
        currentIndex={currentIndex}
        totalResults={flattenedResults.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    );
  }
  
  // determine heading based on source
  const resultHeading = currentResult && currentResult._source === 'potential' 
    ? 'Obtainable Relics' 
    : 'Recommended Relics';

  const showLeftArrow = isMultipleResults && currentIndex > 0;
  const showRightArrow = isMultipleResults && currentIndex < flattenedResults.length - 1;

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
    <>
      <div
        id="relics-card"
        className="card"
      >
      {isMultipleResults && (
        <div className="position-indicator">
          {currentIndex + 1}/{flattenedResults.length}
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
        <h2>{resultHeading}</h2>
        {showScoreInfoToggle && (
          <div className="score-info-container">
            {showScoreInfo && (
              <div className="score-info-tooltip">
                {(() => {
                  let allRelics = [];
                  if (showDeepOfNight && currentResult.deepRelics && currentResult.deepRelics.length > 0) {
                    const baseRelics = currentResult.baseRelics || [];
                    const deepRelics = currentResult.deepRelics || [];
                    allRelics = [...baseRelics, ...deepRelics];
                  } else {
                    allRelics = currentResult.baseRelics || currentResult.relics || [];
                  }

                  const allScores = [
                    currentResult.score,
                    ...allRelics.map(relic => relic ? Object.values(relic.effects || {}).reduce((sum, effect) => sum + (effect?.score || 0), 0) : null)
                  ].filter(score => score != null);
                  
                  // format all scores first to find the longest formatted string
                  const formattedScores = allScores.map(score => numberFormatter.format(score));
                  const maxLength = Math.max(...formattedScores.map(s => s.length));

                  const formattedVesselScore = numberFormatter.format(currentResult.score).padStart(maxLength, '\u00A0');

                  return (
                    <>
                      <div>Vessel Score: {formattedVesselScore}</div>
                      {allRelics.map((relic, index) => {
                        // calculate vessel-level adjusted score by summing effect scores
                        const adjustedScore = Object.values(relic.effects || {}).reduce((sum, effect) => sum + (effect?.score || 0), 0);
                        const formattedScore = numberFormatter.format(adjustedScore).padStart(maxLength, '\u00A0');
                        return relic && <div key={index}>Relic {index + 1} Score: {formattedScore}</div>;
                      })}
                    </>
                  );
                })()}
              </div>
            )}
            <div
              className="score-info-icon"
              onClick={() => setShowScoreInfo(prev => !prev)}
            >
              <InformationIcon />
            </div>
          </div>
        )}

        <button
          className="arrow-button"
          onClick={handleNext}
          disabled={!showRightArrow}
        >
          <RightArrowIcon />
        </button>

        <button
          className="popout-button"
          onClick={() => setShowPopout(true)}
        >
          <ExternalLinkIcon />
        </button>

        <button
          className="maximize-button"
          onClick={() => setShowMaximized(true)}
        >
          <MaximizeIcon />
        </button>
      </div>
      <div className="relic-result-container">
        <div className={`vessel-result-card${showDeepOfNight ? ' deep-mode' : ''}`}>
          <img src={getImageUrl(currentResult["vessel name"], 'vessels')} alt="Vessel" style={{ width: '75px', height: '75px' }} />
          <span id='vessel-name'>{currentResult["vessel name"]}</span>
          {showDeepOfNight ? (
            <div className='relic-slots-container'>
              <div
                className={`base-relic-slots-container ${!showingDeepRelics ? 'active' : ''}`}
                onClick={() => setShowingDeepRelics(false)}
              >
                <div className="relic-slot-name">Base</div>
                {currentResult["vessel slots"].map((color, index) => (
                  <RelicSlot key={index} color={color} />
                ))}
              </div>
              <div
                className={`deep-relic-slots-container ${showingDeepRelics ? 'active' : ''}`}
                onClick={() => setShowingDeepRelics(true)}
              >
                <div className="relic-slot-name">Deep</div>
                {(currentResult["vessel deep slots"] || []).map((color, index) => (
                  <RelicSlot key={`deep-${index}`} color={color} />
                ))}
              </div>
            </div>
          ) : (
            <div className="relic-slots-container">
              {currentResult["vessel slots"].map((color, index) => (
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
                  {currentResult["vessel description"].split('\n').map((line, i) => (
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
          // determine which relics to display and which slots to use
          let relicsToDisplay, slotsToUse;

          if (showDeepOfNight && showingDeepRelics) {
            relicsToDisplay = currentResult.deepRelics || [];
            slotsToUse = currentResult["vessel deep slots"] || [];
          } else {
            relicsToDisplay = currentResult.baseRelics || currentResult.relics || [];
            slotsToUse = currentResult["vessel slots"] || [];
          }

          return relicsToDisplay.map((relic, index) => {
            const slotColor = slotsToUse[index];
            if (relic && relic.score !== 0) {
              return (
                <div className={`relic-result-card color-${slotColor}`} key={index}>
                  <img src={getImageUrl(relic.name, 'relics')} alt={`Relic ${index + 1}`} style={{ width: '100x', height: '100px' }} />
                  <span>{relic.name}</span>
                  <table className="relic-stats-table">
                    <tbody>
                      {['effect1', 'sec_effect1', 'effect2', 'sec_effect2', 'effect3', 'sec_effect3'].map((effectKey) => {
                        const effect = relic.effects?.[effectKey];
                        if (!effect) return null;
                        const isSecondary = effectKey.startsWith('sec_');
                        return (
                          <tr key={effectKey}>
                            <td className={isSecondary ? 'sec-effect' : ''}>
                              • {effect.name}
                              {showScoreInfo && <span className='effect-score'>{numberFormatter.format(effect.score)}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            } else {
              return (
                <div className={`relic-result-card empty-relic-slot color-${slotColor}`} key={index}>
                  <span className='empty-relic-slot-text'>No relic found for {slotColor} slot<br />(Add more desired effects)</span>
                </div>
              );
            }
          });
        })()}
      </div>
    </div>
    {showPopout && (
      <RelicResultsPopout onClose={() => setShowPopout(false)}>
        <RelicResultsPage
          onBack={() => setShowPopout(false)}
          currentResult={currentResult}
          showDeepOfNight={showDeepOfNight}
          showScoreInfo={showScoreInfo}
          setShowScoreInfo={setShowScoreInfo}
          showScoreInfoToggle={showScoreInfoToggle}
          currentIndex={currentIndex}
          totalResults={flattenedResults.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isPopout={true}
        />
      </RelicResultsPopout>
    )}
    </>
  );
};

export default RelicResults;