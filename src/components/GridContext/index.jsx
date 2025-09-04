import React, { useState, createContext, useContext } from 'react';

// Grid Context for managing global state
const GridContext = createContext();

// Hook for using grid context
export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
};

// Smart collision detection
const hasCollision = (item1, item2) => {
  const item1Right = item1.col + item1.colSpan - 1;
  const item1Bottom = item1.row + item1.rowSpan - 1;
  const item2Right = item2.col + item2.colSpan - 1;
  const item2Bottom = item2.row + item2.rowSpan - 1;

  return !(item1.col > item2Right ||
           item1Right < item2.col ||
           item1.row > item2Bottom ||
           item1Bottom < item2.row);
};

// Smart displacement algorithm
const displaceItems = (items, newItem, excludeId = null, config) => {
  const itemsToCheck = items.filter(item => item.id !== excludeId);
  const displaced = [];

  // Find overlapping items
  const overlapping = itemsToCheck.filter(item => hasCollision(item, newItem));

  // Displace overlapping items downward
  overlapping.forEach(item => {
    let newRow = newItem.row + newItem.rowSpan;

    // Make sure displaced item fits in grid
    if (newRow + item.rowSpan - 1 > config.rows) {
      // If it doesn't fit, try moving it to the right
      let newCol = newItem.col + newItem.colSpan;
      if (newCol + item.colSpan - 1 <= config.columns) {
        displaced.push({ ...item, col: newCol, row: newItem.row });
      } else {
        // If neither works, place it at the bottom
        displaced.push({ ...item, row: newRow });
      }
    } else {
      displaced.push({ ...item, row: newRow });
    }
  });

  return displaced;
};

// Find available position for new item
const findAvailablePosition = (items, item, config) => {
  // Try to place at (1,1) first
  for (let row = 1; row <= config.rows - item.rowSpan + 1; row++) {
    for (let col = 1; col <= config.columns - item.colSpan + 1; col++) {
      const testItem = { ...item, col, row };
      const hasConflict = items.some(existingItem => hasCollision(testItem, existingItem));
      
      if (!hasConflict) {
        return { col, row };
      }
    }
  }

  // If no space, return original position
  return { col: item.col, row: item.row };
};

// Grid Provider Component
const GridProvider = ({ children, initialConfig = {} }) => {
  const [config, setConfig] = useState({
    columns: 4,
    rows: 4,
    gap: 16,
    ...initialConfig
  });

  const [workspaceSize, setWorkspaceSize] = useState({
    width: 800,
    height: 600
  });

  const [items, setItems] = useState([]);

  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedItem: null,
    previewPosition: null
  });

  // Smart item placement with displacement
  const placeItemSmart = (newItem, excludeId = null) => {
    const displaced = displaceItems(items, newItem, excludeId, config);

    setItems(prev => {
      let updatedItems = prev.filter(item => item.id !== excludeId);

      // Remove items that will be displaced
      displaced.forEach(displacedItem => {
        updatedItems = updatedItems.filter(item => item.id !== displacedItem.id);
      });

      // Add the new item and displaced items
      return [...updatedItems, newItem, ...displaced];
    });
  };

  const value = {
    config,
    setConfig,
    workspaceSize,
    setWorkspaceSize,
    items,
    setItems,
    dragState,
    setDragState,
    placeItemSmart,
    findAvailablePosition
  };

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
};

export default GridProvider;