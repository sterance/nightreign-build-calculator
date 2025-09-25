import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

const SavedBuildsPage = ({ onBack, onLoadBuild }) => {
    const [savedBuilds, setSavedBuilds] = useState({});
    const [editingName, setEditingName] = useState(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        const builds = JSON.parse(localStorage.getItem('savedBuilds') || '{}');
        setSavedBuilds(builds);
    }, []);

    const handleDelete = (buildName) => {
        const updatedBuilds = { ...savedBuilds };
        delete updatedBuilds[buildName];
        setSavedBuilds(updatedBuilds);
        localStorage.setItem('savedBuilds', JSON.stringify(updatedBuilds));
    };

    const handleRename = (oldName) => {
        if (newName && oldName !== newName) {
            const updatedBuilds = { ...savedBuilds };
            updatedBuilds[newName] = updatedBuilds[oldName];
            delete updatedBuilds[oldName];
            setSavedBuilds(updatedBuilds);
            localStorage.setItem('savedBuilds', JSON.stringify(updatedBuilds));
        }
        setEditingName(null);
        setNewName('');
    };

    const handleLoad = (buildName) => {
        onLoadBuild(savedBuilds[buildName]);
        onBack();
    };

    return (
        <div className="saved-builds-backdrop">
            <div className="saved-builds-page card">
                <div className='card-header'>
                    <button className="corner-button" onClick={onBack}><CloseIcon /></button>
                </div>
                <h2>Saved Builds</h2>
                <div className="saved-builds-list">
                    {Object.keys(savedBuilds).map((buildName) => (
                        <div key={buildName} className="saved-build-item">
                            {editingName === buildName ? (
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onBlur={() => handleRename(buildName)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename(buildName)}
                                    autoFocus
                                />
                            ) : (
                                <span>{buildName}</span>
                            )}
                            <div className="build-actions">
                                <button onClick={() => handleLoad(buildName)}>Load</button>
                                <button onClick={() => { setEditingName(buildName); setNewName(buildName); }}>Rename</button>
                                <button onClick={() => handleDelete(buildName)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SavedBuildsPage;