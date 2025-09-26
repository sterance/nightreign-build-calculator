import ColorPicker from "./ColorPicker";
import { CloseIcon } from "./Icons";

const SettingsPage = ({ onBack, showUnknownRelics, setShowUnknownRelics }) => {
  return (
    <div className="settings-page-backdrop">
      <div className="settings-page card">
        <div className='card-header'>
          <button className="corner-button" onClick={onBack}><CloseIcon /></button>
        </div>
        <h2>Settings</h2>
        <div className="settings-body">
          <div className="settings-column left-column">
            <ColorPicker />
          </div>
          <div className="settings-column right-column">
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                  checked={showUnknownRelics}
                  onChange={() => setShowUnknownRelics(!showUnknownRelics)}
                />
                Display Unknown Relics
              </label>
            </div>
            <div className="settings-option">
              <label>
                <input
                  type="checkbox"
                />
                Display Score Info
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default SettingsPage;