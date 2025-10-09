import React from 'react';
import RelicSlot from './RelicSlot';

const Vessel = ({ vessel, isSelected, onToggle }) => {
  return (
    <div
      className={`vessel ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(vessel.name)}
      title={vessel.name}
    >
      <p>{vessel.name}</p>
      <div className="relic-slots">
        {vessel.baseSlots.map((color, index) => (
          <RelicSlot key={index} color={color} />
        ))}
      </div>
    </div>
  );
};

export default Vessel;

