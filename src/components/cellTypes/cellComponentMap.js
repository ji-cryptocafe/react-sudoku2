// src/components/cellTypes/cellComponentMap.js
import StandardCell from './StandardCell'; // Assuming StandardCell.jsx is in the same directory
import FlippingCell from './FlippingCell'; // Assuming FlippingCell.jsx is in the same directory
import MorphingCell from './MorphingCell'; // Import the new cell type

export const cellComponentMap = {
  standard: StandardCell,
  flipping: FlippingCell,
  morphing: MorphingCell, // Add the new mapping
};

// DefaultCellComponent can remain StandardCell or be changed if desired
export const DefaultCellComponent = FlippingCell;