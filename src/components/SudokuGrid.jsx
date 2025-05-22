// src/components/SudokuGrid.jsx
import React from 'react';
import { cellComponentMap, DefaultCellComponent } from './cellTypes/cellComponentMap';
import { EMPTY_CELL_VALUE } from '../logic/constants'; // Import if needed by cells


function SudokuGrid({
  gridSize,
  initialCluesBoard,
  userBoard,
  solutionBoard,
  cellTypesBoard,
  selectedCell,
  hoveredCell,
  setHoveredCell,
  onCellClick, // This prop from App.jsx will receive (row, col, event, cellElement)
  // onCellContextMenu, // This prop might become unused or repurposed for other cell types
  gameState,
  lockedCells,
  onToggleLock,
  hintedCells,
  cellContextMenuVisible,
  cellContextMenuRow,
  cellContextMenuCol,
  // --- NEW PROPS for Corner Notes ---
  cornerMarks,
  isCornerNoteModeActive,
  onCornerNoteBoxClick,     // (row, col, event, cornerBoxElement) => void
  onCornerNoteRightClick,   // (row, col, event) => void
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
      const cornerMarkValue = cornerMarks && cornerMarks[cellKey] !== undefined ? cornerMarks[cellKey] : EMPTY_CELL_VALUE;

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
            onCellClick(r, c, eventFromCell, cellElementFromCell);
          }}
          onMouseEnter={() => setHoveredCell({ row: r, col: c })}
          gridSize={gridSize}
          gameState={gameState}
          isLocked={lockedCells.some(cell => cell.row === r && cell.col === c)}
          onToggleLock={() => onToggleLock(r, c)} // Pass App's handler
          cellType={cellType}

          // --- Pass Corner Note Props ---
          cornerMarkValue={cornerMarkValue}
          isCornerNoteModeActive={isCornerNoteModeActive} // Though cell might not directly use this, App does
          onCornerNoteBoxClick={onCornerNoteBoxClick}
          onCornerNoteRightClick={onCornerNoteRightClick}
          // --- END Corner Note Props ---
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
  };

  return (
    <div
      style={gridStyle}
      className="sudoku-grid"
      onMouseLeave={() => setHoveredCell(null)}
    >
      {cells}
    </div>
  );
}

export default SudokuGrid;