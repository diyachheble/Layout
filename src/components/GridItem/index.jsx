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
    cellDimensions,
    isValidGridPosition,
    pixelToGrid,
    setDraggedItem
  } = useGrid();
  
  const itemRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialDragPosition, setInitialDragPosition] = useState(null);
  const [tempPosition, setTempPosition] = useState(null);

  // Calculate z-index based on item type and state
  const getZIndex = useMemo(() => {
    const baseZIndex = item.type === 'text' ? 10000 : 1; // Text gets much higher base z-index
    
    if (isDragging) return baseZIndex + 9000;
    if (isSelected) return baseZIndex + 1000;
    if (isResizing) return baseZIndex + 500;
    
    return baseZIndex;
  }, [item.type, isDragging, isSelected, isResizing]);

  // Reset temp position when item position changes
  useEffect(() => {
    if (!isDragging) {
      setTempPosition(null);
    }
  }, [item.x, item.y, item.col, item.row, isDragging]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('no-drag')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = itemRef.current.getBoundingClientRect();
    const workspaceElement = itemRef.current.closest('[data-workspace]');
    if (!workspaceElement) return;
    
    const workspaceRect = workspaceElement.getBoundingClientRect();
    
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    selectItem(item.id);
    setDraggedItem(item.id);
    
    if (layoutMode === 'grid') {
      setInitialDragPosition({
        col: item.col,
        row: item.row,
        mouseStartX: e.clientX - workspaceRect.left - 16,
        mouseStartY: e.clientY - workspaceRect.top - 16
      });
    }
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, [item.id, item.col, item.row, selectItem, layoutMode, setDraggedItem]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !initialDragPosition && layoutMode === 'grid') return;
    
    const workspaceElement = itemRef.current?.closest('[data-workspace]');
    if (!workspaceElement) return;
    
    const workspaceRect = workspaceElement.getBoundingClientRect();
    const workspaceX = e.clientX - workspaceRect.left - 16;
    const workspaceY = e.clientY - workspaceRect.top - 16;
    
    if (layoutMode === 'canvas') {
      const newX = Math.max(0, Math.min(
        workspaceSize.width - (item.width || 200),
        workspaceX - dragOffset.x
      ));
      
      const newY = Math.max(0, Math.min(
        workspaceSize.height - (item.height || 150),
        workspaceY - dragOffset.y
      ));
      
      setTempPosition({ x: newX, y: newY });
      
      // Apply temporary visual position
      if (itemRef.current) {
        itemRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        itemRef.current.style.zIndex = getZIndex;
        itemRef.current.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
      }
    } else if (layoutMode === 'grid' && initialDragPosition) {
      // Calculate grid position based on mouse movement
      const deltaX = workspaceX - initialDragPosition.mouseStartX;
      const deltaY = workspaceY - initialDragPosition.mouseStartY;
      
      const cellWidth = cellDimensions.cellWidth + config.gap;
      const cellHeight = cellDimensions.cellHeight + config.gap;
      
      const colDelta = Math.round(deltaX / cellWidth);
      const rowDelta = Math.round(deltaY / cellHeight);
      
      const newCol = Math.max(1, Math.min(
        config.columns - item.colSpan + 1, 
        initialDragPosition.col + colDelta
      ));
      const newRow = Math.max(1, Math.min(
        config.rows - item.rowSpan + 1, 
        initialDragPosition.row + rowDelta
      ));
      
      // Only update visual position if it's different from current
      if (newCol !== item.col || newRow !== item.row) {
        setTempPosition({ col: newCol, row: newRow });
        
        // Apply temporary visual position
        if (itemRef.current) {
          itemRef.current.style.gridColumn = `${newCol} / span ${item.colSpan}`;
          itemRef.current.style.gridRow = `${newRow} / span ${item.rowSpan}`;
          itemRef.current.style.zIndex = getZIndex;
          itemRef.current.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
          
          // Visual feedback for invalid positions (only for non-text items)
          const isValid = isValidGridPosition(newCol, newRow, item.colSpan, item.rowSpan, item.id, item.type);
          itemRef.current.style.opacity = isValid || item.type === 'text' ? '1' : '0.6';
          itemRef.current.style.backgroundColor = isValid || item.type === 'text' ? '' : 'rgba(255, 0, 0, 0.1)';
        }
      }
    }
  }, [isDragging, initialDragPosition, workspaceSize, dragOffset, layoutMode, cellDimensions, config, item, isValidGridPosition, getZIndex]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setDraggedItem(null);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Reset visual styles
    if (itemRef.current) {
      itemRef.current.style.zIndex = getZIndex;
      itemRef.current.style.boxShadow = '';
      itemRef.current.style.opacity = '';
      itemRef.current.style.backgroundColor = '';
    }
    
    if (tempPosition) {
      if (layoutMode === 'canvas') {
        updateItem(item.id, { 
          x: tempPosition.x, 
          y: tempPosition.y 
        });
      } else if (layoutMode === 'grid') {
        // Text items can always be placed anywhere, other items need valid position
        if (item.type === 'text') {
          updateItem(item.id, { 
            col: tempPosition.col, 
            row: tempPosition.row 
          });
        } else {
          const isValid = isValidGridPosition(
            tempPosition.col, 
            tempPosition.row, 
            item.colSpan, 
            item.rowSpan, 
            item.id,
            item.type
          );
          
          if (isValid) {
            updateItem(item.id, { 
              col: tempPosition.col, 
              row: tempPosition.row 
            });
          } else {
            // Reset to original position if invalid
            if (itemRef.current) {
              itemRef.current.style.gridColumn = `${item.col} / span ${item.colSpan}`;
              itemRef.current.style.gridRow = `${item.row} / span ${item.rowSpan}`;
            }
          }
        }
      }
    }
    
    setTempPosition(null);
    setInitialDragPosition(null);
  }, [isDragging, tempPosition, item.id, item.col, item.row, item.colSpan, item.rowSpan, item.type,
      updateItem, layoutMode, isValidGridPosition, setDraggedItem, getZIndex]);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
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

  // Text-specific font size resize handler - FIXED DIRECTION
  const handleTextFontResize = useCallback((direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.type !== 'text') return;
    
    let resizing = true;
    const startY = e.clientY;
    const currentFontSize = parseInt(item.textStyle?.fontSize || item.style?.fontSize || 16);
    
    const handleMouseMove = (e) => {
      if (!resizing) return;
      
      const deltaY = e.clientY - startY;
      // FIXED: Moving up (negative deltaY) should increase font size
      const fontSizeChange = Math.round(deltaY / 3); // Positive deltaY = moving down = smaller font
      const newFontSize = Math.max(8, Math.min(200, currentFontSize - fontSizeChange));
      
      // Update font size in real time
      updateItem(item.id, {
        textStyle: {
          ...(item.textStyle || {}),
          fontSize: newFontSize
        },
        style: {
          ...(item.style || {}),
          fontSize: newFontSize
        }
      });
    };
    
    const handleMouseUp = () => {
      resizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
    
    document.body.style.cursor = 'ns-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, updateItem]);

  const handleGridResize = useCallback((direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For text items, handle font size resize instead
    if (item.type === 'text') {
      handleTextFontResize(direction, e);
      return;
    }
    
    let resizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (e) => {
      if (!resizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const cellWidth = cellDimensions.cellWidth + config.gap;
      const cellHeight = cellDimensions.cellHeight + config.gap;
      
      let newColSpan = item.colSpan;
      let newRowSpan = item.rowSpan;
      let newCol = item.col;
      let newRow = item.row;

      switch (direction) {
        case 'right':
          newColSpan = Math.max(1, Math.min(
            config.columns - item.col + 1, 
            item.colSpan + Math.round(deltaX / cellWidth)
          ));
          break;
        case 'bottom':
          newRowSpan = Math.max(1, Math.min(
            config.rows - item.row + 1, 
            item.rowSpan + Math.round(deltaY / cellHeight)
          ));
          break;
        case 'left':
          const leftColDelta = Math.round(-deltaX / cellWidth);
          const maxLeftExpand = Math.min(leftColDelta, item.col - 1);
          newCol = item.col - maxLeftExpand;
          newColSpan = item.colSpan + maxLeftExpand;
          break;
        case 'top':
          const topRowDelta = Math.round(-deltaY / cellHeight);
          const maxTopExpand = Math.min(topRowDelta, item.row - 1);
          newRow = item.row - maxTopExpand;
          newRowSpan = item.rowSpan + maxTopExpand;
          break;
      }

      // Check if new dimensions are valid
      if (isValidGridPosition(newCol, newRow, newColSpan, newRowSpan, item.id, item.type)) {
        updateItem(item.id, { 
          col: newCol, 
          row: newRow, 
          colSpan: newColSpan, 
          rowSpan: newRowSpan 
        }, true); // Skip validation since we already checked
      }
    };
    
    const handleMouseUp = () => {
      resizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, cellDimensions, config, isValidGridPosition, updateItem, handleTextFontResize]);

  const handleCanvasResize = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For text items, handle font size resize instead
    if (item.type === 'text') {
      handleTextFontResize(direction, e);
      return;
    }
    
    setIsResizing(direction);
    selectItem(item.id);
    document.body.style.userSelect = 'none';
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width || 200;
    const startHeight = item.height || 150;
    const startPosX = item.x || 0;
    const startPosY = item.y || 0;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;
      
      switch (direction) {
        case 'se':
          newWidth = Math.max(50, Math.min(workspaceSize.width - startPosX, startWidth + deltaX));
          newHeight = Math.max(40, Math.min(workspaceSize.height - startPosY, startHeight + deltaY));
          break;
        case 'sw':
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(40, Math.min(workspaceSize.height - startPosY, startHeight + deltaY));
          newX = Math.min(startPosX, startPosX + startWidth - newWidth);
          break;
        case 'ne':
          newWidth = Math.max(50, Math.min(workspaceSize.width - startPosX, startWidth + deltaX));
          newHeight = Math.max(40, startHeight - deltaY);
          newY = Math.min(startPosY, startPosY + startHeight - newHeight);
          break;
        case 'nw':
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newX = Math.min(startPosX, startPosX + startWidth - newWidth);
          newY = Math.min(startPosY, startPosY + startHeight - newHeight);
          break;
      }
      
      // Maintain aspect ratio for images
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
      
      // Apply visual changes immediately
      if (itemRef.current) {
        itemRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        itemRef.current.style.width = `${newWidth}px`;
        itemRef.current.style.height = `${newHeight}px`;
        itemRef.current.style.zIndex = getZIndex;
      }
      
      setTempPosition({ x: newX, y: newY, width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      if (tempPosition && (tempPosition.width || tempPosition.height)) {
        updateItem(item.id, {
          x: tempPosition.x,
          y: tempPosition.y,
          width: tempPosition.width,
          height: tempPosition.height
        });
      }
      
      setTempPosition(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, workspaceSize, selectItem, updateItem, tempPosition, handleTextFontResize, getZIndex]);

  const gridContainerStyle = useMemo(() => {
    if (layoutMode === 'canvas') return {};
    
    // Use temp position during drag if available
    const currentCol = tempPosition?.col ?? item.col;
    const currentRow = tempPosition?.row ?? item.row;
    
    return {
      gridColumn: `${currentCol} / span ${item.colSpan}`,
      gridRow: `${currentRow} / span ${item.rowSpan}`,
      position: 'relative',
      zIndex: getZIndex, // Add z-index here for grid mode
    };
  }, [layoutMode, item, tempPosition, getZIndex]);

  const canvasStyle = useMemo(() => {
    if (layoutMode !== 'canvas') return {};
    
    // Use temp position during drag if available
    const currentX = tempPosition?.x ?? item.x ?? 0;
    const currentY = tempPosition?.y ?? item.y ?? 0;
    const currentWidth = tempPosition?.width ?? item.width ?? 200;
    const currentHeight = tempPosition?.height ?? item.height ?? 150;
    
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${currentWidth}px`,
      height: `${currentHeight}px`,
      transform: `translate3d(${currentX}px, ${currentY}px, 0)`,
      zIndex: getZIndex, // Dynamic z-index based on type and state
      cursor: isSelected ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
    };
  }, [layoutMode, item, tempPosition, isDragging, isSelected, isResizing, getZIndex]);

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
            style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
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
            : `${Math.round(item.width || 200)}×${Math.round(item.height || 150)}`
          }
        </div>
      </div>
    );
  };

  // Special rendering for text items - no visible container
  if (item.type === 'text') {
    const textFontSize = parseInt(item.textStyle?.fontSize || item.style?.fontSize || 16);
    const textContent = item.text || item.content || 'Double click to edit text';
    
    const textStyle = {
      fontSize: `${textFontSize}px`,
      fontWeight: item.textStyle?.fontWeight || item.style?.fontWeight || 'normal',
      textAlign: item.textStyle?.textAlign || item.style?.textAlign || 'left',
      color: item.textStyle?.color || item.style?.color || '#000000',
      backgroundColor: item.textStyle?.backgroundColor || item.style?.backgroundColor || 'transparent',
      padding: isSelected ? '4px' : '0px',
      border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none',
      borderRadius: '4px',
      minWidth: '50px',
      minHeight: `${textFontSize + 8}px`,
      width: 'auto',
      height: 'auto',
      maxWidth: layoutMode === 'canvas' ? `${workspaceSize.width}px` : '100%',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      cursor: isDragging ? 'grabbing' : (isSelected ? 'grab' : 'text'),
      outline: 'none',
      resize: 'none',
      overflow: 'visible',
      transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
      zIndex: getZIndex, // High z-index for text
      position: layoutMode === 'canvas' ? 'absolute' : 'relative'
    };

    if (layoutMode === 'canvas') {
      const currentX = tempPosition?.x ?? item.x ?? 0;
      const currentY = tempPosition?.y ?? item.y ?? 0;
      textStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      textStyle.left = 0;
      textStyle.top = 0;
    }

    if (layoutMode === 'grid') {
      const currentCol = tempPosition?.col ?? item.col;
      const currentRow = tempPosition?.row ?? item.row;
      textStyle.gridColumn = `${currentCol} / span ${item.colSpan}`;
      textStyle.gridRow = `${currentRow} / span ${item.rowSpan}`;
    }

    return (
      <div
        ref={itemRef}
        style={textStyle}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleTextDoubleClick}
      >
        {isSelected && (
          <button
            onClick={handleDelete}
            className="absolute -top-6 -right-2 w-6 h-6 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-full flex items-center justify-center z-30 no-drag shadow-sm"
          >
            ×
          </button>
        )}

        {/* Font size resize handle for text */}
        {isSelected && (
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize opacity-80 hover:opacity-100 no-drag shadow-sm"
            onMouseDown={(e) => handleTextFontResize('resize', e)}
            title="Drag up to increase font size, down to decrease"
          />
        )}

        {isEditing ? (
          <textarea
            className="no-drag w-full h-full bg-transparent border-none outline-none resize-none"
            style={{
              fontSize: textStyle.fontSize,
              fontWeight: textStyle.fontWeight,
              textAlign: textStyle.textAlign,
              color: textStyle.color,
              backgroundColor: 'transparent',
              padding: '0',
              minHeight: `${textFontSize + 8}px`,
              overflow: 'hidden'
            }}
            value={textContent}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            autoFocus
            placeholder="Enter your text..."
          />
        ) : (
          textContent
        )}
      </div>
    );
  }

  // Regular rendering for non-text items
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
            {/* Side resize handles */}
            <div
              className="absolute top-1/2 -left-1 w-2 h-8 bg-blue-500 cursor-col-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateY(-50%)', borderRadius: '4px 0 0 4px' }}
              onMouseDown={(e) => handleGridResize('left', e)}
            />

            <div
              className="absolute top-1/2 -right-1 w-2 h-8 bg-blue-500 cursor-col-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateY(-50%)', borderRadius: '0 4px 4px 0' }}
              onMouseDown={(e) => handleGridResize('right', e)}
            />

            <div
              className="absolute left-1/2 -top-1 w-8 h-2 bg-blue-500 cursor-row-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateX(-50%)', borderRadius: '4px 4px 0 0' }}
              onMouseDown={(e) => handleGridResize('top', e)}
            />
            
            <div
              className="absolute left-1/2 -bottom-1 w-8 h-2 bg-blue-500 cursor-row-resize opacity-80 hover:opacity-100 no-drag"
              style={{ transform: 'translateX(-50%)', borderRadius: '0 0 4px 4px' }}
              onMouseDown={(e) => handleGridResize('bottom', e)}
            />
          </>
        )}

        <div className="h-full flex items-center justify-center text-gray-700 font-medium text-sm p-2 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Canvas mode rendering
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

      {/* Canvas resize handles */}
      {isSelected && (
        <>
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize no-drag"
            onMouseDown={(e) => handleCanvasResize(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize no-drag"
            onMouseDown={(e) => handleCanvasResize(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize no-drag"
            onMouseDown={(e) => handleCanvasResize(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize no-drag"
            onMouseDown={(e) => handleCanvasResize(e, 'se')}
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