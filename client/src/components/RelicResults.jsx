import React from 'react';

const RelicResults = ({ selectedChalices }) => {
  const toTitleCase = (str) => {
    return str
      .replace('.png', '')
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const relics = [
    'scenic-flatstone.png',
    'scenic-flatstone.png',
    'scenic-flatstone.png',
  ];
  const chalice = 'placeholder-chalice.png'

  const isEnabled = selectedChalices && selectedChalices.length > 0;
  
  return (
    <div id="relics-card" className={`card ${!isEnabled ? 'disabled' : ''}`}>
      <h2>Recommended Relics</h2>
      <div className="relic-result-container">
        <div className="chalice-result-card">
          <img src="/chalices/placeholder-chalice.png" alt="Chalice" style={{ width: '60px', height: '60px' }} />
          <span id='chalice-name'>{chalice === 'placeholder-chalice.png' ? '' : toTitleCase(chalice)}</span>
        </div>
        {relics.map((relic, index) => (
          <div className="relic-result-card" key={index}>
            <img src={`/relics/${relic}`} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
            <span>{relic === 'scenic-flatstone.png' ? '' : toTitleCase(relic)}</span>
            <table className="relic-stats-table">
              <tbody>
                <tr><td>Effect 1</td></tr>
                <tr><td>Effect 2</td></tr>
                <tr><td>Effect 3</td></tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelicResults;