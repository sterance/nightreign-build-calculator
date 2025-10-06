import React from 'react';
import { characters } from '../utils/vesselData';
import { ClearSelectionIcon } from './Icons';

const CharacterSelection = ({
  selectedCharacter,
  onCharacterSelect,
  onClear,
}) => {
  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

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
        {characters.map((character) => (
          <div
            key={character}
            className={`character-image-wrapper ${selectedCharacter === character ? 'selected' : ''
              }`}
            onClick={() => onCharacterSelect(character)}
            title={capitalize(character)}
          >
            <img
              src={`/characters/${character}.png`}
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