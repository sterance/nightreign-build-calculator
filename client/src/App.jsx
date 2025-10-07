import { useState, useRef, useEffect } from 'react';
import './App.css';
import CharacterSelection from './components/CharacterSelection';
import VesselButton from './components/VesselButton';
import VesselPage from './components/VesselPage';
import RelicResults from './components/RelicResults';
import DesiredEffects from './components/DesiredEffects';
import RelicsPage from './components/RelicsPage';
import nightfarers from './data/nightfarers.json';
import vesselsRaw from './data/vessels.json';
import { RelicIcon, UploadIcon, SettingsIcon, SwordIcon, CloseIcon } from './components/Icons';
import { calculateBestRelics } from './utils/calculation';
import { calculateWithGuaranteeableRelics } from './utils/guaranteeableCalculation';
import effects from './data/effects.json';
import SettingsPage from './components/SettingsPage';
import SavedBuildsPage from './components/SavedBuildsPage';
import ToastNotification from './components/ToastNotification';

const vesselData = nightfarers.reduce((acc, character) => {
  const vesselsKey = `${character}Chalices`;
  acc[character] = [...vesselsRaw[vesselsKey], ...vesselsRaw.genericChalices];
  return acc;
}, {});

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

function usePersistentBoolean(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved === null) return defaultValue;
    if (typeof defaultValue === 'boolean') {
      try { return JSON.parse(saved); } catch { return saved === 'true'; }
    }
    return saved;
  });

  useEffect(() => {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedSaveName, setSelectedSaveName] = useState(null);
  const [selectedVessels, setSelectedVessels] = useState([]);
  const [desiredEffects, setDesiredEffects] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [showVessels, setShowVessels] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedBuilds, setShowSavedBuilds] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasRelicData, setHasRelicData] = useState(false);
  const [hasSavedBuilds, setHasSavedBuilds] = useState(false);
  const [showDeepOfNight, setShowDeepOfNight] = usePersistentBoolean('showDeepOfNight', false);
  const [showUnknownRelics, setShowUnknownRelics] = usePersistentBoolean('showUnknownRelics', false);
  const [showRelicIdToggle, setShowRelicIdToggle] = usePersistentBoolean('showRelicIdToggle', false);
  const [showScoreInfoToggle, setShowScoreInfoToggle] = usePersistentBoolean('showScoreInfoToggle', false);
  const [calculateGuaranteeableRelics, setCalculateGuaranteeableRelics] = usePersistentBoolean('calculateGuaranteeableRelics', false);
  const [baseRelicColorFilters, setBaseRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [deepRelicColorFilters, setDeepRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [effectMap, setEffectMap] = useState(new Map());
  const [showDeepConfirmation, setShowDeepConfirmation] = useState(false);
  const [pendingDeepOfNight, setPendingDeepOfNight] = useState(false);
  const fileInputRef = useRef(null);

  const [primaryColor, setPrimaryColor] = usePersistentState('primaryColor', '#646cff');
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    const newEffectMap = createEffectMap(showDeepOfNight);
    // console.log('Creating effectMap with showDeepOfNight:', showDeepOfNight, 'Size:', newEffectMap.size);
    setEffectMap(newEffectMap);
    setCalculationResult(null);
    setDesiredEffects([]);
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

  const selectAllVesselsForCharacter = (character) => {
    if (!character) return;
    const allVesselNames = vesselData[character].map((c) => c.name);
    setSelectedVessels(allVesselNames);
  }
  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    // select all by default
    selectAllVesselsForCharacter(character);
  };

  const handleClearCharacter = () => {
    setSelectedCharacter(null);
    setSelectedVessels([]);
  };

  const handleVesselToggle = (vesselName) => {
    setSelectedVessels((prevSelected) =>
      prevSelected.includes(vesselName)
        ? prevSelected.filter((name) => name !== vesselName)
        : [...prevSelected, vesselName]
    );
  };

  const handleSelectAllVessels = () => {
    selectAllVesselsForCharacter(selectedCharacter);
  };

  const handleClearAllVessels = () => {
    setSelectedVessels([]);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      if (error.name === 'AbortError') {
        addToast('Save file upload to failed.\nServer is busy', 'error');
      } else {
        console.error('Upload failed:', error);
        addToast('Save file failed to upload.\nUnknown error', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCalculate = () => {
    const startTime = performance.now();
    try {
      const saveData = JSON.parse(localStorage.getItem('saveData'));

      if (!saveData && !calculateGuaranteeableRelics) {
        addToast('Calculation failed.\nMissing save data.', 'error');
        console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - Missing save data`);
        return;
      }
      if (!selectedCharacter) {
        addToast('Calculation failed.\nMissing character selection.', 'error');
        console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - Missing character selection`);
        return;
      }
      if (selectedVessels.length === 0) {
        addToast('Calculation failed.\nMissing vessel selection.', 'error');
        console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - Missing vessel selection`);
        return;
      }
      if (desiredEffects.length === 0) {
        addToast('Calculation failed.\nNo desired effects.', 'error');
        console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - No desired effects`);
        return;
      }

      // find the character data for the selected save name, or create empty data if no save file
      let characterSaveData = null;
      if (saveData && saveData.length > 0) {
        characterSaveData = saveData.find(
          (character) => character.character_name === selectedSaveName
        );
      }

      if (!characterSaveData) {
        if (calculateGuaranteeableRelics) {
          // create empty character data for guaranteeable relics calculation
          characterSaveData = {
            character_name: 'No Save Data',
            relics: []
          };
        } else {
          addToast('No relics found for the selected save name.', 'error');
          console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - No relics found`);
          return;
        }
      }

      let result;
      if (calculateGuaranteeableRelics) {
        result = calculateWithGuaranteeableRelics(
          desiredEffects,
          characterSaveData,
          selectedVessels,
          selectedCharacter,
          effectMap,
          showDeepOfNight,
          vesselData
        );
      } else {
        result = calculateBestRelics(
          desiredEffects,
          characterSaveData,
          selectedVessels,
          selectedCharacter,
          effectMap,
          showDeepOfNight,
          vesselData
        );
      }

      // check if result has the new structure (object with owned/potential)
      const hasNewStructure = result && typeof result === 'object' && 
                              'owned' in result && 'potential' in result;

      if (hasNewStructure && (result.owned.length > 0 || result.potential.length > 0)) {
        const formatResults = (results) => results.map(bestResult => ({
          "vessel name": bestResult.vessel.name,
          "vessel slots": bestResult.vessel.baseSlots,
          "vessel deep slots": bestResult.vessel.deepSlots || [],
          "vessel description": bestResult.vessel.description,
          "score": bestResult.score,
          "relics": bestResult.relics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            score: relic.score,
            effects: relic.effectScores
          })),
          "baseRelics": bestResult.baseRelics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            score: relic.score,
            effects: relic.effectScores
          })),
          "deepRelics": bestResult.deepRelics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            score: relic.score,
            effects: relic.effectScores
          }))
        }));

        const formattedOwned = formatResults(result.owned);
        const formattedPotential = formatResults(result.potential);

        setCalculationResult({
          owned: formattedOwned,
          potential: formattedPotential
        });
        
        console.log('Calculation result:', { owned: formattedOwned, potential: formattedPotential });
        console.log(`Calculation successful - took ${(performance.now() - startTime).toFixed(2)}ms`);

        addToast(
          `Found ${result.owned.length} relic combo${result.owned.length === 1 ? '' : 's'}. ` +
          `${result.potential.length} potential upgrade${result.potential.length === 1 ? '' : 's'} available.`,
          'success'
        );
      } else if (result && result.length > 0) {
        // old structure (array) - use existing logic
        const formattedResults = result.map(bestResult => ({
          "vessel name": bestResult.vessel.name,
          "vessel slots": bestResult.vessel.baseSlots,
          "vessel deep slots": bestResult.vessel.deepSlots || [],
          "vessel description": bestResult.vessel.description,
          "score": bestResult.score,
          "relics": bestResult.relics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            score: relic.score,
            effects: relic.effectScores
          })),
          "baseRelics": bestResult.baseRelics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            score: relic.score,
            effects: relic.effectScores
          })),
          "deepRelics": bestResult.deepRelics.map(relic => ({
            name: relic['relic name'],
            color: relic.color,
            score: relic.score,
            effects: relic.effectScores
          }))
        }));
        setCalculationResult(formattedResults);
        console.log(`Calculation successful - took ${(performance.now() - startTime).toFixed(2)}ms`);
        addToast(`Calculation successful!\n${result.length} relic combo${result.length === 1 ? '' : 's'} found (${result.length === 1 ? 'with' : 'tied for'} max score)`, 'success');
      } else {
        setCalculationResult(null);
        console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - No valid combinations`);
        addToast('No valid relic combination found for the selected criteria.', 'error');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      console.log(`Calculation unsuccessful - took ${(performance.now() - startTime).toFixed(2)}ms - ${error.message}`);
      addToast(`Calculation failed:\n${error.message}`, 'error');
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

  const handleDeepOfNightToggle = () => {
    const newValue = !showDeepOfNight;
    const hasData = calculationResult || desiredEffects.length > 0;
    
    if (hasData) {
      setPendingDeepOfNight(newValue);
      setShowDeepConfirmation(true);
    } else {
      setShowDeepOfNight(newValue);
    }
  };

  const confirmDeepOfNightToggle = () => {
    setShowDeepOfNight(pendingDeepOfNight);
    setShowDeepConfirmation(false);
  };

  const cancelDeepOfNightToggle = () => {
    setShowDeepConfirmation(false);
    setPendingDeepOfNight(false);
  };

  return (
    <div className="app-container">
      <ToastNotification toasts={toasts} />
      <div
        className={showDeepOfNight ? 'floating-checkbox checked' : 'floating-checkbox'}
        onClick={handleDeepOfNightToggle}
      >
        Deep of Night
      </div>

      <button
        className="floating-button"
        title='Settings'
        onClick={() => setShowSettings(prev => !prev)}
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

          <VesselButton
            selectedCharacter={selectedCharacter}
            selectedVessels={selectedVessels}
            onClick={() => setShowVessels(true)}
            vesselData={vesselData}
          />

          <DesiredEffects
            desiredEffects={desiredEffects}
            onChange={setDesiredEffects}
            selectedCharacter={selectedCharacter}
            handleCalculate={handleCalculate}
            setHasSavedBuilds={setHasSavedBuilds}
            showDeepOfNight={showDeepOfNight}
            addToast={addToast}
          />

          <RelicResults
            selectedVessels={selectedVessels}
            calculationResult={calculationResult}
            showDeepOfNight={showDeepOfNight}
            showScoreInfoToggle={showScoreInfoToggle}
          />
        </div>
      </div>

      {showVessels && <VesselPage
        onBack={() => setShowVessels(false)}
        selectedCharacter={selectedCharacter}
        selectedVessels={selectedVessels}
        onVesselToggle={handleVesselToggle}
        onSelectAll={handleSelectAllVessels}
        onClearAll={handleClearAllVessels}
        vesselData={vesselData}
      />}

      {showRelics && <RelicsPage
        onBack={() => setShowRelics(false)}
        selectedSaveName={selectedSaveName}
        onSaveNameSelect={setSelectedSaveName}
        showDeepOfNight={showDeepOfNight}
        showUnknownRelics={showUnknownRelics}
        showRelicIdToggle={showRelicIdToggle}
        baseRelicColorFilters={baseRelicColorFilters}
        deepRelicColorFilters={deepRelicColorFilters}
        onBaseRelicColorFilterChange={handleBaseRelicColorFilterChange}
        onDeepRelicColorFilterChange={handleDeepRelicColorFilterChange}
      />}

      {showSettings && <SettingsPage
        onBack={() => setShowSettings(false)}
        showUnknownRelics={showUnknownRelics}
        setShowUnknownRelics={setShowUnknownRelics}
        showRelicIdToggle={showRelicIdToggle}
        setShowRelicIdToggle={setShowRelicIdToggle}
        showScoreInfoToggle={showScoreInfoToggle}
        setShowScoreInfoToggle={setShowScoreInfoToggle}
        calculateGuaranteeableRelics={calculateGuaranteeableRelics}
        setCalculateGuaranteeableRelics={setCalculateGuaranteeableRelics}
        primaryColor={primaryColor}
        setPrimaryColor={setPrimaryColor}
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

      {showDeepConfirmation && (
        <div className="confirmation-backdrop">
          <div className="confirmation-dialog">
            <p>
              Changing the Deep of Night setting will clear your current desired effects and calculation results.
            </p>
            <div className="confirmation-buttons">
              <button className="confirm-button" onClick={confirmDeepOfNightToggle}>
                Continue
              </button>
              <button className="cancel-button" onClick={cancelDeepOfNightToggle}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;