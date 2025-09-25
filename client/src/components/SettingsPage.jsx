import ColorPicker from "./ColorPicker";
import { CloseIcon } from "./Icons";

const SettingsPage = ( {onBack} ) => {

  return (
    <div className="settings-page-backdrop">
      <div className="settings-page card">
        <div className='card-header'>
          <button className="corner-button" onClick={onBack}><CloseIcon /></button>
        </div>
        <h2>Settings</h2>
        <ColorPicker />
      </div>
    </div>
  )
};

export default SettingsPage;