// src/hooks/useCellContextMenu.js
import { useState, useCallback } from 'react';

const INITIAL_CONTEXT_MENU_STATE = {
  visible: false,
  x: 0,
  y: 0,
  row: null,
  col: null,
  instanceKey: 0,
};

export function useCellContextMenu() {
  const [cellContextMenu, setCellContextMenu] = useState(
    INITIAL_CONTEXT_MENU_STATE
  );

  const openMenu = useCallback((x, y, row, col) => {
    setCellContextMenu((prev) => ({
      visible: true,
      x,
      y,
      row,
      col,
      // Increment key if opening on a new cell or if it was previously hidden
      instanceKey:
        !prev.visible || prev.row !== row || prev.col !== col
          ? prev.instanceKey + 1
          : prev.instanceKey,
    }));
  }, []);

  const closeMenu = useCallback(() => {
    // Simply hides, doesn't increment instanceKey for re-animation by default
    // Useful for when the menu closes itself (e.g., after selection or Esc key)
    setCellContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const closeMenuAndResetKey = useCallback(() => {
    // Hides and increments instanceKey, forcing re-animation if re-opened
    // Useful for external close triggers (scroll, new game, etc.)
    setCellContextMenu((prev) => ({
      ...prev,
      visible: false,
      instanceKey: prev.instanceKey + 1,
    }));
  }, []);

  return {
    cellContextMenu, // The state object
    openMenu, // To open/reposition the menu
    closeMenu, // To close the menu (e.g., from within CellContextMenu.jsx)
    closeMenuAndResetKey, // To close the menu and ensure re-animation on next open
    // setCellContextMenu // Exposing the raw setter for more complex direct manipulations if needed
  };
}
