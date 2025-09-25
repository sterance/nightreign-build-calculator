import { useState, useRef, useEffect } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import ChaliceSelection from './components/ChaliceSelection';
import RelicResults from './components/RelicResults';
import DesiredEffects from './components/DesiredEffects';
import RelicsPage from './components/RelicsPage';
import { chaliceData } from './data/chaliceData';
import { RelicIcon, UploadIcon, SettingsIcon, SwordIcon, CloseIcon } from './components/Icons';
import { calculateBestRelics } from './utils/calculation';
import effects from './data/baseRelicEffects.json';
import SettingsPage from './components/SettingsPage';

const effectMap = new Map();
effects.forEach(effect => {
  effect.ids.forEach(id => {
    effectMap.set(id, effect.name);
  });
});

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedSaveName, setSelectedSaveName] = useState(null);
  const [selectedChalices, setSelectedChalices] = useState([]);
  const [desiredEffects, setDesiredEffects] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [showRelics, setShowRelics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [hasRelicData, setHasRelicData] = useState(false);
  const [showDeepOfNight, setShowDeepOfNight] = useState(false);
  const [showUnknownRelics, setShowUnknownRelics] = useState(false);
  const [relicColorFilters, setRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const primaryColor = localStorage.getItem('primaryColor') || '#646cff';
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, []);

  useEffect(() => {
    // check for existing relic data on initial load
    const storedData = localStorage.getItem('saveData');

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.length > 0) {
          setHasRelicData(true);
          // if there's only one character, pre-select it
          if (parsedData.length === 1) {
            setSelectedSaveName(parsedData[0].character_name);
          }
        } else {
            setShowUploadTooltip(true);
        }
      } catch (e) {
        localStorage.removeItem('saveData');
        setShowUploadTooltip(true);
        console.log(e);
      }
    } else {
        setShowUploadTooltip(true);
    }
  }, []);


  const handleCloseTooltip = () => {
      setShowUploadTooltip(false);
  };

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
    setShowUploadTooltip(false);

    const formData = new FormData();
    formData.append('savefile', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('saveData', JSON.stringify(data));
        setHasRelicData(true);
        if (data.length === 1) {
          setSelectedSaveName(data[0].character_name);
        } else {
          setSelectedSaveName(null); // require user to select a character
        }
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

  const handleCalculate = () => {
    const saveData = JSON.parse(localStorage.getItem('saveData'));

    if (!saveData || !selectedCharacter || selectedChalices.length === 0 || !selectedSaveName) {
      console.log("Cannot calculate: Missing relic data, character selection, chalice selection, or save name selection.");
      return;
    }

    // find the character data for the selected save name
    const characterSaveData = saveData.find(
      (character) => character.character_name === selectedSaveName
    );

    if (!characterSaveData) {
      console.log(`No relic data found for character: ${selectedSaveName}`);
      return;
    }

    const result = calculateBestRelics(
      desiredEffects,
      characterSaveData,
      selectedChalices,
      selectedCharacter
    );

    if (result) {
      const formattedResult = {
        "chalice name": result.chalice.name,
        "chalice slots": result.chalice.slots,
        ...result.relics.reduce((acc, relic) => {

          acc[relic['relic name']] = {
            color: relic.color,
            effects: {
              "effect 1": relic['effect 1'] ? relic['effect 1'].name : "",
              "effect 2": relic['effect 2'] ? relic['effect 2'].name : "",
              "effect 3": relic['effect 3'] ? relic['effect 3'].name : "",
            }
          };
          return acc;
        }, {})
      };
      setCalculationResult(formattedResult);
    } else {
      setCalculationResult(null);
    }
  };
  const handleRelicColorFilterChange = (color) => {
    setRelicColorFilters(prevFilters => ({
      ...prevFilters,
      [color]: !prevFilters[color]
    }));
  };

  return (
    <div className="app-container">
      <div className="floating-checkbox">
        <label>
          <input
            type="checkbox"
            checked={showDeepOfNight}
            onChange={() => setShowDeepOfNight(!showDeepOfNight)}
          />
          Deep of Night
        </label>
      </div>

      <button
        className="floating-button"
        title='Settings'
        onClick={() => setShowSettings(true)}
      >
        <SettingsIcon />
      </button>

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

        <DesiredEffects
          onChange={setDesiredEffects}
          selectedCharacter={selectedCharacter}
          handleCalculate={handleCalculate}
        />

        <RelicResults
          selectedChalices={selectedChalices}
          calculationResult={calculationResult}
        />
      </div>

      {showRelics && <RelicsPage
        onBack={() => setShowRelics(false)}
        selectedSaveName={selectedSaveName}
        onSaveNameSelect={setSelectedSaveName}
        showDeepOfNight={showDeepOfNight}
        showUnknownRelics={showUnknownRelics}
        relicColorFilters={relicColorFilters}
        onRelicColorFilterChange={handleRelicColorFilterChange} />}

      {showSettings && <SettingsPage
        onBack={() => setShowSettings(false)}
        showUnknownRelics={showUnknownRelics}
        setShowUnknownRelics={setShowUnknownRelics}
      />}

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
        
        <div className="upload-button-container">
            <button className="upload-button-center" title='Upload your save file' onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? (
                <div className="loader"></div>
              ) : (
                <>
                  <UploadIcon />
                  <span style={{ marginLeft: '0.5rem' }}>Upload</span>
                </>
              )}
            </button>
            {showUploadTooltip && (
                <div className="upload-tooltip">
                    <button className="close-tooltip-button" onClick={handleCloseTooltip}>
                        <CloseIcon />
                    </button>
                    <div className="tooltip-content">
                        <p className="tooltip-main-text"><span className="underlined-text">Upload your save file here to get started!</span></p>
                        <p className="tooltip-sub-text"><span className='code-inline'>.sl2</span> file, found at <span className='code-inline'>C:\Users\[username]\AppData\Roaming\Nightreign</span> on Windows</p>
                    </div>
                </div>
            )}
        </div>

        <button className="builds-button" title='View saved builds'>
          <SwordIcon />
          <span style={{ marginLeft: '0.5rem' }}>Saved Builds</span>
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