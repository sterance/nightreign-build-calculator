import React from 'react';
import nightfarers from '../data/nightfarers.json';
import { ClearSelectionIcon } from './Icons';
import { capitalize } from '../utils/utils';

const CharacterSelection = ({
  selectedCharacter,
  onCharacterSelect,
  onClear,
  showForsakenHollows,
}) => {
  const visibleNightfarers = nightfarers.nightfarers.filter(character => {
    const isForsaken = nightfarers.forsakenNightfarers.includes(character);
    return showForsakenHollows || !isForsaken;
  });

  return (
    <div id="character-card" className="card">
      <div className="card-header">
        <h2>Nightfarer</h2>
        {selectedCharacter && (
          <div className='button-group'>
            <button
              className="card-button icon-button"
              onClick={onClear}
              title='Clear Selection'
            >
              <ClearSelectionIcon />
              &nbsp;Clear Selection
            </button>
          </div>
        )}
      </div>
      <div className="image-grid">
        {visibleNightfarers.map((character) => (
          <div
            key={character}
            className={`character-image-wrapper ${selectedCharacter === character ? 'selected' : ''
              }`}
            onClick={() => onCharacterSelect(character)}
            title={capitalize(character)}
          >
            <img
              src={`characters/${character}.png`}
              alt={character}
              height={70}
              width={70}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelection;