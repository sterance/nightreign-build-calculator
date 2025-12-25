import ColorPicker from "./ColorPicker";
import { CloseIcon } from "./Icons";

const SettingsPage = ({ onBack, userOptions, updateUserOption }) => {
  const {
    showUnknownRelics,
    showRelicIdToggle,
    showScoreInfoToggle,
    calculateGuaranteeableRelics,
    openPopoutInNewTab,
    primaryColor,
  } = userOptions;

  return (
    <div className="settings-page-backdrop">
      <div className="settings-page card">
        <div className='card-header'>
          <button className="corner-button" onClick={onBack}><CloseIcon /></button>
        </div>
        <h2>Settings</h2>
        <div className="settings-body">

          <div className="settings-column left-column">
            <ColorPicker color={primaryColor} setColor={(color) => updateUserOption('primaryColor', color)} />
            
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={openPopoutInNewTab}
                  onChange={() => updateUserOption('openPopoutInNewTab', !openPopoutInNewTab)}
                />
                Open Popout in New Tab
              </label>
            </div>
            
            <div className="settings-option">
              <span>Display Unknown Relics</span>
              <div className="radio-group">
                <label>
                  <input type="radio" checked={showUnknownRelics === 'no'} onChange={() => updateUserOption('showUnknownRelics', 'no')} />
                  No
                </label>
                <label>
                  <input type="radio" checked={showUnknownRelics === 'yes'} onChange={() => updateUserOption('showUnknownRelics', 'yes')} />
                  Yes
                </label>
                <label>
                  <input type="radio" checked={showUnknownRelics === 'only'} onChange={() => updateUserOption('showUnknownRelics', 'only')} />
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
                  onChange={() => updateUserOption('showScoreInfoToggle', !showScoreInfoToggle)}
                />
                Display "Score Info" Toggle Icon
              </label>
            </div>
            
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={showRelicIdToggle}
                  onChange={() => updateUserOption('showRelicIdToggle', !showRelicIdToggle)}
                />
                Display "Relic ID" Toggle Icon
              </label>
            </div>

            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={calculateGuaranteeableRelics}
                  onChange={() => updateUserOption('calculateGuaranteeableRelics', !calculateGuaranteeableRelics)}
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
