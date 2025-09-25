/* eslint-disable complexity */

import React from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { ICarouselPage, ICarouselItemElement } from 'app/shared/model/TV/tv.model';

interface TVPreviewCanvasProps {
  currentPage: ICarouselPage | undefined;
  screenDimensions: { width: number; height: number; scale: number };
  selectedElements: string[];
  setSelectedElements: React.Dispatch<React.SetStateAction<string[]>>;
  handleContextMenu: (e: React.MouseEvent, elementId: string) => void;
  dragOffsets: { [elementId: string]: { x: number; y: number } };
  setDraggingElements: React.Dispatch<React.SetStateAction<string[]>>;
  setDragOffsets: React.Dispatch<React.SetStateAction<{ [elementId: string]: { x: number; y: number } }>>;
  setDragStartPositions: React.Dispatch<React.SetStateAction<{ [elementId: string]: { x: number; y: number } } | null>>;
  updateMultipleElements: (elementIds: string[], updates: any) => void;
  updateElement: (elementId: string, updates: any) => void;
  resizePreview: { [elementId: string]: { width: number; height: number; fontSize?: number } } | null;
  setResizePreview: React.Dispatch<React.SetStateAction<{ [elementId: string]: { width: number; height: number; fontSize?: number } } | null>>;
  resizingElement: string | null;
  setResizingElement: React.Dispatch<React.SetStateAction<string | null>>;
  resizeBaseline: { size: { width: number; height: number }; fontSize: number } | null;
  setResizeBaseline: React.Dispatch<React.SetStateAction<{ size: { width: number; height: number }; fontSize: number } | null>>;
  calculateTextHeight: (content: string, fontSize: number, widthPercentage: number) => number;
  draggingElements: string[];
}

