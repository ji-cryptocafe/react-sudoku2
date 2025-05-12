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
    console.error('Invalid grid size for Sudoku. Must be 4, 9, or 16.');
    // Return a default empty puzzle to avoid crashing
    const errorBoard = Array(9)
      .fill(null)
      .map(() => Array(9).fill(EMPTY_CELL_VALUE));
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
    // Fallback: Create a simple pattern (not a valid Sudoku for playing)
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++) solution[r][c] = (r + c) % gridSize;
  }

  let initialBoard = deepCopy(solution);

  let cellsToRemove = 0;
  const totalCells = gridSize * gridSize;
  let targetClues;

  // Difficulty logic (simplified for brevity, similar to original)
  if (difficultyLevel === 'Ultra') {
    if (gridSize === 16) targetClues = 55;
    else if (gridSize === 9) targetClues = 17;
    else if (gridSize === 4) targetClues = 4;
    else targetClues = Math.max(Math.floor(totalCells * 0.2), 1);
  } else {
    let removalPercentage;
    if (gridSize === 16) {
      switch (difficultyLevel) {
        case 'Easy':
          removalPercentage = 0.5;
          break;
        default:
          removalPercentage = 0.6;
      }
    } else if (gridSize === 9) {
      switch (difficultyLevel) {
        case 'Easy':
          removalPercentage = 0.48;
          break;
        case 'Medium':
          removalPercentage = 0.58;
          break;
        default:
          removalPercentage = 0.66;
      }
    } else {
      // 4x4
      switch (difficultyLevel) {
        case 'Easy':
          removalPercentage = 0.35;
          break;
        case 'Medium':
          removalPercentage = 0.5;
          break;
        default:
          removalPercentage = 0.6;
      }
    }
    targetClues = totalCells - Math.floor(totalCells * removalPercentage);

    // Ensure minimum clues
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
  const maxAttempts = totalCells * 10; // Simplified max attempts

  // Random removal - this doesn't guarantee a unique solution for the puzzle.
  // A robust generator would check uniqueness after each removal.
  while (removedCount < cellsToRemove && attempts < maxAttempts) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);
    if (initialBoard[r][c] !== EMPTY_CELL_VALUE) {
      initialBoard[r][c] = EMPTY_CELL_VALUE;
      removedCount++;
    }
    attempts++;
  }
  // console.log(`Generated ${gridSize}x${gridSize} puzzle (${difficultyLevel}). Clues: ${totalCells - removedCount}`);
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
