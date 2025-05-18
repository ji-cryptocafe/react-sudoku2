// src/components/SudokuGrid.jsx
import React from 'react';
import { cellComponentMap, DefaultCellComponent } from './cellTypes/cellComponentMap';

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

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const initialVal = initialCluesBoard[r]?.[c];
      const userVal = userBoard[r]?.[c];
      const solutionVal = solutionBoard[r]?.[c];
      const cellType = cellTypesBoard[r]?.[c] || 'standard';
      const CellComponentToRender = cellComponentMap[cellType] || DefaultCellComponent;
      const isHinted = hintedCells.some(hc => hc.row === r && hc.col === c);

      cells.push(
        <CellComponentToRender
          key={`${r}-${c}`}
          row={r}
          col={c}
          initialValue={initialVal}
          userValue={userVal}
          solutionValue={solutionVal}
          isSelected={selectedCell?.row === r && selectedCell?.col === c}
          isHovered={hoveredCell?.row === r && hoveredCell?.col === c}
          isRowHovered={hoveredCell?.row === r}
          isColHovered={hoveredCell?.col === c}
          isHinted={isHinted}
          isSubgridHovered={
            hoveredCell &&
            Math.floor(r / subgridSize) === Math.floor(hoveredCell.row / subgridSize) &&
            Math.floor(c / subgridSize) === Math.floor(hoveredCell.col / subgridSize)
          }
          // onClick for CellComponentToRender will be its internal `handleCellLeftClick`
          // which then calls this onCellClick prop from App.
          onClick={(clickedRow, clickedCol, eventFromCell, cellElementFromCell) => {
             // Here, r and c are from the SudokuGrid loop.
             // We use these to call App's onCellClick.
             // The cell component (MorphingCell) calls its onClick prop with its own row, col, event, and ref.
             // So, `clickedRow` and `clickedCol` from MorphingCell should match `r` and `c` here.
             // The important part is passing `eventFromCell` and `cellElementFromCell` up.
            onCellClick(r, c, eventFromCell, cellElementFromCell);
          }}
          onMouseEnter={() => setHoveredCell({ row: r, col: c })}
          // For MorphingCell, onCellContextMenu prop won't be used for opening the menu.
          // For other cell types, it might still be used if they retain right-click.
          // Let's assume for now we only change MorphingCell.
          // If other cells still use right-click, this needs to stay or be conditional.
          // onCellContextMenu={(eventFiredByCell, rowReceivedFromCell, colReceivedFromCell) => {
          //   if (cellType !== 'morphing') { // Example: only call for non-morphing
          //     onCellContextMenu(eventFiredByCell, r, c);
          //   }
          // }}
          gridSize={gridSize}
          gameState={gameState}
          isLocked={lockedCells.some(cell => cell.row === r && cell.col === c)}
          onToggleLock={() => onToggleLock(r, c)}
          cellType={cellType} // Pass cellType so App.jsx can know
        />
      );
    }
  }

  // REMOVE fixed width/height from inline style. Styling will be controlled by CSS.
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${gridSize}, 1fr)`,
    // width: '450px', // REMOVED
    // height: '450px', // REMOVED
    border: '2px solid #333', // This can stay or move to CSS
    position: 'relative', // Good for stacking contexts if needed
    // Add aspect-ratio here or in CSS for the container
    // aspectRatio: '1 / 1', // This ensures it stays square
  };

  return (
    <div
      style={gridStyle} // gridStyle no longer contains fixed width/height
      className="sudoku-grid" // CSS will target this class
      onMouseLeave={() => setHoveredCell(null)}
    >
      {cells}
    </div>
  );
}

export default SudokuGrid;