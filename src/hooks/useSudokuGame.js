// src/hooks/useSudokuGame.js
import { useState, useCallback, useEffect } from 'react';
import {
  generateNewPuzzle,
  checkUserSolution as checkUserSolutionLogic,
  getValidNumbersForCell,
  getTopHints,
} from '../logic/sudokuLogic';
import { EMPTY_CELL_VALUE } from '../logic/constants';
import { deepCopy } from '../logic/utils';

export const useSudokuGame = (initialGridSize, initialDifficulty) => {
  const [gridSize, setGridSizeState] = useState(initialGridSize);
  const [difficulty, setDifficultyState] = useState(initialDifficulty);

  const [initialCluesBoard, setInitialCluesBoard] = useState([]);
  const [solutionBoard, setSolutionBoard] = useState([]);
  const [userBoard, setUserBoard] = useState([]);
  const [cellTypesBoard, setCellTypesBoard] = useState([]);

  const [gameState, setGameState] = useState('Loading');
  const [gameMessage, setGameMessage] = useState('');
  const [lockedCells, setLockedCells] = useState([]);

  const [hintedCells, setHintedCells] = useState([]);
  const [hintUsesLeft, setHintUsesLeft] = useState(1);

  const isCellClue = useCallback(
    (row, col) => {
      return (
        initialCluesBoard.length > 0 &&
        initialCluesBoard[row]?.[col] !== EMPTY_CELL_VALUE
      );
    },
    [initialCluesBoard]
  );

  const isCellLockedByCoords = useCallback( // Renamed for clarity from isCellLocked
    (row, col) => {
      return lockedCells.some((cell) => cell.row === row && cell.col === col);
    },
    [lockedCells]
  );

  const internalStartGame = useCallback(() => { // Takes gridSize & difficulty from hook's state
    setGameState('Loading');
    const puzzle = generateNewPuzzle(gridSize, difficulty); // Use hook's current state
    setInitialCluesBoard(puzzle.initialBoard);
    setSolutionBoard(puzzle.solution);
    setUserBoard(deepCopy(puzzle.initialBoard));

    const newCellTypesBoard = Array(gridSize) // Use hook's current state
      .fill(null)
      .map(() => Array(gridSize).fill('morphing'));
    setCellTypesBoard(newCellTypesBoard);

    setLockedCells([]);
    setHintedCells([]);
    setHintUsesLeft(1);
    setGameMessage('');
    setGameState('Playing');
  }, [gridSize, difficulty]); // Depends on hook's gridSize and difficulty

  useEffect(() => {
    internalStartGame(); // Call on mount and when gridSize/difficulty changes
  }, [internalStartGame]); // internalStartGame is memoized with gridSize/difficulty

  const handleCellInputValue = useCallback(
    (row, col, value) => {
      if (
        gameState !== 'Playing' ||
        isCellClue(row, col) ||
        isCellLockedByCoords(row, col)
      ) {
        return;
      }
      setUserBoard((prevBoard) => {
        const newBoard = deepCopy(prevBoard);
        if (newBoard[row] && newBoard[row][col] !== undefined) {
           newBoard[row][col] = value;
        }
        return newBoard;
      });
      if (hintedCells.length > 0) setHintedCells([]);
    },
    [gameState, isCellClue, isCellLockedByCoords, hintedCells.length]
  );

  const cycleCellValue = useCallback(
    (row, col, isFilterActive) => {
      if (
        gameState !== 'Playing' ||
        isCellClue(row, col) ||
        isCellLockedByCoords(row, col)
      ) {
        return;
      }
      setUserBoard((prevUserBoard) => {
        const newBoard = deepCopy(prevUserBoard);
        if (!newBoard[row] || newBoard[row][col] === undefined) {
            return prevUserBoard;
        }
        let currentValueInCell = newBoard[row][col];
        let nextValue;

        if (isFilterActive) {
          const validNumbers = getValidNumbersForCell(
            initialCluesBoard,
            row,
            col,
            gridSize // Use hook's gridSize
          );
          const cycleOptions = [
            EMPTY_CELL_VALUE,
            ...validNumbers.sort((a, b) => a - b),
          ];
          let currentIndex = cycleOptions.indexOf(currentValueInCell);
          nextValue = cycleOptions[(currentIndex + 1) % cycleOptions.length];
        } else {
          if (currentValueInCell === gridSize - 1) { // Use hook's gridSize
            nextValue = EMPTY_CELL_VALUE;
          } else if (currentValueInCell === EMPTY_CELL_VALUE) {
            nextValue = 0;
          } else {
            nextValue = currentValueInCell + 1;
          }
        }
        newBoard[row][col] = nextValue;
        return newBoard;
      });
      if (hintedCells.length > 0) setHintedCells([]);
    },
    [gameState, isCellClue, isCellLockedByCoords, initialCluesBoard, gridSize, hintedCells.length]
  );

  const checkSolution = useCallback(() => {
    if (gameState !== 'Playing')
      return { newGameState: gameState, newMessage: gameMessage };

    const { isComplete, isCorrect } = checkUserSolutionLogic(
      userBoard,
      solutionBoard
    );

    if (isComplete && isCorrect) {
      setGameState('Won');
      setGameMessage('Congratulations, You Won!');
      return { newGameState: 'Won', newMessage: 'Congratulations, You Won!' };
    } else {
      setGameState('Failed');
      setGameMessage('Board Incomplete or Incorrect.');
      return { newGameState: 'Failed', newMessage: 'Board Incomplete or Incorrect.'};
    }
  }, [gameState, userBoard, solutionBoard, gameMessage]);

  const toggleLock = useCallback(
    (row, col) => {
      if (isCellClue(row, col)) return;

      setLockedCells((prevLocked) => {
        const currentlyLocked = prevLocked.some(
          (cell) => cell.row === row && cell.col === col
        );
        if (currentlyLocked) {
          return prevLocked.filter(
            (cell) => !(cell.row === row && cell.col === col)
          );
        } else {
          if (userBoard[row]?.[col] !== EMPTY_CELL_VALUE) {
            return [...prevLocked, { row, col }];
          }
          return prevLocked;
        }
      });
    },
    [isCellClue, userBoard]
  );

  const requestHint = useCallback(() => {
    if (gameState !== 'Playing' || hintUsesLeft <= 0 || hintedCells.length > 0) {
      return;
    }
    const topHints = getTopHints(userBoard, gridSize, 3); // Use hook's gridSize
    if (topHints.length > 0) {
      setHintedCells(topHints.map((h) => ({ row: h.row, col: h.col })));
      setHintUsesLeft((prev) => prev - 1);
    } else {
      setGameMessage('No obvious hints available or board complete!');
    }
  }, [gameState, hintUsesLeft, userBoard, gridSize, hintedCells.length]);

  return {
    gridSize,
    setGridSize: setGridSizeState,
    difficulty,
    setDifficulty: setDifficultyState,
    initialCluesBoard,
    solutionBoard,
    userBoard,
    cellTypesBoard,
    gameState,
    gameMessage,
    lockedCells,
    hintedCells,
    hintUsesLeft,
    startGame: internalStartGame, // Expose the memoized function that uses current hook state
    handleCellInputValue,
    cycleCellValue,
    checkSolution,
    toggleLock,
    requestHint,
    isCellClue,
    isCellLocked: isCellLockedByCoords, // Expose renamed helper
  };
};