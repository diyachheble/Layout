import React, { useState, createContext, useContext, useCallback, useMemo } from 'react';

const GridContext = createContext();

export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
};

const hasGridCollision = (item1, item2) => {
  if (!item1 || !item2 || item1.id === item2.id) return false;
  
  // Allow text elements to overlap with other elements
  if (item1.type === 'text' || item2.type === 'text') return false;
  
  const item1Right = item1.col + item1.colSpan - 1;
  const item1Bottom = item1.row + item1.rowSpan - 1;
  const item2Right = item2.col + item2.colSpan - 1;
  const item2Bottom = item2.row + item2.rowSpan - 1;

  return !(item1.col > item2Right || item1Right < item2.col || 
           item1.row > item2Bottom || item1Bottom < item2.row);
};

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
  const [selectedItems, setSelectedItems] = useState([]);
  const [layoutMode, setLayoutMode] = useState('canvas');
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedItemId: null
  });

  const cellDimensions = useMemo(() => {
    const cellWidth = (workspaceSize.width - 32 - (config.columns - 1) * config.gap) / config.columns;
    const cellHeight = (workspaceSize.height - 32 - (config.rows - 1) * config.gap) / config.rows;
    return { cellWidth, cellHeight };
  }, [workspaceSize, config]);

  // Fixed grid position conversion functions
  const pixelToGrid = useCallback((x, y) => {
    const col = Math.max(1, Math.min(config.columns, 
      Math.floor(x / (cellDimensions.cellWidth + config.gap)) + 1));
    const row = Math.max(1, Math.min(config.rows, 
      Math.floor(y / (cellDimensions.cellHeight + config.gap)) + 1));
    return { col, row };
  }, [config, cellDimensions]);

  const gridToPixel = useCallback((col, row) => {
    const x = (col - 1) * (cellDimensions.cellWidth + config.gap);
    const y = (row - 1) * (cellDimensions.cellHeight + config.gap);
    return { x, y };
  }, [cellDimensions, config]);

  const findAvailablePosition = useCallback((newItem, excludeId = null) => {
    const { colSpan = 1, rowSpan = 1 } = newItem;
    
    // Filter out the item being dragged to avoid self-collision
    const relevantItems = items.filter(item => item.id !== excludeId);
    
    for (let row = 1; row <= config.rows - rowSpan + 1; row++) {
      for (let col = 1; col <= config.columns - colSpan + 1; col++) {
        const testItem = { ...newItem, col, row, colSpan, rowSpan };
        const hasConflict = relevantItems.some(item => hasGridCollision(testItem, item));
        
        if (!hasConflict) {
          return { col, row };
        }
      }
    }
    
    // If no position is available, return the closest valid position
    return { col: 1, row: 1 };
  }, [items, config]);

  const isValidGridPosition = useCallback((col, row, colSpan, rowSpan, excludeId = null, itemType = null) => {
    // Check boundaries
    if (col < 1 || row < 1 || 
        col + colSpan - 1 > config.columns || 
        row + rowSpan - 1 > config.rows) {
      return false;
    }

    // Check collisions with other items (excluding the one being moved)
    const testItem = { col, row, colSpan, rowSpan, type: itemType };
    const relevantItems = items.filter(item => item.id !== excludeId);
    
    return !relevantItems.some(item => hasGridCollision(testItem, item));
  }, [items, config]);

  const addItem = useCallback((template) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      ...template
    };

    if (layoutMode === 'canvas') {
      newItem.x = template.x ?? Math.random() * Math.max(0, workspaceSize.width - (template.width || 200));
      newItem.y = template.y ?? Math.random() * Math.max(0, workspaceSize.height - (template.height || 150));
      newItem.width = template.width || 200;
      newItem.height = template.height || 150;
    } else {
      newItem.colSpan = Math.max(1, Math.min(config.columns, template.colSpan || 1));
      newItem.rowSpan = Math.max(1, Math.min(config.rows, template.rowSpan || 1));
      
      const position = findAvailablePosition(newItem);
      newItem.col = position.col;
      newItem.row = position.row;
    }

    setItems(prev => [...prev, newItem]);
    return newItem;
  }, [layoutMode, workspaceSize, findAvailablePosition, config]);

  const selectItem = useCallback((itemId) => {
    setSelectedItems([itemId]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const updateItem = useCallback((itemId, updates, skipValidation = false) => {
    setItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return prev;
      
      const currentItem = prev[itemIndex];
      const newItems = [...prev];
      
      // For grid mode, validate position before updating
      if (layoutMode === 'grid' && !skipValidation && 
          (updates.col !== undefined || updates.row !== undefined || 
           updates.colSpan !== undefined || updates.rowSpan !== undefined)) {
        
        const newCol = updates.col ?? currentItem.col;
        const newRow = updates.row ?? currentItem.row;
        const newColSpan = updates.colSpan ?? currentItem.colSpan;
        const newRowSpan = updates.rowSpan ?? currentItem.rowSpan;
        
        if (!isValidGridPosition(newCol, newRow, newColSpan, newRowSpan, itemId, currentItem.type)) {
          // If position is invalid, find the nearest valid position
          const validPosition = findAvailablePosition({
            colSpan: newColSpan,
            rowSpan: newRowSpan,
            type: currentItem.type
          }, itemId);
          
          updates = {
            ...updates,
            col: validPosition.col,
            row: validPosition.row
          };
        }
      }
      
      newItems[itemIndex] = { ...currentItem, ...updates };
      return newItems;
    });
  }, [layoutMode, isValidGridPosition, findAvailablePosition]);

  const deleteItem = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  }, []);

  const setDraggedItem = useCallback((itemId) => {
    setDragState({
      isDragging: !!itemId,
      draggedItemId: itemId
    });
  }, []);

  const switchMode = useCallback((newMode) => {
    if (newMode === layoutMode) return;
    
    setItems(prev => prev.map(item => {
      if (newMode === 'grid') {
        if (item.x !== undefined && item.y !== undefined) {
          const { col, row } = pixelToGrid(item.x, item.y);
          
          // Calculate span based on size
          const colSpan = Math.max(1, Math.min(config.columns - col + 1,
            Math.round((item.width || 200) / (cellDimensions.cellWidth + config.gap))));
          const rowSpan = Math.max(1, Math.min(config.rows - row + 1,
            Math.round((item.height || 150) / (cellDimensions.cellHeight + config.gap))));
          
          // Find valid position if current one conflicts
          const testItem = { col, row, colSpan, rowSpan, type: item.type };
          const hasConflict = prev.some(otherItem => 
            otherItem.id !== item.id && hasGridCollision(testItem, otherItem));
          
          if (hasConflict) {
            const validPosition = findAvailablePosition({ colSpan, rowSpan, type: item.type }, item.id);
            return { ...item, col: validPosition.col, row: validPosition.row, colSpan, rowSpan };
          }
          
          return { ...item, col, row, colSpan, rowSpan };
        }
      } else {
        if (item.col !== undefined && item.row !== undefined) {
          const { x, y } = gridToPixel(item.col, item.row);
          const width = item.colSpan * cellDimensions.cellWidth + (item.colSpan - 1) * config.gap;
          const height = item.rowSpan * cellDimensions.cellHeight + (item.rowSpan - 1) * config.gap;
          
          return { ...item, x, y, width, height };
        }
      }
      return item;
    }));
    
    setLayoutMode(newMode);
  }, [layoutMode, config, cellDimensions, pixelToGrid, gridToPixel, findAvailablePosition]);

  const value = useMemo(() => ({
    config,
    setConfig,
    workspaceSize,
    setWorkspaceSize,
    items,
    setItems,
    layoutMode,
    setLayoutMode: switchMode,
    cellDimensions,
    selectedItems,
    selectItem,
    clearSelection,
    addItem,
    updateItem,
    deleteItem,
    findAvailablePosition,
    isValidGridPosition,
    pixelToGrid,
    gridToPixel,
    dragState,
    setDraggedItem
  }), [
    config, workspaceSize, items, layoutMode, cellDimensions, selectedItems,
    selectItem, clearSelection, addItem, updateItem, deleteItem, switchMode, 
    findAvailablePosition, isValidGridPosition, pixelToGrid, gridToPixel, dragState, setDraggedItem
  ]);

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
};

export default GridProvider;