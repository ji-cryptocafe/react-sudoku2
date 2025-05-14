// src/components/CellContextMenu.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getDisplayValue } from '../logic/utils';
import './CellContextMenu.css';

function CellContextMenu({
  x,
  y,
  gridSize,
  onSelectValue,
  onClose,
  isFilteringEnabled, // NEW PROP: boolean, true if filtering is active for this menu instance
  validNumbersList,   // NEW PROP: array of 0-indexed valid numbers, or null/undefined if not filtering or no valid numbers
}) {
  const menuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const values = Array.from({ length: gridSize }, (_, i) => i); // 0-indexed values 0 to gridSize-1

  useEffect(() => {
    // This effect handles initial positioning and fade-in animation
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let finalX = x;
      let finalY = y;

      // Adjust if menu goes off-screen
      if (x + menuRect.width > window.innerWidth - 10) {
        finalX = window.innerWidth - menuRect.width - 10;
      }
      if (y + menuRect.height > window.innerHeight - 10) {
        finalY = window.innerHeight - menuRect.height - 10;
      }
      finalX = Math.max(5, finalX); // Prevent negative coordinates
      finalY = Math.max(5, finalY);

      setMenuPosition({ top: finalY, left: finalX });

      // Set transform origin based on click position relative to menu's final position
      const originX = x - finalX;
      const originY = y - finalY;
      setTransformOrigin(`${originX}px ${originY}px`);

      // Trigger the transition by adding the .visible class after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10); 

      return () => clearTimeout(timer);
    }
  }, [x, y]); // Recalculate only if x or y (click position) changes

  useEffect(() => {
    // This effect handles closing the menu on outside click or Escape key
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsVisible(false); // Start shrink animation
        setTimeout(onClose, 200); // Delay closing to allow animation
      }
    };
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleValueSelect = (val, isDisabled) => {
    if (isDisabled) return; // Prevent action if button is explicitly disabled by filter

    setIsVisible(false); // Start shrink animation
    setTimeout(() => {
      onSelectValue(val); // Actual selection and App state update
    }, 200); // Match CSS transition duration for animation
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
      // Prevent right-click on the menu itself from propagating or opening another browser menu
      onContextMenu={(e) => e.preventDefault()} 
    >
      {values.map((val) => {
        // Determine if this value should be disabled based on filtering props
        let isValueAllowed = true; // Default to allowed
        if (isFilteringEnabled) {
          if (validNumbersList && Array.isArray(validNumbersList)) {
            isValueAllowed = validNumbersList.includes(val);
          } else {
            // If filtering is enabled but validNumbersList is not a valid array,
            // it implies an issue upstream or that all numbers are considered invalid by the filter.
            // For safety, let's assume if validNumbersList is not a proper list, no specific numbers are "valid" by filter.
            // However, App.jsx's handleOpenContextMenu now tries to provide a default list (all numbers)
            // if initialCluesBoard isn't ready, so validNumbersList should ideally always be an array here.
            // If it's explicitly null/undefined AND filtering is on, treat as "no specific numbers allowed by filter".
            isValueAllowed = false; // if filtering and no valid list, assume nothing is allowed via filter
          }
        }
        
        const isDisabledByFilter = isFilteringEnabled ? !isValueAllowed : false;
        
        // Debug log (uncomment to verify props and calculated disabled state)
        /*
        console.log(
          `ContextMenu Button for value ${getDisplayValue(val, gridSize)} (internal: ${val}):\n` +
          `  isFilteringEnabled: ${isFilteringEnabled}\n` +
          `  validNumbersList: ${JSON.stringify(validNumbersList)}\n` +
          `  isValueAllowed (based on list): ${isValueAllowed}\n` +
          `  isDisabledByFilter (final decision): ${isDisabledByFilter}`
        );
        */
        
        return (
          <button
            key={val}
            className={`context-menu-value-button glossy-button ${isDisabledByFilter ? 'disabled-context-option' : ''}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent click from bubbling to menu's clickOutside handler
              handleValueSelect(val, isDisabledByFilter);
            }}
            // HTML 'disabled' attribute for better accessibility and native behavior
            // It will also prevent click events if the browser respects it for buttons.
            disabled={isDisabledByFilter} 
            title={isDisabledByFilter ? `Invalid for this cell (based on clues)` : `Set to ${getDisplayValue(val, gridSize)}`}
          >
            {getDisplayValue(val, gridSize)}
          </button>
        );
      })}
    </div>
  );
}

export default CellContextMenu;