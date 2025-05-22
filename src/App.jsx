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
  // NEW STATE for Corner Notes
  // Structure: { "row-col": value (or EMPTY_CELL_VALUE if none) }
  const [cornerMarks, setCornerMarks] = useState({});
  const [isCornerNoteModeActive, setIsCornerNoteModeActive] = useState(false);
  const [isMouseOverGrid, setIsMouseOverGrid] = useState(false); // NEW STATE
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
    // cycleCellValue,
    checkSolution,
    toggleLock,
    requestHint,
    isCellClue,
    isCellLocked,
  } = useSudokuGame(GRID_SIZES.S9, DIFFICULTIES.MEDIUM);

  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(false);

  // NEW STATE: Store user's right-click disabled notes (pencil marks)
  // Structure: { "row-col": [value1, value2], ... }
  const [userPencilMarks, setUserPencilMarks] = useState({});

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

  // NEW FUNCTION: Toggle a user's pencil mark for a cell and value
  const toggleUserPencilMark = useCallback((row, col, value) => {
    setUserPencilMarks(prevMarks => {
      const cellKey = `${row}-${col}`;
      const currentCellSpecificMarks = prevMarks[cellKey] ? [...prevMarks[cellKey]] : []; // Create a new array
      const markIndex = currentCellSpecificMarks.indexOf(value);

      if (markIndex > -1) {
        currentCellSpecificMarks.splice(markIndex, 1);
      } else {
        currentCellSpecificMarks.push(value);
      }

      // Ensure a new object is returned for the state to trigger re-renders
      return {
        ...prevMarks,
        [cellKey]: currentCellSpecificMarks, // currentCellSpecificMarks is already a new array here
      };
    });
  }, []);

  useEffect(() => {
    if (gameState === 'Playing') {
      resetTimer();
      startTimer();
      // closeAllPopups();
    } else if (gameState === 'Won' || gameState === 'Failed') {
      stopTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]); // resetTimer, startTimer, closeAllPopups are stable from their hooks


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
      setUserPencilMarks({}); // Clear pencil marks for a new game
      setCornerMarks({}); // CLEAR CORNER MARKS
      setIsCornerNoteModeActive(false); // Reset mode
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
  // Toggle Corner Note Mode
  const handleToggleCornerNoteMode = () => {
    setIsCornerNoteModeActive(prev => !prev);
    if (cellContextMenu.visible) { // Close context menu if it's open when mode changes
      closeContextMenuAndResetKeyAction();
    }
  };
  // NEW: Function to set a corner mark value
  const setCellCornerMark = useCallback((row, col, value) => {
    setCornerMarks(prev => ({
      ...prev,
      [`${row}-${col}`]: value,
    }));
  }, []);

  // NEW: Function to clear a corner mark value (e.g., on right-click or when cell is locked)
  const clearCellCornerMark = useCallback((row, col) => {
    setCornerMarks(prev => {
      const newMarks = { ...prev };
      delete newMarks[`${row}-${col}`];
      return newMarks;
    });
  }, []);

  const handleActualRequestHint = useCallback(() => { // Renamed to avoid conflict
    requestHint();
  }, [requestHint]);

  const handleCloseCellContextMenu = useCallback(() => {
    closeContextMenuAction();
  }, [closeContextMenuAction]);

  // --- MODIFIED: handleOpenCellContextMenu ---
  // Now takes cellElement to calculate position
  // --- MODIFIED: handleOpenOrMoveCellContextMenu ---
  const handleOpenOrMoveCellContextMenu = useCallback(
    // Add menuContext: 'main' | 'corner'
    (row, col, cellElement, menuContext = 'main') => {
      if (menuContext === 'main' && (isCellLocked(row, col) || isCellClue(row, col))) {
        closeContextMenuAndResetKeyAction();
        return;
      }
      // For corner notes, we might allow opening even if cell is locked,
      // but the feature spec says corner note disappears when locked, so this check is fine.

      if (isNewGameModalOpen) closeNewGameModal();

      let validNumbersList = null;
      // Filtering might apply differently or not at all for corner notes
      // For now, assume filtering applies the same way.
      if (isFilteringEnabled) {
        if (initialCluesBoard && initialCluesBoard.length === gridSize) {
          validNumbersList = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
        } else {
          validNumbersList = Array.from({ length: gridSize }, (_, i) => i);
        }
      }

      let menuX, menuY;
      // Position calculations (can be refined later if corner box click gives different coords)
      if (cellElement) { // cellElement could be the main cell or the corner box
        const rect = cellElement.getBoundingClientRect();
        const MENU_APPROXIMATE_HEIGHT = 40;
        const MENU_OFFSET_Y = -10;

        if (menuContext === 'corner') {
          // Position relative to the corner box element
          menuX = rect.left + window.scrollX; // Align left with corner box
          menuY = rect.bottom + window.scrollY + 5; // Below corner box
        } else { // 'main'
          const MENU_LEFT_OFFSET_X = -50;
          menuX = rect.left + window.scrollX + MENU_LEFT_OFFSET_X;
          menuY = rect.top + window.scrollY - MENU_APPROXIMATE_HEIGHT + MENU_OFFSET_Y;
        }
      } else {
        menuX = cellContextMenu.x || 0;
        menuY = cellContextMenu.y || 0;
      }

      const cellKey = `${row}-${col}`;
      const pencilMarksForThisCell = userPencilMarks[cellKey] || [];

      // Pass menuContext to openContextMenu
      openContextMenu(menuX, menuY, row, col, validNumbersList, isFilteringEnabled, pencilMarksForThisCell, menuContext);
      setSelectedCell({ row, col }); // Select the main cell regardless
    },
    [
      isCellLocked, isCellClue, closeContextMenuAndResetKeyAction,
      isNewGameModalOpen, closeNewGameModal, isFilteringEnabled,
      initialCluesBoard, gridSize, openContextMenu, cellContextMenu.x, cellContextMenu.y,
      userPencilMarks
    ]
  );

  // --- MODIFIED: handleSelectValueFromContextMenu ---
  const handleSelectValueFromContextMenu = useCallback(
    (value) => {
      const { row: targetRow, col: targetCol, menuContext } = cellContextMenu; // Get menuContext
      if (targetRow !== null && targetCol !== null) {
        if (targetRow >= gridSize || targetCol >= gridSize || targetRow < 0 || targetCol < 0) {
          console.error("Context menu target out of bounds.", { targetRow, targetCol, gridSize });
        } else {
          if (menuContext === 'corner') {
            setCellCornerMark(targetRow, targetCol, value);
          } else { // 'main'
            handleCellInputValue(targetRow, targetCol, value);
          }
        }
      }
      closeContextMenuAndResetKeyAction();
    },
    [cellContextMenu, gridSize, handleCellInputValue, setCellCornerMark, closeContextMenuAndResetKeyAction]
  );

  // Modify handleCellClick
  const handleCellClick = useCallback(
    (row, col, event, cellElement) => { // Receives event and cellElement
      const clickedCellType = cellTypesBoard[row]?.[col];

      // NEW BEHAVIOR FOR 'standard' and 'morphing' cells: Open/Move Menu
      if (clickedCellType === 'morphing' || clickedCellType === 'standard' || clickedCellType === 'flipping') {
        if (cellContextMenu.visible && cellContextMenu.row === row && cellContextMenu.col === col && cellContextMenu.menuContext === 'main') {
          return;
        }
        // Open menu for 'main' cell context
        handleOpenOrMoveCellContextMenu(row, col, cellElement, 'main');
        return; // End here for these cell types
      }

      // --- Logic for other cell types (e.g., FlippingCell if it retains old behavior) ---
      // Or, if all interactive cells should open menu, this section might be removed.

      // Default behavior for clicks NOT on morphing/standard or if menu logic doesn't apply:
      // (This part might need adjustment based on how FlippingCell will behave)

      // If menu is open AND the click is NOT on the cell associated with the menu, close it.
      // This is a general rule that should apply if the click didn't already handle the menu.
      if (cellContextMenu.visible && (cellContextMenu.row !== row || cellContextMenu.col !== col)) {
        closeContextMenuAndResetKeyAction();
      }
      if (isCellLocked(row, col)) {
        setSelectedCell({ row, col });
        return;
      }
      if (gameState !== 'Playing' || isCellClue(row, col)) {
        setSelectedCell(null);
        if (cellContextMenu.visible) closeContextMenuAndResetKeyAction();
        return;
      }
      setSelectedCell({ row, col });
    },
    [
      cellTypesBoard, cellContextMenu, closeContextMenuAndResetKeyAction,
      handleOpenOrMoveCellContextMenu, isCellLocked, gameState, isCellClue,
    ]
  );

  // NEW: Handler for clicking the corner note box itself (to be passed to cell components)
  const handleCornerNoteBoxClick = useCallback(
    (row, col, event, cornerBoxElement) => {
      event.stopPropagation(); // Prevent main cell click
      if (isCellLocked(row, col) || isCellClue(row, col)) return; // Should not be visible anyway if locked/clue

      if (cellContextMenu.visible && cellContextMenu.row === row && cellContextMenu.col === col && cellContextMenu.menuContext === 'corner') {
        // Optional: close if clicking same corner box again while its menu is open
        // closeContextMenuAndResetKeyAction();
        return;
      }
      handleOpenOrMoveCellContextMenu(row, col, cornerBoxElement, 'corner');
    },
    [handleOpenOrMoveCellContextMenu, isCellLocked, isCellClue, cellContextMenu]
  );

  // NEW: Handler for right-clicking the corner note display area (to be passed to cell)
  const handleCornerNoteRightClick = useCallback((row, col, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isCellLocked(row, col) || isCellClue(row, col)) return;

    clearCellCornerMark(row, col);
  }, [clearCellCornerMark, isCellLocked, isCellClue]);

  // Modify toggleLock to also clear corner mark if cell is locked
  const handleToggleLockCell = useCallback(
    (row, col) => {
      const wasLocked = isCellLocked(row, col); // Check before toggle
      toggleLock(row, col); // Original toggleLock from useSudokuGame

      // If the cell is *becoming* locked, clear its corner mark
      // Need to check the state *after* toggleLock has its effect.
      // This is tricky because isCellLocked might not update immediately for this callback.
      // Let's assume toggleLock updates the lockedCells state synchronously enough for the next render.
      // Or, more robustly, if the cell *will be* locked.
      // For now, let's clear it if it *wasn't* locked and now *is* (or vice-versa for unlocking)
      // The simplest for "when user locks a cell, the optional value box should disappear"
      // is to clear it when it becomes locked.
      // If it becomes locked, the `isCellLocked(row,col)` will be true in the *next* render cycle for the cell.
      // The cell itself will hide the corner note display if locked.
      // To clear the *data*, we can do it here.
      if (!wasLocked) { // If it wasn't locked, and toggleLock is called, it will become locked
        clearCellCornerMark(row, col);
      }
    },
    [toggleLock, isCellLocked, clearCellCornerMark]
  );


  // --- NEW: Global click listener to close context menu ---
  useEffect(() => {
    const handleGlobalClickForMenuClose = (event) => {
      if (!cellContextMenu.visible) return;

      // Check if the click is outside the Sudoku grid and also outside the context menu itself
      const gridElement = document.getElementById('canvas-container-main'); // Or more specific grid ID
      const menuElement = document.querySelector('.cell-context-menu'); // Assumes only one menu

      const isClickOutsideGrid = gridElement && !gridElement.contains(event.target);
      const isClickOutsideMenu = menuElement && !menuElement.contains(event.target);

      if (isClickOutsideGrid && isClickOutsideMenu) {
        // Clicked outside of game area and outside of the menu itself
        closeContextMenuAndResetKeyAction();
      } else if (isClickOutsideMenu) {
        // Click was inside grid but outside menu.
        // Check if it was on a clue or locked cell (which should also close the menu)
        // This part is tricky as we don't have row/col from a global click easily.
        // The `handleCellClick` for individual cells should handle closing if it was on a clue/locked.
        // So, this global listener focuses on clicks *truly* outside interactive game elements.

        // More robust: check if the click target is part of the game board cells.
        // If not, and it's outside the menu, close.
        let targetIsCell = false;
        if (gridElement && gridElement.contains(event.target)) {
          let el = event.target;
          while (el && el !== gridElement) {
            if (el.classList.contains('morphing-cell') || el.classList.contains('standard-cell') || el.classList.contains('flipping-cell')) {
              targetIsCell = true;
              break;
            }
            el = el.parentElement;
          }
        }
        // If click is outside menu AND (outside grid OR not on any cell within grid)
        if (isClickOutsideMenu && (isClickOutsideGrid || !targetIsCell)) {
          // If it's a click on a non-interactive part of the grid (but not a cell that would open/move menu)
          // or completely outside the grid.
          // This relies on `handleCellClick` for specific cell interactions.
          // The primary role here is for "click off" behavior.
          // closeContextMenuAndResetKeyAction(); // This might be too aggressive.
          // Let's rely on specific cell clicks to handle menu.
          // This global handler is now mainly for clicks *really* outside.
        }
        // If it's a click on a clue/locked cell, `handleCellClick` will be triggered by that cell
        // and it should call `closeContextMenuAndResetKeyAction` if appropriate.
        // This global handler is more for clicks completely outside interactive elements.
        if (isClickOutsideGrid && isClickOutsideMenu) {
          closeContextMenuAndResetKeyAction();
        }

      }
    };

    // Add listener when component mounts or menu visibility changes
    document.addEventListener('mousedown', handleGlobalClickForMenuClose);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClickForMenuClose);
    };
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyAction]);


  useEffect(() => {
    if (!cellContextMenu.visible) return;
    const closeMenuOnScroll = () => closeContextMenuAndResetKeyAction();
    window.addEventListener('scroll', closeMenuOnScroll, true);
    return () => window.removeEventListener('scroll', closeMenuOnScroll, true);
  }, [cellContextMenu.visible, closeContextMenuAndResetKeyAction]);

  // Keyboard navigation: Removed direct cell value setting.
  // Keyboard input should now probably select a cell and then the user uses the menu.
  // Or, for speed, keyboard could still directly input if menu is NOT open.
  // This part needs careful consideration based on desired UX.
  // For now, let's simplify: keyboard input only works if menu is NOT open.
  const handleKeyDown = useCallback(
    (event) => {
      if (gameState !== 'Playing' || isNewGameModalOpen || cellContextMenu.visible) { // Block if menu is open
        return;
      }
      // ... (rest of handleKeyDown logic for Tab and number input for hoveredCell)
      // Number input logic from original handleKeyDown:
      const { key } = event;
      if (key === 'Tab') { /* ... Tab logic ... */ return; }

      if (hoveredCell && initialCluesBoard.length > 0 && userBoard.length > 0) {
        const { row, col } = hoveredCell;
        const cellType = cellTypesBoard[row]?.[col];
        // Direct keyboard input might bypass the menu for non-morphing cells,
        // or we might decide all input goes via menu.
        // For now, allow direct input if menu is not open.
        if (isCellClue(row, col) || isCellLocked(row, col)) return;

        const internalValue = getInternalValueFromKey(key, gridSize);
        if (internalValue !== null) {
          if (isFilteringEnabled) {
            const validNumbers = getValidNumbersForCell(initialCluesBoard, row, col, gridSize);
            if (validNumbers.includes(internalValue) || internalValue === EMPTY_CELL_VALUE) {
              handleCellInputValue(row, col, internalValue);
            }
          } else {
            handleCellInputValue(row, col, internalValue);
          }
        }
      }
    },
    [ // Add all dependencies
      gameState, isNewGameModalOpen, cellContextMenu.visible, hoveredCell, selectedCell,
      gridSize, initialCluesBoard, userBoard, cellTypesBoard, isCellLocked, isCellClue,
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
            {/* ... sidebars ... */}
            <div id="left-sidebar" className="sidebar">
              <button
                className={`sidebar-button ${isFilteringEnabled ? 'active' : ''}`}
                aria-label="Toggle Value Filtering"
                onClick={handleToggleFilter /* define this handler */}
                title={isFilteringEnabled ? "Disable Clue-Based Filtering" : "Enable Clue-Based Filtering"}
              >
                Filt
              </button>
              <button
                className={`sidebar-button ${hintUsesLeft <= 0 || hintedCells.length > 0 || gameState !== 'Playing' ? 'disabled' : ''}`}
                aria-label="Get Hint"
                onClick={requestHint} // Directly use from hook
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
                    solutionBoard={solutionBoard}
                    cellTypesBoard={cellTypesBoard}
                    selectedCell={selectedCell}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                    onCellClick={handleCellClick} // This now passes (row, col, event, cellElement)
                    // onCellContextMenu: This might be removed or adapted if no cells use right-click for menu
                    gameState={gameState}
                    lockedCells={lockedCells}
                    onToggleLock={toggleLock} // Use from hook
                    // --- NEW PROPS for Corner Notes ---
                    cornerMarks={cornerMarks}
                    isCornerNoteModeActive={isCornerNoteModeActive}
                    onCornerNoteBoxClick={handleCornerNoteBoxClick}
                    onCornerNoteRightClick={handleCornerNoteRightClick}
                    hintedCells={hintedCells}
                    // ---- NEW PROPS FOR HOVER FIX ----
                    cellContextMenuVisible={cellContextMenu.visible}
                    cellContextMenuRow={cellContextMenu.row}
                    cellContextMenuCol={cellContextMenu.col}
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

      {cellContextMenu.visible && cellContextMenu.row !== null && cellContextMenu.col !== null && (
        <CellContextMenu
          // Key should ideally also include menuContext if it affects rendering significantly
          // or if different types of menus might look different. For now, this is probably fine.
          key={`${cellContextMenu.instanceKey}-${cellContextMenu.row}-${cellContextMenu.col}-${cellContextMenu.menuContext}`}
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          gridSize={gridSize}
          onSelectValue={handleSelectValueFromContextMenu} // Now context-aware
          onClose={handleCloseCellContextMenu}
          isFilteringEnabled={cellContextMenu.isFilteringActiveForMenu}
          validNumbersList={cellContextMenu.validNumbersForMenu}
          userPencilMarksForCell={userPencilMarks[`${cellContextMenu.row}-${cellContextMenu.col}`] || []}
          onToggleUserPencilMark={(value) => {
            if (cellContextMenu.row !== null && cellContextMenu.col !== null) {
              toggleUserPencilMark(cellContextMenu.row, cellContextMenu.col, value);
            }
          }}
        // No new props needed for CellContextMenu itself regarding corner note logic directly,
        // as App.jsx handles which function (setCellCornerMark or handleCellInputValue) gets called.
        />
      )}
    </div>
  );
}

export default App;