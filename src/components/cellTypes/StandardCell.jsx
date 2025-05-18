// src/components/StandardCell.jsx 
// (or Cell.jsx if that's your filename for this component)

import React, { useRef } from 'react'; // Added useRef
import { getDisplayValue } from '../../logic/utils'; // Adjusted path if utils is in ../logic/
import { EMPTY_CELL_VALUE } from '../../logic/constants'; // Adjusted path

function StandardCell({ // Component name is Cell as per your previous structure
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
  // onCellContextMenu, // Prop from SudokuGrid, expects to be called as: func(event, row, col)
  gridSize,
  isLocked,
  onToggleLock, // Prop from SudokuGrid, expects to be called as: func()
  gameState,
  isHinted,
}) {
  const cellRef = useRef(null); // Ref to get cell's DOM element for positioning
  const subgridSize = Math.sqrt(gridSize);
  const isClue = initialValue !== EMPTY_CELL_VALUE;
  let displayContent = '';
  let mainClass = 'cell'; // Base class from App.css for standard cells
  let valueClass = ''; // For .value span, e.g., 'incorrect', 'hint'
  let smallHintContent = '';

  // Determine cell content and classes based on state
  if (isClue) {
    displayContent = getDisplayValue(initialValue, gridSize);
    mainClass += ' clue';
  } else if (userValue !== EMPTY_CELL_VALUE) {
    displayContent = getDisplayValue(userValue, gridSize);
    mainClass += ' user-filled'; // For user-filled number color
    if (gameState === 'Failed' && userValue !== solutionValue) {
      valueClass = 'incorrect'; // Style for incorrect user value
      smallHintContent = getDisplayValue(solutionValue, gridSize); // Show solution as small hint
    }
  } else if (gameState === 'Failed') { // Empty cell and game failed, show hint
    displayContent = getDisplayValue(solutionValue, gridSize);
    valueClass = 'hint'; // Style for hint (solution shown)
  }

  // Apply selection and hover/highlight classes
  if (isSelected && !isClue) mainClass += ' selected';
  if (isHovered) mainClass += ' hovered-cell'; // Direct hover

  // Highlight related cells (if not the directly hovered one)
  if (isRowHovered && !isHovered) mainClass += ' highlight-row';
  if (isColHovered && !isHovered) mainClass += ' highlight-col';
  if (isSubgridHovered && !isHovered) mainClass += ' highlight-subgrid';

  if (isLocked) {
    mainClass += ' locked'; // Style for locked cell
  }

  // Add classes for subgrid borders (from App.css)
  if ((col + 1) % subgridSize === 0 && col + 1 !== gridSize) {
    mainClass += ' subgrid-border-right';
  }
  if ((row + 1) % subgridSize === 0 && row + 1 !== gridSize) {
    mainClass += ' subgrid-border-bottom';
  }

  // Classes for cells on the main grid edge (used for border styling in App.css)
  if (row === 0) {
    mainClass += ' first-row-cell';
  }
  if (col === 0) {
    mainClass += ' first-col-cell';
  }

  // Inline styles: font size, and removing top/left border for edge cells
  // (relying on SudokuGrid container's border)
  const cellStyle = {
    borderTop: row === 0 ? 'none' : undefined,
    borderLeft: col === 0 ? 'none' : undefined,
  };
  const fontSizeBase = 450 / gridSize; // Assuming SudokuGrid is 450px
  cellStyle.fontSize = `${fontSizeBase * (gridSize === 16 ? 0.45 : 0.5)}px`;
  // Note: App.css might also set font-size for .cell, ensure consistency or override

  const handleLockClick = (event) => {
    event.stopPropagation(); // Prevent cell click event
    if (onToggleLock) {
      onToggleLock(); // Call the passed function (which has r,c bound in SudokuGrid)
    }
  };

  const canShowLock =
    !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';

    const handleCellLeftClick = (event) => {
      if (onClick) { // onClick is App.jsx's handleCellClick
        onClick(row, col, event, cellRef.current); // Pass row, col, event, and cell's DOM element
      }
    };
  
    return (
      <div
        ref={cellRef} // Attach ref
        className={mainClass}
        style={cellStyle}
        onClick={handleCellLeftClick} // Use the new handler for left click
        onMouseEnter={onMouseEnter}
        // onMouseDown: removed if it was only for right-click menu
        // onContextMenu: removed as per requirement
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