import React, { useState, useEffect, useRef } from 'react';

const NameSaveCard = ({ onSave, onCancel }) => {
    const [buildName, setBuildName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSave = () => {
        if (buildName.trim()) {
            onSave(buildName);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="save-build-overlay">
            <div className="save-build-card card">
                <h2>Save Build</h2>
                <input
                    ref={inputRef}
                    type="text"
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter build name"
                />
                <div className="save-build-buttons">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NameSaveCard;