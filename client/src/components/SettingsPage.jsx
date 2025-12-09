import ColorPicker from "./ColorPicker";
import { CloseIcon } from "./Icons";

const SettingsPage = ({ onBack,
  showUnknownRelics,
  setShowUnknownRelics,
  showRelicIdToggle,
  setShowRelicIdToggle,
  showScoreInfoToggle,
  setShowScoreInfoToggle,
  calculateGuaranteeableRelics,
  setCalculateGuaranteeableRelics,
  openPopoutInNewTab,
  setOpenPopoutInNewTab,
  primaryColor,
  setPrimaryColor }) => {
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
            
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={openPopoutInNewTab}
                  onChange={() => setOpenPopoutInNewTab(prev => !prev)}
                />
                Open Popout in New Tab
              </label>
            </div>
            
            <div className="settings-option">
              <span>Display Unknown Relics</span>
              <div className="radio-group">
                <label>
                  <input type="radio" checked={showUnknownRelics === 'no'} onChange={() => setShowUnknownRelics('no')} />
                  No
                </label>
                <label>
                  <input type="radio" checked={showUnknownRelics === 'yes'} onChange={() => setShowUnknownRelics('yes')} />
                  Yes
                </label>
                <label>
                  <input type="radio" checked={showUnknownRelics === 'only'} onChange={() => setShowUnknownRelics('only')} />
                  Only
                </label>
              </div>
            </div>
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
                  checked={calculateGuaranteeableRelics}
                  onChange={() => setCalculateGuaranteeableRelics(prev => !prev)}
                />
                Calculate "Guaranteeable" Relics
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default SettingsPage;