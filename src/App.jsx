import { useState } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import ChaliceSelection from './components/ChaliceSelection';
import { chaliceData } from './data/chaliceData';
import { CalculatorIcon, QuestionMarkIcon, UploadIcon } from './components/Icons';

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

      <div className="bottom-bar">
        <button className='help-button' title='How to use'>
          <QuestionMarkIcon />
          <span style={{ marginLeft: '0.5rem' }}>Help</span>
        </button>
        <button className='calculate-button' title='Calculate optimal relics'>
          <CalculatorIcon />
          <span style={{ marginLeft: '0.5rem' }}>Calculate</span>
        </button>
        <button className="upload-button" title='Upload your save file'>
          <UploadIcon />
          <span style={{ marginLeft: '0.5rem' }}>Upload</span>
        </button>
      </div>
    </div>
  );
}

export default App;