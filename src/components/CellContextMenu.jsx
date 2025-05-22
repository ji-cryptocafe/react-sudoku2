// src/components/CellContextMenu.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getDisplayValue } from '../logic/utils';
import './CellContextMenu.css';

function CellContextMenu({
  x,
  y,
  gridSize,
  onSelectValue,
  onClose, // onClose is now App's handleCloseCellContextMenu
  isFilteringEnabled, // NEW PROP: boolean, true if filtering is active for this menu instance
  validNumbersList,   // NEW PROP: array of 0-indexed valid numbers, or null/undefined if not filtering or no valid numbers
  userPencilMarksForCell, // Array of numbers user has right-clicked for *this* cell
  onToggleUserPencilMark, // Function (value) => void, to call App's toggleUserPencilMark
}) {
  const menuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const values = Array.from({ length: gridSize }, (_, i) => i); // 0-indexed values 0 to gridSize-1

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let finalX = x;
      let finalY = y;

      if (x + menuRect.width > window.innerWidth - 10) finalX = window.innerWidth - menuRect.width - 10;
      if (y + menuRect.height > window.innerHeight - 10) finalY = window.innerHeight - menuRect.height - 10;
      finalX = Math.max(5, finalX);
      finalY = Math.max(5, finalY);

      setMenuPosition({ top: finalY, left: finalX });
      const originX = x - finalX;
      const originY = y - finalY;
      setTransformOrigin(`${originX}px ${originY}px`);

      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [x, y]); // Re-position if x, y (passed from App context menu state) change


  useEffect(() => {
    // The global click listener in App.jsx now handles more complex "outside click" logic.
    // This menu's own outside click should only handle Escape or very direct "off-menu" clicks
    // that App.jsx might not easily catch as "not on a cell".

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
        setTimeout(onClose, 200); // Call App's close handler
      }
    };

    // This mousedown listener on document is now primarily for clicks that are *not* on game cells
    // or other interactive elements that App.jsx would handle.
    // App.jsx's global listener will be more specific.
    const handleClickTrulyOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            // This condition means the click was outside the menu itself.
            // App.jsx's global mousedown listener will determine if this click
            // should truly close the menu (e.g., click on body) or if it was on another cell
            // (which App.jsx's handleCellClick would manage, potentially moving the menu).
            // For safety, if this component's direct outside click fires,
            // and App.jsx doesn't intervene to "move" it, it implies a general close.
            // However, to avoid race conditions or double-closing, we can let App.jsx's
            // global listener be the primary decider for "outside" clicks.
            // This local one is now mainly for ESC.
        }
    };

    // document.addEventListener('mousedown', handleClickTrulyOutside); // Temporarily disable direct outside click here
    document.addEventListener('keydown', handleEscKey);
    return () => {
      // document.removeEventListener('mousedown', handleClickTrulyOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]); // onClose is App's handleCloseCellContextMenu

  const handleValueSelect = (val, isDisabled) => {
    if (isDisabled) return;
    setIsVisible(false);
    setTimeout(() => onSelectValue(val), 180); // Shortened to allow quicker state update in App
  };

  // NEW: Handler for right-clicking a value button
  const handleRightClickValue = (event, val) => {
    event.preventDefault(); // Prevent native browser context menu
    onToggleUserPencilMark(val); // Call the callback passed from App.jsx
    // Do NOT close the menu or select the value for the grid
  };

  const menuStyle = {
    position: 'fixed',
    zIndex: 3000,
    top: `${menuPosition.top}px`,
    left: `${menuPosition.left}px`,
    transformOrigin: transformOrigin, // Dynamically set origin
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className={`cell-context-menu ${isVisible ? 'visible' : ''}`}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on the menu background
    >
      {values.map((val) => {
        // Logic to skip rendering if filtering is on and number is invalid
        if (isFilteringEnabled) {
          if (!validNumbersList || !Array.isArray(validNumbersList) || !validNumbersList.includes(val)) {
            return null;
          }
        }

        // Check if this value is in the user's pencil marks for the current cell
        const isPencilMarkedDisabled = userPencilMarksForCell && userPencilMarksForCell.includes(val);
        
        let buttonClass = "context-menu-value-button glossy-button";
        if (isPencilMarkedDisabled) {
          buttonClass += " user-pencil-mark-disabled"; // New class for styling
        }

        return (
          <button
            key={val}
            className={buttonClass}
            onClick={(e) => { // Left click still selects the value
              e.stopPropagation();
              // If you want to PREVENT selection if it's pencil-marked disabled:
              // if (isPencilMarkedDisabled) return; 
              handleValueSelect(val);
            }}
            onContextMenu={(e) => handleRightClickValue(e, val)} // NEW: Handle right-click
            title={
              isPencilMarkedDisabled
                ? `Unmark ${getDisplayValue(val, gridSize)} as possibility (Right-click)`
                : `Mark ${getDisplayValue(val, gridSize)} as NOT a possibility (Right-click)\nSet to ${getDisplayValue(val, gridSize)} (Left-click)`
            }
          >
            {getDisplayValue(val, gridSize)}
          </button>
        );
      })}
    </div>
  );
}

export default CellContextMenu;