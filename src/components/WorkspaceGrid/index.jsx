import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useGrid } from '../GridContext';
import GridItem from '../GridItem';

const WorkspaceGrid = () => {
  const { 
    config, 
    items, 
    workspaceSize, 
    setWorkspaceSize, 
    layoutMode, 
    setLayoutMode,
    selectedItems,
    clearSelection
  } = useGrid();
  
  const workspaceRef = useRef(null);
  const gridRef = useRef(null);
  const [showGridLines, setShowGridLines] = useState(true);
  const [isResizingWorkspace, setIsResizingWorkspace] = useState(false);

  const handleWorkspaceClick = useCallback((e) => {
    if (e.target === gridRef.current || e.target === workspaceRef.current) {
      clearSelection();
    }
  }, [clearSelection]);

  const startWorkspaceResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingWorkspace(true);
    document.body.style.cursor = 'nw-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    if (!isResizingWorkspace) return;

    const handleMouseMove = (e) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;

      const rect = workspace.getBoundingClientRect();
      const newWidth = Math.max(400, Math.min(1400, e.clientX - rect.left));
      const newHeight = Math.max(300, Math.min(1000, e.clientY - rect.top));

      setWorkspaceSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizingWorkspace(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingWorkspace, setWorkspaceSize]);

  const gridLines = useMemo(() => {
    if (!showGridLines || layoutMode !== 'grid') return null;
    
    const lines = [];
    const verticalStep = 100 / config.columns;
    const horizontalStep = 100 / config.rows;
    
    for (let i = 1; i < config.columns; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 border-l border-gray-300 pointer-events-none opacity-40"
          style={{ left: `${i * verticalStep}%` }}
        />
      );
    }
    
    for (let i = 1; i < config.rows; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 border-t border-gray-300 pointer-events-none opacity-40"
          style={{ top: `${i * horizontalStep}%` }}
        />
      );
    }
    
    return lines;
  }, [showGridLines, layoutMode, config]);

  const containerStyle = useMemo(() => {
    const baseStyle = {
      width: `${workspaceSize.width}px`,
      height: `${workspaceSize.height}px`,
    };

    if (layoutMode === 'grid') {
      return {
        ...baseStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
        gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        gap: `${config.gap}px`,
      };
    } else {
      return {
        ...baseStyle,
        position: 'relative',
      };
    }
  }, [layoutMode, workspaceSize, config]);

  const renderedItems = useMemo(() => {
    return items.map(item => (
      <GridItem 
        key={item.id} 
        item={item} 
        isSelected={selectedItems.includes(item.id)}
      />
    ));
  }, [items, selectedItems]);

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grid Designer</h1>
          <p className="text-gray-600 mt-1">Create layouts like Figma</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLayoutMode(layoutMode === 'grid' ? 'canvas' : 'grid')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 ${
              layoutMode === 'grid' 
                ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' 
                : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {layoutMode === 'grid' ? 'Grid Mode' : 'Canvas Mode'}
          </button>
          
          {layoutMode === 'grid' && (
            <button
              onClick={() => setShowGridLines(!showGridLines)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {showGridLines ? 'Hide Grid' : 'Show Grid'}
            </button>
          )}
        </div>
      </div>

      <div 
        ref={workspaceRef}
        className="relative bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden"
        data-workspace="true"
        style={{ width: 'fit-content', height: 'fit-content' }}
        onClick={handleWorkspaceClick}
      >
        <div className="relative p-4">
          {layoutMode === 'grid' && showGridLines && (
            <div className="absolute inset-4 pointer-events-none z-10">
              {gridLines}
            </div>
          )}
          
          <div
            ref={gridRef}
            className="relative z-0"
            style={containerStyle}
            onClick={handleWorkspaceClick}
          >
            {renderedItems}
            
            {items.length === 0 && (
              <div className={`flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg transition-all duration-200 ${
                layoutMode === 'grid' ? 'col-span-full row-span-full' : 'absolute inset-0'
              }`}>
                <div className="text-center p-8">
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="font-medium">Empty {layoutMode === 'grid' ? 'Grid' : 'Canvas'}</div>
                  <div className="text-sm mt-1">Add components or images to get started</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize z-20 transition-all duration-200 ${
            isResizingWorkspace 
              ? 'bg-blue-600 opacity-100 w-5 h-5' 
              : 'bg-blue-500 opacity-60 hover:opacity-100 hover:bg-blue-600'
          }`}
          onMouseDown={startWorkspaceResize}
          style={{ clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)' }}
        />
        
        {isResizingWorkspace && (
          <div className="absolute top-4 right-4 bg-black/80 text-white text-xs px-2 py-1 rounded z-30 pointer-events-none">
            {workspaceSize.width} × {workspaceSize.height}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="font-medium">Layout Mode</div>
            <div className="text-purple-600 font-semibold">{layoutMode}</div>
          </div>
          <div>
            <div className="font-medium">Items</div>
            <div className="text-blue-600 font-semibold">{items.length}</div>
          </div>
          <div>
            <div className="font-medium">Selected</div>
            <div className="text-green-600 font-semibold">{selectedItems.length}</div>
          </div>
          <div>
            <div className="font-medium">Size</div>
            <div className="text-orange-600 font-semibold">{workspaceSize.width}×{workspaceSize.height}</div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default React.memo(WorkspaceGrid);