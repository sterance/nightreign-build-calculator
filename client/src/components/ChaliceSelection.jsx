import React from 'react';
import Chalice from './Chalice';
import { chaliceData, placeholderChalices } from '../data/chaliceData';
import { ClearSelectionIcon, SelectAllIcon } from './Icons';

const ChaliceSelection = ({
  selectedCharacter,
  selectedChalices,
  onChaliceToggle,
  onSelectAll,
  onClearAll,
}) => {
  const isEnabled = !!selectedCharacter;
  const chalices = isEnabled
    ? chaliceData[selectedCharacter]
    : placeholderChalices;

  return (
    <div id="chalice-card" className={`card ${!isEnabled ? 'disabled' : ''}`}>
      <div className="card-header">
        <h2>Chalice Selection</h2>
        {isEnabled && (
          <div className="button-group">
            <button
              className="card-button icon-button"
              onClick={onSelectAll}
              title='Select All'
            >
              <SelectAllIcon />
            </button>
            <button
              className="card-button icon-button"
              onClick={onClearAll}
              title="Clear Selection"
            >
              <ClearSelectionIcon />
            </button>
          </div>
        )}
      </div>
      
        <div className="chalice-grid">
          {chalices.map((chalice, index) => (
            <Chalice
              key={index}
              chalice={chalice}
              isSelected={
                isEnabled && selectedChalices.includes(chalice.name)
              }
              onToggle={isEnabled ? onChaliceToggle : () => { }}
            />
          ))}
        </div>
      
    </div>
  );
};

export default ChaliceSelection;