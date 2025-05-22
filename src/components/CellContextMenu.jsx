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
      const menuRect = menuRef.current.getBoundingClientRect(); // Get actual menu dimensions
      const menuWidth = menuRect.width;
      const menuHeight = menuRect.height;

      // --- Desired position from props (x, y) ---
      // These are the `menuX` and `menuY` calculated in App.jsx's handleOpenOrMoveCellContextMenu
      // which already include offsets like MENU_LEFT_OFFSET_X and MENU_OFFSET_Y.
      // Let's call them `desiredX` and `desiredY` for clarity here.
      let desiredX = x;
      let desiredY = y;

      let finalX = desiredX;
      let finalY = desiredY;

      // --- Viewport boundaries ---
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX; // Important if the page can scroll
      const scrollY = window.scrollY;

      // --- Margins/Paddings from screen edges ---
      const margin = 15; // Minimum space from any edge

      // --- Adjust Y position (vertical) ---
      // If menu goes off bottom
      if (desiredY + menuHeight > viewportHeight + scrollY - margin) {
        finalY = viewportHeight + scrollY - menuHeight - margin;
      }
      // If menu goes off top
      if (desiredY < scrollY + margin) {
        finalY = scrollY + margin;
      }
      // Ensure finalY is at least scrollY + margin (handles cases where menu is taller than viewport)
      finalY = Math.max(scrollY + margin, finalY);


      // --- Adjust X position (horizontal) ---
      // If menu goes off right
      if (desiredX + menuWidth > viewportWidth + scrollX - margin) {
        finalX = viewportWidth + scrollX - menuWidth - margin;
      }
      // If menu goes off left
      if (desiredX < scrollX + margin) {
        finalX = scrollX + margin;
      }
      // Ensure finalX is at least scrollX + margin (handles cases where menu is wider than viewport)
      finalX = Math.max(scrollX + margin, finalX);

      setMenuPosition({ top: finalY, left: finalX });

      // Calculate transform-origin based on the *original click point (props x, y)*
      // relative to the *final menu position (finalX, finalY)*.
      // The props x, y from App.jsx already account for scroll.
      // The original x, y passed to this component are effectively the click point adjusted by initial offsets.
      // So, we need to find where the original desiredX/Y (which is the click point + initial offset)
      // ended up relative to the menu's actual top-left corner.
      
      // The 'x' and 'y' props are already relative to the document (including scroll)
      // because App.jsx calculates them using getBoundingClientRect() and window.scrollX/Y.
      // So, the origin calculation becomes:
      // originX_relative_to_menu = (click_point_x_on_document) - finalX_on_document
      // originY_relative_to_menu = (click_point_y_on_document) - finalY_on_document

      // The `x` and `y` props are the *intended* top-left of the menu.
      // The click point would be `x - MENU_LEFT_OFFSET_X` and `y - (MENU_OFFSET_Y + MENU_APPROXIMATE_HEIGHT)`
      // if we were to reverse App.jsx's calculation.
      // Simpler: use the original `x` and `y` passed to *this component* as the "target point"
      // for the animation origin, as these are what App.jsx calculated as the menu's anchor.

      const originXForTransform = x - finalX;
      const originYForTransform = y - finalY;
      
      setTransformOrigin(`${originXForTransform}px ${originYForTransform}px`);

      const timer = setTimeout(() => setIsVisible(true), 10); // Make visible after position calculation
      return () => clearTimeout(timer);
    }
  }, [x, y]); // Rerun if initial desired x, y change (i.e., menu is opened for a new cell/position)


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
    position: 'fixed', // Fixed position is good for viewport-relative calculations
    zIndex: 3000,
    top: `${menuPosition.top}px`,
    left: `${menuPosition.left}px`,
    transformOrigin: transformOrigin,
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
              if (isPencilMarkedDisabled) {
                return; // Prevent selection
              }
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