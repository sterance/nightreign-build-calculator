import React from 'react';
import Chalice from './Chalice';
import { chaliceData } from '../data/vessels';
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
  const chalices = isEnabled ? chaliceData[selectedCharacter] : [];

  return (
    <div className="chalice-page-backdrop">
      <div className="chalice-page card">
        <div className="chalice-card-header">
          <h2>Vessel Selection</h2>
          <div className="chalice-button-group">
            {isEnabled && (
              <>
                <button
                  className="card-button icon-button"
                  onClick={onSelectAll}
                  title='Select All'
                >
                  <SelectAllIcon />
                  &nbsp;Select All
                </button>
                <button
                  className="card-button icon-button"
                  onClick={onClearAll}
                  title="Clear Selection"
                >
                  <ClearSelectionIcon />
                  &nbsp;Clear Selection
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