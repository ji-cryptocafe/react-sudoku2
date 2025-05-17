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
  getValidNumbersForCell,
} from './logic/sudokuLogic';
import { GRID_SIZES, DIFFICULTIES, EMPTY_CELL_VALUE } from './logic/constants';
import { getInternalValueFromKey } from './logic/utils';

import { useTimer } from './hooks/useTimer';
import { useNewGameModal } from './hooks/useNewGameModal';
import { useCellContextMenu } from './hooks/useCellContextMenu';
import { useSudokuGame } from './hooks/useSudokuGame';

import './App.css';

function App() {
  const {
    gridSize,
    setGridSize,
    difficulty,
    setDifficulty,
    initialCluesBoard,
    solutionBoard, // Keep if needed for direct access, e.g. by Cell
    userBoard,
    cellTypesBoard,
    gameState,
    gameMessage,
    lockedCells,
    hintedCells,
    hintUsesLeft,
    startGame, // This is internalStartGame from the hook
    handleCellInputValue,
    cycleCellValue,
    checkSolution,
    toggleLock,
    requestHint,
    isCellClue,
    isCellLocked,
  } = useSudokuGame(GRID_SIZES.S9, DIFFICULTIES.MEDIUM);

  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(false);

  const { elapsedTime, startTimer, stopTimer, resetTimer } = useTimer();
  const { isNewGameModalOpen, openNewGameModal, closeNewGameModal } = useNewGameModal();
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

  useEffect(() => {
    if (gameState === 'Playing') {
      resetTimer();
      startTimer();
      closeAllPopups();
    } else if (gameState === 'Won' || gameState === 'Failed') {
      stopTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]); // resetTimer, startTimer, closeAllPopups are stable from their hooks


  const handleCellClick = useCallback(
    (row, col) => {
      if (cellContextMenu.visible) {
        closeContextMenuAndResetKeyAction();
      }

      if (isCellLocked(row, col)) {
        setSelectedCell({ row, col });
        return;
      }

      if (gameState !== 'Playing' || isCellClue(row, col)) {
        setSelectedCell(null);
        return;
      }
      setSelectedCell({ row, col });
      cycleCellValue(row, col, isFilteringEnabled); // gridSize is now internal to cycleCellValue
    },
    [
      cellContextMenu.visible,
      closeContextMenuAndResetKeyAction,
      isCellLocked, // From hook
      gameState,
      isCellClue,   // From hook
      cycleCellValue, // From hook
      isFilteringEnabled,
    ]
  );

  const handleCheckSolution = useCallback(() => {
    if (cellContextMenu.visible) {
      closeContextMenuAndResetKeyAction();
    }
    if (gameState !== 'Playing') return;
    checkSolution(); // This will update gameState internally in the hook
                     // The useEffect above will catch gameState change for stopTimer
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyAction, gameState, checkSolution]);

  const handleNewGameRequest = useCallback(() => {
    if (cellContextMenu.visible) {
      closeContextMenuAndResetKeyAction();
    }
    openNewGameModal();
  }, [openNewGameModal, cellContextMenu.visible, closeContextMenuAndResetKeyAction]);

  const handleCloseNewGameModal = useCallback(() => {
    closeNewGameModal();
  }, [closeNewGameModal]);

  const handleStartGameFromModal = useCallback(
    (newSize, newDifficulty) => {
      closeAllPopups();
      // These will trigger the useEffect in useSudokuGame to call internalStartGame
      setGridSize(newSize);
      setDifficulty(newDifficulty);
      // If size and difficulty are the same, the useEffect in useSudokuGame will still run
      // because internalStartGame's deps (gridSize, difficulty) will have new references.
      // However, if you *really* want to force a new puzzle of the *exact same* config,
      // the current `startGame` from the hook can be called.
      if (newSize === gridSize && newDifficulty === difficulty) {
          startGame(); // Call the hook's startGame to ensure re-generation
      }
    },
    [closeAllPopups, setGridSize, setDifficulty, gridSize, difficulty, startGame]
  );

  const handleActualRequestHint = useCallback(() => { // Renamed to avoid conflict
    requestHint();
  }, [requestHint]);

  const handleCloseCellContextMenu = useCallback(() => {
    closeContextMenuAction();
  }, [closeContextMenuAction]);

  const handleOpenCellContextMenu = useCallback(
    (x, y, row, col) => {
      if (isCellLocked(row, col) || isCellClue(row, col)) {
        closeContextMenuAndResetKeyAction();
        return;
      }
      if (isNewGameModalOpen) closeNewGameModal();

      let validNumbersList = null;
      if (isFilteringEnabled) {
        if (initialCluesBoard && initialCluesBoard.length === gridSize) {
          validNumbersList = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
        } else {
          validNumbersList = Array.from({ length: gridSize }, (_, i) => i);
        }
      }
      openContextMenu(x, y, row, col, validNumbersList, isFilteringEnabled);
    },
    [
      isNewGameModalOpen,
      isCellLocked, // From hook
      isCellClue,   // From hook
      openContextMenu,
      closeNewGameModal,
      closeContextMenuAndResetKeyAction,
      isFilteringEnabled,
      initialCluesBoard,
      gridSize,
    ]
  );

  const handleSelectValueFromContextMenu = useCallback(
    (value) => {
      const { row: targetRow, col: targetCol } = cellContextMenu;
      if (targetRow !== null && targetCol !== null) {
        if (targetRow >= gridSize || targetCol >= gridSize || targetRow < 0 || targetCol < 0) {
            console.error("Context menu target out of bounds for current grid size.", {targetRow, targetCol, currentGridSize: gridSize});
        } else {
            handleCellInputValue(targetRow, targetCol, value); // From hook
        }
      }
      closeContextMenuAction();
    },
    [cellContextMenu, handleCellInputValue, closeContextMenuAction, gridSize]
  );

  const handleToggleLockCell = useCallback(
    (row, col) => {
      toggleLock(row, col); // From hook
    },
    [toggleLock]
  );

  useEffect(() => {
    if (!cellContextMenu.visible) return;
    const closeMenuOnScroll = () => closeContextMenuAndResetKeyAction();
    window.addEventListener('scroll', closeMenuOnScroll, true);
    return () => window.removeEventListener('scroll', closeMenuOnScroll, true);
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyAction]);

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
          if (!isCellClue(r,c)) {
            setSelectedCell({ row: r, col: c });
            return;
          }
        }
        return;
      }

      if (hoveredCell && initialCluesBoard.length > 0 && userBoard.length > 0) {
        const { row, col } = hoveredCell;
        if (isCellClue(row, col) || isCellLocked(row, col)) return;

        const internalValue = getInternalValueFromKey(key, gridSize);
        if (internalValue !== null) { // Check if it's a valid number/action key
          if (isFilteringEnabled) {
            const validNumbers = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
            if (validNumbers.includes(internalValue) || internalValue === EMPTY_CELL_VALUE) { // EMPTY_CELL_VALUE is -1
              handleCellInputValue(row, col, internalValue);
            }
          } else {
            handleCellInputValue(row, col, internalValue);
          }
        }
      }
    },
    [
      gameState, isNewGameModalOpen, cellContextMenu.visible, hoveredCell, selectedCell,
      gridSize, initialCluesBoard, userBoard, isCellLocked, isCellClue,
      handleCellInputValue, isFilteringEnabled,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleToggleFilter = () => {
    setIsFilteringEnabled((prev) => !prev);
  };

  return (
    <div className="app-container">
      <div id="main-content-wrapper" className={`${isNewGameModalOpen ? 'blurred' : ''}`}>
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
              <button
                className={`sidebar-button ${hintUsesLeft <= 0 || hintedCells.length > 0 || gameState !== 'Playing' ? 'disabled' : ''}`}
                aria-label="Get Hint"
                onClick={handleActualRequestHint} // Use renamed handler
                disabled={hintUsesLeft <= 0 || gameState !== 'Playing' || hintedCells.length > 0}
                title={`Get a hint (${hintUsesLeft} left)`}
              >
                Hnt {hintUsesLeft > 0 ? `(${hintUsesLeft})` : ''}
              </button>
              <button className="sidebar-button" aria-label="Upgrade 3">L3</button>
            </div>

            <div id="canvas-container-main">
              <div id="canvas-container">
                {gameState === 'Loading' || !initialCluesBoard || initialCluesBoard.length === 0 ? (
                  <p>Loading puzzle...</p>
                ) : (
                  <SudokuGrid
                    gridSize={gridSize}
                    initialCluesBoard={initialCluesBoard}
                    userBoard={userBoard}
                    solutionBoard={solutionBoard} // Pass the actual solutionBoard
                    cellTypesBoard={cellTypesBoard}
                    selectedCell={selectedCell}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                    onCellClick={handleCellClick}
                    onCellContextMenu={(event, row, col) => handleOpenCellContextMenu(event.clientX, event.clientY, row, col)}
                    gameState={gameState}
                    lockedCells={lockedCells}
                    onToggleLock={handleToggleLockCell}
                    hintedCells={hintedCells}
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
      
      {cellContextMenu.visible && (
        <CellContextMenu
          key={cellContextMenu.instanceKey}
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          gridSize={gridSize}
          onSelectValue={handleSelectValueFromContextMenu}
          onClose={handleCloseCellContextMenu}
          isFilteringEnabled={cellContextMenu.isFilteringActiveForMenu}
          validNumbersList={cellContextMenu.validNumbersForMenu}
        />
      )}
    </div>
  );
}

export default App;