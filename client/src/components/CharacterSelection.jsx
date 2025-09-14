import React from 'react';
import { characters } from '../data/chaliceData';
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
        <h2>Character Selection</h2>
        {selectedCharacter && (
          <div className='button-group'>
            <button
              className="card-button icon-button"
              onClick={onClear}
              title='Clear Selection'
            >
              <ClearSelectionIcon />
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
              height={50}
              width={50}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelection;