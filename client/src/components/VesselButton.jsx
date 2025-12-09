import React from 'react';

const VesselButton = ({ selectedCharacter, selectedVessels, onClick, vesselData, showDeepOfNight, showForsakenHollows }) => {
  const isEnabled = !!selectedCharacter;
  const allVessels = isEnabled ? vesselData[selectedCharacter] : [];
  const vessels = allVessels.filter(v => showForsakenHollows || !v.forsaken);

  return (
    <div
      id="vessel-card"
      className={`card ${!isEnabled ? 'disabled' : ''}`}
      onClick={isEnabled ? onClick : undefined}
      style={{ cursor: isEnabled ? 'pointer' : 'not-allowed' }}
      title={isEnabled ? 'Select vessels' : 'Select a Nightfarer to enable vessel selection'}
    >
      <div className="card-header">
        <h2 id='vessel-card-header'>Vessels</h2>
      </div>

      <div className="vessel-preview">
        <div className={`vessel-preview-grid ${showDeepOfNight ? 'deep-mode' : ''} ${showForsakenHollows ? 'forsaken-mode' : ''}`}>
          {(isEnabled ? vessels : Array(8).fill(null)).map((vessel, index) => (
            <div
              key={index}
              className="vessel-preview-dot"
              style={{
                backgroundColor: isEnabled && selectedVessels.includes(vessel.name)
                  ? 'var(--primary-color)'
                  : '#777'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VesselButton;

