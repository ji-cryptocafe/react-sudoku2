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
    gridSize, setGridSize, difficulty, setDifficulty,
    initialCluesBoard, solutionBoard, userBoard, cellTypesBoard,
    gameState, gameMessage, lockedCells, hintedCells, hintUsesLeft,
    startGame, handleCellInputValue, checkSolution, toggleLock: originalToggleLock, // Renamed to avoid conflict
    requestHint, isCellClue, isCellLocked,
  } = useSudokuGame(GRID_SIZES.S9, DIFFICULTIES.MEDIUM);

  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(false);

  // State for pencil marks (strike-throughs in context menu)
  const [userPencilMarks, setUserPencilMarks] = useState({});
  // State for candidate marks (multiple small numbers in a cell)
  const [candidateMarks, setCandidateMarks] = useState({});
  // State for candidate entry mode
  const [isCandidateModeActive, setIsCandidateModeActive] = useState(false);
  
  // State for context menu session tracking (for auto-population)
  const [menuSessionInitialPencilMarks, setMenuSessionInitialPencilMarks] = useState([]);
  const [menuSessionMadeCandidateSelections, setMenuSessionMadeCandidateSelections] = useState(false);

  const { elapsedTime, startTimer, stopTimer, resetTimer } = useTimer();
  const { isNewGameModalOpen, openNewGameModal, closeNewGameModal: closeNewGameModalHook } = useNewGameModal();
  const {
    cellContextMenu, openMenu: openContextMenuHook,
    closeMenu: closeContextMenuActionHook,
    closeMenuAndResetKey: closeContextMenuAndResetKeyActionHook,
  } = useCellContextMenu();

  const closeAllPopups = useCallback(() => {
    closeNewGameModalHook();
    closeContextMenuAndResetKeyActionHook();
  }, [closeNewGameModalHook, closeContextMenuAndResetKeyActionHook]);

  useEffect(() => {
    if (gameState === 'Playing') {
      resetTimer();
      startTimer();
    } else if (gameState === 'Won' || gameState === 'Failed') {
      stopTimer();
    }
  }, [gameState, startTimer, stopTimer, resetTimer]);
 
  const handleCheckSolution = useCallback(() => {
    if (cellContextMenu.visible) closeContextMenuAndResetKeyActionHook();
    if (gameState !== 'Playing') return;
    checkSolution();
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyActionHook, gameState, checkSolution]);

  const handleNewGameRequest = useCallback(() => {
    if (cellContextMenu.visible) closeContextMenuAndResetKeyActionHook();
    openNewGameModal();
  }, [openNewGameModal, cellContextMenu.visible, closeContextMenuAndResetKeyActionHook]);

  const handleStartGameFromModal = useCallback(
    (newSize, newDifficulty) => {
      closeAllPopups();
      setUserPencilMarks({});
      setCandidateMarks({});
      setIsCandidateModeActive(false);
      setGridSize(newSize);
      setDifficulty(newDifficulty);
      if (newSize === gridSize && newDifficulty === difficulty) {
        startGame();
      }
    },
    [closeAllPopups, setGridSize, setDifficulty, gridSize, difficulty, startGame]
  );

  const handleToggleFilter = () => setIsFilteringEnabled(prev => !prev);
  const handleToggleCandidateMode = () => {
    setIsCandidateModeActive(prev => !prev);
    if (cellContextMenu.visible) closeContextMenuAndResetKeyActionHook();
  };

  const toggleCellCandidateMark = useCallback((row, col, value) => {
    setCandidateMarks(prev => {
      const cellKey = `${row}-${col}`;
      const currentCandidates = prev[cellKey] ? [...prev[cellKey]] : [];
      const index = currentCandidates.indexOf(value);
      if (index > -1) currentCandidates.splice(index, 1);
      else {
        currentCandidates.push(value);
        currentCandidates.sort((a, b) => a - b);
      }
      return { ...prev, [cellKey]: currentCandidates };
    });
    setMenuSessionMadeCandidateSelections(true);
  }, []);

  const clearCellCandidateMarks = useCallback((row, col) => {
    setCandidateMarks(prev => {
      const newMarks = { ...prev };
      delete newMarks[`${row}-${col}`];
      return newMarks;
    });
  }, []);

  const toggleUserPencilMarkForMenu = useCallback((row, col, value) => {
    setUserPencilMarks(prevMarks => {
      const cellKey = `${row}-${col}`;
      const currentCellMarks = prevMarks[cellKey] ? [...prevMarks[cellKey]] : [];
      const markIndex = currentCellMarks.indexOf(value);
      if (markIndex > -1) currentCellMarks.splice(markIndex, 1);
      else currentCellMarks.push(value);
      return { ...prevMarks, [cellKey]: currentCellMarks };
    });
  }, []);

  const openActualContextMenu = useCallback(
    (row, col, cellElement) => {
      if (isCellLocked(row, col) || isCellClue(row, col)) {
        closeContextMenuAndResetKeyActionHook();
        return;
      }
      if (isNewGameModalOpen) closeNewGameModalHook();

      let validNumbersList = null;
      if (isFilteringEnabled) {
        if (initialCluesBoard && initialCluesBoard.length === gridSize) {
          validNumbersList = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
        } else {
          validNumbersList = Array.from({ length: gridSize }, (_, i) => i);
        }
      }
      
      let menuX, menuY;
      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        const MENU_APPROXIMATE_HEIGHT = 40; 
        const MENU_OFFSET_Y = -10; 
        const MENU_LEFT_OFFSET_X = -50;
        menuX = rect.left + window.scrollX + MENU_LEFT_OFFSET_X; 
        menuY = rect.top + window.scrollY - MENU_APPROXIMATE_HEIGHT + MENU_OFFSET_Y;
      } else {
        menuX = cellContextMenu.x || 0; 
        menuY = cellContextMenu.y || 0;
      }

      const cellKey = `${row}-${col}`;
      const currentMenuPencilMarks = userPencilMarks[cellKey] || [];
      setMenuSessionInitialPencilMarks(currentMenuPencilMarks);
      setMenuSessionMadeCandidateSelections(false);
      openContextMenuHook(menuX, menuY, row, col, validNumbersList, isFilteringEnabled);
      setSelectedCell({ row, col });
    },
    [ isCellLocked, isCellClue, closeContextMenuAndResetKeyActionHook, isNewGameModalOpen, closeNewGameModalHook,
      isFilteringEnabled, initialCluesBoard, gridSize, openContextMenuHook, userPencilMarks, cellContextMenu.x, cellContextMenu.y
    ]
  );

  const handleSelectValueFromMenu = useCallback(
    (value) => {
      const { row: targetRow, col: targetCol } = cellContextMenu;
      if (targetRow === null || targetCol === null) return;

      if (isCandidateModeActive) {
        toggleCellCandidateMark(targetRow, targetCol, value);
        // If in candidate mode, also clear the main cell value if it's not empty
        // and candidates are being added/toggled. This prevents main value + candidates.
        if (userBoard[targetRow][targetCol] !== EMPTY_CELL_VALUE) {
            handleCellInputValue(targetRow, targetCol, EMPTY_CELL_VALUE);
        }
      } else {
        handleCellInputValue(targetRow, targetCol, value);
        clearCellCandidateMarks(targetRow, targetCol);
        closeContextMenuAndResetKeyActionHook();
      }
    },
    [ cellContextMenu, isCandidateModeActive, toggleCellCandidateMark, handleCellInputValue,
      clearCellCandidateMarks, closeContextMenuAndResetKeyActionHook, userBoard
    ]
  );

  const closeActualContextMenu = useCallback(() => {
    const { row, col, visible } = cellContextMenu;
    if (!visible || row === null || col === null) {
      closeContextMenuActionHook();
      return;
    }

    if (isCandidateModeActive && !menuSessionMadeCandidateSelections) {
      const cellKey = `${row}-${col}`;
      const currentPencilMarksInMenu = userPencilMarks[cellKey] || [];
      const initialPencilMarks = menuSessionInitialPencilMarks; // Use captured initial marks

      const pencilMarksChangedThisSession = currentPencilMarksInMenu.length !== initialPencilMarks.length ||
                                 currentPencilMarksInMenu.some(mark => !initialPencilMarks.includes(mark)) ||
                                 initialPencilMarks.some(mark => !currentPencilMarksInMenu.includes(mark));

      if (pencilMarksChangedThisSession) {
        const allPossibleValues = Array.from({ length: gridSize }, (_, i) => i);
        const leftoverValues = allPossibleValues.filter(v => !currentPencilMarksInMenu.includes(v));
        
        const currentCellCandidates = candidateMarks[cellKey] || [];
        const newCandidatesAreDifferent = leftoverValues.length !== currentCellCandidates.length ||
                                          leftoverValues.some(v => !currentCellCandidates.includes(v));
        
        if (leftoverValues.length > 0) {
          if(newCandidatesAreDifferent) {
            setCandidateMarks(prev => ({ ...prev, [cellKey]: leftoverValues.sort((a,b)=>a-b) }));
             if (userBoard[row][col] !== EMPTY_CELL_VALUE) { // Clear main value if auto-populating candidates
                handleCellInputValue(row, col, EMPTY_CELL_VALUE);
            }
          }
        } else if (currentCellCandidates.length > 0) {
          clearCellCandidateMarks(row, col);
        }
      }
    }
    closeContextMenuActionHook();
  }, [ cellContextMenu, isCandidateModeActive, menuSessionMadeCandidateSelections, userPencilMarks,
       menuSessionInitialPencilMarks, gridSize, candidateMarks, setCandidateMarks,
       clearCellCandidateMarks, closeContextMenuActionHook, userBoard, handleCellInputValue
  ]);

  const handleCellClick = useCallback(
    (row, col, event, cellElement) => {
      const cellIsCurrentlyLocked = isCellLocked(row, col);
      const cellIsCurrentlyClue = isCellClue(row, col);

      if (cellIsCurrentlyLocked || cellIsCurrentlyClue) {
          if (cellContextMenu.visible) closeContextMenuAndResetKeyActionHook();
          setSelectedCell({row, col});
          return;
      }
      // If not locked or clue, proceed to open context menu
      if (cellContextMenu.visible && cellContextMenu.row === row && cellContextMenu.col === col) {
         // If clicking the same cell and menu is already open for it.
         // In candidate mode, this could be a signal to close and apply auto-population.
         if (isCandidateModeActive) {
            closeActualContextMenu(); // This will handle auto-population if conditions met
            return;
         }
         // In non-candidate mode, clicking the same cell again does nothing (user must select from menu or click off)
         return; 
      }
      openActualContextMenu(row, col, cellElement);
    },
    [ cellContextMenu, closeContextMenuAndResetKeyActionHook, openActualContextMenu,
      isCellLocked, isCellClue, isCandidateModeActive, closeActualContextMenu
    ]
  );

  const toggleLockAndManageCandidates = useCallback(
    (row, col) => {
      const cellIsCurrentlyLocked = isCellLocked(row, col);
      originalToggleLock(row, col); // Call the hook's toggleLock
      if (!cellIsCurrentlyLocked) { // Cell is becoming locked
        clearCellCandidateMarks(row, col);
      }
    },
    [originalToggleLock, isCellLocked, clearCellCandidateMarks]
  );

  useEffect(() => {
    const handleGlobalClickForMenuClose = (event) => {
      if (!cellContextMenu.visible) return;
      const gridElement = document.getElementById('canvas-container-main');
      const menuElement = document.querySelector('.cell-context-menu');
      const isClickOutsideGrid = gridElement && !gridElement.contains(event.target);
      const isClickOutsideMenu = menuElement && !menuElement.contains(event.target);

      if (isClickOutsideMenu) { // If click is outside the menu itself
        // Check if it's also outside the grid or on a non-cell part of the grid
        let targetIsCell = false;
        if (gridElement && gridElement.contains(event.target)) {
            let el = event.target;
            while(el && el !== gridElement) {
                if (el.classList.contains('cell')) { // Generic cell class
                    targetIsCell = true;
                    break;
                }
                el = el.parentElement;
            }
        }
        if (isClickOutsideGrid || !targetIsCell) {
             closeActualContextMenu(); // Use the smart close
        }
        // If click was on another cell, handleCellClick for that cell will take over.
      }
    };
    document.addEventListener('mousedown', handleGlobalClickForMenuClose);
    return () => document.removeEventListener('mousedown', handleGlobalClickForMenuClose);
  }, [cellContextMenu.visible, closeActualContextMenu]);

  useEffect(() => {
    if (!cellContextMenu.visible) return;
    const closeMenuOnScroll = () => closeActualContextMenu();
    window.addEventListener('scroll', closeMenuOnScroll, true);
    return () => window.removeEventListener('scroll', closeMenuOnScroll, true);
  }, [cellContextMenu.visible, closeActualContextMenu]);

  const handleKeyDown = useCallback(
    (event) => {
      if (gameState !== 'Playing' || isNewGameModalOpen || cellContextMenu.visible) return;
      const { key } = event;
      if (key === 'Tab') { event.preventDefault(); /* Tab logic can be complex, skip for now */ return; }

      if (hoveredCell && initialCluesBoard.length > 0 && userBoard.length > 0) {
        const { row, col } = hoveredCell;
        if (isCellClue(row, col) || isCellLocked(row, col)) return;

        const internalValue = getInternalValueFromKey(key, gridSize);
        if (internalValue !== null) {
          if (isCandidateModeActive) {
            // If 'c' or some other key is pressed, could toggle candidate mode too
            // For number keys in candidate mode, add/remove from candidates
            toggleCellCandidateMark(row, col, internalValue);
            if (userBoard[row][col] !== EMPTY_CELL_VALUE) { // Clear main value if adding candidates via keyboard
                handleCellInputValue(row, col, EMPTY_CELL_VALUE);
            }
          } else {
            // Regular input mode
            if (isFilteringEnabled) {
              const validNumbers = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
              if (validNumbers.includes(internalValue) || internalValue === EMPTY_CELL_VALUE) {
                handleCellInputValue(row, col, internalValue);
                clearCellCandidateMarks(row, col);
              }
            } else {
              handleCellInputValue(row, col, internalValue);
              clearCellCandidateMarks(row, col);
            }
          }
        } else if (key === 'Backspace' || key === 'Delete') {
            if(isCandidateModeActive && candidateMarks[`${row}-${col}`]?.length > 0){
                clearCellCandidateMarks(row, col)
            } else {
                 handleCellInputValue(row, col, EMPTY_CELL_VALUE); // Clear main value
                 clearCellCandidateMarks(row, col); // Also clear candidates
            }
        }
      }
    },
    [ gameState, isNewGameModalOpen, cellContextMenu.visible, hoveredCell, 
      initialCluesBoard, userBoard, gridSize, isCellClue, isCellLocked, 
      isCandidateModeActive, toggleCellCandidateMark, handleCellInputValue, 
      isFilteringEnabled, clearCellCandidateMarks, candidateMarks
    ]
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
                onClick={handleToggleFilter}
                title={isFilteringEnabled ? "Disable Value Filtering" : "Enable Value Filtering"}
              >
                Filter
              </button>
              <button
                className={`sidebar-button ${hintUsesLeft <= 0 || hintedCells.length > 0 || gameState !== 'Playing' ? 'disabled' : ''}`}
                onClick={requestHint}
                disabled={hintUsesLeft <= 0 || gameState !== 'Playing' || hintedCells.length > 0}
                title={`Get a hint (${hintUsesLeft} left)`}
              >
                Hint {hintUsesLeft > 0 ? `(${hintUsesLeft})` : ''}
              </button>
              <button
                className={`sidebar-button ${isCandidateModeActive ? 'active' : ''}`}
                onClick={handleToggleCandidateMode}
                title={isCandidateModeActive ? "Switch to Single Value Mode" : "Switch to Candidate (Pencil Mark) Mode"}
              >
                Multi
              </button>
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
                    solutionBoard={solutionBoard} 
                    cellTypesBoard={cellTypesBoard}
                    selectedCell={selectedCell}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                    onCellClick={handleCellClick}
                    gameState={gameState}
                    lockedCells={lockedCells}
                    onToggleLock={toggleLockAndManageCandidates}
                    hintedCells={hintedCells}
                    cellContextMenuVisible={cellContextMenu.visible}
                    cellContextMenuRow={cellContextMenu.row}
                    cellContextMenuCol={cellContextMenu.col}
                    candidateMarks={candidateMarks}
                    isCandidateModeActive={isCandidateModeActive}
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
          onClose={closeNewGameModalHook}
          currentGridSize={gridSize}
          currentDifficulty={difficulty}
          onStartNewGame={handleStartGameFromModal}
        />
      )}
      
      {cellContextMenu.visible && cellContextMenu.row !== null && cellContextMenu.col !== null && (
        <CellContextMenu
          key={`${cellContextMenu.instanceKey}-${cellContextMenu.row}-${cellContextMenu.col}`}
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          gridSize={gridSize}
          onSelectValue={handleSelectValueFromMenu}
          onClose={closeActualContextMenu}
          isFilteringEnabled={cellContextMenu.isFilteringActiveForMenu}
          validNumbersList={cellContextMenu.validNumbersForMenu}
          userPencilMarksForCell={userPencilMarks[`${cellContextMenu.row}-${cellContextMenu.col}`] || []}
          onToggleUserPencilMark={(value) => {
            if (cellContextMenu.row !== null && cellContextMenu.col !== null) {
              toggleUserPencilMarkForMenu(cellContextMenu.row, cellContextMenu.col, value);
            }
          }}
          isCandidateModeActive={isCandidateModeActive}
          selectedCellCandidates={candidateMarks[`${cellContextMenu.row}-${cellContextMenu.col}`] || []}
        />
      )}
    </div>
  );
}

export default App;