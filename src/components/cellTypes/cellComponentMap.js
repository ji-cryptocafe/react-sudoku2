// src/components/cellTypes/cellComponentMap.js
import StandardCell from './StandardCell';
import FlippingCell from './FlippingCell'; // NEW IMPORT

export const cellComponentMap = {
  standard: StandardCell, // Keep if you want to switch back easily
  flipping: FlippingCell, // NEW TYPE
};

export const DefaultCellComponent = StandardCell; // MAKE FLIPPING THE DEFAULT