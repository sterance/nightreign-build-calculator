import React from 'react';

const RelicSlot = ({ color }) => {
  return (
    <img
      src={`/relic-slots/${color}.png`}
      alt={`${color} relic slot`}
      style={{ width: '30px', height: '30px' }}
    />
  );
};

export default RelicSlot;