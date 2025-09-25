import React, { useState, useEffect } from 'react';

function ColorPicker() {
  const [color, setColor] = useState(localStorage.getItem('primaryColor') || '#007bff');
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('primaryColor', color);
  }, [color]);

  const handleColorChange = (e) => {
    setColor(e.target.value);
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
    </div>
  );
}

export default ColorPicker;