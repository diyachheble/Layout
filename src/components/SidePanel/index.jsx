import React, { useState, useRef, useCallback } from 'react';
import { useGrid } from '../GridContext';

const SidePanel = () => {
  const { 
    config, 
    setConfig, 
    items, 
    setItems, 
    addItem, 
    layoutMode,
    workspaceSize 
  } = useGrid();
  
  const [isOpen, setIsOpen] = useState(true);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [createdTexts, setCreatedTexts] = useState([]);
  const [newTextContent, setNewTextContent] = useState('');
  const [textStyle, setTextStyle] = useState({
    fontSize: '16',
    fontWeight: 'normal',
    textAlign: 'left',
    color: '#000000',
    backgroundColor: 'transparent'
  });
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const availableComponents = [
    { content: 'Header', color: 'bg-blue-50', colSpan: 3, rowSpan: 1, type: 'component' },
    { content: 'Navigation', color: 'bg-green-50', colSpan: 4, rowSpan: 1, type: 'component' },
    { content: 'Sidebar', color: 'bg-purple-50', colSpan: 1, rowSpan: 2, type: 'component' },
    { content: 'Card', color: 'bg-yellow-50', colSpan: 1, rowSpan: 1, type: 'component' },
    { content: 'Banner', color: 'bg-red-50', colSpan: 2, rowSpan: 1, type: 'component' },
    { content: 'Footer', color: 'bg-gray-50', colSpan: 4, rowSpan: 1, type: 'component' },
    { content: 'Gallery', color: 'bg-indigo-50', colSpan: 2, rowSpan: 2, type: 'component' },
    { content: 'Text Block', color: 'bg-pink-50', colSpan: 2, rowSpan: 1, type: 'text' },
  ];

  const updateConfig = useCallback((key, value) => {
    const numValue = parseInt(value) || value;
    setConfig(prev => ({ ...prev, [key]: numValue }));
  }, [setConfig]);

  const handleImageUpload = useCallback((event) => {
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
            imageUrl: e.target.result,
            size: file.size,
            type: 'image'
          };
          setUploadedImages(prev => [...prev, imageData]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleVideoUpload = useCallback((event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const videoData = {
            id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: e.target.result,
            videoUrl: e.target.result,
            size: file.size,
            type: 'video'
          };
          setUploadedVideos(prev => [...prev, videoData]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, []);

  const createTextElement = useCallback(() => {
    if (!newTextContent.trim()) return;

    const textData = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: newTextContent,
      text: newTextContent,
      style: { ...textStyle },
      createdAt: Date.now(),
      type: 'text'
    };

    setCreatedTexts(prev => [...prev, textData]);
    setNewTextContent('');
  }, [newTextContent, textStyle]);

  const handleAddComponent = useCallback((template) => {
    if (layoutMode === 'canvas') {
      const canvasTemplate = {
        ...template,
        x: Math.random() * (workspaceSize.width - 200),
        y: Math.random() * (workspaceSize.height - 150),
        width: 200,
        height: 150
      };
      addItem(canvasTemplate);
    } else {
      addItem(template);
    }
  }, [addItem, layoutMode, workspaceSize]);

  const addImageToWorkspace = useCallback((imageData) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      const template = {
        type: 'image',
        content: imageData.name.split('.')[0],
        color: 'bg-white',
        imageUrl: imageData.url,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        aspectRatio
      };

      if (layoutMode === 'canvas') {
        template.x = Math.random() * (workspaceSize.width - 250);
        template.y = Math.random() * (workspaceSize.height - 200);
        template.width = 250;
        template.height = Math.round(250 / aspectRatio);
      } else {
        template.colSpan = 2;
        template.rowSpan = aspectRatio > 1.5 ? 1 : 2;
      }

      addItem(template);
    };
    
    img.onerror = () => {
      const template = {
        type: 'image',
        content: imageData.name.split('.')[0],
        color: 'bg-white',
        colSpan: 2,
        rowSpan: 1,
        imageUrl: imageData.url
      };
      addItem(template);
    };
    
    img.src = imageData.url;
  }, [addItem, layoutMode, workspaceSize]);

  const addVideoToWorkspace = useCallback((videoData) => {
    const template = {
      type: 'video',
      content: videoData.name.split('.')[0],
      color: 'bg-black',
      videoUrl: videoData.url
    };

    if (layoutMode === 'canvas') {
      template.x = Math.random() * (workspaceSize.width - 300);
      template.y = Math.random() * (workspaceSize.height - 200);
      template.width = 300;
      template.height = 200;
    } else {
      template.colSpan = 2;
      template.rowSpan = 2;
    }

    addItem(template);
  }, [addItem, layoutMode, workspaceSize]);

  const addTextToWorkspace = useCallback((textData) => {
    const template = {
      type: 'text',
      content: textData.content,
      text: textData.text,
      color: textData.style.backgroundColor === 'transparent' ? 'bg-transparent' : 'bg-white',
      style: textData.style,
      textStyle: {
        fontSize: `${textData.style.fontSize}px`,
        fontWeight: textData.style.fontWeight,
        textAlign: textData.style.textAlign,
        color: textData.style.color,
        backgroundColor: textData.style.backgroundColor
      }
    };

    if (layoutMode === 'canvas') {
      template.x = Math.random() * (workspaceSize.width - 200);
      template.y = Math.random() * (workspaceSize.height - 100);
      template.width = 200;
      template.height = 100;
    } else {
      template.colSpan = 2;
      template.rowSpan = 1;
    }

    addItem(template);
  }, [addItem, layoutMode, workspaceSize]);

  const deleteUploadedImage = useCallback((imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const deleteUploadedVideo = useCallback((videoId) => {
    setUploadedVideos(prev => prev.filter(video => video.id !== videoId));
  }, []);

  const deleteCreatedText = useCallback((textId) => {
    setCreatedTexts(prev => prev.filter(text => text.id !== textId));
  }, []);

  const clearAllItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-l-lg shadow-lg hover:bg-gray-50 transition-all duration-300 p-3"
        style={{ right: isOpen ? '320px' : '0px' }}
      >
        {isOpen ? '→' : '←'}
      </button>

      <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-300 shadow-xl z-40 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Design Panel</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6 h-[calc(100vh-64px)]">
          
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600 font-medium">Current Mode:</span>
              <span className="bg-purple-100 px-2 py-1 rounded text-sm font-semibold text-purple-700">
                {layoutMode === 'grid' ? 'Grid Layout' : 'Free Canvas'}
              </span>
            </div>
          </div>

          {layoutMode === 'grid' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Grid Settings</h3>

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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Creation Section */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Create Text</h3>
              {createdTexts.length > 0 && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  {createdTexts.length} created
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Text Content
                </label>
                <textarea
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  placeholder="Enter your text here..."
                  className="w-full px-3 py-2 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={textStyle.fontSize}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={textStyle.fontWeight}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, fontWeight: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={textStyle.color}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-8 border border-orange-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Text Align
                  </label>
                  <select
                    value={textStyle.textAlign}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, textAlign: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textStyle.backgroundColor === 'transparent' ? '#ffffff' : textStyle.backgroundColor}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="flex-1 h-8 border border-orange-300 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => setTextStyle(prev => ({ ...prev, backgroundColor: 'transparent' }))}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      textStyle.backgroundColor === 'transparent' 
                        ? 'bg-orange-200 text-orange-800' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <button
                onClick={createTextElement}
                disabled={!newTextContent.trim()}
                className="w-full py-2 px-4 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                Create Text Element
              </button>
            </div>

            {createdTexts.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {createdTexts.map(textItem => (
                  <div key={textItem.id} className="flex items-start gap-3 p-2 bg-white rounded border border-orange-200 group">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate mb-1">
                        {textItem.content.length > 30 ? textItem.content.substring(0, 30) + '...' : textItem.content}
                      </div>
                      <div className="text-xs text-gray-500">
                        {textItem.style.fontSize}px • {textItem.style.fontWeight} • {textItem.style.textAlign}
                      </div>
                      <div 
                        className="text-xs mt-1 p-1 rounded border border-gray-200"
                        style={{ 
                          fontSize: `${Math.min(12, parseInt(textItem.style.fontSize))}px`,
                          fontWeight: textItem.style.fontWeight,
                          color: textItem.style.color,
                          backgroundColor: textItem.style.backgroundColor === 'transparent' ? 'transparent' : textItem.style.backgroundColor,
                          textAlign: textItem.style.textAlign
                        }}
                      >
                        {textItem.content}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => addTextToWorkspace(textItem)}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                        title="Add to workspace"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteCreatedText(textItem.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete text"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Upload Images</h3>
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
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-center"
            >
              <div className="text-sm font-medium text-green-700 mb-1">Choose Images</div>
              <div className="text-xs text-green-600">PNG, JPG, GIF up to 10MB</div>
            </button>

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
                        onClick={() => addImageToWorkspace(image)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Add to workspace"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteUploadedImage(image.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Upload Videos</h3>
              {uploadedVideos.length > 0 && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {uploadedVideos.length} uploaded
                </span>
              )}
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
            />

            <button
              onClick={() => videoInputRef.current?.click()}
              className="w-full py-3 px-4 bg-white border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center"
            >
              <div className="text-sm font-medium text-blue-700 mb-1">Choose Videos</div>
              <div className="text-xs text-blue-600">MP4, WebM up to 50MB</div>
            </button>

            {uploadedVideos.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {uploadedVideos.map(video => (
                  <div key={video.id} className="flex items-center gap-3 p-2 bg-white rounded border border-blue-200 group">
                    <div className="w-12 h-12 bg-black rounded border border-gray-200 flex-shrink-0 flex items-center justify-center text-white text-xs">
                      VIDEO
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{video.name}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(video.size)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => addVideoToWorkspace(video)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Add to workspace"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteUploadedVideo(video.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete video"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Add Components</h3>
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
              {availableComponents.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleAddComponent(template)}
                  className={`${template.color} text-gray-700 text-xs font-medium py-3 px-2 rounded-md hover:scale-105 transition-all duration-200 border border-gray-200 hover:shadow-md text-center`}
                >
                  <div className="font-semibold">{template.content}</div>
                  {layoutMode === 'grid' && (
                    <div className="text-xs text-gray-500 bg-white/80 rounded-full px-2 py-0.5 mt-1">
                      {template.colSpan}×{template.rowSpan}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Items in workspace:</span>
                <span className="font-medium text-blue-600">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Images uploaded:</span>
                <span className="font-medium text-green-600">{uploadedImages.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Videos uploaded:</span>
                <span className="font-medium text-purple-600">{uploadedVideos.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Texts created:</span>
                <span className="font-medium text-orange-600">{createdTexts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Workspace size:</span>
                <span className="font-medium text-gray-600">{workspaceSize.width}×{workspaceSize.height}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SidePanel;