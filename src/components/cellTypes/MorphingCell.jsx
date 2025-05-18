// src/components/cellTypes/MorphingCell.jsx
import React, { useState, useEffect } from 'react';
import { getDisplayValue } from '../../logic/utils';
import { EMPTY_CELL_VALUE } from '../../logic/constants';
import './MorphingCell.css';

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
  onClick, // This prop will now be used to open the context menu
  onMouseEnter,
  // onCellContextMenu, // REMOVED - No longer using native context menu for this cell type
  gridSize,
  isLocked,
  onToggleLock,
  gameState,
  isHinted,
  // NEW PROP to identify cell type if App.jsx needs it for click logic
  // cellType, // Optional, can be added if App.jsx needs to differentiate
}) {
  const isClue = initialValue !== EMPTY_CELL_VALUE;
  const [displayedValue, setDisplayedValue] = useState(
    isClue ? initialValue : userValue
  );
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const newEffectiveValue = isClue ? initialValue : userValue;
    if (newEffectiveValue !== displayedValue) {
      if (!isClue || (isClue && displayedValue === EMPTY_CELL_VALUE && newEffectiveValue !== EMPTY_CELL_VALUE)) {
         setAnimationKey((prevKey) => prevKey + 1);
      }
      setDisplayedValue(newEffectiveValue);
    } else if (isClue && initialValue !== displayedValue) {
      setDisplayedValue(initialValue);
    }
  }, [userValue, initialValue, isClue, displayedValue, gameState]);

  let mainClass = 'cell morphing-cell';
  let valueSpanClass = '';
  let displayContentValue = '';
  let smallHintContent = '';

  if (isClue) {
    displayContentValue = getDisplayValue(displayedValue, gridSize);
    mainClass += ' clue';
  } else {
    if (displayedValue !== EMPTY_CELL_VALUE) {
      displayContentValue = getDisplayValue(displayedValue, gridSize);
      mainClass += ' user-filled';
      if (gameState === 'Failed' && userValue !== solutionValue) {
        valueSpanClass = 'incorrect';
        smallHintContent = getDisplayValue(solutionValue, gridSize);
      }
    } else if (gameState === 'Failed') {
      displayContentValue = getDisplayValue(solutionValue, gridSize);
      valueSpanClass = 'hint';
    }
  }

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

  // The onClick prop is now directly used from SudokuGrid, which calls App's handleCellClick
  // No local onContextMenu or onMouseDown specific to opening the menu here.
  
  const cellRef = React.useRef(null); // Ref to get cell's position

  const handleCellLeftClick = (event) => {
    if (onClick) { // onClick is App.jsx's handleCellClick
        // Pass the event to get clientX/Y for initial menu open,
        // or pass the cell's ref for centering. Let's use event for now.
        onClick(row, col, event, cellRef.current); // Pass row, col, and event, and the ref
    }
  };


  return (
    <div
      ref={cellRef} // Attach ref here
      className={mainClass}
      style={cellStyle}
      onClick={handleCellLeftClick} // Use the new handler
      onMouseEnter={onMouseEnter}
      // onMouseDown: If needed for other purposes, but not for opening the menu.
      // onContextMenu: Removed for MorphingCell as per requirement.
    >
      <span
        key={animationKey}
        className={`value ${valueSpanClass} ${
          !isClue && displayedValue !== EMPTY_CELL_VALUE && userValue !== EMPTY_CELL_VALUE
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