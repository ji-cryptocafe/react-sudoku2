// utils.js
import { EMPTY_CELL_VALUE, HEX_CHARS } from './constants.js';

export function getDisplayValue(internalVal, gridSize) {
  if (internalVal === EMPTY_CELL_VALUE) {
    return '';
  }
  if (internalVal >= 0 && internalVal < gridSize) {
    if (gridSize === 16) {
      return HEX_CHARS[internalVal];
    }
    return (internalVal + 1).toString(); // For 4x4 (1-4) and 9x9 (1-9)
  }
  return '?'; // Should not happen
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const nf = (n, d) => String(n).padStart(d, '0'); // Simple number formatting
  return `${nf(minutes, 2)}:${nf(remainingSeconds, 2)}`;
}

export function calculateBoardDimensions(
  canvasWidth,
  canvasHeight,
  targetBoardSize,
  gridSize
) {
  const padding = (canvasWidth - targetBoardSize) / 2;
  // Ensure board fits within canvas, respecting padding, but not exceeding targetBoardSize
  const actualDisplaySize = Math.min(
    canvasWidth - 2 * Math.max(0, padding),
    canvasHeight - 2 * Math.max(0, padding),
    targetBoardSize
  );
  const cellSize = actualDisplaySize / gridSize;
  const boardXOffset = (canvasWidth - actualDisplaySize) / 2;
  const boardYOffset = (canvasHeight - actualDisplaySize) / 2;
  return { actualDisplaySize, cellSize, boardXOffset, boardYOffset };
}

// Deep copy utility for arrays/objects (simple version)
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
export function getInternalValueFromKey(key, gridSize) {
  const upperKey = key.toUpperCase();
  let value = -1; // Default to an invalid marker

  if (gridSize === 16) {
    // Hex Sudoku (0-F)
    if (upperKey >= '0' && upperKey <= '9') {
      value = parseInt(upperKey, 10);
    } else if (upperKey >= 'A' && upperKey <= 'F') {
      value = upperKey.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    }
  } else {
    // Standard 4x4 or 9x9 (1 to gridSize)
    if (upperKey >= '1' && upperKey <= '9') {
      const parsedVal = parseInt(upperKey, 10);
      if (parsedVal > 0 && parsedVal <= gridSize) {
        value = parsedVal - 1; // Internal representation is 0-indexed
      }
    }
  }

  if (value >= 0 && value < gridSize) {
    return value;
  }
  return null; // Invalid key for this grid or out of range
}
