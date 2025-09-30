import React from 'react';

const RelicSlot = ({ color }) => {
  return (
    <img
      src={`/relic-slots/${color}.png`}
      alt={`${color} relic slot`}
      style={{ width: '65px', height: '65px' }}
    />
  );
};

export default RelicSlot;