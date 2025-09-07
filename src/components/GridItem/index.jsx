import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { useGrid } from '../GridContext';

const GridItem = ({ item, isSelected }) => {
  const { 
    updateItem, 
    deleteItem, 
    selectItem,
    layoutMode, 
    workspaceSize,
    config,
    cellDimensions
  } = useGrid();
  
  const itemRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState({ 
    x: item.x || 0, 
    y: item.y || 0 
  });
  const [currentSize, setCurrentSize] = useState({
    width: item.width || 200,
    height: item.height || 150
  });
  const [gridDragStart, setGridDragStart] = useState(null);

  useEffect(() => {
    if (!isDragging && !isResizing) {
      setCurrentPosition({ x: item.x || 0, y: item.y || 0 });
      setCurrentSize({ width: item.width || 200, height: item.height || 150 });
    }
  }, [item.x, item.y, item.width, item.height, isDragging, isResizing]);

  const getGridCellFromPosition = useCallback((x, y) => {
    const col = Math.max(1, Math.min(config.columns, Math.ceil(x / (cellDimensions.cellWidth + config.gap))));
    const row = Math.max(1, Math.min(config.rows, Math.ceil(y / (cellDimensions.cellHeight + config.gap))));
    return { col, row };
  }, [config, cellDimensions]);

  const getGridSpanFromSize = useCallback((width, height) => {
    const colSpan = Math.max(1, Math.min(config.columns, Math.ceil(width / (cellDimensions.cellWidth + config.gap))));
    const rowSpan = Math.max(1, Math.min(config.rows, Math.ceil(height / (cellDimensions.cellHeight + config.gap))));
    return { colSpan, rowSpan };
  }, [config, cellDimensions]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('no-drag')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = itemRef.current.getBoundingClientRect();
    const workspaceElement = itemRef.current.closest('[data-workspace]');
    if (!workspaceElement) return;
    
    const workspaceRect = workspaceElement.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    if (layoutMode === 'grid') {
      setGridDragStart({
        col: item.col,
        row: item.row,
        mouseX: e.clientX - workspaceRect.left - 16,
        mouseY: e.clientY - workspaceRect.top - 16
      });
    }
    
    setIsDragging(true);
    selectItem(item.id);
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, [item.id, item.col, item.row, selectItem, layoutMode]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const workspaceElement = itemRef.current?.closest('[data-workspace]');
    if (!workspaceElement) return;
    
    const workspaceRect = workspaceElement.getBoundingClientRect();
    
    if (layoutMode === 'canvas') {
      const newX = Math.max(0, Math.min(
        workspaceSize.width - currentSize.width,
        e.clientX - workspaceRect.left - 16 - dragOffset.x
      ));
      
      const newY = Math.max(0, Math.min(
        workspaceSize.height - currentSize.height,
        e.clientY - workspaceRect.top - 16 - dragOffset.y
      ));
      
      setCurrentPosition({ x: newX, y: newY });
      
      if (itemRef.current) {
        itemRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      }
    } else if (layoutMode === 'grid' && gridDragStart) {
      const currentMouseX = e.clientX - workspaceRect.left - 16;
      const currentMouseY = e.clientY - workspaceRect.top - 16;
      
      const deltaX = currentMouseX - gridDragStart.mouseX;
      const deltaY = currentMouseY - gridDragStart.mouseY;
      
      const colDelta = Math.round(deltaX / (cellDimensions.cellWidth + config.gap));
      const rowDelta = Math.round(deltaY / (cellDimensions.cellHeight + config.gap));
      
      const newCol = Math.max(1, Math.min(config.columns - item.colSpan + 1, gridDragStart.col + colDelta));
      const newRow = Math.max(1, Math.min(config.rows - item.rowSpan + 1, gridDragStart.row + rowDelta));
      
      if (newCol !== item.col || newRow !== item.row) {
        if (itemRef.current) {
          itemRef.current.style.gridColumn = `${newCol} / span ${item.colSpan}`;
          itemRef.current.style.gridRow = `${newRow} / span ${item.rowSpan}`;
          itemRef.current.style.zIndex = '1000';
          itemRef.current.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        }
      }
    }
  }, [isDragging, dragOffset, workspaceSize, currentSize, layoutMode, gridDragStart, cellDimensions, config, item.col, item.row, item.colSpan, item.rowSpan]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (layoutMode === 'canvas') {
      updateItem(item.id, { 
        x: currentPosition.x, 
        y: currentPosition.y 
      });
    } else if (layoutMode === 'grid' && gridDragStart) {
      const workspaceElement = itemRef.current?.closest('[data-workspace]');
      if (workspaceElement) {
        const workspaceRect = workspaceElement.getBoundingClientRect();
        
        // Calculate the final position
        const deltaX = (window.event?.clientX || 0) - workspaceRect.left - 16 - gridDragStart.mouseX;
        const deltaY = (window.event?.clientY || 0) - workspaceRect.top - 16 - gridDragStart.mouseY;
        
        const colDelta = Math.round(deltaX / (cellDimensions.cellWidth + config.gap));
        const rowDelta = Math.round(deltaY / (cellDimensions.cellHeight + config.gap));
        
        const newCol = Math.max(1, Math.min(config.columns - item.colSpan + 1, gridDragStart.col + colDelta));
        const newRow = Math.max(1, Math.min(config.rows - item.rowSpan + 1, gridDragStart.row + rowDelta));
        
        updateItem(item.id, { col: newCol, row: newRow });
        
        // Reset visual styles
        if (itemRef.current) {
          itemRef.current.style.zIndex = '';
          itemRef.current.style.boxShadow = '';
        }
      }
      
      setGridDragStart(null);
    }
  }, [isDragging, currentPosition, item.id, updateItem, layoutMode, gridDragStart, cellDimensions, config, item.colSpan, item.rowSpan]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDragging) {
      selectItem(item.id);
    }
  }, [item.id, selectItem, isDragging]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    deleteItem(item.id);
  }, [item.id, deleteItem]);

  const handleTextDoubleClick = useCallback((e) => {
    if (item.type === 'text') {
      e.stopPropagation();
      setIsEditing(true);
    }
  }, [item.type]);

  const handleTextChange = useCallback((e) => {
    updateItem(item.id, { text: e.target.value, content: e.target.value });
  }, [item.id, updateItem]);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleTextKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, []);

  const handleGridResize = useCallback((direction, delta) => {
    let newColSpan = item.colSpan;
    let newRowSpan = item.rowSpan;
    let newCol = item.col;
    let newRow = item.row;

    switch (direction) {
      case 'right':
        newColSpan = Math.max(1, Math.min(config.columns - item.col + 1, item.colSpan + delta));
        break;
      case 'bottom':
        newRowSpan = Math.max(1, Math.min(config.rows - item.row + 1, item.rowSpan + delta));
        break;
      case 'left':
        const leftDelta = Math.max(-item.colSpan + 1, Math.min(item.col - 1, -delta));
        newCol = item.col + leftDelta;
        newColSpan = item.colSpan - leftDelta;
        break;
      case 'top':
        const topDelta = Math.max(-item.rowSpan + 1, Math.min(item.row - 1, -delta));
        newRow = item.row + topDelta;
        newRowSpan = item.rowSpan - topDelta;
        break;
    }

    updateItem(item.id, { 
      col: newCol, 
      row: newRow, 
      colSpan: newColSpan, 
      rowSpan: newRowSpan 
    });
  }, [item, config, updateItem]);

  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(direction);
    selectItem(item.id);
    document.body.style.userSelect = 'none';
  }, [item.id, selectItem]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;
    
    if (layoutMode === 'canvas') {
      const workspaceElement = itemRef.current?.closest('[data-workspace]');
      if (!workspaceElement) return;
      
      const workspaceRect = workspaceElement.getBoundingClientRect();
      
      let newWidth = currentSize.width;
      let newHeight = currentSize.height;
      let newX = currentPosition.x;
      let newY = currentPosition.y;
      
      const mouseX = e.clientX - workspaceRect.left - 16;
      const mouseY = e.clientY - workspaceRect.top - 16;
      
      switch (isResizing) {
        case 'se':
          newWidth = Math.max(50, Math.min(workspaceSize.width - currentPosition.x, mouseX - currentPosition.x));
          newHeight = Math.max(40, Math.min(workspaceSize.height - currentPosition.y, mouseY - currentPosition.y));
          break;
        case 'sw':
          newWidth = Math.max(50, currentPosition.x + currentSize.width - mouseX);
          newHeight = Math.max(40, Math.min(workspaceSize.height - currentPosition.y, mouseY - currentPosition.y));
          newX = Math.min(currentPosition.x, mouseX);
          break;
        case 'ne':
          newWidth = Math.max(50, Math.min(workspaceSize.width - currentPosition.x, mouseX - currentPosition.x));
          newHeight = Math.max(40, currentPosition.y + currentSize.height - mouseY);
          newY = Math.min(currentPosition.y, mouseY);
          break;
        case 'nw':
          newWidth = Math.max(50, currentPosition.x + currentSize.width - mouseX);
          newHeight = Math.max(40, currentPosition.y + currentSize.height - mouseY);
          newX = Math.min(currentPosition.x, mouseX);
          newY = Math.min(currentPosition.y, mouseY);
          break;
      }
      
      if (item.type === 'image' && item.aspectRatio) {
        const ratio = newWidth / newHeight;
        if (Math.abs(ratio - item.aspectRatio) > 0.1) {
          if (ratio > item.aspectRatio) {
            newWidth = newHeight * item.aspectRatio;
          } else {
            newHeight = newWidth / item.aspectRatio;
          }
        }
      }
      
      setCurrentSize({ width: newWidth, height: newHeight });
      setCurrentPosition({ x: newX, y: newY });
      
      if (itemRef.current) {
        itemRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        itemRef.current.style.width = `${newWidth}px`;
        itemRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [isResizing, currentSize, currentPosition, workspaceSize, item.type, item.aspectRatio, layoutMode]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (layoutMode === 'canvas') {
      updateItem(item.id, {
        x: currentPosition.x,
        y: currentPosition.y,
        width: currentSize.width,
        height: currentSize.height
      });
    }
  }, [isResizing, currentPosition, currentSize, item.id, updateItem, layoutMode]);

  useEffect(() => {
    if (isResizing && layoutMode === 'canvas') {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd, layoutMode]);

  const gridContainerStyle = useMemo(() => {
    if (layoutMode === 'canvas') return {};
    
    return {
      gridColumn: `${item.col} / span ${item.colSpan}`,
      gridRow: `${item.row} / span ${item.rowSpan}`,
      position: 'relative',
    };
  }, [layoutMode, item]);

  const canvasStyle = useMemo(() => {
    if (layoutMode !== 'canvas') return {};
    
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${currentSize.width}px`,
      height: `${currentSize.height}px`,
      transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
      zIndex: isDragging || isSelected ? 1000 : 1,
      cursor: isSelected && !isResizing ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      willChange: isDragging || isResizing ? 'transform' : 'auto',
      transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
    };
  }, [layoutMode, currentSize, currentPosition, isDragging, isSelected, isResizing]);

  const renderContent = () => {
    if (item.type === 'text') {
      const textStyle = {
        fontSize: item.textStyle?.fontSize || item.style?.fontSize ? `${item.style?.fontSize || item.textStyle?.fontSize || 16}px` : '16px',
        fontWeight: item.textStyle?.fontWeight || item.style?.fontWeight || 'normal',
        textAlign: item.textStyle?.textAlign || item.style?.textAlign || 'left',
        color: item.textStyle?.color || item.style?.color || '#000000',
        backgroundColor: item.textStyle?.backgroundColor || item.style?.backgroundColor || 'transparent',
        width: '100%',
        height: '100%',
        padding: '8px',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
      };

      if (isEditing) {
        return (
          <textarea
            className="no-drag"
            style={textStyle}
            value={item.text || item.content || ''}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            autoFocus
            placeholder="Enter your text..."
          />
        );
      } else {
        return (
          <div 
            className="cursor-text"
            style={{
              ...textStyle,
              display: 'flex',
              alignItems: layoutMode === 'canvas' ? 'flex-start' : 'center',
              justifyContent: textStyle.textAlign === 'center' ? 'center' : textStyle.textAlign === 'right' ? 'flex-end' : 'flex-start',
              minHeight: '100%'
            }}
            onDoubleClick={handleTextDoubleClick}
          >
            {item.text || item.content || 'Double click to edit text'}
          </div>
        );
      }
    }

    if (item.type === 'image' && item.imageUrl) {
      return (
        <div className="relative w-full h-full">
          <img
            src={item.imageUrl}
            alt={item.content}
            className="w-full h-full object-cover rounded-md select-none"
            draggable={false}
          />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {item.content}
          </div>
        </div>
      );
    }

    if (item.type === 'video' && item.videoUrl) {
      return (
        <div className="relative w-full h-full">
          <video
            src={item.videoUrl}
            className="w-full h-full object-cover rounded-md no-drag"
            controls
            draggable={false}
            style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }}
          />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {item.content}
          </div>
        </div>
      );
    }

    return (
      <div className="text-center select-none pointer-events-none">
        <div className="font-medium mb-1">{item.content}</div>
        <div className="text-xs text-gray-500 bg-white/60 rounded-full px-2 py-1">
          {layoutMode === 'grid' 
            ? `${item.colSpan} × ${item.rowSpan}` 
            : `${Math.round(currentSize.width)}×${Math.round(currentSize.height)}`
          }
        </div>
      </div>
    );
  };

  if (layoutMode === 'grid') {
    return (
      <div
        ref={itemRef}
        className={`${item.color || 'bg-gray-50'} relative group rounded-lg border-2 ${
          isSelected 
            ? 'border-blue-500 shadow-lg ring-1 ring-blue-200' 
            : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
        } transition-all duration-200 overflow-hidden h-full w-full ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={gridContainerStyle}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {isSelected && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-full flex items-center justify-center z-30 no-drag"
          >
            ×
          </button>
        )}

        {/* Grid resize handles */}
        {isSelected && (
          <>
            {/* Left resize handle */}
            <div
              className="absolute top-1/2 -left-1 w-2 h-8 bg-blue-500 cursor-col-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateY(-50%)', borderRadius: '4px 0 0 4px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                
                const handleMouseMove = (e) => {
                  const deltaX = e.clientX - startX;
                  const cellDelta = Math.round(-deltaX / (cellDimensions.cellWidth + config.gap));
                  handleGridResize('left', cellDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />

            {/* Right resize handle */}
            <div
              className="absolute top-1/2 -right-1 w-2 h-8 bg-blue-500 cursor-col-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateY(-50%)', borderRadius: '0 4px 4px 0' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                
                const handleMouseMove = (e) => {
                  const deltaX = e.clientX - startX;
                  const cellDelta = Math.round(deltaX / (cellDimensions.cellWidth + config.gap));
                  handleGridResize('right', cellDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />

            {/* Top resize handle */}
            <div
              className="absolute left-1/2 -top-1 w-8 h-2 bg-blue-500 cursor-row-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateX(-50%)', borderRadius: '4px 4px 0 0' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startY = e.clientY;
                
                const handleMouseMove = (e) => {
                  const deltaY = e.clientY - startY;
                  const cellDelta = Math.round(-deltaY / (cellDimensions.cellHeight + config.gap));
                  handleGridResize('top', cellDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            {/* Bottom resize handle */}
            <div
              className="absolute left-1/2 -bottom-1 w-8 h-2 bg-blue-500 cursor-row-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateX(-50%)', borderRadius: '0 0 4px 4px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startY = e.clientY;
                
                const handleMouseMove = (e) => {
                  const deltaY = e.clientY - startY;
                  const cellDelta = Math.round(deltaY / (cellDimensions.cellHeight + config.gap));
                  handleGridResize('bottom', cellDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            {/* Corner resize handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize opacity-80 hover:opacity-100 no-drag"
              style={{ borderRadius: '4px 0 0 0' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                
                const handleMouseMove = (e) => {
                  const deltaX = e.clientX - startX;
                  const deltaY = e.clientY - startY;
                  const colDelta = Math.round(-deltaX / (cellDimensions.cellWidth + config.gap));
                  const rowDelta = Math.round(-deltaY / (cellDimensions.cellHeight + config.gap));
                  
                  handleGridResize('left', colDelta);
                  handleGridResize('top', rowDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />

            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize opacity-80 hover:opacity-100 no-drag"
              style={{ borderRadius: '0 4px 0 0' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                
                const handleMouseMove = (e) => {
                  const deltaX = e.clientX - startX;
                  const deltaY = e.clientY - startY;
                  const colDelta = Math.round(deltaX / (cellDimensions.cellWidth + config.gap));
                  const rowDelta = Math.round(-deltaY / (cellDimensions.cellHeight + config.gap));
                  
                  handleGridResize('right', colDelta);
                  handleGridResize('top', rowDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />

            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize opacity-80 hover:opacity-100 no-drag"
              style={{ borderRadius: '0 0 0 4px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                
                const handleMouseMove = (e) => {
                  const deltaX = e.clientX - startX;
                  const deltaY = e.clientY - startY;
                  const colDelta = Math.round(-deltaX / (cellDimensions.cellWidth + config.gap));
                  const rowDelta = Math.round(deltaY / (cellDimensions.cellHeight + config.gap));
                  
                  handleGridResize('left', colDelta);
                  handleGridResize('bottom', rowDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize opacity-80 hover:opacity-100 no-drag"
              style={{ borderRadius: '0 0 4px 0' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                
                const handleMouseMove = (e) => {
                  const deltaX = e.clientX - startX;
                  const deltaY = e.clientY - startY;
                  const colDelta = Math.round(deltaX / (cellDimensions.cellWidth + config.gap));
                  const rowDelta = Math.round(deltaY / (cellDimensions.cellHeight + config.gap));
                  
                  handleGridResize('right', colDelta);
                  handleGridResize('bottom', rowDelta);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </>
        )}

        <div className="h-full flex items-center justify-center text-gray-700 font-medium text-sm p-2 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={itemRef}
      className={`${item.color || 'bg-gray-50'} relative group rounded-lg border-2 ${
        isSelected 
          ? 'border-blue-500 shadow-lg ring-1 ring-blue-200' 
          : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
      } transition-all duration-200 overflow-hidden`}
      style={canvasStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {isSelected && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-full flex items-center justify-center z-30 no-drag"
        >
          ×
        </button>
      )}

      {isSelected && layoutMode === 'canvas' && (
        <>
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize no-drag"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize no-drag"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize no-drag"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize no-drag"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
        </>
      )}

      <div className="h-full flex items-center justify-center text-gray-700 font-medium text-sm p-2 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default React.memo(GridItem);