// src/components/cellTypes/StandardCell.jsx
import React, { useRef } from 'react';
import { getDisplayValue } from '../../logic/utils';
import { EMPTY_CELL_VALUE } from '../../logic/constants';
// Assuming App.css handles .cell, .standard-cell, and .hinted-cell-indicator styling

function StandardCell({
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
  gridSize,
  isLocked,
  onToggleLock,
  gameState,
  isHinted,
}) {
  const cellRef = useRef(null);
  const subgridSize = Math.sqrt(gridSize);
  const isClue = initialValue !== EMPTY_CELL_VALUE;
  let displayContent = '';
  let mainClass = 'cell standard-cell'; // Base classes
  let valueClass = '';
  let smallHintContent = '';

  if (isClue) {
    displayContent = getDisplayValue(initialValue, gridSize);
    mainClass += ' clue';
  } else if (userValue !== EMPTY_CELL_VALUE) {
    displayContent = getDisplayValue(userValue, gridSize);
    mainClass += ' user-filled';
    if (gameState === 'Failed' && userValue !== solutionValue) {
      valueClass = 'incorrect';
      smallHintContent = getDisplayValue(solutionValue, gridSize);
    }
  } else if (gameState === 'Failed') {
    displayContent = getDisplayValue(solutionValue, gridSize);
    valueClass = 'hint';
  }

  if (isSelected && !isClue) mainClass += ' selected';
  if (isHovered) mainClass += ' hovered-cell';
  if (isRowHovered && !isHovered) mainClass += ' highlight-row';
  if (isColHovered && !isHovered) mainClass += ' highlight-col';
  if (isSubgridHovered && !isHovered) mainClass += ' highlight-subgrid';
  if (isLocked) mainClass += ' locked';

  // Apply hint indicator class if conditions are met
  if (isHinted && !isClue && userValue === EMPTY_CELL_VALUE) {
    mainClass += ' hinted-cell-indicator';
  }

  // Subgrid borders
  if ((col + 1) % subgridSize === 0 && col + 1 !== gridSize) mainClass += ' subgrid-border-right';
  if ((row + 1) % subgridSize === 0 && row + 1 !== gridSize) mainClass += ' subgrid-border-bottom';

  // Edge cell classes for main grid border handling via CSS
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

  const canShowLock = !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';

  const handleCellLeftClick = (event) => {
    if (onClick) { // onClick is App.jsx's handleCellClick
      onClick(row, col, event, cellRef.current);
    }
  };

  return (
    <div
      ref={cellRef}
      className={mainClass}
      style={cellStyle}
      onClick={handleCellLeftClick}
      onMouseEnter={onMouseEnter}
    >
      <span className={`value ${valueClass}`}>{displayContent}</span>
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

export default StandardCell;