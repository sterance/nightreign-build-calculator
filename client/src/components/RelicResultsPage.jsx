import React, { useState } from 'react';
import RelicSlot from './RelicSlot';
import { InformationIcon, LeftArrowIcon, RightArrowIcon, CloseIcon } from './Icons';
import { numberFormatter } from '../utils/utils';
import relicsData from '../data/relics.json';

const RelicResultsPage = ({
  onBack,
  currentResult,
  showDeepOfNight,
  showScoreInfo,
  setShowScoreInfo,
  showScoreInfoToggle,
  currentIndex,
  totalResults,
  onNext,
  onPrevious,
  isPopout
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRelicTooltip, setShowRelicTooltip] = useState(null);

  const getImageUrl = (name, type) => {
    if (!name) return '';
    const cleanedName = name
      .toLowerCase()
      .replace(/[<>:'"/\\|?*']/g, '')
      .replace(/ /g, '-');
    return `/${type}/${cleanedName}.png`;
  };

  const getRelicDescription = (relicId) => {
    if (!relicId) return null;
    const relicEntry = relicsData[relicId.toString()];
    return relicEntry?.description || null;
  };

  const isMultipleResults = totalResults > 1;
  const showLeftArrow = isMultipleResults && currentIndex > 0;
  const showRightArrow = isMultipleResults && currentIndex < totalResults - 1;

  const resultHeading = currentResult && currentResult._source === 'potential'
    ? 'Obtainable Relics'
    : 'Recommended Relics';

  const baseRelics = currentResult.baseRelics || currentResult.relics || [];
  const deepRelics = currentResult.deepRelics || [];

  const renderRelicCard = (relic, index, slotColor, isDeep = false) => {
    const tooltipKey = `${isDeep ? 'deep-' : ''}${index}`;
    if (relic && relic.score !== 0) {
      const isPotentialUpgrade = currentResult._source === 'potential';
      return (
        <div className={`relic-result-card color-${slotColor}`} key={tooltipKey}>
          <img src={getImageUrl(relic.name, 'relics')} alt={`Relic ${index + 1}`} style={{ width: '100px', height: '100px' }} />
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
          {isPotentialUpgrade && (
            <div className="info-button-container">
              <button className="info-button" onClick={() => setShowRelicTooltip(prev => prev === tooltipKey ? null : tooltipKey)}>
                <InformationIcon />
              </button>
              {showRelicTooltip === tooltipKey && (
                <div className="info-tooltip">
                  <p>
                    {(() => {
                      const description = getRelicDescription(relic.id);
                      return description ? (
                        description.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))
                      ) : (
                        'Description not available.'
                      );
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className={`relic-result-card empty-relic-slot color-${slotColor}`} key={tooltipKey}>
          <span className='empty-relic-slot-text'>No relic found for {slotColor} slot<br />(Add more desired effects)</span>
        </div>
      );
    }
  };

  return (
    <div className={`relic-results-page-backdrop${isPopout ? ' popout-mode' : ''}`}>
      <div className={`relic-results-page card${isPopout ? ' popout-mode' : ''}`}>
        {isMultipleResults && (
          <div className="position-indicator">
            {currentIndex + 1}/{totalResults}
          </div>
        )}
        <div className="relic-result-header">
          <button
            className="arrow-button"
            onClick={onPrevious}
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
                    const allRelics = showDeepOfNight ? [...baseRelics, ...deepRelics] : baseRelics;
                    const allScores = [
                      currentResult.score,
                      ...allRelics.map(relic => relic ? Object.values(relic.effects || {}).reduce((sum, effect) => sum + (effect?.score || 0), 0) : null)
                    ].filter(score => score != null);

                    const formattedScores = allScores.map(score => numberFormatter.format(score));
                    const maxLength = Math.max(...formattedScores.map(s => s.length));
                    const formattedVesselScore = numberFormatter.format(currentResult.score).padStart(maxLength, '\u00A0');

                    return (
                      <>
                        <div>Vessel Score: {formattedVesselScore}</div>
                        {allRelics.map((relic, index) => {
                          const adjustedScore = Object.values(relic.effects || {}).reduce((sum, effect) => sum + (effect?.score || 0), 0);
                          const formattedScore = numberFormatter.format(adjustedScore).padStart(maxLength, '\u00A0');
                          return relic && <div key={index}>Relic {index + 1} Score: {formattedScore}</div>;
                        })}
                      </>
                    );
                  })()}
                </div>
              )}
              <button
                className="score-info-icon"
                onClick={() => setShowScoreInfo(prev => !prev)}
              >
                <InformationIcon />
              </button>
            </div>
          )}
          <button
            className="arrow-button"
            onClick={onNext}
            disabled={!showRightArrow}
          >
            <RightArrowIcon />
          </button>
          {!isPopout && (
            <button className="corner-button" onClick={onBack}>
              <CloseIcon />
            </button>
          )}
        </div>

        <div className="relic-results-maximized-container">
          <div className="vessel-result-card-maximized">
            <img src={getImageUrl(currentResult["vessel name"], 'vessels')} alt="Vessel" style={{ width: '100px', height: '100px' }} />
            <span id='vessel-name'>{currentResult["vessel name"]}</span>
            {showDeepOfNight ? (
              <div className='relic-slots-container-maximized'>
                <div className="base-relic-slots-container">
                  <div className="relic-slot-name">Base</div>
                  {currentResult["vessel slots"].map((color, index) => (
                    <RelicSlot key={index} color={color} />
                  ))}
                </div>
                <div className="deep-relic-slots-container">
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

          <div className={`relic-results-maximized-grid${showDeepOfNight ? '' : ' single-column'}`}>
            {showDeepOfNight ? (
              <>
                <div className="relic-column-base">
                  <h3>Base Relics</h3>
                  <div className="relic-column-content">
                    {baseRelics.map((relic, index) => {
                      const slotColor = currentResult["vessel slots"][index];
                      return renderRelicCard(relic, index, slotColor, false);
                    })}
                  </div>
                </div>
                <div className="relic-column-deep">
                  <h3>Deep Relics</h3>
                  <div className="relic-column-content">
                    {deepRelics.map((relic, index) => {
                      const slotColor = (currentResult["vessel deep slots"] || [])[index];
                      return renderRelicCard(relic, index, slotColor, true);
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="relic-column-base">
                <h3>Relics</h3>
                <div className="relic-column-content">
                  {baseRelics.map((relic, index) => {
                    const slotColor = currentResult["vessel slots"][index];
                    return renderRelicCard(relic, index, slotColor, false);
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelicResultsPage;

