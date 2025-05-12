// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useRef removed as timerIntervalIdRef is in useTimer
import SudokuGrid from './components/SudokuGrid';
import Controls from './components/Controls';
import TimerDisplay from './components/TimerDisplay';
import MessageDisplay from './components/MessageDisplay';
import NewGameModal from './components/NewGameModal';
import CellContextMenu from './components/CellContextMenu';
import ParticleEffect from './components/ParticleEffect';
import {
  generateNewPuzzle,
  checkUserSolution as checkUserSolutionLogic,
} from './logic/sudokuLogic';
import { EMPTY_CELL_VALUE, GRID_SIZES, DIFFICULTIES } from './logic/constants';
import { deepCopy, getInternalValueFromKey } from './logic/utils';

// Import custom hooks
import { useTimer } from './hooks/useTimer';
import { useNewGameModal } from './hooks/useNewGameModal';
import { useCellContextMenu } from './hooks/useCellContextMenu';

import './App.css';

function App() {
  const [gridSize, setGridSize] = useState(GRID_SIZES.S9);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES.MEDIUM);
  const [initialCluesBoard, setInitialCluesBoard] = useState([]);
  const [solutionBoard, setSolutionBoard] = useState([]);
  const [userBoard, setUserBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [gameState, setGameState] = useState('Loading');
  const [gameMessage, setGameMessage] = useState('');
  const [lockedCells, setLockedCells] = useState([]);

  // REMOVE OLD useState DECLARATIONS that are now handled by hooks:
  // const [elapsedTime, setElapsedTime] = useState(0); // REMOVED
  // const timerIntervalIdRef = useRef(null); // REMOVED
  // const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false); // REMOVED
  // const [cellContextMenu, setCellContextMenu] = useState({ ... }); // REMOVED

  // Using custom hooks
  const {
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
    setElapsedTime: setTimerElapsedTime,
  } = useTimer(); // Renamed setElapsedTime from hook if needed to avoid conflict, though original should be removed
  const {
    isNewGameModalOpen,
    openNewGameModal,
    closeNewGameModal,
    setIsNewGameModalOpen: setModalOpen,
  } = useNewGameModal(); // Renamed setIsNewGameModalOpen from hook for clarity
  const {
    cellContextMenu,
    openMenu: openContextMenu,
    closeMenu: closeContextMenuAction,
    closeMenuAndResetKey: closeContextMenuAndResetKeyAction,
  } = useCellContextMenu();

  const closeAllPopups = useCallback(() => {
    closeNewGameModal();
    closeContextMenuAndResetKeyAction();
  }, [closeNewGameModal, closeContextMenuAndResetKeyAction]);

  const startGame = useCallback(() => {
    closeAllPopups();
    setGameState('Loading');
    resetTimer();

    const puzzle = generateNewPuzzle(gridSize, difficulty);
    setInitialCluesBoard(puzzle.initialBoard);
    setSolutionBoard(puzzle.solution);
    setUserBoard(deepCopy(puzzle.initialBoard));

    setLockedCells([]);
    setSelectedCell(null);
    setHoveredCell(null);
    setGameMessage('');
    setGameState('Playing');
    startTimer();
  }, [
    gridSize,
    difficulty,
    closeAllPopups,
    resetTimer,
    startTimer,
    // setInitialCluesBoard, setSolutionBoard, setUserBoard, setLockedCells, setSelectedCell, setHoveredCell, setGameMessage, setGameState (implicit dependencies)
  ]);

  useEffect(() => {
    startGame();
    return () => {
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize, difficulty]); // startGame is recreated if gridSize/difficulty changes, so it's not needed in dep array directly if those are.
  // However, best practice is to include startGame and memoize it properly.
  // For now, to ensure it runs on gridSize/difficulty change:
  // Re-added startGame to ensure it calls on settings change. If startGame itself is memoized correctly with gridSize/difficulty, this is fine.

  // Re-evaluating useEffect for startGame:
  // The initial call is fine. If startGame is called again due to gridSize/difficulty change,
  // this useEffect will re-run.
  useEffect(() => {
    startGame();
    return () => stopTimer();
  }, [startGame]); // Keep startGame here. Ensure its own useCallback deps are complete.

  const handleCellClick = useCallback(
    (row, col) => {
      if (cellContextMenu.visible) {
        closeContextMenuAndResetKeyAction();
      }

      const isCellLocked = lockedCells.some(
        (cell) => cell.row === row && cell.col === col
      );
      if (isCellLocked) {
        setSelectedCell({ row, col });
        return;
      }

      if (
        gameState !== 'Playing' ||
        (initialCluesBoard.length > 0 &&
          initialCluesBoard[row][col] !== EMPTY_CELL_VALUE)
      ) {
        setSelectedCell(null);
        return;
      }
      setSelectedCell({ row, col });
      setUserBoard((prevBoard) => {
        const newBoard = deepCopy(prevBoard);
        let currentValue = newBoard[row][col];
        if (currentValue === gridSize - 1) {
          newBoard[row][col] = EMPTY_CELL_VALUE;
        } else if (currentValue === EMPTY_CELL_VALUE) {
          newBoard[row][col] = 0;
        } else {
          newBoard[row][col] = currentValue + 1;
        }
        return newBoard;
      });
    },
    [
      gameState,
      initialCluesBoard,
      gridSize,
      cellContextMenu.visible,
      lockedCells,
      closeContextMenuAndResetKeyAction,
      // setSelectedCell, setUserBoard (implicit dependencies)
    ]
  );

  const handleCheckSolution = useCallback(() => {
    if (cellContextMenu.visible) {
      closeContextMenuAndResetKeyAction();
    }
    if (gameState !== 'Playing') return;
    const { isComplete, isCorrect } = checkUserSolutionLogic(
      userBoard,
      solutionBoard
    );
    stopTimer();
    if (isComplete && isCorrect) {
      setGameState('Won');
      setGameMessage('Congratulations, You Won!');
    } else {
      setGameState('Failed');
      setGameMessage('Board Incomplete or Incorrect.');
    }
  }, [
    gameState,
    userBoard,
    solutionBoard,
    cellContextMenu.visible,
    closeContextMenuAndResetKeyAction,
    stopTimer,
    // setGameState, setGameMessage (implicit dependencies)
  ]);

  const handleNewGameRequest = useCallback(() => {
    if (cellContextMenu.visible) {
      closeContextMenuAndResetKeyAction();
    }
    openNewGameModal();
  }, [
    openNewGameModal,
    cellContextMenu.visible,
    closeContextMenuAndResetKeyAction,
  ]);

  const handleCloseNewGameModal = useCallback(() => {
    closeNewGameModal();
  }, [closeNewGameModal]);

  const handleStartGameFromModal = useCallback(
    (newSize, newDifficulty) => {
      closeAllPopups();

      if (newSize !== gridSize || newDifficulty !== difficulty) {
        setGridSize(newSize); // This will trigger the useEffect with startGame
        setDifficulty(newDifficulty); // This will trigger the useEffect with startGame
      } else {
        startGame();
      }
    },
    [
      gridSize,
      difficulty,
      startGame,
      closeAllPopups /*setGridSize, setDifficulty (implicit dependencies)*/,
    ]
  );

  const handleCloseCellContextMenu = useCallback(() => {
    closeContextMenuAction();
  }, [closeContextMenuAction]);

  const handleOpenCellContextMenu = useCallback(
    (x, y, row, col) => {
      const isCellLocked = lockedCells.some(
        (lcell) => lcell.row === row && lcell.col === col
      );
      if (isCellLocked) {
        closeContextMenuAndResetKeyAction();
        return;
      }

      if (isNewGameModalOpen) {
        closeNewGameModal();
      }

      openContextMenu(x, y, row, col);
    },
    [
      isNewGameModalOpen,
      lockedCells,
      openContextMenu,
      closeNewGameModal,
      closeContextMenuAndResetKeyAction,
    ]
  );

  const handleSelectValueFromContextMenu = useCallback(
    (value) => {
      if (cellContextMenu.row !== null && cellContextMenu.col !== null) {
        const { row, col } = cellContextMenu;
        const isCellLocked = lockedCells.some(
          (lcell) => lcell.row === row && lcell.col === col
        );
        if (!isCellLocked) {
          setUserBoard((prevBoard) => {
            const newBoard = deepCopy(prevBoard);
            newBoard[row][col] = value;
            return newBoard;
          });
        }
      }
      closeContextMenuAction();
    },
    [
      lockedCells,
      cellContextMenu.row,
      cellContextMenu.col,
      closeContextMenuAction /*, setUserBoard (implicit)*/,
    ]
  );

  const handleToggleLockCell = useCallback(
    (row, col) => {
      setLockedCells((prevLocked) => {
        const isCurrentlyLocked = prevLocked.some(
          (cell) => cell.row === row && cell.col === col
        );
        if (isCurrentlyLocked) {
          return prevLocked.filter(
            (cell) => !(cell.row === row && cell.col === col)
          );
        } else {
          if (
            initialCluesBoard.length > 0 &&
            userBoard.length > 0 &&
            userBoard[row][col] !== EMPTY_CELL_VALUE &&
            initialCluesBoard[row][col] === EMPTY_CELL_VALUE
          ) {
            return [...prevLocked, { row, col }];
          }
          return prevLocked;
        }
      });
    },
    [userBoard, initialCluesBoard /*, setLockedCells (implicit) */]
  );

  useEffect(() => {
    if (!cellContextMenu.visible) return;

    const closeMenuOnScroll = () => {
      closeContextMenuAndResetKeyAction();
    };
    window.addEventListener('scroll', closeMenuOnScroll, true);
    return () => {
      window.removeEventListener('scroll', closeMenuOnScroll, true);
    };
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyAction]);

  const handleKeyDown = useCallback(
    (event) => {
      if (
        gameState !== 'Playing' ||
        isNewGameModalOpen ||
        cellContextMenu.visible
      ) {
        return;
      }

      const { key } = event;

      if (key === 'Tab') {
        event.preventDefault();
        if (
          !initialCluesBoard ||
          initialCluesBoard.length === 0 ||
          initialCluesBoard.length !== gridSize
        ) {
          return;
        }

        let startRow = selectedCell ? selectedCell.row : gridSize - 1;
        let startCol = selectedCell ? selectedCell.col : gridSize - 1;
        let r = startRow;
        let c = startCol;

        for (let i = 0; i < gridSize * gridSize; i++) {
          c++;
          if (c >= gridSize) {
            c = 0;
            r++;
            if (r >= gridSize) {
              r = 0;
            }
          }
          if (
            initialCluesBoard[r] &&
            initialCluesBoard[r][c] === EMPTY_CELL_VALUE
          ) {
            setSelectedCell({ row: r, col: c });
            return;
          }
        }
        return;
      }

      if (hoveredCell && initialCluesBoard.length > 0 && userBoard.length > 0) {
        const { row, col } = hoveredCell;
        if (
          (initialCluesBoard[row] &&
            initialCluesBoard[row][col] !== EMPTY_CELL_VALUE) ||
          lockedCells.some((lc) => lc.row === row && lc.col === col)
        ) {
          return;
        }
        const internalValue = getInternalValueFromKey(key, gridSize);
        if (internalValue !== null) {
          setUserBoard((prevBoard) => {
            const newBoard = deepCopy(prevBoard);
            newBoard[row][col] = internalValue;
            return newBoard;
          });
        }
      }
    },
    [
      gameState,
      isNewGameModalOpen,
      cellContextMenu.visible,
      hoveredCell,
      selectedCell,
      gridSize,
      initialCluesBoard,
      userBoard,
      lockedCells,
      // setUserBoard, setSelectedCell (implicit dependencies)
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="app-container">
      <div
        id="main-content-wrapper"
        className={`${isNewGameModalOpen ? 'blurred' : ''}`}
        // Removed problematic comment from here
      >
        <TimerDisplay time={elapsedTime} />
        <div id="game-area">
          <div id="canvas-container">
            {gameState === 'Loading' ||
            initialCluesBoard.length === 0 ||
            userBoard.length === 0 ||
            solutionBoard.length === 0 ? (
              <p>Loading puzzle...</p>
            ) : (
              <SudokuGrid
                gridSize={gridSize}
                initialCluesBoard={initialCluesBoard}
                userBoard={userBoard}
                solutionBoard={solutionBoard}
                selectedCell={selectedCell}
                hoveredCell={hoveredCell}
                setHoveredCell={setHoveredCell}
                onCellClick={handleCellClick}
                onCellContextMenu={handleOpenCellContextMenu}
                gameState={gameState}
                lockedCells={lockedCells}
                onToggleLock={handleToggleLockCell}
              />
            )}
          </div>
          <MessageDisplay gameState={gameState} message={gameMessage} />
        </div>
        <div id="bottom-controls">
          <Controls
            onNewGame={handleNewGameRequest}
            onCheckSolution={handleCheckSolution}
            isGamePlaying={gameState === 'Playing'}
          />
        </div>
        {gameState === 'Won' && <ParticleEffect />}
      </div>

      {isNewGameModalOpen && (
        <NewGameModal
          isOpen={isNewGameModalOpen}
          onClose={handleCloseNewGameModal}
          currentGridSize={gridSize}
          currentDifficulty={difficulty}
          onStartNewGame={handleStartGameFromModal}
        />
      )}

      {cellContextMenu.visible && (
        <CellContextMenu
          key={cellContextMenu.instanceKey}
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          gridSize={gridSize}
          onSelectValue={handleSelectValueFromContextMenu}
          onClose={handleCloseCellContextMenu}
        />
      )}
    </div>
  );
}

export default App;
