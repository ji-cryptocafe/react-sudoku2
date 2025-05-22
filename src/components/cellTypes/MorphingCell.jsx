// src/components/cellTypes/MorphingCell.jsx
import React, { useState, useEffect, useRef as useReactRef } from 'react'; // Renamed useRef to avoid conflict if cell needs its own internal ref
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
  // --- NEW PROPS for Corner Notes ---
  cornerMarkValue,          // The value for the corner note (0-15 or EMPTY_CELL_VALUE)
  // isCornerNoteModeActive, // Cell doesn't directly use this; visibility logic is based on other factors
  onCornerNoteBoxClick,     // (row, col, event, cornerBoxElement) => void
  onCornerNoteRightClick,   // (row, col, event) => void
}) {
  const cellDOMRef = useReactRef(null); // Ref for the main cell div
  const cornerBoxRef = useReactRef(null); // Ref for the corner box div

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
  if (isLocked) mainClass += ' locked'; // Corner note should not show if locked
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
    fontSize: `${(450 / gridSize) * (gridSize === 16 ? 0.6 : 0.7)}px`,
  };

  const handleLockClick = (event) => {
    event.stopPropagation();
    if (onToggleLock) onToggleLock();
  };

  const handleMainCellLeftClick = (event) => {
    // If corner note mode is active, a click on the main cell might do nothing,
    // or it might still select the cell for regular input, or toggle corner note mode off.
    // For now, let's assume main cell click still works as usual for opening menu for main value.
    // App.jsx's isCornerNoteModeActive might influence what handleCellClick does.
    // Current App.jsx handleCellClick will open menu for 'main' context.
    if (onClick) {
        onClick(row, col, event, cellDOMRef.current);
    }
  };

  const handleMainCellLockClick = (event) => {
    event.stopPropagation(); // Prevent main cell click
    if (onToggleLock) onToggleLock(); // This will call App's handleToggleLockCell
  };

  const canShowLock = !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';
// --- Corner Note Logic ---
  const showCornerNoteIndicator = !isClue && !isLocked && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';
  const hasCornerMark = cornerMarkValue !== EMPTY_CELL_VALUE;

  const handleInternalCornerBoxClick = (event) => {
    // Call the prop passed from App.jsx, which knows how to open the menu for 'corner' context
    if (onCornerNoteBoxClick) {
      onCornerNoteBoxClick(row, col, event, cornerBoxRef.current);
    }
  };

  const handleInternalCornerNoteRightClick = (event) => {
    // Call the prop passed from App.jsx to clear the corner note
    if (onCornerNoteRightClick) {
      onCornerNoteRightClick(row, col, event);
    }
  };
   

  return (
    <div
      ref={cellDOMRef}
      className={mainClass}
      style={cellStyle}
      onClick={handleMainCellLeftClick}
      onMouseEnter={onMouseEnter}
    >
      {/* Corner Note Display & Interaction Area */}
      {showCornerNoteIndicator && (
        <div
          ref={cornerBoxRef}
          className={`corner-note-box ${hasCornerMark ? 'has-value' : ''}`}
          onClick={handleInternalCornerBoxClick} // Left-click to open menu for corner note
          onContextMenu={handleInternalCornerNoteRightClick} // Right-click to clear corner note
          title={
            hasCornerMark 
            ? `Corner note: ${getDisplayValue(cornerMarkValue, gridSize)}. Click to change, Right-click to clear.`
            : "Click to set corner note."
          }
        >
          {hasCornerMark && (
            <span className="corner-note-value">
              {getDisplayValue(cornerMarkValue, gridSize)}
            </span>
          )}
        </div>
      )}

      {/* Main Value Display */}
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

      {/* Lock Icon */}
      {canShowLock && (
        <div
          className={`lock-icon-container ${isLocked ? 'is-active-lock' : 'is-inactive-lock'}`}
          onClick={handleMainCellLockClick}
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