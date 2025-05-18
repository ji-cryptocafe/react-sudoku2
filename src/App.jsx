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

  // --- MODIFIED: handleOpenCellContextMenu ---
  // Now takes cellElement to calculate position
  const handleOpenOrMoveCellContextMenu = useCallback(
    (row, col, cellElement) => { // cellElement is the DOM element of the cell
      if (isCellLocked(row, col) || isCellClue(row, col)) {
        closeContextMenuAndResetKeyAction(); // Close if trying to open on locked/clue
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
      
      // Calculate position based on cellElement
      let menuX, menuY;
      const MENU_APPROXIMATE_HEIGHT = 25; // Estimate or calculate dynamically if possible
      const MENU_OFFSET_Y = -5; // How many pixels above the cell
      const MENU_LEFT_OFFSET_X = -50;
      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        // Position menu e.g., bottom-right of the cell or centered
        // For simplicity, let's try to place it near the cell.
        // This might need fine-tuning based on menu size.
        menuX = rect.left + window.scrollX + MENU_LEFT_OFFSET_X; 
        menuY = rect.top - MENU_APPROXIMATE_HEIGHT - MENU_OFFSET_Y + window.scrollY;
      } else {
        // Fallback if cellElement is not available (shouldn't happen with new flow)
        // This part of logic for x,y might be from a direct event.
        // For now, if cellElement isn't passed, we might need a different source for x,y
        // or assume it's an error. For the new flow, cellElement is key.
        console.warn("handleOpenOrMoveCellContextMenu called without cellElement, positioning might be off.");
        menuX = cellContextMenu.x || 0; // Keep previous or default
        menuY = cellContextMenu.y || 0;
      }

      openContextMenu(menuX, menuY, row, col, validNumbersList, isFilteringEnabled);
      setSelectedCell({ row, col }); // Select the cell for which the menu is opened
    },
    [
      isCellLocked, isCellClue, closeContextMenuAndResetKeyAction,
      isNewGameModalOpen, closeNewGameModal, isFilteringEnabled,
      initialCluesBoard, gridSize, openContextMenu, cellContextMenu.x, cellContextMenu.y // Added cellContextMenu x,y as fallback
    ]
  );

  // Modify handleCellClick
  const handleCellClick = useCallback(
    (row, col, event, cellElement) => { // Receives event and cellElement
      const clickedCellType = cellTypesBoard[row]?.[col];

      // NEW BEHAVIOR FOR 'standard' and 'morphing' cells: Open/Move Menu
      if (clickedCellType === 'morphing' || clickedCellType === 'standard' || clickedCellType === 'flipping') {
        if (cellContextMenu.visible && cellContextMenu.row === row && cellContextMenu.col === col) {
          // Optional: If clicking the same cell again while its menu is open,
          // you might want to close it or do nothing.
          // For now, let's assume it does nothing, user must select from menu or click elsewhere.
          // closeContextMenuAndResetKeyAction(); // Example: to close on second click
          return; 
        }
        // Open or move the menu to this cell
        handleOpenOrMoveCellContextMenu(row, col, cellElement);
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
      
      // Fallback selection logic (might be mostly for non-interactive cells or after menu closes)
      if (isCellLocked(row, col)) {
        setSelectedCell({ row, col });
        // If a menu was open for another cell, it should have been closed by the check above.
        return;
      }
      if (gameState !== 'Playing' || isCellClue(row, col)) {
        setSelectedCell(null);
        // If a menu was open, and user clicks a clue, it should close.
        if(cellContextMenu.visible) closeContextMenuAndResetKeyAction();
        return;
      }
      
      // If we reach here, it's a non-morphing/non-standard, non-clue, non-locked cell.
      // What should happen? Original cycleCellValue is removed from useSudokuGame.
      // Perhaps just select it. The keyboard handler would then take over for input if menu isn't open.
      setSelectedCell({ row, col });

    },
    [
      cellTypesBoard, cellContextMenu, closeContextMenuAndResetKeyAction,
      handleOpenOrMoveCellContextMenu, isCellLocked, gameState, isCellClue,
      // No longer using cycleCellValue directly here
    ]
  );
  
  // --- MODIFIED: handleSelectValueFromContextMenu ---
  const handleSelectValueFromContextMenu = useCallback(
    (value) => {
      const { row: targetRow, col: targetCol } = cellContextMenu;
      if (targetRow !== null && targetCol !== null) {
         if (targetRow >= gridSize || targetCol >= gridSize || targetRow < 0 || targetCol < 0) {
            console.error("Context menu target out of bounds.", {targetRow, targetCol, gridSize});
         } else {
            handleCellInputValue(targetRow, targetCol, value);
         }
      }
      closeContextMenuAndResetKeyAction(); // Close menu after selection
    },
    [cellContextMenu, gridSize, handleCellInputValue, closeContextMenuAndResetKeyAction]
  );
   

  const handleToggleLockCell = useCallback(
    (row, col) => {
      toggleLock(row, col); // From hook
    },
    [toggleLock]
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
            while(el && el !== gridElement) {
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
          onClose={handleCloseCellContextMenu} // This is App's handler
          isFilteringEnabled={cellContextMenu.isFilteringActiveForMenu}
          validNumbersList={cellContextMenu.validNumbersForMenu}
        />
      )}
    </div>
  );
}

export default App;