// src/components/SudokuGrid.jsx
import React from 'react';
// import Cell from './Cell';
import { cellComponentMap, DefaultCellComponent } from './cellTypes/cellComponentMap'; // NEW IMPORT

function SudokuGrid({
  gridSize,
  initialCluesBoard,
  userBoard,
  solutionBoard,
  cellTypesBoard, // NEW PROP
  selectedCell,
  hoveredCell,
  setHoveredCell,
  onCellClick,
  onCellContextMenu,
  gameState,
  lockedCells,
  onToggleLock,
}) {
  // Robust check: If boards aren't ready, don't attempt to render cells
  if (
    !initialCluesBoard || initialCluesBoard.length !== gridSize ||
    !userBoard || userBoard.length !== gridSize ||
    !solutionBoard || solutionBoard.length !== gridSize ||
    !cellTypesBoard || cellTypesBoard.length !== gridSize // ADD CHECK FOR cellTypesBoard
  ) {
    return <p>Initializing grid data...</p>;
  } 

  const subgridSize = Math.sqrt(gridSize);
  const cells = [];

  // This loop should now be safe
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Defensive access, though the check above should prevent issues
      const initialVal = initialCluesBoard[r]
        ? initialCluesBoard[r][c]
        : undefined;
      const userVal = userBoard[r] ? userBoard[r][c] : undefined;
      const solutionVal = solutionBoard[r] ? solutionBoard[r][c] : undefined;

      // If for some reason a value is still undefined (should not happen with guards)
      // handle it gracefully or throw a more specific error.
      // For now, we assume the top-level check in SudokuGrid handles this.

      // Determine which component to render for this cell
      const cellType = (cellTypesBoard[r] && cellTypesBoard[r][c]) ? cellTypesBoard[r][c] : 'standard';
      const CellComponentToRender = cellComponentMap[cellType] || DefaultCellComponent;

      cells.push(
        <CellComponentToRender // DYNAMICALLY RENDER THE COMPONENT
          key={`${r}-${c}`}
          row={r}
          col={c}
          initialValue={initialVal}
          userValue={userVal}
          solutionValue={solutionVal}
          isSelected={selectedCell?.row === r && selectedCell?.col === c}
          isHovered={hoveredCell?.row === r && hoveredCell?.col === c}
          isRowHovered={hoveredCell?.row === r} // Pass these down
          isColHovered={hoveredCell?.col === c} // Pass these down
          isSubgridHovered={ // Pass these down
            hoveredCell &&
            Math.floor(r / subgridSize) ===
              Math.floor(hoveredCell.row / subgridSize) &&
            Math.floor(c / subgridSize) ===
              Math.floor(hoveredCell.col / subgridSize)
          }
          onClick={() => onCellClick(r, c)}
          onMouseEnter={() => setHoveredCell({ row: r, col: c })}
          onCellContextMenu={onCellContextMenu} // Pass down directly
          gridSize={gridSize}
          gameState={gameState}
          isLocked={lockedCells.some(
            (cell) => cell.row === r && cell.col === c
          )}
          onToggleLock={() => onToggleLock(r, c)}
          // Add any other props StandardCell (previously Cell) was expecting
        />
      );
    }
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${gridSize}, 1fr)`,
    width: '450px',
    height: '450px',
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