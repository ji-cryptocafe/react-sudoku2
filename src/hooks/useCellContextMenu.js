// src/hooks/useCellContextMenu.js
import { useState, useCallback } from 'react';

const INITIAL_CONTEXT_MENU_STATE = {
  visible: false,
  x: 0,
  y: 0,
  row: null, // Crucial: row and col must be part of the initial state shape
  col: null,
  instanceKey: 0,
  validNumbersForMenu: null,
  isFilteringActiveForMenu: false,
};

export function useCellContextMenu() {
  const [cellContextMenu, setCellContextMenu] = useState(
    INITIAL_CONTEXT_MENU_STATE
  );

  const openMenu = useCallback((xPos, yPos, cellRow, cellCol, validNumbersList, isFilteringEnabledCurrent) => {
    console.log("[useCellContextMenu] openMenu CALLED WITH:", { xPos, yPos, cellRow, cellCol, validNumbersCount: validNumbersList ? validNumbersList.length : 'null', isFilteringEnabledCurrent });
    
    setCellContextMenu((prev) => {
      // Construct the new state object carefully
      const newState = {
        ...prev, // Spread previous state
        visible: true,
        x: xPos,
        y: yPos,
        row: cellRow, // Explicitly set row
        col: cellCol, // Explicitly set col
        validNumbersForMenu: validNumbersList,
        isFilteringActiveForMenu: isFilteringEnabledCurrent,
        instanceKey:
          !prev.visible || prev.row !== cellRow || prev.col !== cellCol || prev.x !== xPos || prev.y !== yPos
            ? prev.instanceKey + 1
            : prev.instanceKey,
      };
      console.log("[useCellContextMenu] new STATE OBJECT to be set in openMenu:", JSON.stringify(newState));
      return newState;
    });
  }, []); // No dependencies, `openMenu` function identity is stable

  const closeMenu = useCallback(() => {
    console.log("[useCellContextMenu] closeMenu CALLED");
    setCellContextMenu((prev) => {
      const newState = { ...prev, visible: false };
      // console.log("[useCellContextMenu] new STATE OBJECT to be set in closeMenu:", JSON.stringify(newState));
      return newState;
    });
  }, []);

  const closeMenuAndResetKey = useCallback(() => {
    console.log("[useCellContextMenu] closeMenuAndResetKey CALLED");
    setCellContextMenu((prev) => {
      const newState = {
        ...INITIAL_CONTEXT_MENU_STATE, // Reset to initial shape, includes row:null, col:null
        instanceKey: prev.instanceKey + 1,
        visible: false, // ensure visible is false
      };
      console.log("[useCellContextMenu] new STATE OBJECT to be set in closeMenuAndResetKey:", JSON.stringify(newState));
      return newState;
    });
  }, []);

  return {
    cellContextMenu,
    openMenu,
    closeMenu,
    closeMenuAndResetKey,
  };
}