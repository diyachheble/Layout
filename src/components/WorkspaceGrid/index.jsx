import React, { useRef, useState, useEffect } from 'react';
import { useGrid } from '../GridContext';
import GridItem from '../GridItem';

const WorkspaceGrid = () => {
  const { config, items, dragState, setDragState, workspaceSize, setWorkspaceSize, placeItemSmart } = useGrid();
  const gridRef = useRef(null);
  const workspaceRef = useRef(null);
  const [showGridLines, setShowGridLines] = useState(true);
  const [isResizingWorkspace, setIsResizingWorkspace] = useState(false);

  const getGridPosition = (clientX, clientY) => {
    const grid = gridRef.current;
    if (!grid) return null;

    const rect = grid.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cellWidth = (rect.width + config.gap) / config.columns - config.gap;
    const cellHeight = (rect.height + config.gap) / config.rows - config.gap;

    const col = Math.max(1, Math.min(config.columns, Math.floor(x / (cellWidth + config.gap)) + 1));
    const row = Math.max(1, Math.min(config.rows, Math.floor(y / (cellHeight + config.gap)) + 1));

    return { col, row };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!dragState.isDragging) return;

    const position = getGridPosition(e.clientX, e.clientY);
    if (position) {
      setDragState(prev => ({
        ...prev,
        previewPosition: position
      }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const position = getGridPosition(e.clientX, e.clientY);
        
    if (position && dragState.draggedItem) {
      const wouldFit = position.col + dragState.draggedItem.colSpan - 1 <= config.columns &&
                       position.row + dragState.draggedItem.rowSpan - 1 <= config.rows;

      if (wouldFit) {
        const updatedItem = { ...dragState.draggedItem, col: position.col, row: position.row };
        placeItemSmart(updatedItem, dragState.draggedItem.id);
      }
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      previewPosition: null
    });
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
    gridTemplateRows: `repeat(${config.rows}, 1fr)`,
    gap: `${config.gap}px`,
    width: `${workspaceSize.width}px`,
    height: `${workspaceSize.height}px`,
  };

  const generateGridLines = () => {
    const lines = [];
        
    for (let i = 1; i < config.columns; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 border-l border-gray-400 pointer-events-none opacity-30"
          style={{ left: `${(i / config.columns) * 100}%` }}
        />
      );
    }
        
    for (let i = 1; i < config.rows; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 border-t border-gray-400 pointer-events-none opacity-30"
          style={{ top: `${(i / config.rows) * 100}%` }}
        />
      );
    }
        
    return lines;
  };

  const getPreviewStyle = () => {
    if (!dragState.previewPosition || !dragState.draggedItem) return {};

    const colWidth = 100 / config.columns;
    const rowHeight = 100 / config.rows;

    return {
      left: `${(dragState.previewPosition.col - 1) * colWidth}%`,
      top: `${(dragState.previewPosition.row - 1) * rowHeight}%`,
      width: `${dragState.draggedItem.colSpan * colWidth}%`,
      height: `${dragState.draggedItem.rowSpan * rowHeight}%`,
    };
  };

  // Workspace resize functionality
  const startWorkspaceResize = (e) => {
    e.preventDefault();
    setIsResizingWorkspace(true);
  };

  useEffect(() => {
    if (isResizingWorkspace) {
      const handleMouseMove = (e) => {
        const workspace = workspaceRef.current;
        if (!workspace) return;

        const rect = workspace.getBoundingClientRect();
        const newWidth = Math.max(400, e.clientX - rect.left);
        const newHeight = Math.max(300, e.clientY - rect.top);

        setWorkspaceSize({ width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
        setIsResizingWorkspace(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingWorkspace, setWorkspaceSize]);

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grid Designer</h1>
          <p className="text-gray-600 mt-1">Create layouts like Figma</p>
        </div>
                
        <button
          onClick={() => setShowGridLines(!showGridLines)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {showGridLines ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      <div 
        ref={workspaceRef}
        className="relative bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden"
        style={{ width: 'fit-content', height: 'fit-content' }}
      >
        {/* Grid container */}
        <div className="relative p-4">
          {showGridLines && (
            <div className="absolute inset-4 pointer-events-none">
              {generateGridLines()}
            </div>
          )}
                    
          {dragState.previewPosition && (
            <div
              className="absolute bg-blue-200 border-2 border-blue-400 rounded-md opacity-70 pointer-events-none z-10"
              style={{
                ...getPreviewStyle(),
                margin: `${config.gap / 2}px`,
              }}
            />
          )}
                    
          <div
            ref={gridRef}
            className="relative z-0"
            style={gridStyle}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {items.map(item => (
              <GridItem key={item.id} item={item} />
            ))}
                        
            {items.length === 0 && (
              <div className="col-span-full row-span-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center p-8">
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="font-medium">Empty Canvas</div>
                  <div className="text-sm mt-1">Add components or images to get started</div>
                </div>
              </div>
            )}
          </div>
        </div>
                
        {/* Workspace resize handle - RESTORED */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nw-resize opacity-60 hover:opacity-100 transition-opacity"
          onMouseDown={startWorkspaceResize}
        />
      </div>
    </div>
  );
};

export default WorkspaceGrid;