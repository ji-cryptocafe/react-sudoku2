// src/components/StandardCell.jsx 
// (or Cell.jsx if that's your filename for this component)

import React from 'react';
import { getDisplayValue } from '../../logic/utils'; // Adjusted path if utils is in ../logic/
import { EMPTY_CELL_VALUE } from '../../logic/constants'; // Adjusted path

function Cell({ // Component name is Cell as per your previous structure
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
  onCellContextMenu, // Prop from SudokuGrid, expects to be called as: func(event, row, col)
  gridSize,
  isLocked,
  onToggleLock, // Prop from SudokuGrid, expects to be called as: func()
  gameState,
}) {
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

  // Context Menu Handler (Right-click)
  const handleContextMenu = (event) => {
    // Log the component's props and the event's clientX/Y
    console.log(`[StandardCell R${row}C${col}] CONTEXTMENU event. ClientX=${event.clientX}, ClientY=${event.clientY}. Cell's own props: row=${row}, col=${col}`);
    
    if (!isClue && gameState === 'Playing' && onCellContextMenu) {
      event.preventDefault(); // Prevent default browser context menu
      // Call the onCellContextMenu prop passed from SudokuGrid.
      // This prop expects (event, row, col)
      onCellContextMenu(event, row, col); 
    }
  };

  // MouseDown Handler (Optional, ensure it doesn't conflict with onContextMenu for right-clicks)
  const handleMouseDown = (event) => {
    // console.log(`[StandardCell R${row}C${col}] MOUSEDOWN event button=${event.button}`);
    if (
      event.button === 2 && // If it's a right-click
      !isClue &&
      gameState === 'Playing'
      // && onCellContextMenu // No need to call from here if onContextMenu handles it properly
    ) {
      // If onContextMenu is correctly handling the right-click and calling event.preventDefault(),
      // then this mousedown handler might not need to do anything specific for right-click.
      // If there was a desire for mousedown to *also* trigger the context menu logic,
      // it would need to call: onCellContextMenu(event, row, col);
      // but that's usually handled by onContextMenu alone.
      // event.stopPropagation(); // Could be used if this event was causing undesired bubbling.
    }
  };

  return (
    <div
      className={mainClass}
      style={cellStyle}
      onClick={onClick} // Left-click handler from props
      onMouseEnter={onMouseEnter} // Hover handler from props
      onMouseDown={handleMouseDown} // Optional: for other mouse button logic if needed
      onContextMenu={handleContextMenu} // Right-click handler
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
          tabIndex={0} // Make it focusable for accessibility
        >
          🔒
        </div>
      )}
    </div>
  );
}

export default Cell;