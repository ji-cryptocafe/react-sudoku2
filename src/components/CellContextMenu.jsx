// src/components/CellContextMenu.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getDisplayValue } from '../logic/utils';
import './CellContextMenu.css';

function CellContextMenu({
  x, y, gridSize,
  onSelectValue, // App's handleSelectValueFromContextMenu
  onClose,       // App's handleCloseCellContextMenu
  isFilteringEnabled, validNumbersList,
  userPencilMarksForCell,   // For strike-throughs in menu
  onToggleUserPencilMark, // For strike-throughs in menu
  isCandidateModeActive,      // boolean: Is the app in candidate entry mode?
  selectedCellCandidates,   // array: Numbers already selected as candidates for this cell
}) {
  const menuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: y, left: x });
  const [transformOrigin, setTransformOrigin] = useState('0 0');
  const values = Array.from({ length: gridSize }, (_, i) => i);

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let finalX = x;
      let finalY = y;
      const margin = 10;

      if (x + menuRect.width > window.innerWidth - margin) {
        finalX = window.innerWidth - menuRect.width - margin;
      }
      if (y + menuRect.height > window.innerHeight - margin) {
        finalY = window.innerHeight - menuRect.height - margin;
      }
      finalX = Math.max(margin + window.scrollX, finalX);
      finalY = Math.max(margin + window.scrollY, finalY);

      setMenuPosition({ top: finalY, left: finalX });
      setTransformOrigin(`${x - finalX}px ${y - finalY}px`);
      
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [x, y]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
        setTimeout(onClose, 200); // App's onClose handles auto-population logic
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleLeftClickValueButton = (valToSelect) => {
    onSelectValue(valToSelect); // App's handler knows about candidate mode.
                                // Menu does not close automatically if in candidate mode.
  };

  const handleRightClickValueButton = (event, valToMark) => {
    event.preventDefault();
    onToggleUserPencilMark(valToMark); // Toggles strike-through in menu.
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
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on the menu background itself
    >
      {values.map((val) => {
        if (isFilteringEnabled) {
          if (!validNumbersList || !Array.isArray(validNumbersList) || !validNumbersList.includes(val)) {
            return null; // Skip rendering if filtered out
          }
        }

        const isPencilMarkedDisabled = userPencilMarksForCell && userPencilMarksForCell.includes(val);
        const isCurrentlySelectedAsCandidate = selectedCellCandidates && selectedCellCandidates.includes(val);
        
        let buttonClass = "context-menu-value-button glossy-button";
        if (isPencilMarkedDisabled) {
          buttonClass += " user-pencil-mark-disabled";
        }
        // Apply 'candidate-selected' style if in candidate mode AND this value is a selected candidate
        if (isCandidateModeActive && isCurrentlySelectedAsCandidate) {
          buttonClass += " candidate-selected";
        }

        return (
          <button
            key={val}
            className={buttonClass}
            onClick={(e) => {
              e.stopPropagation();
              // Prevent setting main value if pencil-marked,
              // but allow toggling as a candidate even if pencil-marked.
              if (isPencilMarkedDisabled && !isCandidateModeActive) { 
                return;
              }
              handleLeftClickValueButton(val);
            }}
            onContextMenu={(e) => handleRightClickValueButton(e, val)}
            title={
              isPencilMarkedDisabled
                ? `(Marked off) Right-click to unmark ${getDisplayValue(val, gridSize)}`
                : isCandidateModeActive
                  ? isCurrentlySelectedAsCandidate
                    ? `Remove ${getDisplayValue(val, gridSize)} as candidate (Left-click)`
                    : `Add ${getDisplayValue(val, gridSize)} as candidate (Left-click)`
                  : `Set cell to ${getDisplayValue(val, gridSize)} (Left-click)`
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