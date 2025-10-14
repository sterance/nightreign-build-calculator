import React from 'react';
import RelicSlot from './RelicSlot';

const Vessel = ({ vessel, isSelected, onToggle, showDeepOfNight }) => {
  return (
    <div
      className={`vessel ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(vessel.name)}
      title={vessel.name}
    >
      <p>{vessel.name}</p>
      {showDeepOfNight ? (
        <div className="vessel-slots-container">
          <div className="relic-slots">
            {vessel.baseSlots.map((color, index) => (
              <RelicSlot key={index} color={color} />
            ))}
          </div>
          <div className="relic-slots">
            {vessel.deepSlots?.map((color, index) => (
              <RelicSlot key={index} color={color} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relic-slots">
          {vessel.baseSlots.map((color, index) => (
            <RelicSlot key={index} color={color} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Vessel;

