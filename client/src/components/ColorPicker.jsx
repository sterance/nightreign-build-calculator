import React from 'react';

function ColorPicker({ color, setColor }) {
  const defaultColor = '#646cff';

  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  const handleReset = () => {
    setColor(defaultColor);
  };

  return (
    <div className="settings-option">
      <div className="color-picker-wrapper">
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={handleColorChange}
        />
        <button onClick={handleReset} className="color-picker-reset">Reset</button>
      </div>
      <label htmlFor="colorPicker">Select Primary Color</label>
    </div>
  );
}

export default ColorPicker;