import React, { useState, useRef } from 'react';
import { useGrid } from '../GridContext';

const SidePanel = () => {
  const { config, setConfig, items, setItems, placeItemSmart, findAvailablePosition } = useGrid();
  const [isOpen, setIsOpen] = useState(true);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  const availableItems = [
    { content: 'Header', color: 'bg-blue-50', colSpan: 3, rowSpan: 1 },
    { content: 'Navigation', color: 'bg-green-50', colSpan: 4, rowSpan: 1 },
    { content: 'Sidebar', color: 'bg-purple-50', colSpan: 1, rowSpan: 2 },
    { content: 'Card', color: 'bg-yellow-50', colSpan: 1, rowSpan: 1 },
    { content: 'Banner', color: 'bg-red-50', colSpan: 2, rowSpan: 1 },
    { content: 'Footer', color: 'bg-gray-50', colSpan: 4, rowSpan: 1 },
    { content: 'Gallery', color: 'bg-indigo-50', colSpan: 2, rowSpan: 2 },
    { content: 'Text Block', color: 'bg-pink-50', colSpan: 2, rowSpan: 1 },
  ];

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: parseInt(value) || value }));
  };

  const addItem = (template) => {
    const newItem = {
      ...template,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      col: 1,
      row: 1
    };

    // Find available position
    const position = findAvailablePosition(items, newItem, config);
    const itemWithPosition = { ...newItem, ...position };

    placeItemSmart(itemWithPosition);
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: e.target.result,
            size: file.size
          };
          setUploadedImages(prev => [...prev, imageData]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add image to grid
  const addImageToGrid = (imageData) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'image',
      content: imageData.name.split('.')[0],
      imageUrl: imageData.url,
      color: 'bg-white',
      colSpan: 2,
      rowSpan: 2,
      col: 1,
      row: 1
    };

    // Find available position
    const position = findAvailablePosition(items, newItem, config);
    const itemWithPosition = { ...newItem, ...position };

    placeItemSmart(itemWithPosition);
  };

  // Delete uploaded image
  const deleteUploadedImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const clearAllItems = () => {
    setItems([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-l-lg shadow-lg hover:bg-gray-50 transition-all duration-300 p-3"
        style={{ right: isOpen ? '320px' : '0px' }}
      >
        {isOpen ? '→' : '←'}
      </button>

      {/* Side Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-300 shadow-xl z-40 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Design Panel</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Grid Settings Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚙️</span>
              Grid Settings
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={config.columns}
                    onChange={(e) => updateConfig('columns', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={config.rows}
                    onChange={(e) => updateConfig('rows', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gap: {config.gap}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={config.gap}
                  onChange={(e) => updateConfig('gap', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium">{config.columns} × {config.rows}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span>📸</span>
                Upload Images
              </h3>
              {uploadedImages.length > 0 && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {uploadedImages.length} uploaded
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 flex flex-col items-center gap-2"
            >
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium text-green-700">Choose Images</span>
              <span className="text-xs text-green-600">PNG, JPG, GIF up to 10MB</span>
            </button>

            {/* Uploaded Images List */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {uploadedImages.map(image => (
                  <div key={image.id} className="flex items-center gap-3 p-2 bg-white rounded border border-green-200 group">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{image.name}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(image.size)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => addImageToGrid(image)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Add to grid"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteUploadedImage(image.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Components Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span>➕</span>
                Add Components
              </h3>
              {items.length > 0 && (
                <button
                  onClick={clearAllItems}
                  className="px-2 py-1 text-xs text-red-600 bg-red-100 border border-red-200 rounded hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {availableItems.map((template, index) => (
                <button
                  key={index}
                  onClick={() => addItem(template)}
                  className={`${template.color} text-gray-700 text-xs font-medium py-3 px-2 rounded-md hover:scale-105 transition-all duration-200 flex flex-col items-center gap-1 border border-gray-200 hover:shadow-md`}
                >
                  <div className="font-semibold">{template.content}</div>
                  <div className="text-xs text-gray-500 bg-white/80 rounded-full px-2 py-0.5">
                    {template.colSpan}×{template.rowSpan}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="text-xs font-semibold text-blue-800 mb-2">💡 Quick Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Upload images and add them to grid</li>
              <li>• Click components to add them</li>
              <li>• Drag items to move them around</li>
              <li>• Use resize handles on hover</li>
              <li>• Items auto-displace when moved</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;