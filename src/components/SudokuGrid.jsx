// src/components/SudokuGrid.jsx
import React from 'react';
import { cellComponentMap, DefaultCellComponent } from './cellTypes/cellComponentMap';
import { EMPTY_CELL_VALUE } from '../logic/constants'; // Make sure this is imported

function SudokuGrid({
  gridSize,
  initialCluesBoard,
  userBoard,
  solutionBoard,
  cellTypesBoard,
  selectedCell,
  hoveredCell,
  setHoveredCell,
  onCellClick, // For main cell clicks
  gameState,
  lockedCells,
  onToggleLock, // This is App's handleToggleLockCell
  hintedCells,
  cellContextMenuVisible, // For hover highlight fix
  cellContextMenuRow,     // For hover highlight fix
  cellContextMenuCol,     // For hover highlight fix

  // --- Props for Candidate Marks ---
  candidateMarks,           // Object: { "row-col": [val1, val2,...] }
  isCandidateModeActive,    // boolean
  // --- END Props for Candidate Marks ---
  
  // Props that are no longer needed for the new candidate feature:
  // cornerMarks, (replaced by candidateMarks)
  // onCornerNoteBoxClick, (candidate setting is via main cell click + context menu)
  // onCornerNoteRightClick, (candidate clearing is via main cell click + context menu)
}) {
  if (
    !initialCluesBoard || initialCluesBoard.length !== gridSize ||
    !userBoard || userBoard.length !== gridSize ||
    !solutionBoard || solutionBoard.length !== gridSize ||
    !cellTypesBoard || cellTypesBoard.length !== gridSize
  ) {
    return <p>Initializing grid data...</p>;
  }

  const subgridSize = Math.sqrt(gridSize);
  const cells = [];

  const highlightTarget = (cellContextMenuVisible && cellContextMenuRow !== null && cellContextMenuCol !== null)
    ? { row: cellContextMenuRow, col: cellContextMenuCol }
    : hoveredCell;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const initialVal = initialCluesBoard[r]?.[c];
      const userVal = userBoard[r]?.[c];
      const solutionVal = solutionBoard[r]?.[c];
      const cellType = cellTypesBoard[r]?.[c] || 'standard';
      const CellComponentToRender = cellComponentMap[cellType] || DefaultCellComponent;
      const isHinted = hintedCells.some(hc => hc.row === r && hc.col === c);
      
      const cellKey = `${r}-${c}`;
      // Get candidates for this specific cell; defaults to an empty array if none exist
      const cellCandidates = candidateMarks && candidateMarks[cellKey] ? candidateMarks[cellKey] : [];

      cells.push(
        <CellComponentToRender
          key={cellKey}
          row={r}
          col={c}
          initialValue={initialVal}
          userValue={userVal}
          solutionValue={solutionVal}
          isSelected={selectedCell?.row === r && selectedCell?.col === c}
          isHovered={highlightTarget?.row === r && highlightTarget?.col === c}
          isRowHovered={highlightTarget?.row === r}
          isColHovered={highlightTarget?.col === c}
          isSubgridHovered={
            highlightTarget &&
            Math.floor(r / subgridSize) === Math.floor(highlightTarget.row / subgridSize) &&
            Math.floor(c / subgridSize) === Math.floor(highlightTarget.col / subgridSize)
          }
          isHinted={isHinted}
          onClick={(clickedRow, clickedCol, eventFromCell, cellElementFromCell) => {
            // Pass r, c from the loop to ensure correct cell identification
            onCellClick(r, c, eventFromCell, cellElementFromCell);
          }}
          onMouseEnter={() => setHoveredCell({ row: r, col: c })}
          gridSize={gridSize}
          gameState={gameState}
          isLocked={lockedCells.some(cell => cell.row === r && cell.col === c)}
          onToggleLock={() => onToggleLock(r, c)} // Pass App's handler
          cellType={cellType} // Pass cellType if individual cells need it for some logic

          // --- Pass Candidate Mark Props to Cell ---
          cellCandidates={cellCandidates} // Pass the array of candidates for this cell
          isCandidateModeActive={isCandidateModeActive} // Let cell know the global mode for display purposes
          // --- END Candidate Mark Props ---
        />
      );
    }
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${gridSize}, 1fr)`,
    border: '2px solid #333',
    position: 'relative',
    // aspectRatio: '1 / 1', // Already in App.css for .sudoku-grid
  };

  return (
    <div
      style={gridStyle}
      className={`sudoku-grid grid-size-${gridSize}`} // Add gridSize class for potential CSS targeting
      onMouseLeave={() => setHoveredCell(null)}
    >
      {cells}
    </div>
  );
}

export default SudokuGrid;