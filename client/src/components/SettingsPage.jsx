import ColorPicker from "./ColorPicker";
import { CloseIcon } from "./Icons";

const SettingsPage = ({ onBack, showUnknownRelics, setShowUnknownRelics, showRelicIdToggle, setShowRelicIdToggle, showScoreInfoToggle, setShowScoreInfoToggle, primaryColor, setPrimaryColor }) => {
  return (
    <div className="settings-page-backdrop">
      <div className="settings-page card">
        <div className='card-header'>
          <button className="corner-button" onClick={onBack}><CloseIcon /></button>
        </div>
        <h2>Settings</h2>
        <div className="settings-body">
          <div className="settings-column left-column">
            <ColorPicker color={primaryColor} setColor={setPrimaryColor} />
          </div>
          <div className="settings-column right-column">
          <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={showScoreInfoToggle}
                  onChange={() => setShowScoreInfoToggle(prev => !prev)}
                />
                Display "Score Info" Toggle Icon
              </label>
            </div>
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={showRelicIdToggle}
                  onChange={() => setShowRelicIdToggle(prev => !prev)}
                />
                Display "Relic ID" Toggle Icon
              </label>
            </div>
            
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={showUnknownRelics}
                  onChange={() => setShowUnknownRelics(prev => !prev)}
                />
                Display Unknown Relics
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default SettingsPage;