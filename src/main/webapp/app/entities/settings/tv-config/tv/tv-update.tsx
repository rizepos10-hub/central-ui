/* eslint-disable complexity */


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
import { FaArrowDown, FaArrowLeft, FaArrowUp, FaChevronDown, FaChevronUp, FaImage, FaFont, FaSave, FaTrash, FaMinus } from 'react-icons/fa';
import { ITv } from '../../../../shared/model/TV/tv.model';
import MediaLibrary from "../../../../shared/components/media-library/media-library";
import { transformAttachmentStructure } from "../../../../shared/util/attachment-utils";

interface PreviewModalProps {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  currentPage: ICarouselPage | undefined;
  tv: ITv;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ showPreview, setShowPreview, currentPage, tv }) => {
  if (!showPreview) return null;

  return (
    <div
      className="preview-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={() => setShowPreview(false)}
    >
      <div
        className="preview-screen"
        style={{
          width: tv.dimensions?.width || 1920,
          height: tv.dimensions?.height || 1080,
          maxWidth: '95vw',
          maxHeight: '95vh',
          backgroundColor: '#000',
          position: 'relative',
          overflow: 'hidden',
          transform: 'scale(' + Math.min(
            (window.innerWidth * 0.95) / (tv.dimensions?.width || 1920),
            (window.innerHeight * 0.95) / (tv.dimensions?.height || 1080)
          ) + ')'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentPage?.elements.map((element, index) => (
          <div
            key={element.id}
            className="preview-element"
            style={{
              position: 'absolute',
              left: `${element.position?.x || 0}%`,
              top: `${element.position?.y || 0}%`,
              width: `${element.size?.width || 0}%`,
              height: `${element.size?.height || 0}%`,
              zIndex: index + 1,
              transform: element.type === 'line' ? `rotate(${element.angle || 0}deg)` : undefined,
              transformOrigin: element.type === 'line' ? 'center' : undefined
            }}
          >
            {element.type === 'text' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  fontSize: element.style?.fontSize || 24,
                  color: element.style?.color || '#ffffff',
                  fontWeight: element.style?.fontWeight || 'normal',
                  fontStyle: element.style?.fontStyle || 'normal',
                  textDecoration: element.style?.textDecoration || 'none',
                  fontFamily: element.style?.fontFamily || 'Arial, sans-serif',
                  textAlign: element.style?.textAlign as any || 'center',
                  lineHeight: '1.2'
                }}
              >
                {element.content}
              </div>
            ) : element.type === 'line' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
                  objectFit: 'cover'
                }}
              />
            )}
          </div>
        ))}

        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 1000
          }}
        >
          Press ESC to close preview
        </div>
      </div>
    </div>
  );
};