const TVPreviewCanvas: React.FC<TVPreviewCanvasProps> = ({
  currentPage,
  screenDimensions,
  selectedElements,
  setSelectedElements,
  handleContextMenu,
  dragOffsets,
  setDraggingElements,
  setDragOffsets,
  setDragStartPositions,
  updateMultipleElements,
  updateElement,
  resizePreview,
  setResizePreview,
  resizingElement,
  setResizingElement,
  resizeBaseline,
  setResizeBaseline,
  calculateTextHeight,
  draggingElements
}) => {
  return (
    <div className="tv-preview">
      <h3>TV Preview</h3>
      <div
        className="tv-screen"
        style={{
          width: screenDimensions.width,
          height: screenDimensions.height
        }}
        onClick={(e) => {
          // Clear selection when clicking empty space
          if (e.target === e.currentTarget) {
            setSelectedElements([]);
          }
        }}
      >
        {currentPage?.elements.map((element, index) => (
          <div
            key={element.id}
            className={`carousel-element ${selectedElements.includes(element.id) ? 'selected' : ''} ${element.locked ? 'locked' : ''} ${draggingElements.includes(element.id) ? 'dragging' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              // Don't allow selection of locked elements
              if (element.locked) return;

              if (e.ctrlKey || e.metaKey) {
                // Multi-select: toggle element in selection
                setSelectedElements(prev =>
                  prev.includes(element.id)
                    ? prev.filter(id => id !== element.id)
                    : [...prev, element.id]
                );
              } else {
                // Single select: replace selection
                setSelectedElements([element.id]);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, element.id)}
            style={{
              position: 'absolute',
              left: ((element.position?.x || 0) / 100) * screenDimensions.width + (dragOffsets[element.id]?.x || 0),
              top: ((element.position?.y || 0) / 100) * screenDimensions.height + (dragOffsets[element.id]?.y || 0),
              width: ((element.size?.width || 0) / 100) * screenDimensions.width,
              height: ((element.size?.height || 0) / 100) * screenDimensions.height,
              zIndex: index + 1
            }}
          >
            <Draggable
              disabled={element.locked || resizingElement === element.id}
              handle=".drag-handle"
              bounds={false}
              position={{ x: 0, y: 0 }}
              onStart={() => {
                const elementsToMove = selectedElements.length > 1 && selectedElements.includes(element.id)
                  ? selectedElements.filter(id => {
                      const el = currentPage?.elements.find(e => e.id === id);
                      return el && !el.locked;
                    })
                  : [element.id];

                setDraggingElements(elementsToMove);
                setDragOffsets({}); // Reset offsets

                // Store initial positions
                const initialPositions: {[elementId: string]: {x: number, y: number}} = {};
                elementsToMove.forEach(id => {
                  const el = currentPage?.elements.find(e => e.id === id);
                  if (el) {
                    initialPositions[id] = {
                      x: el.position?.x || 0,
                      y: el.position?.y || 0
                    };
                  }
                });
                setDragStartPositions(initialPositions);
              }}
              onDrag={(e, data) => {
                // Real-time visual offset updates for multi-selection
                if (selectedElements.length > 1 && selectedElements.includes(element.id)) {
                  const deltaX = (data?.x || 0);
                  const deltaY = (data?.y || 0);

                  const elementsToMove = selectedElements.filter(id => {
                    const el = currentPage?.elements.find(e => e.id === id);
                    return el && !el.locked && id !== element.id; // Exclude the directly dragged element
                  });

                  // Update offsets for visual positioning without touching Redux state
                  const newOffsets: {[elementId: string]: {x: number, y: number}} = {};
                  elementsToMove.forEach(id => {
                    newOffsets[id] = { x: deltaX, y: deltaY };
                  });
                  setDragOffsets(newOffsets);
                }
              }}
              onStop={(e, data) => {
                // Calculate the drag offset in percentage
                const deltaX = ((data?.x || 0) / screenDimensions.width) * 100;
                const deltaY = ((data?.y || 0) / screenDimensions.height) * 100;

                if (selectedElements.length > 1 && selectedElements.includes(element.id)) {
                  // Multi-selection drag: move all selected unlocked elements
                  const elementsToMove = selectedElements.filter(id => {
                    const el = currentPage?.elements.find(e => e.id === id);
                    return el && !el.locked;
                  });

                  updateMultipleElements(elementsToMove, (el) => ({
                    position: {
                      x: (el.position?.x || 0) + deltaX,
                      y: (el.position?.y || 0) + deltaY
                    }
                  }));
                } else {
                  // Single element drag
                  updateElement(element.id, {
                    position: {
                      x: (element.position?.x || 0) + deltaX,
                      y: (element.position?.y || 0) + deltaY
                    }
                  });
                }

                // Clear dragging state and offsets
                setDraggingElements([]);
                setDragOffsets({});
                setDragStartPositions(null);
              }}
            >
              <ResizableBox
                width={resizePreview?.[element.id]?.width || ((element.size?.width || 0) / 100) * screenDimensions.width}
                height={resizePreview?.[element.id]?.height || ((element.size?.height || 0) / 100) * screenDimensions.height}
                onResizeStart={(e, { node, handle }) => {
                  if (!element.locked) {
                    setResizingElement(element.id);
                    // Store baseline for proportional font scaling (only for corner resizing)
                    if (element.type === 'text' && handle === 'se') {
                      setResizeBaseline({
                        size: {
                          width: element.size?.width || 0,
                          height: element.size?.height || 0
                        },
                        fontSize: element.style?.fontSize || 24
                      });
                    }
                  }
                }}
                onResize={(e, { size, handle }) => {
                  if (!element.locked) {
                    // Use local state for immediate visual feedback during resize
                    const pixelWidth = size.width;
                    const pixelHeight = size.height;

                    if (element.type === 'text') {
                      // For text elements, calculate font scaling for corner resize
                      let previewFontSize = element.style?.fontSize || 24;

                      // Scale font when resizing from corner (se handle) like Canva
                      if (handle === 'se' && resizeBaseline) {
                        const baselineWidthPx = (resizeBaseline.size.width / 100) * screenDimensions.width;
                        const baselineFontSize = resizeBaseline.fontSize;

                        if (baselineWidthPx > 0) {
                          const widthScale = pixelWidth / baselineWidthPx;
                          // More responsive scaling with lower threshold
                          if (Math.abs(widthScale - 1) > 0.01) {
                            previewFontSize = Math.max(8, Math.min(120, Math.round(baselineFontSize * widthScale)));
                          }
                        }
                      }

                      // Always auto-calculate height based on current font size and width
                      const widthPercentage = (pixelWidth / screenDimensions.width) * 100;
                      const autoHeight = calculateTextHeight(element.content, previewFontSize, widthPercentage);
                      const autoHeightPixels = (autoHeight / 100) * screenDimensions.height;

                      setResizePreview({
                        [element.id]: {
                          width: pixelWidth,
                          height: autoHeightPixels,
                          fontSize: previewFontSize
                        }
                      });
                    } else {
                      // For non-text elements, simple width/height preview
                      setResizePreview({
                        [element.id]: {
                          width: pixelWidth,
                          height: pixelHeight
                        }
                      });
                    }
                  }
                }}
                onResizeStop={(e, data) => {
                  // Always clear states first to ensure resize stops
                  setResizingElement(null);
                  setResizeBaseline(null);

                  if (!element.locked) {
                    // Apply final changes to Redux state
                    const newWidth = (data.size.width / screenDimensions.width) * 100;
                    const newHeight = (data.size.height / screenDimensions.height) * 100;

                    if (element.type === 'text') {
                      // Get font size from preview if it was scaled, otherwise use current font size
                      const fontSize = resizePreview?.[element.id]?.fontSize || element.style?.fontSize || 24;
                      const autoHeight = calculateTextHeight(element.content, fontSize, newWidth);

                      const updates: Partial<ICarouselItemElement> = {
                        size: {
                          width: newWidth,
                          height: autoHeight  // Always use auto-calculated height for text
                        }
                      };

                      // Update font size if it was scaled during corner resize
                      if (data.handle === 'se' && resizePreview?.[element.id]?.fontSize) {
                        updates.style = {
                          ...element.style,
                          fontSize: resizePreview[element.id].fontSize
                        };
                      }

                      updateElement(element.id, updates);
                    } else {
                      updateElement(element.id, {
                        size: {
                          width: newWidth,
                          height: newHeight
                        }
                      });
                    }
                  }

                  // Clear preview state last
                  setResizePreview(null);
                }}
                minConstraints={[30, element.type === 'text' ? 20 : 30]} // Smaller minimum for easier resizing
                maxConstraints={[screenDimensions.width, screenDimensions.height]}
                resizeHandles={element.locked ? [] :
                  element.type === 'text' ? ['e', 'se'] : ['se'] // Text: east (width) + southeast (font scaling), Images: southeast (corner)
                }
                handleStyle={{
                  se: {
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#007bff',
                    border: '2px solid white',
                    borderRadius: '2px',
                    cursor: 'se-resize',
                    bottom: '-7px',
                    right: '-7px'
                  },
                  e: {
                    width: '6px',
                    height: '24px',
                    backgroundColor: '#007bff',
                    border: '1px solid white',
                    borderRadius: '3px',
                    cursor: 'ew-resize',
                    right: '-3px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }
                }}
                axis={element.type === 'text' ? undefined : 'both'}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                  }}
                >
                <div
                  className="drag-handle"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    cursor: element.locked ? 'not-allowed' : (resizingElement === element.id ? 'default' : 'move'),
                    zIndex: 1
                  }}
                />
                {element.locked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '2px',
                      padding: '2px 4px',
                      fontSize: '12px',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    🔒
                  </div>
                )}
                {selectedElements.length > 1 && selectedElements.includes(element.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      backgroundColor: 'rgba(0, 123, 255, 0.9)',
                      color: 'white',
                      borderRadius: '2px',
                      padding: '2px 4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    {selectedElements.length}
                  </div>
                )}
                {element.type === 'text' ? (
                  <div
                    className="carousel-element-text"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: element.style?.textAlign === 'right' ? 'flex-end' :
                                    element.style?.textAlign === 'center' ? 'center' : 'flex-start',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '2px',
                      padding: '8px',
                      position: 'relative',
                      zIndex: 0
                    }}
                  >
                    <span style={{
                      fontSize: resizePreview?.[element.id]?.fontSize || element.style?.fontSize || 24,
                      color: element.style?.color || '#ffffff',
                      fontWeight: element.style?.fontWeight || 'normal',
                      fontStyle: element.style?.fontStyle || 'normal',
                      textDecoration: element.style?.textDecoration || 'none',
                      fontFamily: element.style?.fontFamily || 'Arial, sans-serif',
                      textAlign: element.style?.textAlign as any || 'left',
                      lineHeight: '1.2',
                      display: 'block',
                      width: '100%'
                    }}>
                      {element.content}
                    </span>
                  </div>
                ) : element.type === 'line' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 0
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: element.style?.lineStyle === 'solid' ? `${element.style?.lineWidth || 2}px` : '0px',
                        backgroundColor: element.style?.lineStyle === 'solid' ? (element.style?.color || '#ffffff') : 'transparent',
                        borderTop: element.style?.lineStyle !== 'solid'
                          ? `${element.style?.lineWidth || 2}px ${element.style?.lineStyle || 'solid'} ${element.style?.color || '#ffffff'}`
                          : 'none'
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={element.content}
                    alt="Element"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '2px',
                      position: 'relative',
                      zIndex: 0
                    }}
                  />
                )}
              </div>
            </ResizableBox>
          </Draggable>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVPreviewCanvas;