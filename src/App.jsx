import { useState } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import ChaliceSelection from './components/ChaliceSelection';

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
  };

  return (
    <div className="app-container">
      <h1>Nightreign Build Calculator</h1>

      <div className="card-container">
        <CharacterSelection
          selectedCharacter={selectedCharacter}
          onCharacterSelect={handleCharacterSelect}
        />

        <ChaliceSelection selectedCharacter={selectedCharacter} />

        <div id="effects-card" className="card">
          <h2>Desired Effects</h2>
          <input type="text" />
        </div>

        <div id="relics-card" className="card">
          <h2>Recommended Relics</h2>
        </div>
      </div>

      <button id="calculate-button">Calculate</button>
    </div>
  );
}

export default App;