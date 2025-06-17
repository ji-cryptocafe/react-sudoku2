// src/components/cellTypes/MorphingCell.jsx
import React, { useState, useEffect, useRef as useReactRef } from 'react';
import { getDisplayValue } from '../../logic/utils';
import { EMPTY_CELL_VALUE } from '../../logic/constants';
import './MorphingCell.css';
import './CandidateDisplay.css';

function MorphingCell({
  row, col, initialValue, userValue, solutionValue,
  isSelected, isHovered, isRowHovered, isColHovered, isSubgridHovered,
  onClick, onMouseEnter, gridSize, isLocked, onToggleLock,
  gameState, isHinted,
  cellCandidates, // Array of numbers: e.g., [1, 4, 7]
  isCandidateModeActive,
}) {
  const cellDOMRef = useReactRef(null);
  const isClue = initialValue !== EMPTY_CELL_VALUE;

  const [displayedValueForAnimation, setDisplayedValueForAnimation] = useState(isClue ? initialValue : userValue);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const newEffectiveValue = isClue ? initialValue : userValue;
    if (newEffectiveValue !== displayedValueForAnimation) {
      if (!isClue || (isClue && displayedValueForAnimation === EMPTY_CELL_VALUE && newEffectiveValue !== EMPTY_CELL_VALUE)) {
         setAnimationKey((prevKey) => prevKey + 1);
      }
      setDisplayedValueForAnimation(newEffectiveValue);
    } else if (isClue && initialValue !== displayedValueForAnimation) {
      setDisplayedValueForAnimation(initialValue);
    }
  }, [userValue, initialValue, isClue, displayedValueForAnimation, gameState]);

  let mainClass = 'cell morphing-cell';
  let valueSpanClass = '';
  let mainDisplayContent = '';
  let smallHintContent = '';

  const showCandidates = !isClue && !isLocked && 
                         (cellCandidates && cellCandidates.length > 0) && 
                         userValue === EMPTY_CELL_VALUE;

  if (isClue) {
    mainDisplayContent = getDisplayValue(initialValue, gridSize);
    mainClass += ' clue';
  } else if (userValue !== EMPTY_CELL_VALUE && !showCandidates) {
    mainDisplayContent = getDisplayValue(userValue, gridSize);
    mainClass += ' user-filled';
    if (gameState === 'Failed' && userValue !== solutionValue) {
      valueSpanClass = 'incorrect';
      smallHintContent = getDisplayValue(solutionValue, gridSize);
    }
  } else if (gameState === 'Failed' && !showCandidates && userValue === EMPTY_CELL_VALUE) {
    mainDisplayContent = getDisplayValue(solutionValue, gridSize);
    valueSpanClass = 'hint';
  }

  if (isSelected && !isClue) mainClass += ' selected';
  if (isHovered) mainClass += ' hovered-cell';
  if (isRowHovered && !isHovered) mainClass += ' highlight-row';
  if (isColHovered && !isHovered) mainClass += ' highlight-col';
  if (isSubgridHovered && !isHovered) mainClass += ' highlight-subgrid';
  if (isLocked) mainClass += ' locked';
  if (isHinted && !isClue && userValue === EMPTY_CELL_VALUE && !showCandidates) {
    mainClass += ' hinted-cell-indicator';
  }

  const subgridSize = Math.sqrt(gridSize);
  if ((col + 1) % subgridSize === 0 && col + 1 !== gridSize) mainClass += ' subgrid-border-right';
  if ((row + 1) % subgridSize === 0 && row + 1 !== gridSize) mainClass += ' subgrid-border-bottom';
  if (row === 0) mainClass += ' first-row-cell';
  if (col === 0) mainClass += ' first-col-cell';
  
  // Main cell font size, can be used as a base for candidate font size if needed via CSS vars
  const mainCellFontSizeBase = (450 / gridSize); // Approx pixel size for a 450px grid
  const mainCellActualFontSize = mainCellFontSizeBase * (gridSize === 16 ? 0.6 : 0.7);

  const cellStyle = {
    fontSize: `${mainCellActualFontSize}px`,
    position: 'relative', 
    // Pass the main font size as a CSS variable for candidates to use
    // '--main-cell-font-size': `${mainCellActualFontSize}px`, // Option for precise relative sizing
  };

  const handleMainCellLeftClick = (event) => {
    if (onClick) {
      onClick(row, col, event, cellDOMRef.current);
    }
  };

  const handleMainCellLockClick = (event) => {
    event.stopPropagation();
    if (onToggleLock) onToggleLock();
  };
  const canShowLock = !isClue && userValue !== EMPTY_CELL_VALUE && gameState === 'Playing' && !showCandidates;

  // Determine the class for the candidate grid based on the number of candidates
  let candidateGridClass = "candidate-display-grid";
  const numCandidates = cellCandidates.length;

  if (numCandidates === 1) { // Though usually main value is shown for 1
    candidateGridClass += " candidates-1";
  } else if (numCandidates === 2) {
    candidateGridClass += " candidates-2";
  } else if (numCandidates >= 3 && numCandidates <= 6) { // 3 to 6 candidates
    candidateGridClass += " candidates-3to6";
  } else if (numCandidates > 6) { // 7 to 9 candidates (or more for 16x16)
    candidateGridClass += " candidates-7plus";
  }
  // For 16x16, you might need more granular classes or a different approach if more than 9 candidates are common.


  return (
    <div
      ref={cellDOMRef}
      className={mainClass}
      style={cellStyle}
      onClick={handleMainCellLeftClick}
      onMouseEnter={onMouseEnter}
    >
      {showCandidates ? (
        <div className={candidateGridClass}> {/* Use dynamic class */}
          {cellCandidates.map(candidateVal => (
            <span key={candidateVal} className="candidate-mark">
              {getDisplayValue(candidateVal, gridSize)}
            </span>
          ))}
        </div>
      ) : (
        <span
          key={animationKey}
          className={`value ${valueSpanClass} ${
            !isClue && userValue !== EMPTY_CELL_VALUE ? 'morph-animate' : ''
          }`}
        >
          {mainDisplayContent}
        </span>
      )}

      {smallHintContent && !showCandidates && (
        <span className="small-hint">{smallHintContent}</span>
      )}

      {canShowLock && (
        <div
          className={`lock-icon-container ${isLocked ? 'is-active-lock' : 'is-inactive-lock'}`}
          onClick={handleMainCellLockClick}
          title={isLocked ? 'Unlock cell value' : 'Lock cell value'}
          role="button"
          tabIndex={0}
        >
          🔒
        </div>
      )}
    </div>
  );
}

export default MorphingCell;