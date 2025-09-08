import React from 'react';
import RelicSlot from './RelicSlot';

const Chalice = ({ chalice }) => {
  return (
    <div className="chalice">
      <div className="relic-slots">
        {chalice.slots.map((color, index) => (
          <RelicSlot key={index} color={color} />
        ))}
      </div>
    </div>
  );
};

export default Chalice;