interface HeaderControlsProps {
  isNew: boolean;
  undo: () => void;
  redo: () => void;
  undoStack: ICarouselPage[];
  redoStack: ICarouselPage[];
  setShowPreview: (show: boolean) => void;
  currentPage: ICarouselPage | undefined;
  saveEntity: (e: any) => void;
  updating: boolean;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({
  isNew,
  undo,
  redo,
  undoStack,
  redoStack,
  setShowPreview,
  currentPage,
  saveEntity,
  updating
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2>{isNew ? "Create New TV" : "Edit TV"}</h2>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn btn-outline btn-small"
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          className="btn btn-outline btn-small"
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
        <button
          className="btn btn-primary btn-small"
          onClick={() => setShowPreview(true)}
          disabled={!currentPage || currentPage.elements.length === 0}
          title="Preview TV (Press Escape to close)"
        >
          👁️ Preview
        </button>
        <button
          className="btn btn-primary btn-small"
          onClick={saveEntity}
          disabled={updating}
          title="Save TV"
          style={{ marginLeft: '10px' }}
        >
          💾 Save
        </button>
      </div>
    </div>
  );
};

interface MultiSelectionToolbarProps {
  selectedElements: string[];
  alignLeft: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignBottom: () => void;
  spaceHorizontallyWithGap: (gapPercentage: number) => void;
  spaceVerticallyWithGap: (gapPercentage: number) => void;
  makeSameWidth: () => void;
  makeSameHeight: () => void;
  makeSameSizeSmaller: () => void;
  makeSameSizeLarger: () => void;
  bulkChangeTextColor: (color: string) => void;
  bulkChangeFontSize: (fontSize: number) => void;
  bulkChangeFontFamily: (fontFamily: string) => void;
  bulkChangeTextAlign: (textAlign: string) => void;
  bulkToggleFontWeight: () => void;
  bulkToggleFontStyle: () => void;
  bulkToggleUnderline: () => void;
  bulkToggleStrikethrough: () => void;
  bulkToggleLock: () => void;
  bulkDelete: () => void;
  currentPage: ICarouselPage | undefined;
}

const MultiSelectionToolbar: React.FC<MultiSelectionToolbarProps> = ({
  selectedElements,
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  spaceHorizontallyWithGap,
  spaceVerticallyWithGap,
  makeSameWidth,
  makeSameHeight,
  makeSameSizeSmaller,
  makeSameSizeLarger,
  bulkChangeTextColor,
  bulkChangeFontSize,
  bulkChangeFontFamily,
  bulkChangeTextAlign,
  bulkToggleFontWeight,
  bulkToggleFontStyle,
  bulkToggleUnderline,
  bulkToggleStrikethrough,
  bulkToggleLock,
  bulkDelete,
  currentPage
}) => {
  if (selectedElements.length <= 1) return null;

  const selectedTextElements = currentPage?.elements.filter(el => selectedElements.includes(el.id) && el.type === 'text') || [];
  const allSelectedAreText = currentPage?.elements.filter(el => selectedElements.includes(el.id)).every(el => el.type === 'text');

  // Local state for gap inputs
  const [horizontalGap, setHorizontalGap] = React.useState<number>(2);
  const [verticalGap, setVerticalGap] = React.useState<number>(2);

  // Check if any selected elements have specific styles
  const anyBold = selectedTextElements.some(el => el.style?.fontWeight === 'bold');
  const anyItalic = selectedTextElements.some(el => el.style?.fontStyle === 'italic');
  const anyUnderline = selectedTextElements.some(el => el.style?.textDecoration === 'underline');
  const anyStrikethrough = selectedTextElements.some(el => el.style?.textDecoration === 'line-through');

  return (
    <div className="multi-selection-toolbar">
      <h4>Multi-Selection Operations ({selectedElements.length} selected)</h4>

      <div className="toolbar-section">
        <label className="form-label">Alignment</label>
        <div className="toolbar-buttons">
          <button className="btn btn-outline btn-small" onClick={alignLeft} title="Align Left">
            Align Left
          </button>
          <button className="btn btn-outline btn-small" onClick={alignRight} title="Align Right">
            Align Right
          </button>
        </div>
        <div className="toolbar-buttons">
          <button className="btn btn-outline btn-small" onClick={alignTop} title="Align Top">
            Align Top
          </button>
          <button className="btn btn-outline btn-small" onClick={alignBottom} title="Align Bottom">
            Align Bottom
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <label className="form-label">Spacing</label>
        <div className="toolbar-buttons">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>H:</span>
            <input
              type="number"
              value={horizontalGap}
              onChange={(e) => setHorizontalGap(Number(e.target.value))}
              className="control-input"
              style={{ width: '50px', padding: '2px 4px' }}
              min="0"
              max="20"
              step="0.5"
            />
            <span style={{ fontSize: '11px', color: '#666' }}>%</span>
            <button
              className="btn btn-outline btn-small"
              onClick={() => spaceHorizontallyWithGap(horizontalGap)}
              title={`Space horizontally with ${horizontalGap}% gaps`}
              disabled={selectedElements.length < 2}
            >
              Apply H
            </button>
          </div>
        </div>
        <div className="toolbar-buttons">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>V:</span>
            <input
              type="number"
              value={verticalGap}
              onChange={(e) => setVerticalGap(Number(e.target.value))}
              className="control-input"
              style={{ width: '50px', padding: '2px 4px' }}
              min="0"
              max="20"
              step="0.5"
            />
            <span style={{ fontSize: '11px', color: '#666' }}>%</span>
            <button
              className="btn btn-outline btn-small"
              onClick={() => spaceVerticallyWithGap(verticalGap)}
              title={`Space vertically with ${verticalGap}% gaps`}
              disabled={selectedElements.length < 2}
            >
              Apply V
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar-section">
        <label className="form-label">Sizing</label>
        <div className="toolbar-buttons">
          <button className="btn btn-outline btn-small" onClick={makeSameWidth} title="Make Same Width">
            Same Width
          </button>
          <button className="btn btn-outline btn-small" onClick={makeSameHeight} title="Make Same Height">
            Same Height
          </button>
        </div>
        <div className="toolbar-buttons">
          <button className="btn btn-outline btn-small" onClick={makeSameSizeSmaller} title="Make Same Size (Smallest)">
            Size &lt;
          </button>
          <button className="btn btn-outline btn-small" onClick={makeSameSizeLarger} title="Make Same Size (Largest)">
            Size &gt;
          </button>
        </div>
      </div>

      {allSelectedAreText && (
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

          <div className="toolbar-section">
            <label className="form-label">Font Family</label>
            <select
              onChange={(e) => bulkChangeFontFamily(e.target.value)}
              className="control-input"
              defaultValue=""
              title="Change Font Family"
            >
              <option value="">Choose font...</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="Tahoma, sans-serif">Tahoma</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="Impact, sans-serif">Impact</option>
              <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
            </select>
          </div>

          <div className="toolbar-section">
            <label className="form-label">Text Alignment</label>
            <div className="toolbar-buttons">
              <button
                className="btn btn-small btn-outline"
                onClick={() => bulkChangeTextAlign('left')}
                title="Align Left"
              >
                ⬅️
              </button>
              <button
                className="btn btn-small btn-outline"
                onClick={() => bulkChangeTextAlign('center')}
                title="Align Center"
              >
                ↔️
              </button>
              <button
                className="btn btn-small btn-outline"
                onClick={() => bulkChangeTextAlign('right')}
                title="Align Right"
              >
                ➡️
              </button>
            </div>
          </div>

          <div className="toolbar-section">
            <label className="form-label">Font Styles</label>
            <div className="toolbar-buttons">
              <button
                className={`btn btn-small font-toggle ${anyBold ? 'active' : 'btn-outline'}`}
                onClick={bulkToggleFontWeight}
                title="Toggle Bold"
              >
                <strong>B</strong>
              </button>
              <button
                className={`btn btn-small font-toggle ${anyItalic ? 'active' : 'btn-outline'}`}
                onClick={bulkToggleFontStyle}
                title="Toggle Italic"
              >
                <em>I</em>
              </button>
              <button
                className={`btn btn-small font-toggle ${anyUnderline ? 'active' : 'btn-outline'}`}
                onClick={bulkToggleUnderline}
                title="Toggle Underline"
              >
                <u>U</u>
              </button>
              <button
                className={`btn btn-small font-toggle ${anyStrikethrough ? 'active' : 'btn-outline'}`}
                onClick={bulkToggleStrikethrough}
                title="Toggle Strikethrough"
              >
                <s>S</s>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="toolbar-section">
        <label className="form-label">Actions</label>
        <div className="toolbar-buttons">
          <button className="btn btn-outline btn-small" onClick={bulkToggleLock} title="Lock/Unlock Selected">
            🔒 Lock/Unlock
          </button>
          <button className="btn btn-secondary btn-small" onClick={bulkDelete} title="Delete Selected">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line complexity
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
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Local state for smooth resize preview
  const [resizePreview, setResizePreview] = useState<{[elementId: string]: {width: number, height: number, fontSize?: number}} | null>(null);

  // Store initial positions when drag starts
  const [dragStartPositions, setDragStartPositions] = useState<{[elementId: string]: {x: number, y: number}} | null>(null);

  // Line rotation functionality
  const [rotatingElement, setRotatingElement] = useState<string | null>(null);
  const [rotationStart, setRotationStart] = useState<{x: number, y: number, angle: number} | null>(null);
  const [showAngleDisplay, setShowAngleDisplay] = useState<{elementId: string, angle: number, x: number, y: number} | null>(null);

  // Undo/Redo functionality
  const [undoStack, setUndoStack] = useState<ICarouselPage[]>([]);
  const [redoStack, setRedoStack] = useState<ICarouselPage[]>([]);
  const [isUndoRedo, setIsUndoRedo] = useState(false); // Flag to prevent saving undo states during undo/redo

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

  // Helper function to calculate angle between two points
  const calculateAngle = (centerX: number, centerY: number, pointX: number, pointY: number): number => {
    const deltaX = pointX - centerX;
    const deltaY = pointY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    // Normalize angle to 0-360 degrees
    if (angle < 0) angle += 360;
    return Math.round(angle);
  };

  // Helper function to get element center position in screen coordinates
  const getElementCenter = (element: ICarouselItemElement): {x: number, y: number} => {
    const elementLeft = ((element.position?.x || 0) / 100) * screenDimensions.width;
    const elementTop = ((element.position?.y || 0) / 100) * screenDimensions.height;
    const elementWidth = ((element.size?.width || 0) / 100) * screenDimensions.width;
    const elementHeight = ((element.size?.height || 0) / 100) * screenDimensions.height;

    return {
      x: elementLeft + elementWidth / 2,
      y: elementTop + elementHeight / 2
    };
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

  const addElementToPage = (type: 'text' | 'image' | 'line', content: string, fieldToQuery?: string, isStandaloneImage = false, isBackgroundImage = false) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    // For standalone images and lines, we don't need a selected item
    if (!isStandaloneImage && type !== 'line' && !currentPage.selectedItem) return;

    const selectedItem = currentPage.selectedItem;

    // For text elements tied to items, we need field queries
    if (!isStandaloneImage && type !== 'line' && !fieldToQuery && type === 'text') return;

    const newElement: ICarouselItemElement = {
      id: `element-${Date.now()}`,
      type,
      documentType: 'ITEM',
      documentId: (isStandaloneImage || type === 'line') ? '' : (selectedItem?.id || ''),
      fieldToQuery: fieldToQuery || '',
      content,
      position: isBackgroundImage ? { x: 0, y: 0 } : { x: 10, y: 10 },
      size: isBackgroundImage
        ? { width: 100, height: 100 } // Full screen background
        : type === 'line'
          ? { width: 30, height: 0.5 } // Default line: 30% width, thin height
          : { width: type === 'text' ? 30 : 20, height: type === 'text' ? 10 : 15 },
      angle: type === 'line' ? 0 : undefined, // Lines start at 0 degrees
      style: type === 'text' ? {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'normal',
        textAlign: 'left'
      } : type === 'line' ? {
        color: '#ffffff',
        lineWidth: 2,
        lineStyle: 'solid'
      } : undefined
    };

    const updatedElements = [...currentPage.elements, newElement];
    updateCarouselPage(activePageIndex, { elements: updatedElements });
    setSelectedElements([newElement.id]);
  };


  const updateElement = (elementId: string, updates: Partial<ICarouselItemElement>, saveUndo = true) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    // Save undo state before making changes
    if (saveUndo && !isUndoRedo) {
      saveUndoState();
    }

    // For drag/resize operations, we'll use immediate updates to avoid delays
    const updatedElements = currentPage.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    updateCarouselPage(activePageIndex, { elements: updatedElements });
  };

  const updateMultipleElements = (elementIds: string[], updates: Partial<ICarouselItemElement> | ((element: ICarouselItemElement) => Partial<ICarouselItemElement>), saveUndo = true) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    if (saveUndo && !isUndoRedo) {
      saveUndoState();
    }

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


  const spaceHorizontallyWithGap = (gapPercentage: number) => {
    if (selectedElements.length < 2) return;

    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    saveUndoState();

    const elements = currentPage.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));

    // Sort elements by their X position (left to right)
    const sortedElements = [...selectedElementsData].sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

    // Calculate new positions with equal gaps
    const updates: { [elementId: string]: Partial<ICarouselItemElement> } = {};

    // Start with the first element's position and track cumulative position
    let currentX = (sortedElements[0].position?.x || 0) + (sortedElements[0].size?.width || 0);

    // Position each subsequent element with the specified gap
    for (let i = 1; i < sortedElements.length; i++) {
      const currentElement = sortedElements[i];

      // Add gap and position the current element
      currentX += gapPercentage;

      updates[currentElement.id] = {
        position: {
          ...currentElement.position,
          x: currentX
        }
      };

      // Update currentX to the end of this element for the next iteration
      currentX += (currentElement.size?.width || 0);
    }

    // Apply all updates at once by updating the entire elements array
    const updatedElements = elements.map(el =>
      updates[el.id] ? { ...el, ...updates[el.id] } : el
    );
    updateCarouselPage(activePageIndex, { elements: updatedElements });
  };

  const spaceVerticallyWithGap = (gapPercentage: number) => {
    if (selectedElements.length < 2) return;

    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    saveUndoState();

    const elements = currentPage.elements || [];
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));

    // Sort elements by their Y position (top to bottom)
    const sortedElements = [...selectedElementsData].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

    // Calculate new positions with equal gaps
    const updates: { [elementId: string]: Partial<ICarouselItemElement> } = {};

    // Start with the first element's position and track cumulative position
    let currentY = (sortedElements[0].position?.y || 0) + (sortedElements[0].size?.height || 0);

    // Position each subsequent element with the specified gap
    for (let i = 1; i < sortedElements.length; i++) {
      const currentElement = sortedElements[i];

      // Add gap and position the current element
      currentY += gapPercentage;

      updates[currentElement.id] = {
        position: {
          ...currentElement.position,
          y: currentY
        }
      };

      // Update currentY to the end of this element for the next iteration
      currentY += (currentElement.size?.height || 0);
    }

    // Apply all updates at once by updating the entire elements array
    const updatedElements = elements.map(el =>
      updates[el.id] ? { ...el, ...updates[el.id] } : el
    );
    updateCarouselPage(activePageIndex, { elements: updatedElements });
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

  const bulkChangeFontFamily = (fontFamily: string) => {
    const elements = currentPage?.elements || [];
    const selectedTextElementIds = elements
      .filter(el => selectedElements.includes(el.id) && el.type === 'text')
      .map(el => el.id);

    updateMultipleElements(selectedTextElementIds, (element) => ({
      style: {
        ...element.style,
        fontFamily
      }
    }));
  };

  const bulkChangeTextAlign = (textAlign: string) => {
    const elements = currentPage?.elements || [];
    const selectedTextElementIds = elements
      .filter(el => selectedElements.includes(el.id) && el.type === 'text')
      .map(el => el.id);

    updateMultipleElements(selectedTextElementIds, (element) => ({
      style: {
        ...element.style,
        textAlign
      }
    }));
  };

  const bulkToggleFontWeight = () => {
    const elements = currentPage?.elements || [];
    const selectedTextElements = elements.filter(el => selectedElements.includes(el.id) && el.type === 'text');
    const anyBold = selectedTextElements.some(el => el.style?.fontWeight === 'bold');

    updateMultipleElements(selectedTextElements.map(el => el.id), (element) => ({
      style: {
        ...element.style,
        fontWeight: anyBold ? 'normal' : 'bold'
      }
    }));
  };

  const bulkToggleFontStyle = () => {
    const elements = currentPage?.elements || [];
    const selectedTextElements = elements.filter(el => selectedElements.includes(el.id) && el.type === 'text');
    const anyItalic = selectedTextElements.some(el => el.style?.fontStyle === 'italic');

    updateMultipleElements(selectedTextElements.map(el => el.id), (element) => ({
      style: {
        ...element.style,
        fontStyle: anyItalic ? 'normal' : 'italic'
      }
    }));
  };

  const bulkToggleUnderline = () => {
    const elements = currentPage?.elements || [];
    const selectedTextElements = elements.filter(el => selectedElements.includes(el.id) && el.type === 'text');
    const anyUnderline = selectedTextElements.some(el => el.style?.textDecoration === 'underline');

    updateMultipleElements(selectedTextElements.map(el => el.id), (element) => ({
      style: {
        ...element.style,
        textDecoration: anyUnderline ? 'none' : 'underline'
      }
    }));
  };

  const bulkToggleStrikethrough = () => {
    const elements = currentPage?.elements || [];
    const selectedTextElements = elements.filter(el => selectedElements.includes(el.id) && el.type === 'text');
    const anyStrikethrough = selectedTextElements.some(el => el.style?.textDecoration === 'line-through');

    updateMultipleElements(selectedTextElements.map(el => el.id), (element) => ({
      style: {
        ...element.style,
        textDecoration: anyStrikethrough ? 'none' : 'line-through'
      }
    }));
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

  // Undo/Redo functions
  const saveUndoState = useCallback(() => {
    if (isUndoRedo || !currentPage) return;

    setUndoStack(prev => {
      const newStack = [...prev, { ...currentPage }];
      // Limit undo stack to 50 operations
      return newStack.length > 50 ? newStack.slice(1) : newStack;
    });

    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, [currentPage, isUndoRedo]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    setIsUndoRedo(true);

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    // Save current state to redo stack
    if (currentPage) {
      setRedoStack(prev => [...prev, { ...currentPage }]);
    }

    // Update the TV state with previous state
    setUndoStack(newUndoStack);
    updateCarouselPage(activePageIndex, previousState);

    // Clear selections
    setSelectedElements([]);

    setTimeout(() => setIsUndoRedo(false), 100);
  }, [undoStack, currentPage, activePageIndex, updateCarouselPage]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    setIsUndoRedo(true);

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    // Save current state to undo stack
    if (currentPage) {
      setUndoStack(prev => [...prev, { ...currentPage }]);
    }

    // Update the TV state with next state
    setRedoStack(newRedoStack);
    updateCarouselPage(activePageIndex, nextState);

    // Clear selections
    setSelectedElements([]);

    setTimeout(() => setIsUndoRedo(false), 100);
  }, [redoStack, currentPage, activePageIndex, updateCarouselPage]);

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

      // Escape: Clear selection or close preview
      if (e.key === 'Escape') {
        if (showPreview) {
          setShowPreview(false);
        } else {
          setSelectedElements([]);
          closeContextMenu();
        }
      }

      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && undoStack.length > 0) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')) {
        if (redoStack.length > 0) {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, selectedElements, showPreview]);

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
        <HeaderControls
          isNew={isNew}
          undo={undo}
          redo={redo}
          undoStack={undoStack}
          redoStack={redoStack}
          setShowPreview={setShowPreview}
          currentPage={currentPage}
          saveEntity={saveEntity}
          updating={updating}
        />

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
                    zIndex: index + 1,
                    transform: element.type === 'line' ? `rotate(${element.angle || 0}deg)` : undefined,
                    transformOrigin: element.type === 'line' ? 'center' : undefined
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
                        element.type === 'text' ? ['e', 'se'] :
                        element.type === 'line' ? ['e'] : // Lines: only east (width)
                        ['se'] // Images: southeast (corner)
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

                      {/* Custom Rotation Handle for Lines */}
                      {element.type === 'line' && selectedElements.includes(element.id) && !element.locked && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-10px',
                            right: '-10px',
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#ff6b35',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'crosshair',
                            zIndex: 1000,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (element.locked) return;

                            setRotatingElement(element.id);
                            const center = getElementCenter(element);
                            setRotationStart({
                              x: e.clientX,
                              y: e.clientY,
                              angle: element.angle || 0
                            });

                            // Show angle display
                            setShowAngleDisplay({
                              elementId: element.id,
                              angle: element.angle || 0,
                              x: center.x,
                              y: center.y
                            });

                            const handleMouseMove = (moveE: MouseEvent) => {
                              const center = getElementCenter(element);
                              const newAngle = calculateAngle(center.x, center.y, moveE.clientX, moveE.clientY);

                              // Update angle display
                              setShowAngleDisplay({
                                elementId: element.id,
                                angle: newAngle,
                                x: center.x,
                                y: center.y
                              });

                              // Update only this element's angle
                              updateElement(element.id, { angle: newAngle }, false);
                            };

                            const handleMouseUp = () => {
                              setRotatingElement(null);
                              setRotationStart(null);
                              setShowAngleDisplay(null);
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          title="Drag to rotate"
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

              {/* Add Line Button */}
              <div className="form-group">
                <label className="form-label">Add Line Element</label>
                <p className="form-description">Add a line that can be resized and rotated</p>
                <button
                  className="btn btn-outline"
                  onClick={() => addElementToPage('line', '', '', true)}
                  style={{ width: '100%' }}
                >
                  ➖ Add Line
                </button>
              </div>

              <MultiSelectionToolbar
                selectedElements={selectedElements}
                alignLeft={alignLeft}
                alignRight={alignRight}
                alignTop={alignTop}
                alignBottom={alignBottom}
                spaceHorizontallyWithGap={spaceHorizontallyWithGap}
                spaceVerticallyWithGap={spaceVerticallyWithGap}
                makeSameWidth={makeSameWidth}
                makeSameHeight={makeSameHeight}
                makeSameSizeSmaller={makeSameSizeSmaller}
                makeSameSizeLarger={makeSameSizeLarger}
                bulkChangeTextColor={bulkChangeTextColor}
                bulkChangeFontSize={bulkChangeFontSize}
                bulkChangeFontFamily={bulkChangeFontFamily}
                bulkChangeTextAlign={bulkChangeTextAlign}
                bulkToggleFontWeight={bulkToggleFontWeight}
                bulkToggleFontStyle={bulkToggleFontStyle}
                bulkToggleUnderline={bulkToggleUnderline}
                bulkToggleStrikethrough={bulkToggleStrikethrough}
                bulkToggleLock={bulkToggleLock}
                bulkDelete={bulkDelete}
                currentPage={currentPage}
              />

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
                        <label className="control-label">Font Family</label>
                        <select
                          value={selectedElementData.style?.fontFamily || 'Arial, sans-serif'}
                          onChange={(e) => updateElement(selectedElements[0], {
                            style: { ...selectedElementData.style, fontFamily: e.target.value }
                          })}
                          className="control-input"
                        >
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="Helvetica, sans-serif">Helvetica</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="'Times New Roman', serif">Times New Roman</option>
                          <option value="'Courier New', monospace">Courier New</option>
                          <option value="Verdana, sans-serif">Verdana</option>
                          <option value="Tahoma, sans-serif">Tahoma</option>
                          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                          <option value="Impact, sans-serif">Impact</option>
                          <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                        </select>
                      </div>

                      <div className="control-group">
                        <label className="control-label">Font Styles</label>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button
                            className={`btn btn-small font-toggle ${(selectedElementData.style?.fontWeight === 'bold') ? 'active' : 'btn-outline'}`}
                            onClick={() => updateElement(selectedElements[0], {
                              style: {
                                ...selectedElementData.style,
                                fontWeight: selectedElementData.style?.fontWeight === 'bold' ? 'normal' : 'bold'
                              }
                            })}
                            title="Bold"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            className={`btn btn-small font-toggle ${(selectedElementData.style?.fontStyle === 'italic') ? 'active' : 'btn-outline'}`}
                            onClick={() => updateElement(selectedElements[0], {
                              style: {
                                ...selectedElementData.style,
                                fontStyle: selectedElementData.style?.fontStyle === 'italic' ? 'normal' : 'italic'
                              }
                            })}
                            title="Italic"
                          >
                            <em>I</em>
                          </button>
                          <button
                            className={`btn btn-small font-toggle ${(selectedElementData.style?.textDecoration === 'underline') ? 'active' : 'btn-outline'}`}
                            onClick={() => updateElement(selectedElements[0], {
                              style: {
                                ...selectedElementData.style,
                                textDecoration: selectedElementData.style?.textDecoration === 'underline' ? 'none' : 'underline'
                              }
                            })}
                            title="Underline"
                          >
                            <u>U</u>
                          </button>
                          <button
                            className={`btn btn-small font-toggle ${(selectedElementData.style?.textDecoration === 'line-through') ? 'active' : 'btn-outline'}`}
                            onClick={() => updateElement(selectedElements[0], {
                              style: {
                                ...selectedElementData.style,
                                textDecoration: selectedElementData.style?.textDecoration === 'line-through' ? 'none' : 'line-through'
                              }
                            })}
                            title="Strikethrough"
                          >
                            <s>S</s>
                          </button>
                        </div>
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

                  {selectedElementData.type === 'line' && (
                    <>
                      <div className="control-group">
                        <label className="control-label">Line Color</label>
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
                        <label className="control-label">Line Width</label>
                        <input
                          type="number"
                          value={selectedElementData.style?.lineWidth || 2}
                          onChange={(e) => updateElement(selectedElements[0], {
                            style: { ...selectedElementData.style, lineWidth: parseInt(e.target.value, 10) }
                          })}
                          className="control-input"
                          min="1"
                          max="20"
                        />
                      </div>

                      <div className="control-group">
                        <label className="control-label">Line Style</label>
                        <select
                          value={selectedElementData.style?.lineStyle || 'solid'}
                          onChange={(e) => updateElement(selectedElements[0], {
                            style: { ...selectedElementData.style, lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted' }
                          })}
                          className="control-input"
                        >
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </div>

                      <div className="control-group">
                        <label className="control-label">Angle</label>
                        <input
                          type="number"
                          value={selectedElementData.angle || 0}
                          onChange={(e) => updateElement(selectedElements[0], {
                            angle: parseInt(e.target.value, 10)
                          })}
                          className="control-input"
                          min="0"
                          max="359"
                        />
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>°</span>
                      </div>

                      <p style={{ fontSize: '11px', color: '#666', margin: '8px 0' }}>
                        💡 Drag the orange circle to rotate the line. Use the blue handle to resize width.
                      </p>
                    </>
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
                            {element.type === 'text' ? <FaFont /> :
                             element.type === 'line' ? <FaMinus /> : <FaImage />}
                            {element.locked && <span style={{ marginLeft: '4px', fontSize: '12px' }}>🔒</span>}
                          </div>
                          <div className="layer-content">
                            <div className="layer-name">
                              {element.type === 'text' ? 'Text' :
                               element.type === 'line' ? 'Line' : 'Image'}
                            </div>
                            <div className="layer-preview">
                              {element.type === 'text'
                                ? element.content.substring(0, 20) + (element.content.length > 20 ? '...' : '')
                                : element.type === 'line'
                                  ? `${element.angle || 0}° • ${element.style?.lineWidth || 2}px`
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

      {/* Angle Display during rotation */}
      {showAngleDisplay && (
        <div
          style={{
            position: 'fixed',
            left: showAngleDisplay.x + 20,
            top: showAngleDisplay.y - 30,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 10000,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {showAngleDisplay.angle}°
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

      <PreviewModal
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        currentPage={currentPage}
        tv={tv}
      />
    </div>
  );
};

export default TVUpdate;
