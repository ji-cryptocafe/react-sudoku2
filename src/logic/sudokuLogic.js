// sudokuLogic.js
import { EMPTY_CELL_VALUE } from './constants.js';
import { deepCopy } from './utils.js';

function arrayShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function findEmpty(board) {
  const gridSize = board.length;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c] === EMPTY_CELL_VALUE) return [r, c];
    }
  }
  return null;
}

function isValidPlacement(board, row, col, num) {
  const gridSize = board.length;
  const subgridSize = Math.sqrt(gridSize);

  // Check Row & Column
  for (let i = 0; i < gridSize; i++) {
    if (board[row][i] === num && i !== col) return false;
    if (board[i][col] === num && i !== row) return false;
  }
  // Check Subgrid
  const startRow = Math.floor(row / subgridSize) * subgridSize;
  const startCol = Math.floor(col / subgridSize) * subgridSize;
  for (let r_ = 0; r_ < subgridSize; r_++) {
    for (let c_ = 0; c_ < subgridSize; c_++) {
      const checkRow = startRow + r_;
      const checkCol = startCol + c_;
      if (
        board[checkRow][checkCol] === num &&
        (checkRow !== row || checkCol !== col)
      )
        return false;
    }
  }
  return true;
}

export function solveSudoku(board) {
  const gridSize = board.length;
  const emptySpot = findEmpty(board);
  if (!emptySpot) return true; // Solved
  const [row, col] = emptySpot;

  const nums = arrayShuffle([...Array(gridSize).keys()]); // Numbers 0 to gridSize-1

  for (let num of nums) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;
      if (solveSudoku(board)) return true;
      board[row][col] = EMPTY_CELL_VALUE; // Backtrack
    }
  }
  return false;
}

export function generateNewPuzzle(gridSize, difficultyLevel) {
  const subgridSize = Math.sqrt(gridSize);
  if (!Number.isInteger(subgridSize) || ![4, 9, 16].includes(gridSize)) {
    console.error(`Invalid grid size for Sudoku: ${gridSize}. Must be 4, 9, or 16.`);
    // Fallback to a correctly sized empty board using the provided gridSize
    const errorBoard = Array(gridSize) // Use the provided gridSize
      .fill(null)
      .map(() => Array(gridSize).fill(EMPTY_CELL_VALUE)); // Use the provided gridSize
    return {
      initialBoard: deepCopy(errorBoard),
      solution: deepCopy(errorBoard),
    };
  }

  let solution = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(EMPTY_CELL_VALUE));

  if (!solveSudoku(solution)) {
    console.error(
      'Failed to generate a solvable Sudoku base for size ' + gridSize
    );
    // Fallback: Create a simple pattern (not a valid Sudoku for playing but prevents crash)
    // Re-initialize to ensure correct dimensions if solveSudoku somehow modified it badly
    solution = Array(gridSize).fill(null).map(() => Array(gridSize).fill(EMPTY_CELL_VALUE));
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        solution[r][c] = (r + c) % gridSize; // Simple pattern
      }
    }
  }

  let initialBoard = deepCopy(solution);
  let cellsToRemove = 0;
  const totalCells = gridSize * gridSize;
  let targetClues;

  if (difficultyLevel === 'Ultra') {
    if (gridSize === 16) targetClues = 55;
    else if (gridSize === 9) targetClues = 17;
    else if (gridSize === 4) targetClues = 4;
    else targetClues = Math.max(Math.floor(totalCells * 0.2), 1);
  } else {
    let removalPercentage;
    if (gridSize === 16) {
      switch (difficultyLevel) {
        case 'Easy': removalPercentage = 0.5; break;
        default: removalPercentage = 0.6;
      }
    } else if (gridSize === 9) {
      switch (difficultyLevel) {
        case 'Easy': removalPercentage = 0.48; break;
        case 'Medium': removalPercentage = 0.58; break;
        default: removalPercentage = 0.66;
      }
    } else { // 4x4
      switch (difficultyLevel) {
        case 'Easy': removalPercentage = 0.35; break;
        case 'Medium': removalPercentage = 0.5; break;
        default: removalPercentage = 0.6;
      }
    }
    targetClues = totalCells - Math.floor(totalCells * removalPercentage);
    let minCluesMap = { 4: 5, 9: 22, 16: 60 };
    targetClues = Math.max(
      targetClues,
      minCluesMap[gridSize] || Math.floor(totalCells * 0.25)
    );
  }
  cellsToRemove = totalCells - targetClues;
  cellsToRemove = Math.max(
    0,
    Math.min(cellsToRemove, totalCells > 0 ? totalCells - 1 : 0)
  );

  let removedCount = 0;
  let attempts = 0;
  const maxAttempts = totalCells * 10;

  while (removedCount < cellsToRemove && attempts < maxAttempts) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);
    if (initialBoard[r][c] !== EMPTY_CELL_VALUE) {
      initialBoard[r][c] = EMPTY_CELL_VALUE;
      removedCount++;
    }
    attempts++;
  }
  return { initialBoard, solution };
}

