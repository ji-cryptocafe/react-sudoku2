// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  getValidNumbersForCell,
} from './logic/sudokuLogic';
import { EMPTY_CELL_VALUE, GRID_SIZES, DIFFICULTIES } from './logic/constants';
import { deepCopy, getInternalValueFromKey } from './logic/utils';

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
  const [cellTypesBoard, setCellTypesBoard] = useState([]);
  
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(false);

  const {
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
  } = useTimer();
  const {
    isNewGameModalOpen,
    openNewGameModal,
    closeNewGameModal,
  } = useNewGameModal();
  const {
    cellContextMenu, // Get the LATEST cellContextMenu on each render for the non-memoized function
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

    const newCellTypesBoard = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill('standard'));
    setCellTypesBoard(newCellTypesBoard);

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
  ]);

  useEffect(() => {
    startGame();
    return () => {
      stopTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startGame]);

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

      setUserBoard((prevUserBoard) => {
        const newBoard = deepCopy(prevUserBoard);
        let currentValueInCell = newBoard[row][col];

        if (isFilteringEnabled) {
          const validNumbersBasedOnClues = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
          const cycleOptions = [...new Set([EMPTY_CELL_VALUE, ...validNumbersBasedOnClues])].sort((a, b) => a - b);
          let currentIndex = cycleOptions.indexOf(currentValueInCell);
          let nextIndex = (currentIndex + 1) % cycleOptions.length;
          newBoard[row][col] = cycleOptions[nextIndex];
        } else {
          if (currentValueInCell === gridSize - 1) {
            newBoard[row][col] = EMPTY_CELL_VALUE;
          } else if (currentValueInCell === EMPTY_CELL_VALUE) {
            newBoard[row][col] = 0;
          } else {
            newBoard[row][col] = currentValueInCell + 1;
          }
        }
        return newBoard;
      });
    },
    [
      gameState,
      initialCluesBoard,
      gridSize,
      cellContextMenu.visible, // Depends on cellContextMenu object
      lockedCells,
      closeContextMenuAndResetKeyAction,
      isFilteringEnabled,
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
    cellContextMenu.visible, // Depends on cellContextMenu object
    closeContextMenuAndResetKeyAction,
    stopTimer,
  ]);

  const handleNewGameRequest = useCallback(() => {
    if (cellContextMenu.visible) {
      closeContextMenuAndResetKeyAction();
    }
    openNewGameModal();
  }, [
    openNewGameModal,
    cellContextMenu.visible, // Depends on cellContextMenu object
    closeContextMenuAndResetKeyAction,
  ]);

  const handleCloseNewGameModal = useCallback(() => {
    closeNewGameModal();
  }, [closeNewGameModal]);

  const handleStartGameFromModal = useCallback(
    (newSize, newDifficulty) => {
      closeAllPopups();
      if (newSize !== gridSize || newDifficulty !== difficulty) {
        setGridSize(newSize);
        setDifficulty(newDifficulty);
      } else {
        startGame();
      }
    },
    [
      gridSize,
      difficulty,
      startGame,
      closeAllPopups,
    ]
  );

  const handleCloseCellContextMenu = useCallback(() => {
    closeContextMenuAction();
  }, [closeContextMenuAction]);

  const handleOpenCellContextMenu = useCallback(
    (x, y, row, col) => {
      console.log(`[App.jsx] handleOpenCellContextMenu called with: x=${x}, y=${y}, rowParam=${row}, colParam=${col}`);

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
      
      let validNumbersList = null;
      if (isFilteringEnabled) {
        if (initialCluesBoard && initialCluesBoard.length === gridSize && initialCluesBoard[row] && initialCluesBoard[row][col] !== undefined) {
            validNumbersList = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
        } else {
            console.warn("handleOpenCellContextMenu: initialCluesBoard not ready for filtering. Menu will show all options.");
            validNumbersList = Array.from({ length: gridSize }, (_, i) => i);
        }
      }
      openContextMenu(x, y, row, col, validNumbersList, isFilteringEnabled);
    },
    [
      isNewGameModalOpen,
      lockedCells,
      openContextMenu,
      closeNewGameModal,
      closeContextMenuAndResetKeyAction,
      isFilteringEnabled,
      initialCluesBoard,
      gridSize,
    ]
  );

  // --- TEMPORARY DIAGNOSTIC CHANGE: Not using useCallback ---
  const handleSelectValueFromContextMenu = (value) => {
      const currentContextRow = cellContextMenu.row; // Access LATEST from hook's current state
      const currentContextCol = cellContextMenu.col;

      console.log("Inside (non-memoized) handleSelectValueFromContextMenu:", { 
          selectedVal: value, 
          ctxRow: currentContextRow, 
          ctxCol: currentContextCol,
          rawContextMenuState: JSON.stringify(cellContextMenu) // Log the whole state
      });

      if (currentContextRow !== null && currentContextRow !== undefined && 
          currentContextCol !== null && currentContextCol !== undefined) {
        
        if (currentContextRow >= gridSize || currentContextCol >= gridSize || currentContextRow < 0 || currentContextCol < 0) {
            console.error("CRITICAL: row/col from context menu are out of bounds for current gridSize.", {
                contextMenuRow: currentContextRow, 
                contextMenuCol: currentContextCol, 
                currentGridSize: gridSize,
            });
            closeContextMenuAction(); 
            return; 
        }

        const isCellLocked = lockedCells.some(
          (lcell) => lcell.row === currentContextRow && lcell.col === currentContextCol
        );
        if (!isCellLocked) {
          setUserBoard((prevBoard) => {
            if (!prevBoard || prevBoard.length !== gridSize || !prevBoard[currentContextRow] || prevBoard[currentContextRow].length !== gridSize) {
              console.error("CRITICAL: prevBoard is not correctly structured or context menu row is out of bounds for prevBoard.", {
                prevBoardLength: prevBoard ? prevBoard.length : 'undefined',
                isPrevBoardArray: Array.isArray(prevBoard),
                rowFromContextMenu: currentContextRow,
                colFromContextMenu: currentContextCol,
                expectedGridSize: gridSize,
                actualRowLength: prevBoard && prevBoard[currentContextRow] ? prevBoard[currentContextRow].length : 'N/A (or prevBoard[row] undefined)',
              });
              closeContextMenuAction(); // Close menu if state is bad
              return prevBoard; 
            }
            const newBoard = deepCopy(prevBoard);
            newBoard[currentContextRow][currentContextCol] = value; 
            return newBoard;
          });
        }
      } else {
        console.warn("handleSelectValueFromContextMenu: cellContextMenu.row or .col is null/undefined. Skipping update.", {
            ctxRow: currentContextRow, 
            ctxCol: currentContextCol
        });
      }
      closeContextMenuAction(); 
    };
  // --- END OF TEMPORARY DIAGNOSTIC CHANGE ---


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
    [userBoard, initialCluesBoard]
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
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyAction]); // Depends on cellContextMenu object

  const handleKeyDown = useCallback(
    (event) => {
      if (gameState !== 'Playing' || isNewGameModalOpen || cellContextMenu.visible) {
        return;
      }
      const { key } = event;
      if (key === 'Tab') {
        event.preventDefault();
        if (!initialCluesBoard || initialCluesBoard.length !== gridSize) return;
        let startRow = selectedCell ? selectedCell.row : gridSize - 1;
        let startCol = selectedCell ? selectedCell.col : gridSize - 1;
        let r = startRow;
        let c = startCol;
        for (let i = 0; i < gridSize * gridSize; i++) {
          c++;
          if (c >= gridSize) { c = 0; r++; if (r >= gridSize) r = 0; }
          if (initialCluesBoard[r] && initialCluesBoard[r][c] === EMPTY_CELL_VALUE) {
            setSelectedCell({ row: r, col: c });
            return;
          }
        }
        return;
      }

      if (hoveredCell && initialCluesBoard.length > 0 && userBoard.length > 0) {
        const { row, col } = hoveredCell;
        if (
          (initialCluesBoard[row] && initialCluesBoard[row][col] !== EMPTY_CELL_VALUE) ||
          lockedCells.some((lc) => lc.row === row && lc.col === col)
        ) return;
        
        const internalValue = getInternalValueFromKey(key, gridSize);
        if (internalValue !== null) {
          if (isFilteringEnabled) {
            const validNumbersBasedOnClues = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
            if (validNumbersBasedOnClues.includes(internalValue) || internalValue === EMPTY_CELL_VALUE) {
              setUserBoard((prevBoard) => {
                const newBoard = deepCopy(prevBoard);
                newBoard[row][col] = internalValue;
                return newBoard;
              });
            }
          } else {
            setUserBoard((prevBoard) => {
              const newBoard = deepCopy(prevBoard);
              newBoard[row][col] = internalValue;
              return newBoard;
            });
          }
        }
      }
    },
    [
      gameState, isNewGameModalOpen, cellContextMenu.visible, hoveredCell, selectedCell,
      gridSize, initialCluesBoard, userBoard, lockedCells, isFilteringEnabled, 
      // cellContextMenu.visible used here
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleToggleFilter = () => {
    setIsFilteringEnabled(prev => !prev);
  };

  return (
    <div className="app-container">
      <div
        id="main-content-wrapper"
        className={`${isNewGameModalOpen ? 'blurred' : ''}`}
      >
        <div id="top-bar">
          <div id="top-bar-controls">
            <Controls
              onNewGame={handleNewGameRequest}
              onCheckSolution={handleCheckSolution}
              isGamePlaying={gameState === 'Playing'}
            />
          </div>
          <TimerDisplay time={elapsedTime} />
        </div>

        <div id="game-area">
          <div id="play-area-wrapper">
            <div id="left-sidebar" className="sidebar">
              <button 
                className={`sidebar-button ${isFilteringEnabled ? 'active' : ''}`}
                aria-label="Toggle Value Filtering"
                onClick={handleToggleFilter} 
                title={isFilteringEnabled ? "Disable Clue-Based Filtering" : "Enable Clue-Based Filtering"}
              >
                Filt
              </button>
              <button className="sidebar-button" aria-label="Upgrade 2">L2</button>
              <button className="sidebar-button" aria-label="Upgrade 3">L3</button>
            </div>

            <div id="canvas-container-main"> 
              <div id="canvas-container"> 
                {gameState === 'Loading' ||
                initialCluesBoard.length === 0 || 
                userBoard.length === 0 ||
                solutionBoard.length === 0 ||
                !cellTypesBoard || cellTypesBoard.length !== gridSize ? (
                  <p>Loading puzzle...</p>
                ) : (
                  <SudokuGrid
                    gridSize={gridSize}
                    initialCluesBoard={initialCluesBoard}
                    userBoard={userBoard}
                    solutionBoard={solutionBoard}
                    cellTypesBoard={cellTypesBoard}
                    selectedCell={selectedCell}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                    onCellClick={handleCellClick}
                    onCellContextMenu={(event, row, col) => handleOpenCellContextMenu(event.clientX, event.clientY, row, col)} 
                    gameState={gameState}
                    lockedCells={lockedCells}
                    onToggleLock={handleToggleLockCell}
                  />
                )}
              </div>
            </div>

            <div id="right-sidebar" className="sidebar">
              <button className="sidebar-button" aria-label="Tool 1">R1</button>
              <button className="sidebar-button" aria-label="Tool 2">R2</button>
              <button className="sidebar-button" aria-label="Tool 3">R3</button>
            </div>
          </div>
          <MessageDisplay gameState={gameState} message={gameMessage} />
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
      
      {/* {cellContextMenu.visible && console.log("Rendering CellContextMenu with state:", JSON.stringify(cellContextMenu))} */}
      {cellContextMenu.visible && (
        <CellContextMenu
          key={cellContextMenu.instanceKey}
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          gridSize={gridSize}
          onSelectValue={handleSelectValueFromContextMenu} // This will receive the non-memoized version
          onClose={handleCloseCellContextMenu}
          isFilteringEnabled={cellContextMenu.isFilteringActiveForMenu} 
          validNumbersList={cellContextMenu.validNumbersForMenu}
        />
      )}
    </div>
  );
}

export default App;