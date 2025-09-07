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

  const cellDimensions = useMemo(() => {
    const cellWidth = (workspaceSize.width - 32 - (config.columns - 1) * config.gap) / config.columns;
    const cellHeight = (workspaceSize.height - 32 - (config.rows - 1) * config.gap) / config.rows;
    return { cellWidth, cellHeight };
  }, [workspaceSize, config]);

  const findAvailablePosition = useCallback((newItem) => {
    const { colSpan = 1, rowSpan = 1 } = newItem;
    
    for (let row = 1; row <= config.rows - rowSpan + 1; row++) {
      for (let col = 1; col <= config.columns - colSpan + 1; col++) {
        const testItem = { ...newItem, col, row, colSpan, rowSpan };
        const hasConflict = items.some(item => hasGridCollision(testItem, item));
        
        if (!hasConflict) {
          return { col, row };
        }
      }
    }
    
    return { col: 1, row: 1 };
  }, [items, config]);

  const addItem = useCallback((template) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      ...template
    };

    if (layoutMode === 'canvas') {
      newItem.x = template.x ?? Math.random() * (workspaceSize.width - (template.width || 200));
      newItem.y = template.y ?? Math.random() * (workspaceSize.height - (template.height || 150));
      newItem.width = template.width || 200;
      newItem.height = template.height || 150;
    } else {
      newItem.colSpan = template.colSpan || 1;
      newItem.rowSpan = template.rowSpan || 1;
      
      const position = findAvailablePosition(newItem);
      newItem.col = position.col;
      newItem.row = position.row;
    }

    setItems(prev => [...prev, newItem]);
    return newItem;
  }, [layoutMode, workspaceSize, findAvailablePosition]);

  const selectItem = useCallback((itemId) => {
    setSelectedItems([itemId]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const updateItem = useCallback((itemId, updates) => {
    setItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return prev;
      
      const newItems = [...prev];
      newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
      return newItems;
    });
  }, []);

  const deleteItem = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  }, []);

  const switchMode = useCallback((newMode) => {
    if (newMode === layoutMode) return;
    
    setItems(prev => prev.map(item => {
      if (newMode === 'grid') {
        if (item.x !== undefined && item.y !== undefined) {
          const col = Math.max(1, Math.min(config.columns, 
            Math.round(item.x / (cellDimensions.cellWidth + config.gap)) + 1));
          const row = Math.max(1, Math.min(config.rows, 
            Math.round(item.y / (cellDimensions.cellHeight + config.gap)) + 1));
          const colSpan = Math.max(1, Math.min(config.columns - col + 1,
            Math.round((item.width || 200) / (cellDimensions.cellWidth + config.gap))));
          const rowSpan = Math.max(1, Math.min(config.rows - row + 1,
            Math.round((item.height || 150) / (cellDimensions.cellHeight + config.gap))));
          
          return { ...item, col, row, colSpan, rowSpan };
        }
      } else {
        if (item.col !== undefined && item.row !== undefined) {
          const x = (item.col - 1) * (cellDimensions.cellWidth + config.gap);
          const y = (item.row - 1) * (cellDimensions.cellHeight + config.gap);
          const width = item.colSpan * cellDimensions.cellWidth + (item.colSpan - 1) * config.gap;
          const height = item.rowSpan * cellDimensions.cellHeight + (item.rowSpan - 1) * config.gap;
          
          return { ...item, x, y, width, height };
        }
      }
      return item;
    }));
    
    setLayoutMode(newMode);
  }, [layoutMode, config, cellDimensions]);

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
    findAvailablePosition
  }), [
    config, workspaceSize, items, layoutMode, cellDimensions, selectedItems,
    selectItem, clearSelection, addItem, updateItem, deleteItem, switchMode, findAvailablePosition
  ]);

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
};


export default GridProvider;