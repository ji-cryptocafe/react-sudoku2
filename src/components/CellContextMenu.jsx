// src/components/CellContextMenu.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getDisplayValue } from '../logic/utils';
import './CellContextMenu.css';

function CellContextMenu({
  x, // Click X coordinate (relative to viewport)
  y, // Click Y coordinate (relative to viewport)
  gridSize,
  onSelectValue,
  onClose,
}) {
  const menuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false); // For controlling the .visible class
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const values = Array.from({ length: gridSize }, (_, i) => i); // Values 0 to gridSize-1

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let finalX = x;
      let finalY = y;

      // Adjust if menu goes off-screen (simple adjustment)
      if (x + menuRect.width > window.innerWidth - 10) {
        finalX = window.innerWidth - menuRect.width - 10;
      }
      if (y + menuRect.height > window.innerHeight - 10) {
        finalY = window.innerHeight - menuRect.height - 10;
      }
      // Prevent negative coordinates
      finalX = Math.max(5, finalX);
      finalY = Math.max(5, finalY);

      setMenuPosition({ top: finalY, left: finalX });

      // Calculate transform origin relative to the menu's top-left corner
      // This makes the menu appear to grow from the point where the mouse clicked.
      // x and y are click coords, finalX and finalY are menu's top-left.
      const originX = x - finalX;
      const originY = y - finalY;
      setTransformOrigin(`${originX}px ${originY}px`);

      // Trigger the transition by adding the .visible class after a short delay
      // This ensures the initial state (opacity 0, scale 0.5) is rendered first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10); // Small delay, like one frame

      return () => clearTimeout(timer);
    }
  }, [x, y]); // Recalculate only if x or y (click position) changes

  useEffect(() => {
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

  const handleValueSelect = (val) => {
    setIsVisible(false); // Start shrink animation
    setTimeout(() => {
      onSelectValue(val); // Actual selection and App state update happens after animation
      // onClose will be called by App.jsx's handleSelectValueFromContextMenu
    }, 200); // Match CSS transition duration
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
    >
      {values.map((val) => (
        <button
          key={val}
          className="context-menu-value-button glossy-button"
          onClick={(e) => {
            e.stopPropagation();
            handleValueSelect(val);
          }}
          title={`Set to ${getDisplayValue(val, gridSize)}`}
        >
          {getDisplayValue(val, gridSize)}
        </button>
      ))}
    </div>
  );
}

export default CellContextMenu;
