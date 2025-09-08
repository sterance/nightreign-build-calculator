import { useState } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import ChaliceSelection from './components/ChaliceSelection';
import { chaliceData } from './data/chaliceData';

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedChalices, setSelectedChalices] = useState([]);

  const selectAllChalicesForCharacter = (character) => {
    if (!character) return;
    const allChaliceNames = chaliceData[character].map((c) => c.name);
    setSelectedChalices(allChaliceNames);
  }
  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    // select all by default
    selectAllChalicesForCharacter(character);
  };

  const handleClearCharacter = () => {
    setSelectedCharacter(null);
    setSelectedChalices([]);
  };

  const handleChaliceToggle = (chaliceName) => {
    setSelectedChalices((prevSelected) =>
      prevSelected.includes(chaliceName)
        ? prevSelected.filter((name) => name !== chaliceName)
        : [...prevSelected, chaliceName]
    );
  };

  const handleSelectAllChalices = () => {
    selectAllChalicesForCharacter(selectedCharacter);
  };

  const handleClearAllChalices = () => {
    setSelectedChalices([]);
  };

  return (
    <div className="app-container">
      <h1>Nightreign Build Calculator</h1>

      <div className="card-container">
        <CharacterSelection
          selectedCharacter={selectedCharacter}
          onCharacterSelect={handleCharacterSelect}
          onClear={handleClearCharacter}
        />

        <ChaliceSelection
          selectedCharacter={selectedCharacter}
          selectedChalices={selectedChalices}
          onChaliceToggle={handleChaliceToggle}
          onSelectAll={handleSelectAllChalices}
          onClearAll={handleClearAllChalices}
        />

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