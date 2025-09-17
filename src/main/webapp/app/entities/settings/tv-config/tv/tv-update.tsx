import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tv.reducer';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getTvDisplays } from "app/entities/settings/tv-config/tv-display/tv-display.reducer";
import { getEntities as getRegularItems } from "app/entities/item/restaurant/regular-item/regular-item.reducer";
import { Translate, getSortState } from "react-jhipster";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ICarouselPage, ICarouselItemElement } from 'app/shared/model/TV/tv.model';
import { IRegularItem } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import './tv-builder.css';
import { FaArrowDown, FaArrowLeft, FaArrowUp, FaChevronDown, FaChevronUp, FaImage, FaFont, FaSave, FaTrash } from 'react-icons/fa';
import { ITv } from '../../../../shared/model/TV/tv.model';
import MediaLibrary from "../../../../shared/components/media-library/media-library";
import { transformAttachmentStructure } from "../../../../shared/util/attachment-utils";

export const TVUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const branchList = useAppSelector(state => state.branch.entities);
  // const tvDisplayList = useAppSelector(state => state.tvDisplay.entities);
  const regularItemList = useAppSelector(state => state.regularItem.entities);
  const tv : ITv = useAppSelector(state => state.tv.entity);
  const loading = useAppSelector(state => state.tv.loading);
  const updating = useAppSelector(state => state.tv.updating);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [draggingElements, setDraggingElements] = useState<string[]>([]);
  const [dragOffsets, setDragOffsets] = useState<{[elementId: string]: {x: number, y: number}}>({});
  const [resizeBaseline, setResizeBaseline] = useState<{size: {width: number, height: number}, fontSize: number} | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  // Local state for smooth resize preview
  const [resizePreview, setResizePreview] = useState<{[elementId: string]: {width: number, height: number, fontSize?: number}} | null>(null);

  // Store initial positions when drag starts
  const [dragStartPositions, setDragStartPositions] = useState<{[elementId: string]: {x: number, y: number}} | null>(null);

  // Cache for text height calculations
  const textHeightCache = useRef<Map<string, number>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const screenDimensions = useMemo(() => {
    const maxWidth = 800;
    const maxHeight = 450;
    const actualWidth = tv.dimensions?.width || 1920;
    const actualHeight = tv.dimensions?.height || 1080;

    const ratio = Math.min(maxWidth / actualWidth, maxHeight / actualHeight);

    return {
      width: actualWidth * ratio,
      height: actualHeight * ratio,
      scale: ratio
    };
  }, [tv.dimensions?.width, tv.dimensions?.height]);

  // Optimized text height calculation with caching
  const calculateTextHeight = useCallback((text: string, fontSize: number, widthPercentage: number): number => {
    const cacheKey = `${text}-${fontSize}-${Math.round(widthPercentage)}`;
    const cached = textHeightCache.current.get(cacheKey);
    if (cached) return cached;

    // Reuse canvas element
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) return 10; // fallback

    context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const lineHeight = fontSize * 1.2;

    // Calculate actual width in pixels
    const actualWidth = (widthPercentage / 100) * screenDimensions.width;
    const maxWidth = actualWidth * 0.9;

    // Optimized word wrapping
    const words = text.split(' ');
    let lines = 1;
    let currentLineWidth = 0;

    for (const word of words) {
      const wordWidth = context.measureText(word + ' ').width;
      if (currentLineWidth + wordWidth > maxWidth && currentLineWidth > 0) {
        lines++;
        currentLineWidth = wordWidth;
      } else {
        currentLineWidth += wordWidth;
      }
    }

    const totalHeightPixels = (lines * lineHeight) + 16;
    const minHeightPixels = Math.max(totalHeightPixels, fontSize + 16);
    const result = (minHeightPixels / screenDimensions.height) * 100;

    // Cache the result
    textHeightCache.current.set(cacheKey, result);

    // Limit cache size
    if (textHeightCache.current.size > 100) {
      const firstKey = textHeightCache.current.keys().next().value;
      textHeightCache.current.delete(firstKey);
    }

    return result;
  }, [screenDimensions.width, screenDimensions.height]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);

  const aspectRatios = {
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1024, height: 768 },
    '21:9': { width: 2560, height: 1080 },
    '1:1': { width: 1080, height: 1080 }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: paginationState.sort
    }));

    dispatch(getTvDisplays({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: paginationState.sort
    }));

    dispatch(getRegularItems({
      page: 0,
      size: 1000,
      sort: 'name,asc'
    }));
  }, []);

  const handleBranchChange = (selectedBranch) => {
    dispatch(changeEntityField({ name: "branch", value: selectedBranch }));
  };

  const handleDisplayChange = (display) => {
    dispatch(changeEntityField({ name: "tvDisplay", value: display }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }));
  };

  const handleDimensionChange = (type, value) => {
    const currentDimensions = tv.dimensions || { width: 1920, height: 1080 };
    dispatch(changeEntityField({ 
      name: "dimensions", 
      value: { ...currentDimensions, [type]: parseInt(value, 10) || 0 } 
    }));
  };

  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);
    const dimensions = aspectRatios[ratio];
    dispatch(changeEntityField({ name: "dimensions", value: dimensions }));
  };

  const addCarouselPage = () => {
    const newPage: ICarouselPage = {
      id: `page-${Date.now()}`,
      name: `Page ${(tv.carouselPages?.length || 0) + 1}`,
      elements: [],
      duration: 5
    };
    
    const updatedPages = [...(tv.carouselPages || []), newPage];
    dispatch(changeEntityField({ name: "carouselPages", value: updatedPages }));
    setActivePageIndex(updatedPages.length - 1);
  };

  const deleteCarouselPage = (pageIndex: number) => {
    const updatedPages = [...(tv.carouselPages || [])];
    updatedPages.splice(pageIndex, 1);
    dispatch(changeEntityField({ name: "carouselPages", value: updatedPages }));
    
    // Adjust active page index if necessary
    if (activePageIndex >= updatedPages.length) {
      setActivePageIndex(Math.max(0, updatedPages.length - 1));
    }
    setSelectedElements([]);
  };

  const updateCarouselPage = (pageIndex: number, updates: Partial<ICarouselPage>) => {
    const updatedPages = [...(tv.carouselPages || [])];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], ...updates };
    dispatch(changeEntityField({ name: "carouselPages", value: updatedPages }));
  };

  const handleItemSelection = (selectedItem: IRegularItem) => {
    // Reset variant selection when a new item is selected
    setSelectedVariantIndex(0);
    updateCarouselPage(activePageIndex, { selectedItem });
  };

  const handleVariantSelection = (variantIndex: number) => {
    setSelectedVariantIndex(variantIndex);
  };

  const addElementToPage = (type: 'text' | 'image', content: string, fieldToQuery?: string, isStandaloneImage = false, isBackgroundImage = false) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    // For standalone images, we don't need a selected item
    if (!isStandaloneImage && !currentPage.selectedItem) return;

    const selectedItem = currentPage.selectedItem;
    
    // For text elements tied to items, we need field queries
    if (!isStandaloneImage && !fieldToQuery && type === 'text') return;

    const newElement: ICarouselItemElement = {
      id: `element-${Date.now()}`,
      type,
      documentType: 'ITEM',
      documentId: isStandaloneImage ? '' : (selectedItem?.id || ''),
      fieldToQuery: fieldToQuery || '',
      content,
      position: isBackgroundImage ? { x: 0, y: 0 } : { x: 10, y: 10 },
      size: isBackgroundImage 
        ? { width: 100, height: 100 } // Full screen background
        : { width: type === 'text' ? 30 : 20, height: type === 'text' ? 10 : 15 },
      style: type === 'text' ? {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'normal',
        textAlign: 'left'
      } : undefined
    };

    const updatedElements = [...currentPage.elements, newElement];
    updateCarouselPage(activePageIndex, { elements: updatedElements });
    setSelectedElements([newElement.id]);
  };


  const updateElement = useCallback((elementId: string, updates: Partial<ICarouselItemElement>, immediate = true) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    // For drag/resize operations, we'll use immediate updates to avoid delays
    const updatedElements = currentPage.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    updateCarouselPage(activePageIndex, { elements: updatedElements });
  }, [tv.carouselPages, activePageIndex, updateCarouselPage]);

  const updateMultipleElements = (elementIds: string[], updates: Partial<ICarouselItemElement> | ((element: ICarouselItemElement) => Partial<ICarouselItemElement>)) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const updatedElements = currentPage.elements.map(el => {
      if (elementIds.includes(el.id)) {
        const elementUpdates = typeof updates === 'function' ? updates(el) : updates;
        return { ...el, ...elementUpdates };
      }
      return el;
    });
    updateCarouselPage(activePageIndex, { elements: updatedElements });
  };

  const deleteElement = (elementId: string) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const updatedElements = currentPage.elements.filter(el => el.id !== elementId);
    updateCarouselPage(activePageIndex, { elements: updatedElements });
    setSelectedElements(prev => prev.filter(id => id !== elementId));
  };

  const moveElementLayer = (elementId: string, direction: 'up' | 'down') => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const elements = [...currentPage.elements];
    const elementIndex = elements.findIndex(el => el.id === elementId);
    
    if (elementIndex === -1) return;

    if (direction === 'up' && elementIndex < elements.length - 1) {
      [elements[elementIndex], elements[elementIndex + 1]] = [elements[elementIndex + 1], elements[elementIndex]];
    } else if (direction === 'down' && elementIndex > 0) {
      [elements[elementIndex], elements[elementIndex - 1]] = [elements[elementIndex - 1], elements[elementIndex]];
    }

    updateCarouselPage(activePageIndex, { elements });
  };

  const reorderElements = (sourceIndex: number, destinationIndex: number) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const elements = [...currentPage.elements];
    const [reorderedItem] = elements.splice(sourceIndex, 1);
    elements.splice(destinationIndex, 0, reorderedItem);

    updateCarouselPage(activePageIndex, { elements });
  };

  const fitAsBackground = (elementId: string) => {
    updateElement(elementId, {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 }
    });
  };

  // Multi-selection operations
  const alignLeft = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const leftmostX = Math.min(...selectedElementsData.map(el => el.position?.x || 0));

    updateMultipleElements(selectedElements, (element) => ({
      position: {
        ...element.position,
        x: leftmostX
      }
    }));
  };

  const alignTop = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const topmostY = Math.min(...selectedElementsData.map(el => el.position?.y || 0));

    updateMultipleElements(selectedElements, (element) => ({
      position: {
        ...element.position,
        y: topmostY
      }
    }));
  };

  const alignBottom = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    // Calculate bottom edge (y + height) and find the bottommost
    const bottommostY = Math.max(...selectedElementsData.map(el => (el.position?.y || 0) + (el.size?.height || 0)));

    updateMultipleElements(selectedElements, (element) => {
      const elementHeight = element.size?.height || 0;
      return {
        position: {
          ...element.position,
          y: bottommostY - elementHeight
        }
      };
    });
  };

  const alignRight = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    // Calculate right edge (x + width) and find the rightmost
    const rightmostX = Math.max(...selectedElementsData.map(el => (el.position?.x || 0) + (el.size?.width || 0)));

    updateMultipleElements(selectedElements, (element) => {
      const elementWidth = element.size?.width || 0;
      return {
        position: {
          ...element.position,
          x: rightmostX - elementWidth
        }
      };
    });
  };

  const makeSameWidth = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const targetWidth = Math.max(...selectedElementsData.map(el => el.size?.width || 0));

    updateMultipleElements(selectedElements, (element) => ({
      size: {
        ...element.size,
        width: targetWidth
      }
    }));
  };

  const makeSameHeight = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const targetHeight = Math.max(...selectedElementsData.map(el => el.size?.height || 0));

    updateMultipleElements(selectedElements, (element) => ({
      size: {
        ...element.size,
        height: targetHeight
      }
    }));
  };

  const makeSameSizeSmaller = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const smallestWidth = Math.min(...selectedElementsData.map(el => el.size?.width || 0));
    const smallestHeight = Math.min(...selectedElementsData.map(el => el.size?.height || 0));

    updateMultipleElements(selectedElements, {
      size: {
        width: smallestWidth,
        height: smallestHeight
      }
    });
  };

  const makeSameSizeLarger = () => {
    if (selectedElements.length < 2) return;

    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const largestWidth = Math.max(...selectedElementsData.map(el => el.size?.width || 0));
    const largestHeight = Math.max(...selectedElementsData.map(el => el.size?.height || 0));

    updateMultipleElements(selectedElements, {
      size: {
        width: largestWidth,
        height: largestHeight
      }
    });
  };

  const bulkChangeTextColor = (color: string) => {
    const elements = currentPage?.elements || [];
    const selectedTextElementIds = elements
      .filter(el => selectedElements.includes(el.id) && el.type === 'text')
      .map(el => el.id);

    updateMultipleElements(selectedTextElementIds, (element) => ({
      style: {
        ...element.style,
        color
      }
    }));
  };

  const bulkChangeFontSize = (fontSize: number) => {
    const elements = currentPage?.elements || [];
    const selectedTextElements = elements
      .filter(el => selectedElements.includes(el.id) && el.type === 'text');

    updateMultipleElements(selectedTextElements.map(el => el.id), (element) => {
      // Auto-calculate height for text elements
      const autoHeight = calculateTextHeight(
        element.content,
        fontSize,
        element.size?.width || 0
      );

      return {
        style: {
          ...element.style,
          fontSize
        },
        size: {
          ...element.size,
          height: autoHeight
        }
      };
    });
  };

  const bulkToggleLock = () => {
    const elements = currentPage?.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    const allLocked = selectedElementsData.every(el => el.locked);

    updateMultipleElements(selectedElements, {
      locked: !allLocked
    });

    // Clear selection if we just locked all elements
    if (!allLocked) {
      setSelectedElements([]);
    }
  };

  const bulkDelete = () => {
    if (selectedElements.length === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    const updatedElements = currentPage?.elements.filter(el => !selectedElements.includes(el.id)) || [];
    updateCarouselPage(activePageIndex, { elements: updatedElements });
    setSelectedElements([]);
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const currentPage: ICarouselPage = useMemo(() =>
    tv.carouselPages?.[activePageIndex],
    [tv.carouselPages, activePageIndex]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPage) return;

      // Ctrl+A or Cmd+A: Select all elements
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const unlockedElements = currentPage.elements
          .filter(el => !el.locked)
          .map(el => el.id);
        setSelectedElements(unlockedElements);
      }

      // Delete key: Delete selected elements
      if (e.key === 'Delete' && selectedElements.length > 0) {
        e.preventDefault();
        if (selectedElements.length === 1) {
          deleteElement(selectedElements[0]);
        } else {
          bulkDelete();
        }
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        setSelectedElements([]);
        closeContextMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, selectedElements]);

  // Update text element heights when they change
  useEffect(() => {
    if (currentPage?.elements) {
      currentPage.elements.forEach(element => {
        if (element.type === 'text') {
          const fontSize = element.style?.fontSize || 24;
          const currentWidth = element.size?.width || 0;
          const expectedHeight = calculateTextHeight(element.content, fontSize, currentWidth);

          // Only update if height is significantly different (avoid infinite loops)
          if (Math.abs((element.size?.height || 0) - expectedHeight) > 1) {
            updateElement(element.id, {
              size: {
                ...element.size,
                height: expectedHeight
              }
            });
          }
        }
      });
    }
  }, [currentPage?.elements, calculateTextHeight, updateElement]);

  const selectedElementData = selectedElements.length === 1 ?
    currentPage?.elements.find(el => el.id === selectedElements[0]) : null;

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = { ...tv };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/tv/${newId}/edit`);
          }
        }
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/tv/new`);
        }
      });
    }
  };

  return (
    <div className="tv-builder-container">
      {/* Header */}
      <div className="tv-builder-header">
        <h2>{isNew ? "Create New TV" : "Edit TV"}</h2>
        
        {/* TV Configuration */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
          <div className="form-group" style={{ minWidth: '200px' }}>
            <label className="form-label">TV Name</label>
            <input
                    type="text"
                    name="name"
                    value={tv.name || ''}
                    onChange={handleChange}
              className="form-input"
              placeholder="Enter TV name"
            />
          </div>

          <div className="form-group" style={{ minWidth: '200px' }}>
            <label className="form-label">Branch</label>
            <Select
              options={branchList}
              onChange={handleBranchChange}
              getOptionValue={option => option.id}
              getOptionLabel={option => option.name}
              value={tv.branch || null}
              placeholder="Select a branch..."
              isClearable
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Aspect Ratio</label>
            <div className="aspect-ratio-selector">
              {Object.keys(aspectRatios).map(ratio => (
                <button
                  key={ratio}
                  className={`aspect-ratio-btn ${aspectRatio === ratio ? 'active' : ''}`}
                  onClick={() => handleAspectRatioChange(ratio)}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Dimensions</label>
            <div className="dimension-input-group">
              <input
                type="number"
                value={tv.dimensions?.width || 1920}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="dimension-input"
                placeholder="Width"
              />
              <span className="dimension-label">×</span>
              <input
                type="number"
                value={tv.dimensions?.height || 1080}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="dimension-input"
                placeholder="Height"
                  />
                </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tv-builder-content">
        <div className="tv-builder-main">
          {/* TV Preview */}
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
                            justifyContent: 'center',
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
                            textAlign: 'center',
                            lineHeight: '1.2',
                            display: 'block',
                            width: '100%'
                          }}>
                            {element.content}
                          </span>
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

          {/* Carousel Pages */}
          <div className="carousel-container">
            <h3>Carousel Pages</h3>
            <div className="carousel-tabs">
              {tv.carouselPages?.map((page, index) => (
                <button
                  key={page.id}
                  className={`carousel-tab ${activePageIndex === index ? 'active' : ''}`}
                  onClick={() => setActivePageIndex(index)}
                >
                  <span>{page.name}</span>
                  {tv.carouselPages.length > 1 && (
                    <button
                      className="carousel-tab-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCarouselPage(index);
                      }}
                      title="Delete page"
                    >
                      ×
                    </button>
                  )}
                </button>
              ))}
              <button className="add-page-btn" onClick={addCarouselPage}>
                + Add Page
              </button>
            </div>

            {tv.carouselPages?.length === 0 ? (
              <div className="no-pages-message">
                No carousel pages yet. Click &quot;Add Page&quot; to create your first page.
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar */}
        <div className="tv-builder-sidebar">
          <h3>Page Configuration</h3>
          
          {currentPage && (
            <>
              {/* Page Name */}
              <div className="form-group">
                <label className="form-label">Page Name</label>
                <input
                  type="text"
                  value={currentPage.name}
                  onChange={(e) => updateCarouselPage(activePageIndex, { name: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Duration */}
              <div className="form-group">
                <label className="form-label">Duration (seconds)</label>
                <input
                  type="number"
                  value={currentPage.duration || 5}
                  onChange={(e) => updateCarouselPage(activePageIndex, { duration: parseInt(e.target.value, 10) || 5 })}
                  className="form-input"
                  min="1"
                />
              </div>

              {/* Item Selection */}
              <div className="form-group">
                <label className="form-label">Select Item</label>
                <Select
                  options={regularItemList}
                  onChange={handleItemSelection}
                  getOptionValue={option => option.id}
                  getOptionLabel={option => option.name}
                  value={currentPage.selectedItem || null}
                  placeholder="Choose an item..."
                  isClearable
                />
              </div>

              {/* Standalone Image Selector */}
              <div className="form-group">
                <label className="form-label">Add Custom Image</label>
                <p className="form-description">Add any image as a decorative element (not tied to items)</p>
                <MediaLibrary
                  handleFilesSelectCallback={(files) => {
                    if (files.length > 0) {
                      addElementToPage('image', files[0].thumbnailUrl, '', true);
                    }
                  }}
                  multiSelect={false}
                />
              </div>

              {/* Multi-Selection Operations */}
              {selectedElements.length > 1 && (
                <div className="multi-selection-toolbar">
                  <h4>Multi-Selection Operations ({selectedElements.length} selected)</h4>

                  <div className="toolbar-section">
                    <label className="form-label">Alignment</label>
                    <div className="toolbar-buttons">
                      <button
                        className="btn btn-outline btn-small"
                        onClick={alignLeft}
                        title="Align Left"
                      >
                        Align Left
                      </button>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={alignRight}
                        title="Align Right"
                      >
                        Align Right
                      </button>
                    </div>
                    <div className="toolbar-buttons">
                      <button
                        className="btn btn-outline btn-small"
                        onClick={alignTop}
                        title="Align Top"
                      >
                        Align Top
                      </button>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={alignBottom}
                        title="Align Bottom"
                      >
                        Align Bottom
                      </button>
                    </div>
                  </div>

                  <div className="toolbar-section">
                    <label className="form-label">Sizing</label>
                    <div className="toolbar-buttons">
                      <button
                        className="btn btn-outline btn-small"
                        onClick={makeSameWidth}
                        title="Make Same Width"
                      >
                        Same Width
                      </button>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={makeSameHeight}
                        title="Make Same Height"
                      >
                        Same Height
                      </button>
                    </div>
                    <div className="toolbar-buttons">
                      <button
                        className="btn btn-outline btn-small"
                        onClick={makeSameSizeSmaller}
                        title="Make Same Size (Smallest)"
                      >
                        Size &lt;
                      </button>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={makeSameSizeLarger}
                        title="Make Same Size (Largest)"
                      >
                        Size &gt;
                      </button>
                    </div>
                  </div>

                  {/* Text Controls - only show if all selected elements are text */}
                  {currentPage?.elements.filter(el => selectedElements.includes(el.id)).every(el => el.type === 'text') && (
                    <>
                      <div className="toolbar-section">
                        <label className="form-label">Text Color</label>
                        <input
                          type="color"
                          onChange={(e) => bulkChangeTextColor(e.target.value)}
                          className="color-input"
                          title="Change Text Color"
                        />
                      </div>

                      <div className="toolbar-section">
                        <label className="form-label">Font Size</label>
                        <input
                          type="number"
                          placeholder="Font Size"
                          onChange={(e) => {
                            const fontSize = parseInt(e.target.value, 10);
                            if (!isNaN(fontSize) && fontSize >= 8 && fontSize <= 120) {
                              bulkChangeFontSize(fontSize);
                            }
                          }}
                          className="control-input"
                          min="8"
                          max="120"
                          title="Change Font Size"
                        />
                      </div>
                    </>
                  )}

                  <div className="toolbar-section">
                    <label className="form-label">Actions</label>
                    <div className="toolbar-buttons">
                      <button
                        className="btn btn-outline btn-small"
                        onClick={bulkToggleLock}
                        title="Lock/Unlock Selected"
                      >
                        🔒 Lock/Unlock
                      </button>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={bulkDelete}
                        title="Delete Selected"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Item Fields */}
              {currentPage.selectedItem && (
                <div className="item-fields">
                  <h4>Item Details</h4>
                  
                  {/* Variant Selection */}
                  {currentPage.selectedItem.variants && currentPage.selectedItem.variants.length > 1 && (
                    <div className="form-group">
                      <label className="form-label">Select Variant</label>
                      <select
                        value={selectedVariantIndex}
                        onChange={(e) => handleVariantSelection(parseInt(e.target.value, 10))}
                        className="form-input"
                      >
                        {currentPage.selectedItem.variants.map((variant, index) => (
                          <option key={variant.id || index} value={index}>
                            {variant.name || `Variant ${index + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Show selected variant info */}
                  {currentPage.selectedItem.variants && currentPage.selectedItem.variants[selectedVariantIndex] && (
                    <>
                      <div className="item-field">
                        <label className="form-label">Variant Name</label>
                        <div className="item-field-content">
                          {currentPage.selectedItem.variants[selectedVariantIndex].name || 'Unnamed variant'}
                        </div>
                        <button 
                          className="btn btn-outline btn-small"
                          onClick={() => addElementToPage(
                            'text', 
                            currentPage.selectedItem.variants[selectedVariantIndex].name || '',
                            `variants[${currentPage.selectedItem.variants[selectedVariantIndex].id}].name`
                          )}
                        >
                          Add to Canvas
                        </button>
                      </div>

                      <div className="item-field">
                        <label className="form-label">Variant Description</label>
                        <div className="item-field-content">
                          {currentPage.selectedItem.variants[selectedVariantIndex].description || 'No description'}
                        </div>
                        {currentPage.selectedItem.variants[selectedVariantIndex].description && (
                          <button 
                            className="btn btn-outline btn-small"
                                                         onClick={() => addElementToPage(
                               'text', 
                               currentPage.selectedItem.variants[selectedVariantIndex].description || '',
                               `variants[${currentPage.selectedItem.variants[selectedVariantIndex].id}].description`
                             )}
                          >
                            Add to Canvas
                          </button>
                        )}
                      </div>

                      <div className="item-field">
                        <label className="form-label">Price</label>
                        <div className="item-field-content">
                          ${currentPage.selectedItem.variants[selectedVariantIndex].price?.toFixed(2) || 'No price set'}
                        </div>
                        {currentPage.selectedItem.variants[selectedVariantIndex].price && (
                          <button 
                            className="btn btn-outline btn-small"
                                                         onClick={() => addElementToPage(
                               'text', 
                               `$${currentPage.selectedItem.variants[selectedVariantIndex].price?.toFixed(2)}`,
                               `variants[${currentPage.selectedItem.variants[selectedVariantIndex].id}].price`
                             )}
                          >
                            Add to Canvas
                          </button>
                        )}
                      </div>

                      {currentPage.selectedItem.variants[selectedVariantIndex].attachments?.[0]?.url && (
                        <div className="item-field">
                          <label className="form-label">Variant Image</label>
                          <img 
                            src={currentPage.selectedItem.variants[selectedVariantIndex].attachments[0].url} 
                            alt="Variant" 
                            className="item-field-image"
                          />
                          <button 
                            className="btn btn-outline btn-small"
                                                         onClick={() => addElementToPage(
                               'image', 
                               currentPage.selectedItem.variants[selectedVariantIndex].attachments[0].url,
                               `variants[${currentPage.selectedItem.variants[selectedVariantIndex].id}].attachments[0].url`
                             )}
                          >
                            Add to Canvas
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <div className="item-field">
                    <label className="form-label">Item Name</label>
                    <div className="item-field-content">{currentPage.selectedItem.name}</div>
                    <button 
                      className="btn btn-outline btn-small"
                      onClick={() => addElementToPage('text', currentPage.selectedItem.name || '', 'name')}
                    >
                      Add to Canvas
                    </button>
                  </div>

                  <div className="item-field">
                    <label className="form-label">Item Description</label>
                    <div className="item-field-content">{currentPage.selectedItem.desc || 'No description'}</div>
                    {currentPage.selectedItem.desc && (
                      <button 
                        className="btn btn-outline btn-small"
                        onClick={() => addElementToPage('text', currentPage.selectedItem.desc || '', 'desc')}
                      >
                        Add to Canvas
                      </button>
                    )}
                  </div>

                  {currentPage.selectedItem.attachments?.[0]?.url && (
                    <div className="item-field">
                      <label className="form-label">Item Image</label>
                      <img 
                        src={currentPage.selectedItem.attachments[0].url} 
                        alt="Item" 
                        className="item-field-image"
                      />
                      <button 
                        className="btn btn-outline btn-small"
                        onClick={() => addElementToPage(
                          'image', 
                          currentPage.selectedItem.attachments[0].url,
                          'attachments[0].url'
                        )}
                      >
                        Add to Canvas
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Element Controls */}
              {selectedElementData && (
                <div className="element-controls">
                  <h4>Element Properties</h4>
                  
                  {selectedElementData.type === 'text' && (
                    <>
                      <div className="control-group">
                        <label className="control-label">Font Size</label>
                        <input
                          type="number"
                          value={selectedElementData.style?.fontSize || 24}
                          onChange={(e) => {
                            const newFontSize = parseInt(e.target.value, 10);
                            const updates: Partial<ICarouselItemElement> = {
                              style: { ...selectedElementData.style, fontSize: newFontSize }
                            };

                            // Auto-calculate height for text elements
                            if (selectedElementData.type === 'text') {
                              const autoHeight = calculateTextHeight(
                                selectedElementData.content,
                                newFontSize,
                                selectedElementData.size?.width || 0
                              );
                              updates.size = {
                                ...selectedElementData.size,
                                height: autoHeight
                              };
                            }

                            updateElement(selectedElements[0], updates);
                          }}
                          className="control-input"
                          min="8"
                          max="120"
                        />
                        <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>
                          💡 Font size scales only when dragging from corner. Height auto-adjusts to fit text.
                        </p>
                      </div>

                      <div className="control-group">
                        <label className="control-label">Color</label>
                        <input
                          type="color"
                          value={selectedElementData.style?.color || '#ffffff'}
                          onChange={(e) => updateElement(selectedElements[0], {
                            style: { ...selectedElementData.style, color: e.target.value }
                          })}
                          className="color-input"
                        />
                      </div>

                      <div className="control-group">
                        <label className="control-label">Weight</label>
                        <select
                          value={selectedElementData.style?.fontWeight || 'normal'}
                          onChange={(e) => updateElement(selectedElements[0], {
                            style: { ...selectedElementData.style, fontWeight: e.target.value }
                          })}
                          className="control-input"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                      
                      <div className="control-group">
                        <label className="control-label">Align</label>
                        <select
                          value={selectedElementData.style?.textAlign || 'left'}
                          onChange={(e) => updateElement(selectedElements[0], {
                            style: { ...selectedElementData.style, textAlign: e.target.value }
                          })}
                          className="control-input"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </>
                  )}

                  {selectedElementData.type === 'image' && (
                    <button 
                      className="btn btn-outline btn-small"
                      onClick={() => fitAsBackground(selectedElements[0])}
                      style={{ marginTop: '10px', marginRight: '10px' }}
                    >
                      <FaImage />
                      Fit as Background
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => deleteElement(selectedElements[0])}
                    style={{ marginTop: '10px' }}
                  >
                    Delete Element
                  </button>
                </div>
              )}

              {/* Layers Panel */}
              {currentPage && currentPage.elements.length > 0 && (
                <div className="layers-panel">
                  <h4>Layers</h4>
                  <div className="layers-list">
                    {currentPage.elements.map((element, index) => (
                      <div
                        key={element.id}
                        className={`layer-item ${selectedElements.includes(element.id) ? 'selected' : ''} ${element.locked ? 'locked' : ''}`}
                        onClick={(e) => {
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
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                          reorderElements(sourceIndex, index);
                        }}
                      >
                        <div className="layer-info">
                          <div className="layer-type">
                            {element.type === 'text' ? <FaFont /> : <FaImage />}
                            {element.locked && <span style={{ marginLeft: '4px', fontSize: '12px' }}>🔒</span>}
                          </div>
                          <div className="layer-content">
                            <div className="layer-name">
                              {element.type === 'text' ? 'Text' : 'Image'}
                            </div>
                            <div className="layer-preview">
                              {element.type === 'text' 
                                ? element.content.substring(0, 20) + (element.content.length > 20 ? '...' : '')
                                : 'Image Element'
                              }
                            </div>
                          </div>
                          <div className="layer-controls">
                            <button
                              className="layer-control-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveElementLayer(element.id, 'up');
                              }}
                              disabled={index === currentPage.elements.length - 1}
                              title="Bring forward"
                            >
                              <FaChevronUp />
                            </button>
                            <button
                              className="layer-control-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveElementLayer(element.id, 'down');
                              }}
                              disabled={index === 0}
                              title="Send backward"
                            >
                              <FaChevronDown />
                            </button>
                          </div>
                        </div>
                        <div className="layer-index">
                          Layer {currentPage.elements.length - index}
                        </div>
                      </div>
                    )).reverse()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="tv-actions">
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              <FaArrowLeft />
              Cancel
            </button>
            <button 
              onClick={saveEntity} 
              className="btn btn-primary" 
              disabled={updating}
            >
              <FaSave />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
        >
          <div className="context-menu-item" onClick={() => {
            moveElementLayer(contextMenu.elementId, 'up');
            closeContextMenu();
          }}>
            <FaArrowUp /> Bring Forward
          </div>
          <div className="context-menu-item" onClick={() => {
            moveElementLayer(contextMenu.elementId, 'down');
            closeContextMenu();
          }}>
            <FaArrowDown /> Send Backward
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => {
            const element = currentPage?.elements.find(el => el.id === contextMenu.elementId);
            if (element) {
              updateElement(contextMenu.elementId, { locked: !element.locked });
              if (!element.locked) {
                // Clear selection if we just locked the element
                setSelectedElements(prev => prev.filter(id => id !== contextMenu.elementId));
              }
            }
            closeContextMenu();
          }}>
            🔒 {currentPage?.elements.find(el => el.id === contextMenu.elementId)?.locked ? 'Unlock' : 'Lock'} Element
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item context-menu-delete" onClick={() => {
            deleteElement(contextMenu.elementId);
            closeContextMenu();
          }}>
            <FaTrash /> Delete Element
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={showDeleteDialog}
        style={{ width: '400px' }}
        header="Confirm Delete"
        modal
        onHide={cancelDelete}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={cancelDelete}
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              className="p-button-danger"
              onClick={confirmDelete}
            />
          </div>
        }
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#ff9800', marginRight: '10px' }}></i>
          <span>
            Are you sure you want to delete {selectedElements.length} element{selectedElements.length === 1 ? '' : 's'}?
            This action cannot be undone.
          </span>
        </div>
      </Dialog>
    </div>
  );
};

export default TVUpdate;
