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
      style={{
        position: 'fixed',
        zIndex: 3000,
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        transformOrigin: transformOrigin,
      }}
      className={`cell-context-menu ${isVisible ? 'visible' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {values.map((val) => {
        let isValueAllowed = true;
        if (isFilteringEnabled) {
          if (validNumbersList && Array.isArray(validNumbersList)) {
            isValueAllowed = validNumbersList.includes(val);
          } else {
            isValueAllowed = !isFilteringEnabled; // If filtering is on but no list, nothing is "valid" by filter
          }
        }
        const isDisabledByFilter = isFilteringEnabled ? !isValueAllowed : false;
        return (
          <button
            key={val}
            className={`context-menu-value-button glossy-button ${isDisabledByFilter ? 'disabled-context-option' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleValueSelect(val, isDisabledByFilter);
            }}
            disabled={isDisabledByFilter}
            title={isDisabledByFilter ? `Invalid for this cell` : `Set to ${getDisplayValue(val, gridSize)}`}
          >
            {getDisplayValue(val, gridSize)}
          </button>
        );
      })}
    </div>
  );
}

export default CellContextMenu;