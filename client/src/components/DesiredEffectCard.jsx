import React, { useState } from 'react';
import { StarIcon, ProhibitionIcon, TrashIcon, UpIcon, DownIcon } from './Icons';

const DesiredEffectCard = ({ effect, onUpdate, onDelete, onSort }) => {
    const [weight, setWeight] = useState(effect.weight.toFixed(1));

    const handleWeightChange = (e) => {
        setWeight(e.target.value);
    };

    const handleWeightBlur = () => {
        const newWeight = parseFloat(weight);
        if (!isNaN(newWeight)) {
            onUpdate(effect.id, { ...effect, weight: newWeight });
        } else {
            setWeight(effect.weight.toFixed(1));
        }
        onSort();
    };

    const adjustWeight = (amount) => {
        const currentWeight = parseFloat(weight);
        if (!isNaN(currentWeight)) {
            const newWeight = currentWeight + amount;
            setWeight(newWeight.toFixed(1));
            onUpdate(effect.id, { ...effect, weight: newWeight });
        }
    };

    return (
        <div className="effect-card" onMouseLeave={onSort}>
            <span className={`effect-name ${effect.isDebuff ? 'debuff' : ''}`}>{effect.name}</span>
            <div className="effect-controls">
                <div className="effect-icons">
                    <button
                        className={`icon-button ${effect.isRequired ? 'required' : ''}`}
                        onClick={() => onUpdate(effect.id, { ...effect, isRequired: !effect.isRequired })}
                        title={effect.isRequired ? 'Required' : 'Optional'}
                    >
                        <StarIcon isRequired={effect.isRequired} />
                    </button>
                    <button
                        className={`icon-button ${effect.isForbidden ? 'forbidden' : ''}`}
                        onClick={() => onUpdate(effect.id, { ...effect, isForbidden: !effect.isForbidden })}
                        title={effect.isForbidden ? 'Forbidden' : 'Allowed'}
                    >
                        <ProhibitionIcon />
                    </button>
                    <button className="icon-button" onClick={() => onDelete(effect.id)} title="Delete">
                        <TrashIcon />
                    </button>
                </div>
                <div className="weight-control">
                    <button className="icon-button" onClick={() => adjustWeight(-0.5)}>
                        <DownIcon />
                    </button>
                    <input
                        type="number"
                        value={weight}
                        onChange={handleWeightChange}
                        onBlur={handleWeightBlur}
                        step="0.1"
                    />
                    <button className="icon-button" onClick={() => adjustWeight(0.5)}>
                        <UpIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DesiredEffectCard;