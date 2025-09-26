import React from 'react';
import Chalice from './Chalice';
import { chaliceData, placeholderChalices } from '../data/chaliceData';
import { ClearSelectionIcon, SelectAllIcon, CloseIcon } from './Icons';

const ChalicePage = ({
  onBack,
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
    <div className="chalice-page-backdrop">
      <div className="chalice-page card">
        <div className="card-header">
          <h2>Vessel Selection</h2>
          <div className="button-group">
            {isEnabled && (
              <>
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
              </>
            )}
            <button className="corner-button" onClick={onBack}>
              <CloseIcon />
            </button>
          </div>
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
    </div>
  );
};

export default ChalicePage;