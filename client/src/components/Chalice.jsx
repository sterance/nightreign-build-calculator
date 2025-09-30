import React from 'react';
import RelicSlot from './RelicSlot';

const Chalice = ({ chalice, isSelected, onToggle }) => {
  return (
    <div
      className={`chalice ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(chalice.name)}
      title={chalice.name}
    >
      <p>{chalice.name}</p>
      <div className="relic-slots">
        {chalice.baseSlots.map((color, index) => (
          <RelicSlot key={index} color={color} />
        ))}
      </div>
    </div>
  );
};

export default Chalice;