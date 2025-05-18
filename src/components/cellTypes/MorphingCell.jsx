// src/components/cellTypes/MorphingCell.jsx
import React, { useState, useEffect } from 'react';
import { getDisplayValue } from '../../logic/utils';
import { EMPTY_CELL_VALUE } from '../../logic/constants';
import './MorphingCell.css'; // Import the new CSS

// MorphingCell is very similar to StandardCell, with an animation for value changes.
function MorphingCell({
  row,
  col,
  initialValue,
  userValue,
  solutionValue,
  isSelected,
  isHovered,
  isRowHovered,
  isColHovered,
  isSubgridHovered,
  onClick,
  onMouseEnter,
  onCellContextMenu,
  gridSize,
  isLocked,
  onToggleLock,
  gameState,
  isHinted,
}) {
  const isClue = initialValue !== EMPTY_CELL_VALUE;

  // State for the value that is visually displayed and an animation trigger
  const [displayedValue, setDisplayedValue] = useState(
    isClue ? initialValue : userValue
  );
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const newEffectiveValue = isClue ? initialValue : userValue;

    if (newEffectiveValue !== displayedValue) {
      // Only trigger animation if the value actually changes
      // and it's either a user input or the initial reveal of a clue.
      if (!isClue || (isClue && displayedValue === EMPTY_CELL_VALUE && newEffectiveValue !== EMPTY_CELL_VALUE)) {
         setAnimationKey((prevKey) => prevKey + 1);
      }
      setDisplayedValue(newEffectiveValue);
    } else if (isClue && initialValue !== displayedValue) {
      // This handles cases where a clue might change after initial render (e.g., in an editor)
      // or ensures the initial clue is set correctly if it wasn't empty.
      setDisplayedValue(initialValue);
      // Optionally animate clue changes too: setAnimationKey(prevKey => prevKey + 1);
    }
  }, [userValue, initialValue, isClue, displayedValue, gameState]);


  let mainClass = 'cell morphing-cell'; // Add base 'cell' class for App.css styles + 'morphing-cell'
  let valueSpanClass = ''; // For .value span, e.g., 'incorrect', 'hint'
  let displayContentValue = ''; // The string to display in the span
  let smallHintContent = '';

  // Determine cell content and classes based on state (similar to StandardCell)
  if (isClue) {
    displayContentValue = getDisplayValue(displayedValue, gridSize);
    mainClass += ' clue';
  } else {
    // For non-clues, displayedValue holds the user's input
    if (displayedValue !== EMPTY_CELL_VALUE) {
      displayContentValue = getDisplayValue(displayedValue, gridSize);
      mainClass += ' user-filled';
      // Check correctness based on the actual userValue prop for failed state
      if (gameState === 'Failed' && userValue !== solutionValue) {
        valueSpanClass = 'incorrect';
        smallHintContent = getDisplayValue(solutionValue, gridSize);
      }
    } else if (gameState === 'Failed') {
      // Empty cell, game failed: show solution as hint
      displayContentValue = getDisplayValue(solutionValue, gridSize);
      valueSpanClass = 'hint';
    }
  }

  // Apply selection and hover/highlight classes
  if (isSelected && !isClue) mainClass += ' selected';
  if (isHovered) mainClass += ' hovered-cell';
  if (isRowHovered && !isHovered) mainClass += ' highlight-row';
  if (isColHovered && !isHovered) mainClass += ' highlight-col';
  if (isSubgridHovered && !isHovered) mainClass += ' highlight-subgrid';
  if (isLocked) mainClass += ' locked';
  if (isHinted && !isClue && userValue === EMPTY_CELL_VALUE) {
    mainClass += ' hinted-cell-indicator';
  }

  const subgridSize = Math.sqrt(gridSize);
  if ((col + 1) % subgridSize === 0 && col + 1 !== gridSize) mainClass += ' subgrid-border-right';
  if ((row + 1) % subgridSize === 0 && row + 1 !== gridSize) mainClass += ' subgrid-border-bottom';
  if (row === 0) mainClass += ' first-row-cell';
  if (col === 0) mainClass += ' first-col-cell';

  const cellStyle = {
    borderTop: row === 0 ? 'none' : undefined,
    borderLeft: col === 0 ? 'none' : undefined,
    fontSize: `${(450 / gridSize) * (gridSize === 16 ? 0.45 : 0.5)}px`,
  };

  const handleLockClick = (event) => {
    event.stopPropagation();
    if (onToggleLock) onToggleLock();
  };

  const canShowLock = !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';

  const handleLocalContextMenu = (event) => {
    if (!isClue && gameState === 'Playing' && onCellContextMenu) {
      event.preventDefault();
      onCellContextMenu(event, row, col);
    }
  };
  
  const handleLocalMouseDown = (event) => {
     if (event.button === 2 && !isClue && gameState === 'Playing') {
        // Propagation is handled by onContextMenu preventing default
     }
  };

  return (
    <div
      className={mainClass}
      style={cellStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={handleLocalMouseDown}
      onContextMenu={handleLocalContextMenu}
    >
      <span
        key={animationKey} // This key forces React to re-render the span if animationKey changes
        className={`value ${valueSpanClass} ${
          !isClue && displayedValue !== EMPTY_CELL_VALUE && userValue !== EMPTY_CELL_VALUE // Only animate actual user inputs
            ? 'morph-animate'
            : ''
        }`}
      >
        {displayContentValue}
      </span>
      {smallHintContent && (
        <span className="small-hint">{smallHintContent}</span>
      )}
      {canShowLock && (
        <div
          className={`lock-icon-container ${isLocked ? 'is-active-lock' : 'is-inactive-lock'}`}
          onClick={handleLockClick}
          title={isLocked ? 'Unlock cell value' : 'Lock cell value'}
          role="button"
          tabIndex={0}
        >
          🔒
        </div>
      )}
    </div>
  );
}

export default MorphingCell;