import React, { useState } from 'react';
import { GRID_SIZES, DIFFICULTIES } from '../logic/constants';
import './NewGameModal.css';

function NewGameModal({
  isOpen,
  onClose,
  currentGridSize,
  currentDifficulty,
  onStartNewGame,
}) {
  const [selectedSize, setSelectedSize] = useState(currentGridSize);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState(currentDifficulty);

  if (!isOpen) {
    return null;
  }

  const handleGo = () => {
    onStartNewGame(selectedSize, selectedDifficulty);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {' '}
      {/* Close on backdrop click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {' '}
        {/* Prevent closing when clicking content */}
        <h2>Start New Game</h2>
        <div className="modal-controls">
          <label htmlFor="grid-size-select">Size:</label>
          <select
            id="grid-size-select"
            className="glossy-select"
            value={selectedSize}
            onChange={(e) => setSelectedSize(Number(e.target.value))}
          >
            <option value={GRID_SIZES.S4}>4x4</option>
            <option value={GRID_SIZES.S9}>9x9</option>
            <option value={GRID_SIZES.S16}>16x16 Hex</option>
          </select>

          <label htmlFor="difficulty-select">Difficulty:</label>
          <select
            id="difficulty-select"
            className="glossy-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            {Object.values(DIFFICULTIES).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="glossy-button go" onClick={handleGo}>
            GO
          </button>
          <button className="glossy-button cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewGameModal;
