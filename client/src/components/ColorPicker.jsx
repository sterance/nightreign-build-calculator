import React, { useState, useEffect } from 'react';

function ColorPicker() {
  const defaultColor = '#646cff';
  const [color, setColor] = useState(localStorage.getItem('primaryColor') || '#007bff');
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('primaryColor', color);
  }, [color]);

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