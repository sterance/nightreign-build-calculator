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
    <div style={{ margin: '20px' }}>
      <label htmlFor="colorPicker">Select Primary Color: </label>
      <input
        type="color"
        id="colorPicker"
        value={color}
        onChange={handleColorChange}
      />
      <button onClick={handleReset} style={{ marginLeft: '10px' }}>Default</button>
    </div>
  );
}

export default ColorPicker;