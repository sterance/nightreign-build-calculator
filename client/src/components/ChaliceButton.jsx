import React from 'react';

const ChaliceButton = ({ selectedCharacter, selectedChalices, onClick, chaliceData }) => {
  const isEnabled = !!selectedCharacter;
  const chalices = isEnabled ? chaliceData[selectedCharacter] : [];

  return (
    <div
      id="chalice-card"
      className={`card ${!isEnabled ? 'disabled' : ''}`}
      onClick={isEnabled ? onClick : undefined}
      style={{ cursor: isEnabled ? 'pointer' : 'not-allowed' }}
      title={isEnabled ? 'Select vessels' : 'Select a Nightfarer to enable vessel selection'}
    >
      <div className="card-header">
        <h2>Vessels</h2>
      </div>

      <div className="chalice-preview">
        <div className="chalice-preview-grid">
          {(isEnabled ? chalices : Array(8).fill(null)).map((chalice, index) => (
            <div
              key={index}
              className="chalice-preview-dot"
              style={{
                backgroundColor: isEnabled && selectedChalices.includes(chalice.name)
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

export default ChaliceButton;