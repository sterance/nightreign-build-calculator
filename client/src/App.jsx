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
import effects from './data/effects.json';
import SettingsPage from './components/SettingsPage';
import SavedBuildsPage from './components/SavedBuildsPage';
import ToastNotification from './components/ToastNotification';
import { shouldUseDarkText, createEffectMap, capitalize } from './utils/utils';
import { useUserOptions } from './utils/hooks';
import { extractAllRelicsFromSl2 } from './utils/relicExtractor';

const vesselData = nightfarers.nightfarers.reduce((acc, character) => {
  const vesselsKey = `${character}Chalices`;
  const characterVessels = vesselsRaw[vesselsKey] || [];
  acc[character] = [...characterVessels, ...vesselsRaw.genericChalices];
  return acc;
}, {});


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
  const [userOptions, updateUserOption] = useUserOptions();
  const {
    showDeepOfNight,
    showForsakenHollows,
    showUnknownRelics,
    showRelicIdToggle,
    showScoreInfoToggle,
    calculateGuaranteeableRelics,
    openPopoutInNewTab,
    primaryColor,
  } = userOptions;
  const [baseRelicColorFilters, setBaseRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [deepRelicColorFilters, setDeepRelicColorFilters] = useState({ red: true, green: true, blue: true, yellow: true });
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [effectMap, setEffectMap] = useState(new Map());
  const [showDeepConfirmation, setShowDeepConfirmation] = useState(false);
  const [pendingDeepOfNight, setPendingDeepOfNight] = useState(false);
  const [showForsakenConfirmation, setShowForsakenConfirmation] = useState(false);
  const [pendingForsakenHollows, setPendingForsakenHollows] = useState(false);
  const [pendingBuildLoad, setPendingBuildLoad] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const pendingBuildEffectsRef = useRef(null);

  const toggleCard = (cardName) => {
    setExpandedCard(prev => prev === cardName ? null : cardName);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    const textColor = shouldUseDarkText(primaryColor) ? '#000000' : 'rgba(255, 255, 255, 0.87)';
    document.documentElement.style.setProperty('--primary-text-color', textColor);
  }, [primaryColor]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./workers/calculator.worker.js', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (event) => {
      const { success, result, error } = event.data;

      if (success) {
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
              id: relic['relic id'],
              name: relic['relic name'],
              color: relic.color,
              score: relic.score,
              effects: relic.vesselEffectScores || relic.effectScores
            })),
            "baseRelics": bestResult.baseRelics.map(relic => ({
              id: relic['relic id'],
              name: relic['relic name'],
              color: relic.color,
              score: relic.score,
              effects: relic.vesselEffectScores || relic.effectScores
            })),
            "deepRelics": bestResult.deepRelics.map(relic => ({
              id: relic['relic id'],
              name: relic['relic name'],
              color: relic.color,
              score: relic.score,
              effects: relic.vesselEffectScores || relic.effectScores
            }))
          }));

          const formattedOwned = formatResults(result.owned);
          const formattedPotential = formatResults(result.potential);
          // suppress zero-score owned results
          const filteredOwned = formattedOwned.filter(r => (typeof r.score === 'number') ? r.score > 0 : true);

          const nextValue = {
            owned: filteredOwned,
            potential: formattedPotential
          };
          setCalculationResult(nextValue);
          // toast when showing potential upgrades
          addToast(
            `Found ${filteredOwned.length} relic combo${filteredOwned.length === 1 ? '' : 's'} from save file.\n` +
            `${result.potential.length} potential upgrade${result.potential.length === 1 ? '' : 's'} available.`,
            'success'
          );
        } else if (result && result.length > 0) {
          const formattedResults = result.map(bestResult => ({
            "vessel name": bestResult.vessel.name,
            "vessel slots": bestResult.vessel.baseSlots,
            "vessel deep slots": bestResult.vessel.deepSlots || [],
            "vessel description": bestResult.vessel.description,
            "score": bestResult.score,
            "relics": bestResult.relics.map(relic => ({
              id: relic['relic id'],
              name: relic['relic name'],
              color: relic.color,
              score: relic.score,
              effects: relic.vesselEffectScores || relic.effectScores
            })),
            "baseRelics": bestResult.baseRelics.map(relic => ({
              id: relic['relic id'],
              name: relic['relic name'],
              color: relic.color,
              score: relic.score,
              effects: relic.vesselEffectScores || relic.effectScores
            })),
            "deepRelics": bestResult.deepRelics.map(relic => ({
              id: relic['relic id'],
              name: relic['relic name'],
              color: relic.color,
              score: relic.score,
              effects: relic.vesselEffectScores || relic.effectScores
            }))
          }));
          setCalculationResult(formattedResults);
          // toast when showing owned relics only
          addToast(`Calculation successful!\n${result.length} relic combo${result.length === 1 ? '' : 's'} found (${result.length === 1 ? 'with' : 'tied for'} max score)`, 'success');
        } else {
          setCalculationResult(null);
          addToast('No valid relic combination found for the selected criteria.', 'error');
        }
      } else {
        console.error('Calculation error from worker:', error);
        addToast(`Calculation failed:\n${error}`, 'error');
        setCalculationResult(null);
      }

      setIsCalculating(false);
      console.log('Worker calculation and state update finished.');
    };

    workerRef.current.onerror = (err) => {
      console.error("Worker instantiation error:", err);
      addToast('Failed to start calculation worker.', 'error');
      setIsCalculating(false);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    const newEffectMap = createEffectMap(showForsakenHollows, effects);
    setEffectMap(newEffectMap);
    setCalculationResult(null);
    setExpandedCard(prev => prev === 'relics' ? null : prev);
    if (pendingBuildEffectsRef.current) {
      setDesiredEffects(pendingBuildEffectsRef.current);
      pendingBuildEffectsRef.current = null;
    } else {
      setDesiredEffects([]);
    }
  }, [showForsakenHollows]);

  useEffect(() => {
    // check for existing relic data on initial load
    const storedData = localStorage.getItem('saveData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.length > 0) {
          setHasRelicData(true);
          // pre-select default: single entry -> that entry; otherwise choose most-populated if none set
          if (parsedData.length === 1) {
            setSelectedSaveName(parsedData[0].character_name);
            localStorage.setItem('selectedRelicsCharacter', parsedData[0].character_name);
          } else if (!selectedSaveName) {
            const mostRelics = parsedData
              .map(c => ({ name: c.character_name, count: Array.isArray(c.relics) ? c.relics.length : 0 }))
              .sort((a, b) => b.count - a.count)[0];
            if (mostRelics) {
              setSelectedSaveName(mostRelics.name);
              localStorage.setItem('selectedRelicsCharacter', mostRelics.name);
            }
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
    const allVesselNames = vesselData[character]
      .filter(v => showForsakenHollows || !v.forsaken)
      .map(c => c.name);
    setSelectedVessels(allVesselNames);
  }
  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    // select all vessels by default
    selectAllVesselsForCharacter(character);
  };

  const handleClearCharacter = () => {
    setSelectedCharacter(null);
    setSelectedVessels([]);
    if (expandedCard === 'vessels') {
      setExpandedCard(null);
    }
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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = await extractAllRelicsFromSl2(arrayBuffer);
      if (data && data.length > 0) {
        localStorage.setItem('saveData', JSON.stringify(data));
        setHasRelicData(true);
        addToast('Save file uploaded successfully!', 'success');
        // default to the character with the most relics upon upload
        const mostRelicsEntry = data
          .map(c => ({ name: c.character_name, count: Array.isArray(c.relics) ? c.relics.length : 0 }))
          .sort((a, b) => b.count - a.count)[0];
        setSelectedSaveName(mostRelicsEntry ? mostRelicsEntry.name : null);
        if (mostRelicsEntry && mostRelicsEntry.name) {
          localStorage.setItem('selectedRelicsCharacter', mostRelicsEntry.name);
        }
      } else {
        addToast('Relic information not found in save file.', 'error');
      }
    } catch (error) {
      console.error('local parse failed:', error);
      addToast('save file failed to parse. unknown error', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCalculate = () => {
    const saveData = JSON.parse(localStorage.getItem('saveData'));

    if (!saveData && !calculateGuaranteeableRelics) {
      addToast('Calculation failed.\nMissing save data.', 'error');
      return;
    }
    if (!selectedCharacter) {
      addToast('Calculation failed.\nMissing character selection.', 'error');
      return;
    }
    if (selectedVessels.length === 0) {
      addToast('Calculation failed.\nMissing vessel selection.', 'error');
      return;
    }
    if (desiredEffects.length === 0) {
      addToast('Calculation failed.\nNo desired effects.', 'error');
      return;
    }

    let characterSaveData = null;
    if (saveData && saveData.length > 0) {
      characterSaveData = saveData.find(
        (character) => character.character_name === selectedSaveName
      );
    }

    if (!characterSaveData) {
      if (calculateGuaranteeableRelics) {
        characterSaveData = {
          character_name: 'No Save Data',
          relics: []
        };
      } else {
        addToast('No relics found for the selected save name.', 'error');
        return;
      }
    }

    setExpandedCard('relics');
    setIsCalculating(true);
    setCalculationResult(null);

    const effectMapArray = Array.from(effectMap.entries());

    workerRef.current.postMessage({
      desiredEffects,
      characterRelicData: characterSaveData,
      selectedVessels,
      selectedNightfarer: selectedCharacter,
      effectMap: effectMapArray,
      showDeepOfNight,
      showForsakenHollows,
      vesselData,
      calculateGuaranteeable: calculateGuaranteeableRelics,
    });
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

  const handleLoadBuild = (buildData) => {
    const needsModeSwitch = buildData.isDeepOfNight !== showDeepOfNight;
    const hasData = calculationResult || desiredEffects.length > 0;

    if (needsModeSwitch && hasData) {
      setPendingDeepOfNight(buildData.isDeepOfNight);
      setPendingBuildLoad(buildData);
      setShowDeepConfirmation(true);
    } else if (needsModeSwitch) {
      pendingBuildEffectsRef.current = buildData.effects;
      updateUserOption('showDeepOfNight', buildData.isDeepOfNight);
    } else {
      setDesiredEffects(buildData.effects);
    }
  };

  // DEEP OF NIGHT TOGGLE
  const applyDeepOfNightToggle = (newValue) => {
    if (pendingBuildLoad) {
      pendingBuildEffectsRef.current = pendingBuildLoad.effects;
      setPendingBuildLoad(null);
    }
    updateUserOption('showDeepOfNight', newValue);
  };

  const handleDeepOfNightToggle = () => {
    const newValue = !showDeepOfNight;
    const hasData = calculationResult || desiredEffects.length > 0;

    if (hasData) {
      setPendingDeepOfNight(newValue);
      setShowDeepConfirmation(true);
    } else {
      applyDeepOfNightToggle(newValue);
    }
  };

  const confirmDeepOfNightToggle = () => {
    setShowDeepConfirmation(false);
    applyDeepOfNightToggle(pendingDeepOfNight);
  };

  const cancelDeepOfNightToggle = () => {
    setShowDeepConfirmation(false);
    setPendingDeepOfNight(false);
    setPendingBuildLoad(null);
  };
  
  // FORSAKEN HOLLOWS TOGGLE
  const applyForsakenHollowsToggle = (newValue) => {
    updateUserOption('showForsakenHollows', newValue);
    handleClearCharacter();
  };

  const handleForsakenHollowsToggle = () => {
    const newValue = !showForsakenHollows;
    const hasData = calculationResult || desiredEffects.length > 0;

    if (hasData) {
      setPendingForsakenHollows(newValue);
      setShowForsakenConfirmation(true);
    } else {
      applyForsakenHollowsToggle(newValue);
    }
  };

  const confirmForsakenHollowsToggle = () => {
    setShowForsakenConfirmation(false);
    applyForsakenHollowsToggle(pendingForsakenHollows);
  };

  const cancelForsakenHollowsToggle = () => {
    setShowForsakenConfirmation(false);
    setPendingForsakenHollows(false);
  };

  const isVesselsEnabled = !!selectedCharacter;
  const hasRelicResults = !!calculationResult;

  return (
    <div className="app-container">
      <ToastNotification toasts={toasts} />
      <div className="top-controls-bar">
        <div
          className={showDeepOfNight ? 'floating-checkbox checked' : 'floating-checkbox'}
          onClick={handleDeepOfNightToggle}
        >
          Deep of Night
        </div>

        <div
          className={showForsakenHollows ? 'floating-checkbox checked' : 'floating-checkbox'}
          onClick={handleForsakenHollowsToggle}
        >
          Forsaken Hollows
        </div>
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
          <div className={`collapsible-card ${expandedCard === 'nightfarer' ? 'expanded' : ''}`}>
            <div className="collapsible-header" onClick={() => toggleCard('nightfarer')}>
              <span>Nightfarer</span>
              <div className="collapsible-header-right">
                <span id='selected-nightfarer-name'>{selectedCharacter ? capitalize(selectedCharacter) : '(None)'}</span>
                <span className="collapse-indicator">▼</span>
              </div>
            </div>
            <div className="collapsible-content">
              <CharacterSelection
                selectedCharacter={selectedCharacter}
                onCharacterSelect={handleCharacterSelect}
                onClear={handleClearCharacter}
                showForsakenHollows={showForsakenHollows}
              />
            </div>
          </div>

          <div className={`collapsible-card ${expandedCard === 'vessels' ? 'expanded' : ''} ${!isVesselsEnabled ? 'disabled' : ''}`}>
            <div className="collapsible-header" onClick={() => isVesselsEnabled && toggleCard('vessels')}>
              <span>Vessels</span>
              <div className="collapsible-header-right">
                <span id='selected-vessel-count'> {selectedVessels.length === 0 ? '(None)' : (selectedVessels.length === 8 && !showForsakenHollows) || (selectedVessels.length === 11 && showForsakenHollows) ? '(All)' : '(Some)'} </span>
                <span className="collapse-indicator">▼</span>
              </div>
            </div>
            <div className="collapsible-content">
              <VesselButton
                selectedCharacter={selectedCharacter}
                selectedVessels={selectedVessels}
                onClick={() => setShowVessels(true)}
                vesselData={vesselData}
                showDeepOfNight={showDeepOfNight}
                showForsakenHollows={showForsakenHollows}
              />
              <div className="portrait-vessel-selection">
                <VesselPage
                  onBack={() => { }}
                  selectedCharacter={selectedCharacter}
                  selectedVessels={selectedVessels}
                  onVesselToggle={handleVesselToggle}
                  onSelectAll={handleSelectAllVessels}
                  onClearAll={handleClearAllVessels}
                  vesselData={vesselData}
                  showDeepOfNight={showDeepOfNight}
                  showForsakenHollows={showForsakenHollows}
                  isInline={true}
                />
              </div>
            </div>
          </div>

          <div className={`collapsible-card ${expandedCard === 'desired-effects' ? 'expanded' : ''}`}>
            <div className="collapsible-header" onClick={() => toggleCard('desired-effects')}>
              <span>Desired Effects</span>
              <span className="collapse-indicator">▼</span>
            </div>
            <div className="collapsible-content">
              <DesiredEffects
                desiredEffects={desiredEffects}
                onChange={setDesiredEffects}
                selectedCharacter={selectedCharacter}
                selectedVessels={selectedVessels}
                handleCalculate={handleCalculate}
                setHasSavedBuilds={setHasSavedBuilds}
                showDeepOfNight={showDeepOfNight}
                showForsakenHollows={showForsakenHollows}
                addToast={addToast}
                isCalculating={isCalculating}
              />
            </div>
          </div>

          <div className={`collapsible-card ${expandedCard === 'relics' ? 'expanded' : ''} ${!hasRelicResults ? 'disabled' : ''}`}>
            <div className="collapsible-header" onClick={() => hasRelicResults && toggleCard('relics')}>
              <span>Recommended Relics</span>
              <span className="collapse-indicator">▼</span>
            </div>
            <div className="collapsible-content">
              <RelicResults
                selectedVessels={selectedVessels}
                calculationResult={calculationResult}
                userOptions={userOptions}
              />
            </div>
          </div>
          <div className="bottom-bar-spacer"></div>
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
        showDeepOfNight={showDeepOfNight}
        showForsakenHollows={showForsakenHollows}
      />}

      {showRelics && <RelicsPage
        onBack={() => setShowRelics(false)}
        selectedSaveName={selectedSaveName}
        onSaveNameSelect={setSelectedSaveName}
        userOptions={userOptions}
        baseRelicColorFilters={baseRelicColorFilters}
        deepRelicColorFilters={deepRelicColorFilters}
        onBaseRelicColorFilterChange={handleBaseRelicColorFilterChange}
        onDeepRelicColorFilterChange={handleDeepRelicColorFilterChange}
      />}

      {showSettings && <SettingsPage
        onBack={() => setShowSettings(false)}
        userOptions={userOptions}
        updateUserOption={updateUserOption}
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
                <p className="tooltip-sub-text"><span className='code-inline'>.sl2</span> file, found at <span className='code-inline'>C:\Users\[username]\AppData\Roaming\Nightreign\[user-id]</span> on Windows</p>
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

      {showForsakenConfirmation && (
        <div className="confirmation-backdrop">
          <div className="confirmation-dialog">
            <p>
              Changing the Forsaken Hollows setting will clear your current desired effects and calculation results.
            </p>
            <div className="confirmation-buttons">
              <button className="confirm-button" onClick={confirmForsakenHollowsToggle}>
                Continue
              </button>
              <button className="cancel-button" onClick={cancelForsakenHollowsToggle}>
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