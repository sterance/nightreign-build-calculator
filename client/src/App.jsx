import { useState, useRef, useEffect } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import ChaliceButton from './components/ChaliceButton';
import ChalicePage from './components/ChalicePage';
import RelicResults from './components/RelicResults';
import DesiredEffects from './components/DesiredEffects';
import RelicsPage from './components/RelicsPage';
import { chaliceData } from './data/chaliceData';
import { RelicIcon, UploadIcon, SettingsIcon, SwordIcon, CloseIcon } from './components/Icons';
import { calculateBestRelics } from './utils/calculation';
import effects from './data/relicEffects.json';
import SettingsPage from './components/SettingsPage';
import SavedBuildsPage from './components/SavedBuildsPage';
import ToastNotification from './components/ToastNotification';

const createEffectMap = (showDeepOfNight) => {
  const effectMap = new Map();
  effects.forEach(effect => {
    // filter out deep effects if showDeepOfNight is false
    if (effect.deep === true && !showDeepOfNight) {
      return;
    }
    effect.ids.forEach(id => {
      effectMap.set(id, effect.name);
    });
  });
  return effectMap;
};

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedSaveName, setSelectedSaveName] = useState(null);
  const [selectedChalices, setSelectedChalices] = useState([]);
  const [desiredEffects, setDesiredEffects] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [showChalices, setShowChalices] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedBuilds, setShowSavedBuilds] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasRelicData, setHasRelicData] = useState(false);
  const [hasSavedBuilds, setHasSavedBuilds] = useState(false);
  const [showDeepOfNight, setShowDeepOfNight] = useState(false);
  const [showUnknownRelics, setShowUnknownRelics] = useState(false);
  const [baseRelicColorFilters, setBaseRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [deepRelicColorFilters, setDeepRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [effectMap, setEffectMap] = useState(new Map());
  const fileInputRef = useRef(null);

  useEffect(() => {
    const primaryColor = localStorage.getItem('primaryColor') || '#646cff';
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, []);

  useEffect(() => {
    const newEffectMap = createEffectMap(showDeepOfNight);
    console.log('Creating effectMap with showDeepOfNight:', showDeepOfNight, 'Size:', newEffectMap.size);
    setEffectMap(newEffectMap);
  }, [showDeepOfNight]);

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

    // check for existing saved builds on initial load
    const storedBuilds = localStorage.getItem('savedBuilds');
    if (storedBuilds) {
      try {
        const parsedBuilds = JSON.parse(storedBuilds);
        if (parsedBuilds && Object.keys(parsedBuilds).length > 0) {
          setHasSavedBuilds(true);
        }
      } catch (e) {
        console.log("Error parsing saved builds:", e);
        localStorage.removeItem('savedBuilds');
      }
    }
  }, []);

  const addToast = (message, type = 'error', duration = 5000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, duration);
  };

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
        if (data && data.length > 0) {
          localStorage.setItem('saveData', JSON.stringify(data));
          setHasRelicData(true);
          addToast('Save file uploaded successfully!', 'success');
          if (data.length === 1) {
            setSelectedSaveName(data[0].character_name);
          } else {
            setSelectedSaveName(null); // require user to select a character
          }
        } else {
          addToast('Relic information not found in save file.', 'error');
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to process file');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      addToast('Save file failed to upload.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCalculate = () => {
    try {
      const saveData = JSON.parse(localStorage.getItem('saveData'));

      if (!saveData) {
        addToast('Calculation failed: Missing relic data.', 'error');
        return;
      }
      if (!selectedCharacter) {
        addToast('Calculation failed: Missing character selection.', 'error');
        return;
      }
      if (selectedChalices.length === 0) {
        addToast('Calculation failed: Missing chalice selection.', 'error');
        return;
      }
      if (desiredEffects.length === 0) {
        addToast('Calculation failed: No desired effects.', 'error');
        return;
      }

      // find the character data for the selected save name
      const characterSaveData = saveData.find(
        (character) => character.character_name === selectedSaveName
      );

      if (!characterSaveData) {
        addToast('No relic data found for the selected character.', 'error');
        return;
      }

      const result = calculateBestRelics(
        desiredEffects,
        characterSaveData,
        selectedChalices,
        selectedCharacter,
        effectMap
      );

      if (result) {
        const formattedResult = {
          "chalice name": result.chalice.name,
          "chalice slots": result.chalice.slots,
          "chalice description": result.chalice.description,
          "relics": result.relics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            effects: {
              "effect 1": relic['effect 1'] || "",
              "effect 2": relic['effect 2'] || "",
              "effect 3": relic['effect 3'] || "",
            }
          }))
        };
        setCalculationResult(formattedResult);
        addToast('Calculation successful!', 'success');
      } else {
        setCalculationResult(null);
        addToast('No valid relic combination found for the selected criteria.', 'error');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      addToast(`Calculation failed: ${error.message}`, 'error');
      setCalculationResult(null);
    }
  };

  const handleBaseRelicColorFilterChange = (color) => {
    setBaseRelicColorFilters(prevFilters => ({
      ...prevFilters,
      [color]: !prevFilters[color]
    }));
  };

  const handleDeepRelicColorFilterChange = (color) => {
    setDeepRelicColorFilters(prevFilters => ({
      ...prevFilters,
      [color]: !prevFilters[color]
    }));
  };

  const handleLoadBuild = (buildEffects) => {
    setDesiredEffects(buildEffects);
  };

  return (
    <div className="app-container">
      <ToastNotification toasts={toasts} />
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
        onClick={() => setShowSettings(!showSettings)}
      >
        <SettingsIcon />
      </button>

      <div className="content-wrapper">
        <h1>Nightreign Build Calculator</h1>
        <div className="card-container">
          <CharacterSelection
            selectedCharacter={selectedCharacter}
            onCharacterSelect={handleCharacterSelect}
            onClear={handleClearCharacter}
          />

          <ChaliceButton
            selectedCharacter={selectedCharacter}
            selectedChalices={selectedChalices}
            onClick={() => setShowChalices(true)}
          />

          <DesiredEffects
            desiredEffects={desiredEffects}
            onChange={setDesiredEffects}
            selectedCharacter={selectedCharacter}
            handleCalculate={handleCalculate}
            setHasSavedBuilds={setHasSavedBuilds}
            showDeepOfNight={showDeepOfNight}
          />

          <RelicResults
            selectedChalices={selectedChalices}
            calculationResult={calculationResult}
          />
        </div>
      </div>

      {showChalices && <ChalicePage
        onBack={() => setShowChalices(false)}
        selectedCharacter={selectedCharacter}
        selectedChalices={selectedChalices}
        onChaliceToggle={handleChaliceToggle}
        onSelectAll={handleSelectAllChalices}
        onClearAll={handleClearAllChalices}
      />}

      {showRelics && <RelicsPage
        onBack={() => setShowRelics(false)}
        selectedSaveName={selectedSaveName}
        onSaveNameSelect={setSelectedSaveName}
        showDeepOfNight={showDeepOfNight}
        showUnknownRelics={showUnknownRelics}
        baseRelicColorFilters={baseRelicColorFilters}
        deepRelicColorFilters={deepRelicColorFilters}
        onBaseRelicColorFilterChange={handleBaseRelicColorFilterChange}
        onDeepRelicColorFilterChange={handleDeepRelicColorFilterChange}
      />}

      {showSettings && <SettingsPage
        onBack={() => setShowSettings(false)}
        showUnknownRelics={showUnknownRelics}
        setShowUnknownRelics={setShowUnknownRelics}
      />}

      {showSavedBuilds && <SavedBuildsPage
        onBack={() => setShowSavedBuilds(false)}
        onLoadBuild={handleLoadBuild}
      />}

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

        <button
          className="builds-button"
          title={hasSavedBuilds ? 'View saved builds' : 'No saved builds'}
          onClick={() => setShowSavedBuilds(true)}
          disabled={!hasSavedBuilds}
        >
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