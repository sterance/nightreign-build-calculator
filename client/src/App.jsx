import { useState, useRef, useEffect } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import ChaliceSelection from './components/ChaliceSelection';
import RelicResults from './components/RelicResults';
import DesiredEffects from './components/DesiredEffects';
import RelicsPage from './components/RelicsPage';
import { chaliceData } from './data/chaliceData';
import { CalculatorIcon, RelicIcon, UploadIcon } from './components/Icons';

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedChalices, setSelectedChalices] = useState([]);
  const [showRelics, setShowRelics] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [hasRelicData, setHasRelicData] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // check for existing relic data on initial load
    const storedData = localStorage.getItem('relicData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.length > 0) {
          setHasRelicData(true);
        }
      } catch (e) {
        localStorage.removeItem('relicData');
        console.log(e);
      }
    }
  }, []);


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

  const handleUploadClick = () => {
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('savefile', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('relicData', JSON.stringify(data));
        setHasRelicData(true);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to process file');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
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

        <DesiredEffects />

        <RelicResults
          selectedChalices={selectedChalices}
        />
      </div>

      {showRelics && <RelicsPage onBack={() => setShowRelics(false)} />}
      
      {uploadError && <div className="error-popup">{uploadError}</div>}

      <div className="bottom-bar">
        <button
          className='relic-button'
          title={hasRelicData ? 'View your relics' : 'Upload a save file to view relics'}
          onClick={() => hasRelicData && setShowRelics(true)}
          disabled={!hasRelicData}
        >
          <RelicIcon />
          <span style={{ marginLeft: '0.5rem' }}>Relics</span>
        </button>
        <button className='calculate-button' title='Calculate optimal relics'>
          <CalculatorIcon />
          <span style={{ marginLeft: '0.5rem' }}>Calculate</span>
        </button>
        <button className="upload-button" title='Upload your save file' onClick={handleUploadClick} disabled={isUploading}>
           {isUploading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <UploadIcon />
              <span style={{ marginLeft: '0.5rem' }}>Upload</span>
            </>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".sl2"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default App;