import React from 'react';
import { characters } from '../data/chaliceData';

const CharacterSelection = ({ selectedCharacter, onCharacterSelect }) => {
  return (
    <div id="character-card" className="card">
      <h2>Character Selection</h2>
      <div className="image-grid">
        {characters.map((character) => (
          <img
            key={character}
            src={`/characters/${character}.png`}
            alt={character}
            height={50}
            width={50}
            className={selectedCharacter === character ? 'selected' : ''}
            onClick={() => onCharacterSelect(character)}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterSelection;