import React from 'react';

const ColorFilter = ({ relicColorFilters,
  onRelicColorFilterChange,
  type,
  colorCounts }) => {
  const handleColorClick = (e, color) => {
    e.stopPropagation(); // Prevent group toggle when individual color is clicked
    onRelicColorFilterChange(color);
  };

  return (
    <div className={`${type}-color-filters`}>
      {Object.keys(relicColorFilters).map(color => (
        <div
          key={color}
          className={`color-filter-card color-${color} ${relicColorFilters[color] ? 'checked' : ''}`}
          onClick={(e) => handleColorClick(e, color)}
        >
          <input
            type="checkbox"
        checked={Boolean(relicColorFilters[color])}
            onChange={(e) => handleColorClick(e, color)}
            style={{ display: 'none' }}
          />
          <span>{colorCounts && colorCounts[color] !== undefined ? colorCounts[color] : 0}</span>
        </div>
      ))}
    </div>
  );
};

const RelicFilters = ({
  baseRelicColorFilters,
  deepRelicColorFilters,
  onBaseRelicColorFilterChange,
  onDeepRelicColorFilterChange,
  showDeepOfNight,
  colorCounts }) => {

  const toggleAllBaseFilters = () => {
    const allEnabled = Object.values(baseRelicColorFilters).every(enabled => enabled);
    const newState = !allEnabled;
    Object.keys(baseRelicColorFilters).forEach(color => {
      if (baseRelicColorFilters[color] !== newState) {
        onBaseRelicColorFilterChange(color);
      }
    });
  };

  const toggleAllDeepFilters = () => {
    const allEnabled = Object.values(deepRelicColorFilters).every(enabled => enabled);
    const newState = !allEnabled;
    Object.keys(deepRelicColorFilters).forEach(color => {
      if (deepRelicColorFilters[color] !== newState) {
        onDeepRelicColorFilterChange(color);
      }
    });
  };

  const isBaseGroupEnabled = Object.values(baseRelicColorFilters).some(enabled => enabled);
  const isDeepGroupEnabled = Object.values(deepRelicColorFilters).some(enabled => enabled);

  const baseTotalCount = colorCounts ? Object.values(colorCounts.base).reduce((sum, count) => sum + count, 0) : 0;
  const deepTotalCount = colorCounts ? Object.values(colorCounts.deep).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className="relic-color-filters">
      {showDeepOfNight ? (
        <>
          <div
            className={`base-color-filter-group ${isBaseGroupEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleAllBaseFilters}
          >
            <h3 className="color-filter-label">Base Relics ({baseTotalCount})</h3>
            <ColorFilter
              relicColorFilters={baseRelicColorFilters}
              onRelicColorFilterChange={onBaseRelicColorFilterChange}
              type="base"
              colorCounts={colorCounts?.base}
            />
          </div>
          <div
            className={`deep-color-filter-group ${isDeepGroupEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleAllDeepFilters}
          >
            <h3 className="color-filter-label">Deep Relics ({deepTotalCount})</h3>
            <ColorFilter
              relicColorFilters={deepRelicColorFilters}
              onRelicColorFilterChange={onDeepRelicColorFilterChange}
              type="deep"
              colorCounts={colorCounts?.deep}
            />
          </div>
        </>
      ) : (
        <ColorFilter
          relicColorFilters={baseRelicColorFilters}
          onRelicColorFilterChange={onBaseRelicColorFilterChange}
          type="base"
          colorCounts={colorCounts?.base}
        />
      )}
    </div>
  );
};

export default RelicFilters;