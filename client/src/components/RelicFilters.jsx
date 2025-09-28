import React from 'react';

const RelicFilters = ({ color, isChecked, onChange }) => {
  return (
    <div
      className={`color-filter-card color-${color} ${isChecked ? 'checked' : ''}`}
      onClick={() => onChange(color)}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => onChange(color)}
        style={{ display: 'none' }}
      />
      <span>{color.charAt(0).toUpperCase() + color.slice(1)}</span>
    </div>
  );
};

export default RelicFilters;