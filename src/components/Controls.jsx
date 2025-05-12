// src/components/Controls.jsx
import React from 'react';
// GRID_SIZES and DIFFICULTIES constants are no longer needed here

function Controls({ onNewGame, onCheckSolution, isGamePlaying }) {
  return (
    <>
      <button className="glossy-button" onClick={onNewGame}>
        New Game
      </button>
      <button
        className="glossy-button"
        onClick={onCheckSolution}
        disabled={!isGamePlaying}
      >
        Check Solution
      </button>
    </>
  );
}

export default Controls;
