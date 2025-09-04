import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FaArrowsAlt, FaTimes } from "react-icons/fa";
import { useGrid } from '../GridContext';

const GridItem = ({ item }) => {
  const { setItems, dragState, setDragState, config } = useGrid();
  const itemRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ colSpan: 0, rowSpan: 0 });

  // Your existing drag functionality - UNCHANGED
  const handleDragStart = (e) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      previewPosition: null
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      previewPosition: null
    });
  };

  const deleteItem = (e) => {
    e.stopPropagation();
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  // Resize functionality starts here
  const startResize = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setInitialMousePos({ x: e.clientX, y: e.clientY });
    setInitialSize({ colSpan: item.colSpan, rowSpan: item.rowSpan });
  };

  const handleResize = useCallback((e) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - initialMousePos.x;
    const deltaY = e.clientY - initialMousePos.y;

    // Get parent grid element
    const gridElement = itemRef.current?.parentElement;
    if (!gridElement) return;

    const gridRect = gridElement.getBoundingClientRect();
    const cellWidth = (gridRect.width + config.gap) / config.columns - config.gap;
    const cellHeight = (gridRect.height + config.gap) / config.rows - config.gap;

    // Convert pixel movement to grid cells
    const colDelta = Math.round(deltaX / (cellWidth + config.gap));
    const rowDelta = Math.round(deltaY / (cellHeight + config.gap));

    let newColSpan = initialSize.colSpan;
    let newRowSpan = initialSize.rowSpan;

    // Calculate new spans based on resize direction
    if (resizeDirection === 'right' || resizeDirection === 'both') {
      newColSpan = Math.max(1, Math.min(config.columns - item.col + 1, initialSize.colSpan + colDelta));
    }
    if (resizeDirection === 'bottom' || resizeDirection === 'both') {
      newRowSpan = Math.max(1, Math.min(config.rows - item.row + 1, initialSize.rowSpan + rowDelta));
    }

    // Check if resize would cause collision
    setItems(prev => {
      const otherItems = prev.filter(i => i.id !== item.id);

      // Check collision with other items
      for (let other of otherItems) {
        const itemRight = item.col + newColSpan - 1;
        const itemBottom = item.row + newRowSpan - 1;
        const otherRight = other.col + other.colSpan - 1;
        const otherBottom = other.row + other.rowSpan - 1;

        // If rectangles overlap, don't resize
        if (!(item.col > otherRight ||
              itemRight < other.col ||
              item.row > otherBottom ||
              itemBottom < other.row)) {
          return prev; // No change if collision
        }
      }

      // No collision, update the item
      return prev.map(i =>
        i.id === item.id
          ? { ...i, colSpan: newColSpan, rowSpan: newRowSpan }
          : i
      );
    });

  }, [isResizing, resizeDirection, initialMousePos, initialSize, item, config, setItems]);

  useEffect(() => {
    if (isResizing) {
      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeDirection(null);
      };

      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleResize]);

  const gridStyle = {
    gridColumn: `${item.col} / span ${item.colSpan}`,
    gridRow: `${item.row} / span ${item.rowSpan}`,
  };

  return (
    <div
      ref={itemRef}
      className={`${item.color} relative group cursor-move rounded-lg border-2 border-gray-300 hover:border-purple-400 hover:shadow-md transition-all duration-200 ${
        dragState.isDragging && dragState.draggedItem?.id === item.id
          ? 'opacity-50 scale-95'
          : 'hover:scale-[1.02]'
      }`}
      style={gridStyle}
      draggable={!isResizing} // Prevent drag when resizing
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <button
        onClick={deleteItem}
        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-20"
      >
        <FaTimes className="w-3 h-3" />
      </button>

      <div className="h-full flex items-center justify-center text-gray-700 font-medium text-sm p-2 overflow-hidden">
        {item.type === 'image' ? (
          // Image content
          <div className="relative w-full h-full">
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full h-full object-cover rounded-md"
              draggable={false}
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {item.content}
            </div>
            <div className="absolute top-2 right-2 text-xs text-white bg-black/60 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.colSpan} × {item.rowSpan}
            </div>
          </div>
        ) : (
          // Regular component content
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 text-gray-500">
              <FaArrowsAlt className="w-4 h-4" />
            </div>
            <div className="font-medium mb-1">{item.content}</div>
            <div className="text-xs text-gray-500 bg-white/60 rounded-full px-2 py-1">
              {item.colSpan} × {item.rowSpan}
            </div>
          </div>
        )}
      </div>

      {/* Resize handles - only appear on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 h-full w-3 cursor-col-resize pointer-events-auto flex items-center justify-center"
          onMouseDown={(e) => startResize('right', e)}
        >
          <div className="w-1 h-8 bg-purple-400 rounded-full shadow-sm" />
        </div>

        {/* Bottom resize handle */}
        <div
          className="absolute bottom-0 left-0 w-full h-3 cursor-row-resize pointer-events-auto flex items-center justify-center"
          onMouseDown={(e) => startResize('bottom', e)}
        >
          <div className="h-1 w-8 bg-purple-400 rounded-full shadow-sm" />
        </div>

        {/* Corner resize handle (both directions) */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize pointer-events-auto flex items-center justify-center"
          onMouseDown={(e) => startResize('both', e)}
        >
          <div className="w-2 h-2 bg-purple-400 rounded-full shadow-sm" />
        </div>
      </div>

      {/* Show current size while resizing */}
      {isResizing && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded z-30">
          {item.colSpan} × {item.rowSpan}
        </div>
      )}
    </div>
  );
};

export default GridItem;