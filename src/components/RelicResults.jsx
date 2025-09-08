import React from 'react';

const RelicResults = () => {
  const toTitleCase = (str) => {
    return str
      .replace('.png', '')
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const relics = [
    'delicate-burning-scene.png',
    'delicate-drizzly-scene.png',
    'delicate-luminous-scene.png',
  ];

  return (
    <div id="relics-card" className="card">
      <h2>Recommended Relics</h2>
      <div className="relic-result-container">
        <div className="chalice-result-card">
          <img src="/chalices/wylders-chalice.png" alt="Chalice" style={{ width: '60px', height: '60px' }} />
          <span id='chalice-name'>{toTitleCase('wylders-chalice.png')}</span>
        </div>
        {relics.map((relic, index) => (
          <div className="relic-result-card" key={index}>
            <img src={`/relics/${relic}`} alt={`Relic ${index + 1}`} style={{ width: '60px', height: '60px' }} />
            <span>{toTitleCase(relic)}</span>
            <table className="relic-stats-table">
              <tbody>
                <tr><td>Stat 1</td></tr>
                <tr><td>Stat 2</td></tr>
                <tr><td>Stat 3</td></tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelicResults;