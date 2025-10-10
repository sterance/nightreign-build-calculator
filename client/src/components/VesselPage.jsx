import React from 'react';
import Vessel from './Vessel';
import { ClearSelectionIcon, SelectAllIcon, CloseIcon } from './Icons';

const VesselPage = ({
  onBack,
  selectedCharacter,
  selectedVessels,
  onVesselToggle,
  onSelectAll,
  onClearAll,
  vesselData,
  showDeepOfNight,
}) => {
  const isEnabled = !!selectedCharacter;
  const vessels = isEnabled ? vesselData[selectedCharacter] : [];

  return (
    <div className="vessel-page-backdrop">
      <div className="vessel-page card">
        <div className="vessel-card-header">
          <h2>Vessel Selection</h2>
          <div className="vessel-button-group">
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

        <div className={`vessel-grid ${showDeepOfNight ? 'deep-mode' : ''}`}>
          {vessels.map((vessel, index) => (
            <Vessel
              key={index}
              vessel={vessel}
              isSelected={
                isEnabled && selectedVessels.includes(vessel.name)
              }
              onToggle={isEnabled ? onVesselToggle : () => { }}
              showDeepOfNight={showDeepOfNight}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VesselPage;

