// src/hooks/useCellContextMenu.js
import { useState, useCallback } from 'react';

export const useCellContextMenu = () => {
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    row: null,
    col: null,
    instanceKey: 0,
    validNumbersForMenu: null,
    isFilteringActiveForMenu: false,
    // userPencilMarksForMenu: [], // NEW: Store pencil marks for the current menu instance
  });

  // Added userPencilMarks to the signature
  const openMenu = useCallback((x, y, row, col, validNumbersList, isFilteringActive, userPencilMarks) => {
    setMenuState(prevState => ({
      visible: true,
      x,
      y,
      row,
      col,
      // instanceKey: prevState.instanceKey + 1, // Key change might not be needed if props themselves cause re-render
      // Let's rely on props changing in CellContextMenu or App.jsx's key for CellContextMenu itself.
      // Forcing a new key for the menu on *every* open isn't ideal if only notes changed for *another* cell.
      // App.jsx's key on CellContextMenu will now include stringified notes for *this* menu instance.
      instanceKey: prevState.instanceKey, // Keep same key unless specifically reset
      validNumbersForMenu: validNumbersList,
      isFilteringActiveForMenu: isFilteringActive,
     }));
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState(prevState => ({
      ...prevState,
      visible: false,
      row: null,
      col: null,
      validNumbersForMenu: null,
      isFilteringActiveForMenu: false,
       // instanceKey: prevState.instanceKey + 1, // Increment key on close to ensure clean state if reopened
    }));
  }, []);

  const closeMenuAndResetKey = useCallback(() => {
    setMenuState(prevState => ({
      visible: false,
      x: 0,
      y: 0,
      row: null,
      col: null,
      instanceKey: prevState.instanceKey + 1, // Force a new key for a full reset
      validNumbersForMenu: null,
      isFilteringActiveForMenu: false,
     }));
  }, []);
  
  // Function to update only the pencil marks for an already open menu
  // This is useful if toggleUserPencilMark is called and we want the open menu to reflect it immediately
  // However, the current App.jsx logic passes fresh notes on each open, and the key on <CellContextMenu>
  // ensures it re-renders if those notes change. So, this specific function might not be strictly necessary
  // if App.jsx's keying of CellContextMenu is robust.
  // Let's hold off on this unless proven necessary.
  /*
  const updateUserPencilMarksInMenu = useCallback((newPencilMarks) => {
    if (menuState.visible) {
      setMenuState(prevState => ({
        ...prevState,
        userPencilMarksForMenu: newPencilMarks || [],
        instanceKey: prevState.instanceKey + 1, // Force re-render of menu
      }));
    }
  }, [menuState.visible]);
  */

  return {
    cellContextMenu: menuState,
    openMenu,
    closeMenu,
    closeMenuAndResetKey,
    // updateUserPencilMarksInMenu, // Expose if needed
  };
};