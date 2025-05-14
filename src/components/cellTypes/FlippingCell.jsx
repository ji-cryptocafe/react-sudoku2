// src/components/cellTypes/FlippingCell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getDisplayValue } from '../../logic/utils';
import { EMPTY_CELL_VALUE } from '../../logic/constants';
import './FlippingCell.css';

function FlippingCell({
    // ...props...
    row,
    col,
    initialValue,
    userValue,
    solutionValue,
    isSelected,
    isHovered,
    isRowHovered,
    isColHovered,
    isSubgridHovered,
    onClick,
    onMouseEnter,
    onCellContextMenu, // This prop now expects (event, row, col) from SudokuGrid
    gridSize,
    isLocked,
    onToggleLock,
    gameState,
}) {
    const isClue = initialValue !== EMPTY_CELL_VALUE;
    const currentValue = isClue ? initialValue : userValue; // The "true" current value based on props

    // State for the content of the front face (starts matching initial prop)
    const [frontFaceValue, setFrontFaceValue] = useState(currentValue);
    // State for the content of the back face (will be updated immediately on change)
    const [backFaceValue, setBackFaceValue] = useState(currentValue);
    // State for rotation
    const [rotation, setRotation] = useState(0);

    // Ref to track the previous "true" value from props
    const prevValueRef = useRef(currentValue);

    useEffect(() => {
        const newValue = isClue ? initialValue : userValue; // Get the latest value from props

        // Only trigger flip logic if the actual value has changed
        if (prevValueRef.current !== newValue && !isClue) {

            // --- START FLIP ---
            // 1. PRESET BACK FACE: Update the state for the back face immediately
            setBackFaceValue(newValue);

            // 2. START ANIMATION: Trigger the rotation
            setRotation(prev => prev + 180);

            // 3. DELAY FRONT FACE CONTENT UPDATE:
            // Schedule the front face state to update *after* the animation.
            // This ensures the front face shows the OLD value while flipping away.
            const animationDuration = 600; // Match CSS
            const timer = setTimeout(() => {
                setFrontFaceValue(newValue);
            }, animationDuration);

            // 4. Update the ref *after* scheduling updates
            prevValueRef.current = newValue;

            // 5. Cleanup timeout
            return () => clearTimeout(timer);

        } else {
             // --- NO FLIP - Ensure states are synced if props change without a flip ---
             // (e.g., initial load, clue changes, non-animation updates)
             if (frontFaceValue !== newValue) {
                setFrontFaceValue(newValue);
             }
             if (backFaceValue !== newValue) {
                 setBackFaceValue(newValue);
             }
             // Update ref if value changed without flipping (e.g. clue update)
             if (prevValueRef.current !== newValue) {
                 prevValueRef.current = newValue;
             }
        }

    }, [userValue, initialValue, isClue, frontFaceValue, backFaceValue, gameState]); // Added states to deps for sync logic
    // Note: Adding front/backFaceValue to deps ensures the sync logic in the 'else' runs if needed.


    // --- Rendering logic remains largely the same, but uses frontFaceValue/backFaceValue ---

    const getFaceClasses = (isFront) => {
        let classes = 'flipping-cell-face';
        const subgridSize = Math.sqrt(gridSize);
        if (isClue) classes += ' clue-face';
        if (isSelected && !isClue) classes += ' selected-face';
        if (isLocked) classes += ' locked-face';
        if ((col + 1) % subgridSize === 0 && col + 1 !== gridSize) classes += ' subgrid-border-right-face';
        if ((row + 1) % subgridSize === 0 && row + 1 !== gridSize) classes += ' subgrid-border-bottom-face';
        if (row === 0) classes += ' first-row-face';
        if (col === 0) classes += ' first-col-face';
        classes += isFront ? ' flipping-cell-face-front' : ' flipping-cell-face-back';
        return classes;
    };

    const renderFaceContent = (internalValToRender) => {
        // This function remains the same as before, using internalValToRender
        let displayContent = '';
        let valueTextClass = '';
        let smallHintContent = '';
        const fontSizeBase = 450 / gridSize;
        const valueStyle = { fontSize: `${fontSizeBase * (gridSize === 16 ? 0.45 : 0.5)}px`, color: '' };
        const smallHintStyle = { fontSize: `${fontSizeBase * (gridSize === 16 ? 0.35 : 0.5)}px` };

        if (isClue) {
          displayContent = getDisplayValue(initialValue, gridSize);
          valueStyle.fontWeight = 'bold';
          valueStyle.color = '#333';
        } else {
          if (internalValToRender !== EMPTY_CELL_VALUE) {
            displayContent = getDisplayValue(internalValToRender, gridSize);
            valueTextClass = 'user-filled-text';
            valueStyle.color = '#007bff';
            // Check correctness based on the actual committed userValue prop
            if (gameState === 'Failed' && userValue !== solutionValue) {
                 // Only add 'incorrect' styling if the value *being displayed* is wrong
                 if (internalValToRender !== solutionValue) {
                    valueTextClass += ' incorrect';
                    valueStyle.color = '#dc3545';
                    valueStyle.textDecoration = 'line-through';
                    smallHintContent = getDisplayValue(solutionValue, gridSize);
                 }
            }
          } else if (gameState === 'Failed') {
            displayContent = getDisplayValue(solutionValue, gridSize);
            valueTextClass = 'hint';
            valueStyle.color = '#28a745';
            valueStyle.fontWeight = 'bold';
          }
        }
        return (
          <div className="value-container">
            <span className={`value ${valueTextClass}`} style={valueStyle}>{displayContent}</span>
            {smallHintContent && <span className="small-hint" style={smallHintStyle}>{smallHintContent}</span>}
          </div>
        );
    };


    const handleContextMenu = (event) => {
        if (!isClue && gameState === 'Playing' && onCellContextMenu) {
          event.preventDefault();
          onCellContextMenu(event.clientX, event.clientY, row, col);
        }
      };
    
      const handleMouseDown = (event) => {
        if (
          event.button === 2 &&
          !isClue &&
          gameState === 'Playing' &&
          onCellContextMenu
        ) {
          event.stopPropagation();
        }
      };

      const handleContextMenuInternal = (event) => {
        // Props `row` and `col` for this cell instance
        console.log(`[FlippingCell R${row}C${col}] handleContextMenuInternal. Cell's own props: row=${row}, col=${col}`);
        if (!isClue && gameState === 'Playing') {
            event.preventDefault(); 
            if (onCellContextMenu) { // This is the prop from SudokuGrid
                console.log(`[FlippingCell R${row}C${col}] Calling onCellContextMenu prop with event, and its own row=${row}, col=${col}`);
                onCellContextMenu(event, row, col); 
            }
        }
    };

    // --- Outer wrapper and JSX structure remain the same ---
      let outerWrapperClasses = 'flipping-cell-outer-wrapper';
      if (isHovered) outerWrapperClasses += ' hovered-cell';
      if (isRowHovered && !isHovered) outerWrapperClasses += ' highlight-row';
      if (isColHovered && !isHovered) outerWrapperClasses += ' highlight-col';
      if (isSubgridHovered && !isHovered) outerWrapperClasses += ' highlight-subgrid';

      const handleOuterClick = () => { if (!isClue && onClick) onClick(); };
      const canShowLock = !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';

      return (
        <div
          className={outerWrapperClasses}
          onClick={handleOuterClick}
          onMouseEnter={onMouseEnter}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenuInternal} // Use the internal handler
          style={{ cursor: isClue ? 'default' : 'pointer',
                position: 'relative' 
            }}
        >
          <div className="flipping-cell-scene">
            <div
              className="flipping-cell-flipper"
              style={{ transform: `rotateX(${rotation}deg)` }}
            >
              <div className={getFaceClasses(true)}> {/* Front Face */}
                {renderFaceContent(frontFaceValue)} {/* Use frontFaceValue state */}
              </div>
              <div className={getFaceClasses(false)}> {/* Back Face */}
                {renderFaceContent(backFaceValue)} {/* Use backFaceValue state */}
              </div>
            </div>
          </div>
          {canShowLock && (
            <div
              style={{ position: 'absolute', top: 0, right: 0, zIndex: 15 }}
              className={`lock-icon-container ${isLocked ? 'is-active-lock' : 'is-inactive-lock'}`}
              onClick={(e) => { e.stopPropagation(); if (onToggleLock) onToggleLock(); }}
              title={isLocked ? 'Unlock cell value' : 'Lock cell value'} role="button" tabIndex={0}
            >🔒</div>
          )}
        </div>
      );
}

export default FlippingCell;