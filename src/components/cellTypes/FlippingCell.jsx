// src/components/cellTypes/FlippingCell.jsx
import React, { useState, useEffect, useRef as useReactRef } from 'react';
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
    // onCellContextMenu, // This prop now expects (event, row, col) from SudokuGrid
    gridSize,
    isLocked,
    onToggleLock,
    gameState,
    isHinted,
}) {
  const cellOuterRef = useReactRef(null); // Ref for the outermost div for positioning
  const isClue = initialValue !== EMPTY_CELL_VALUE;
  const currentValueFromProps = isClue ? initialValue : userValue;

  const [frontFaceValue, setFrontFaceValue] = useState(currentValueFromProps);
  const [backFaceValue, setBackFaceValue] = useState(currentValueFromProps);
  const [rotation, setRotation] = useState(0);
  const prevValueRef = useReactRef(currentValueFromProps);

  useEffect(() => {
      const newValueFromProps = isClue ? initialValue : userValue;

      if (prevValueRef.current !== newValueFromProps && !isClue) {
          setBackFaceValue(newValueFromProps);
          setRotation(prev => prev + 180);
          const animationDuration = 600;
          const timer = setTimeout(() => {
              setFrontFaceValue(newValueFromProps);
          }, animationDuration);
          prevValueRef.current = newValueFromProps;
          return () => clearTimeout(timer);
      } else {
          if (frontFaceValue !== newValueFromProps) setFrontFaceValue(newValueFromProps);
          if (backFaceValue !== newValueFromProps) setBackFaceValue(newValueFromProps);
          if (prevValueRef.current !== newValueFromProps) prevValueRef.current = newValueFromProps;
      }
  }, [userValue, initialValue, isClue, frontFaceValue, backFaceValue, gameState]);

  let outerWrapperClasses = 'flipping-cell-outer-wrapper';
  if (isHovered) outerWrapperClasses += ' hovered-cell';
  if (isRowHovered && !isHovered) outerWrapperClasses += ' highlight-row';
  if (isColHovered && !isHovered) outerWrapperClasses += ' highlight-col';
  if (isSubgridHovered && !isHovered) outerWrapperClasses += ' highlight-subgrid';
  if (isHinted && !isClue && userValue === EMPTY_CELL_VALUE) {
      outerWrapperClasses += ' hinted-cell-indicator';
  } 

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
      if (isHinted && !isClue && (isFront ? frontFaceValue : backFaceValue) === EMPTY_CELL_VALUE) {
          classes += ' hinted-cell-indicator-face';
      }
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


    const handleCellLeftClick = (event) => {
      // This is the onClick prop from App.jsx (handleCellClick)
      if (onClick) {
          onClick(row, col, event, cellOuterRef.current); // Pass row, col, event, and the outer div's ref
      }
  };
    // Removed handleContextMenuInternal and handleMouseDown as right-click is removed for menu.
    // Lock icon logic remains the same.
    const canShowLock = !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing';

    return (
    <div
        ref={cellOuterRef} // Attach ref to the outermost wrapper
        className={outerWrapperClasses}
        onClick={handleCellLeftClick} // Use the new handler for left click
        onMouseEnter={onMouseEnter}
        // onMouseDown: Removed if it was only for right-click menu
        // onContextMenu: Removed as per requirement
        style={{ cursor: isClue ? 'default' : 'pointer', position: 'relative' }}
    >
        <div className="flipping-cell-scene">
        <div
            className="flipping-cell-flipper"
            style={{ transform: `rotateX(${rotation}deg)` }}
        >
            <div className={getFaceClasses(true)}>{renderFaceContent(frontFaceValue)}</div>
            <div className={getFaceClasses(false)}>{renderFaceContent(backFaceValue)}</div>
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