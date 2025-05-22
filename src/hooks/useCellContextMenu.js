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
    menuContext: 'main', // NEW: 'main' or 'corner'
  });

  // Added userPencilMarks to the signature
  // Added menuContext to the signature
  const openMenu = useCallback((x, y, row, col, validNumbersList, isFilteringActive, userPencilMarks, menuContext = 'main') => {
    setMenuState(prevState => ({
      visible: true,
      x,
      y,
      row,
      col,
      instanceKey: prevState.instanceKey, // Or +1 if always new instance desired
      validNumbersForMenu: validNumbersList,
      isFilteringActiveForMenu: isFilteringActive,
      // userPencilMarksForMenu prop removed from here as App.jsx passes them directly
      menuContext: menuContext, // STORE THE CONTEXT
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
       menuContext: 'main', // Reset context
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
      menuContext: 'main', // Reset context
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