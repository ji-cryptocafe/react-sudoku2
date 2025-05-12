// src/components/cellTypes/StandardCell.jsx
import React from 'react';
import { getDisplayValue } from '../../logic/utils'; // Adjusted path
import { EMPTY_CELL_VALUE } from '../../logic/constants'; // Adjusted path

// Renamed function from Cell to StandardCell
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
  onCellContextMenu,
  gridSize,
  isLocked,
  onToggleLock,
  gameState,
}) {
  const subgridSize = Math.sqrt(gridSize);
  const isClue = initialValue !== EMPTY_CELL_VALUE;
  let displayContent = '';
  let mainClass = 'cell'; // Keep 'cell' class for base styling
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

  if (isLocked) {
    mainClass += ' locked';
  }

  if ((col + 1) % subgridSize === 0 && col + 1 !== gridSize) {
    mainClass += ' subgrid-border-right';
  }
  if ((row + 1) % subgridSize === 0 && row + 1 !== gridSize) {
    mainClass += ' subgrid-border-bottom';
  }
  if (row === 0) {
    mainClass += ' first-row-cell';
  }
  if (col === 0) {
    mainClass += ' first-col-cell';
  }

  const cellStyle = {
    borderTop: row === 0 ? 'none' : undefined,
    borderLeft: col === 0 ? 'none' : undefined,
  };

  const handleLockClick = (event) => {
    event.stopPropagation();
    if (onToggleLock) {
      onToggleLock();
    }
  };

  const canShowLock =
    !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';

  const fontSizeBase = 450 / gridSize;
  cellStyle.fontSize = `${fontSizeBase * (gridSize === 16 ? 0.45 : 0.5)}px`;

  const handleContextMenu = (event) => {
    if (!isClue && gameState === 'Playing' && onCellContextMenu) {
      event.preventDefault();
      onCellContextMenu(event.clientX, event.clientY, row, col);
    }
  };

  const handleMouseDown = (event) => {
    if (
      event.button === 2 &&
      !isClue &&
      gameState === 'Playing' &&
      onCellContextMenu
    ) {
      event.stopPropagation();
    }
  };

  return (
    <div
      className={mainClass}
      style={cellStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <span className={`value ${valueClass}`}>{displayContent}</span>
      {smallHintContent && (
        <span className="small-hint">{smallHintContent}</span>
      )}
      {canShowLock && (
        <div
          className={`lock-icon-container ${
            isLocked ? 'is-active-lock' : 'is-inactive-lock'
          }`}
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

export default StandardCell; // Update export name