export function checkUserSolution(userBoard, solutionBoard) {
  const gridSize = userBoard.length;
  let isComplete = true;
  let isCorrect = true;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (userBoard[r][c] === EMPTY_CELL_VALUE) {
        isComplete = false;
      }
      if (
        userBoard[r][c] !== EMPTY_CELL_VALUE &&
        userBoard[r][c] !== solutionBoard[r][c]
      ) {
        isCorrect = false;
      }
    }
  }
  return { isComplete, isCorrect };
}


// MODIFIED FUNCTION: Get numbers present in the cell's row, column, and subgrid (peers)
export function getInvalidNumbersInPeers(board, row, col, gridSize) {
  const invalidNumbers = new Set();
  const subgridSize = Math.sqrt(gridSize);

  // Ensure board and relevant rows are defined
  if (!board || board.length !== gridSize) {
    console.error("getInvalidNumbersInPeers: Invalid board provided or board not ready.");
    return invalidNumbers; // Return empty set to prevent further errors
  }


  // Check Row (excluding the cell itself)
  if (board[row]) { // Check if the row exists
    for (let c_ = 0; c_ < gridSize; c_++) {
      if (c_ !== col && board[row][c_] !== EMPTY_CELL_VALUE) {
        invalidNumbers.add(board[row][c_]);
      }
    }
  } else {
    console.warn(`getInvalidNumbersInPeers: Row ${row} is undefined.`);
  }


  // Check Column (excluding the cell itself)
  for (let r_ = 0; r_ < gridSize; r_++) {
    if (board[r_]) { // Check if this row exists
        if (r_ !== row && board[r_][col] !== EMPTY_CELL_VALUE) {
        invalidNumbers.add(board[r_][col]);
        }
    } else {
        console.warn(`getInvalidNumbersInPeers: Row ${r_} for column check is undefined.`);
    }
  }

  // Check Subgrid (excluding the cell itself)
  const startRow = Math.floor(row / subgridSize) * subgridSize;
  const startCol = Math.floor(col / subgridSize) * subgridSize;
  for (let r_offset = 0; r_offset < subgridSize; r_offset++) {
    for (let c_offset = 0; c_offset < subgridSize; c_offset++) {
      const checkRow = startRow + r_offset;
      const checkCol = startCol + c_offset;
      
      if (board[checkRow]) { // Check if this subgrid row exists
        if ((checkRow !== row || checkCol !== col) && board[checkRow][checkCol] !== EMPTY_CELL_VALUE) {
          invalidNumbers.add(board[checkRow][checkCol]);
        }
      } else {
        console.warn(`getInvalidNumbersInPeers: Row ${checkRow} for subgrid check is undefined.`);
      }
    }
  }
  return invalidNumbers; // Set of 0-indexed numbers
}

// NEW FUNCTION: Get valid numbers (0-indexed) that can be placed in a cell
export function getValidNumbersForCell(board, row, col, gridSize) {
  const allPossibleNumbers = Array.from({ length: gridSize }, (_, i) => i); // 0 to gridSize-1
  
  // Add a guard here too for the board
  if (!board || board.length !== gridSize || !board[row] || board[row][col] === undefined) {
    console.warn("getValidNumbersForCell: Board not fully ready or cell invalid. Returning all numbers.");
    return allPossibleNumbers; // Fallback: consider all numbers valid to prevent crash
  }

  const invalidPeerNumbers = getInvalidNumbersInPeers(board, row, col, gridSize);
  
  const validNumbers = allPossibleNumbers.filter(num => !invalidPeerNumbers.has(num));
  return validNumbers; // Returns an array of valid 0-indexed numbers
}

// NEW FUNCTION: Find all empty cells in the board
export function findAllEmptyCells(board) {
  const emptyCells = [];
  const gridSize = board.length;
  if (!board || gridSize === 0) return emptyCells;

  for (let r = 0; r < gridSize; r++) {
    if (!board[r]) continue; // Skip if row is undefined
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c] === EMPTY_CELL_VALUE) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
  return emptyCells;
}

// NEW FUNCTION: Get candidates for hints
// This will find empty cells and count their valid possibilities based on the CURRENT userBoard.
export function getHintCandidates(userBoard, gridSize) {
  const emptyCells = findAllEmptyCells(userBoard);
  const candidates = [];

  if (!userBoard || userBoard.length !== gridSize) {
    console.error("getHintCandidates: Invalid userBoard provided.");
    return [];
  }

  for (const cell of emptyCells) {
    // IMPORTANT: For hint candidates, we need to know possibilities based on the *current* state of userBoard
    const validMoves = getValidNumbersForCell(userBoard, cell.row, cell.col, gridSize);
    if (validMoves.length > 0) { // Only consider cells that still have possible moves
        candidates.push({
            row: cell.row,
            col: cell.col,
            possibilitiesCount: validMoves.length,
            // Optional: store the actual validMoves if needed for advanced hints later
            // validMoves: validMoves 
        });
    }
  }

  // Sort candidates: fewer possibilities = easier = higher priority
  candidates.sort((a, b) => a.possibilitiesCount - b.possibilitiesCount);

  return candidates;
}

// NEW FUNCTION: Get the top N hints
export function getTopHints(userBoard, gridSize, numberOfHints = 3) {
  const candidates = getHintCandidates(userBoard, gridSize);
  return candidates.slice(0, numberOfHints); // Returns array of {row, col, possibilitiesCount}
}