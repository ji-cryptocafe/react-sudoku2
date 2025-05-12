// src/components/cellTypes/cellComponentMap.js
import StandardCell from './StandardCell';
// Import other cell types here in the future
// e.g., import ImageCell from './ImageCell';

export const cellComponentMap = {
  standard: StandardCell,
  // image: ImageCell, // Example for the future
  // Add more cell types here
};

// You might also want a default component if a type is not found
export const DefaultCellComponent = StandardCell;