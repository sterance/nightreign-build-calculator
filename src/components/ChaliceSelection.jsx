import React from 'react';
import Chalice from './Chalice';
import { chaliceData } from '../data/chaliceData';

const ChaliceSelection = ({ selectedCharacter }) => {
  const isEnabled = !!selectedCharacter;
  const chalices = isEnabled ? chaliceData[selectedCharacter] : [];

  return (
    <div id="chalice-card" className={`card ${!isEnabled ? 'disabled' : ''}`}>
      <h2>Chalice Selection</h2>
      {isEnabled && (
        <div className="chalice-grid">
          {chalices.map((chalice, index) => (
            <Chalice key={index} chalice={chalice} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChaliceSelection;