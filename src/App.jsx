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
      
      const cellRect = cellElement.getBoundingClientRect();
      const approximateMenuWidth = 250; // Estimate, or get from a ref if consistently sized. 
                                        // A rough estimate is often fine here.
      const spaceRight = window.innerWidth - cellRect.right;
      const spaceLeft = cellRect.left;

      let menuX, menuY;
      const MENU_APPROXIMATE_HEIGHT = 40; // Updated estimate for scaled menu
      const MENU_VERTICAL_OFFSET = -10; // How many pixels above the cell to start the menu
      const MENU_HORIZONTAL_OFFSET_IDEAL = -50; // e.g. try to open 10px to the right of the cell
      const MENU_HORIZONTAL_OFFSET_SHIFT_LEFT = -approximateMenuWidth + cellRect.width - 10; // to position right edge of menu near right edge of cell

      menuY = cellRect.top + window.scrollY + MENU_VERTICAL_OFFSET - MENU_APPROXIMATE_HEIGHT;

      // Decide initial X based on space
      if (spaceRight >= approximateMenuWidth + MENU_HORIZONTAL_OFFSET_IDEAL) {
        // Enough space to the right, position it standardly (e.g., slightly to the right of cell)
        menuX = cellRect.left + window.scrollX + MENU_HORIZONTAL_OFFSET_IDEAL;
      } else if (spaceLeft >= approximateMenuWidth) {
        // Not enough space to the right, but enough to the left to place the menu fully to the left of the cell
        menuX = cellRect.left + window.scrollX - approximateMenuWidth - 10; // 10px gap
      } else {
        // Try to align menu's right edge with cell's right edge (or slightly offset)
        // This is effectively what MENU_LEFT_OFFSET_X = -50 was trying to do if menu width ~70-80px
        // menuX = cellRect.right + window.scrollX - approximateMenuWidth - 10; // Puts menu mostly to left
        // A common strategy is to align the right edge of the menu with the right edge of the cell if opening left
        menuX = cellRect.right + window.scrollX - approximateMenuWidth;
        // The original MENU_LEFT_OFFSET_X = -50 was trying to position it relative to the cell's left.
        // If cell is on right edge, and menu is, say, 200px wide, cell is 50px wide:
        // ideal x = cell.left - 50. 
        // If cell.left is viewportWidth - 50, then menu.left = viewportWidth - 100.
        // If menu is 200px, menu.right = viewportWidth - 100 + 200 = viewportWidth + 100 (off screen).
        // The old logic relied on CellContextMenu to fix it.
        // Let's use the more robust CellContextMenu correction but App.jsx can provide a better starting desiredX.
        // A common pattern is to try opening to bottom-right, then bottom-left, then top-right, then top-left.
        // For a horizontal menu like this, it's mostly about left/right of the cell.
        // Default to opening with its left edge near the cell's left edge, slightly offset.
        // The fixed MENU_LEFT_OFFSET_X = -50 was an attempt at opening it centered or to the left.
        // Let's assume for now the CellContextMenu's own correction is primary.
        // The `x` passed to CellContextMenu should be the *desired menu.left*.
        // App.jsx provides an initial guess.
        const PREFERRED_MENU_LEFT_OFFSET = -50; // The previous value
        menuX = cellRect.left + window.scrollX + PREFERRED_MENU_LEFT_OFFSET;
        // menuY is already calculated above.
      }

      // The CellContextMenu's internal logic will then ensure it stays fully on screen.
      const cellKey = `${row}-${col}`;
      const pencilMarksForThisCell = userPencilMarks[cellKey] || []; // Get current pencil marks for this cell

      // Pass pencilMarksForThisCell to openContextMenu
      openContextMenu(menuX, menuY, row, col, validNumbersList, isFilteringEnabled, pencilMarksForThisCell);
      setSelectedCell({ row, col });
    },
    [
      isCellLocked, isCellClue, closeContextMenuAndResetKeyAction,
      isNewGameModalOpen, closeNewGameModal, isFilteringEnabled,
      initialCluesBoard, gridSize, openContextMenu, cellContextMenu.x, cellContextMenu.y,
      userPencilMarks // ADDED userPencilMarks as dependency
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
          // SIMPLIFIED KEY: Identifies the menu instance primarily by the cell it's for and its instanceKey from the hook.
          // The instanceKey from useCellContextMenu is incremented only on full close/reset,
          // which is appropriate for forcing a fresh mount.
          key={`${cellContextMenu.instanceKey}-${cellContextMenu.row}-${cellContextMenu.col}`}
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          gridSize={gridSize}
          onSelectValue={handleSelectValueFromContextMenu}
          onClose={handleCloseCellContextMenu}
          isFilteringEnabled={cellContextMenu.isFilteringActiveForMenu}
          validNumbersList={cellContextMenu.validNumbersForMenu}
          // Pass a new array reference for userPencilMarksForCell if it exists
          userPencilMarksForCell={ // Ensure this is a new array reference if possible for React's shallow comparison
            // This already gets a new array from the `userPencilMarks` state update due to how
            // `toggleUserPencilMark` constructs its new state.
            userPencilMarks[`${cellContextMenu.row}-${cellContextMenu.col}`] || []
          }
          onToggleUserPencilMark={(value) => {
            if (cellContextMenu.row !== null && cellContextMenu.col !== null) {
              toggleUserPencilMark(cellContextMenu.row, cellContextMenu.col, value);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;