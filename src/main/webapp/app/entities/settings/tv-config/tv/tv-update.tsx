import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

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
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
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
    setSelectedElement(null);
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
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<ICarouselItemElement>) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const updatedElements = currentPage.elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    updateCarouselPage(activePageIndex, { elements: updatedElements });
  };

  const deleteElement = (elementId: string) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const updatedElements = currentPage.elements.filter(el => el.id !== elementId);
    updateCarouselPage(activePageIndex, { elements: updatedElements });
    setSelectedElement(null);
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

  const getScreenDimensions = () => {
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
  };

  const screenDimensions = getScreenDimensions();
  const currentPage: ICarouselPage = tv.carouselPages?.[activePageIndex];
  const selectedElementData = selectedElement ? 
    currentPage?.elements.find(el => el.id === selectedElement) : null;

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
            >
              {currentPage?.elements.map((element, index) => (
                <div
                  key={element.id}
                  className={`carousel-element ${selectedElement === element.id ? 'selected' : ''}`}
                  onClick={() => setSelectedElement(element.id)}
                  onContextMenu={(e) => handleContextMenu(e, element.id)}
                  style={{
                    position: 'absolute',
                    left: ((element.position?.x || 0) / 100) * screenDimensions.width,
                    top: ((element.position?.y || 0) / 100) * screenDimensions.height,
                    width: ((element.size?.width || 0) / 100) * screenDimensions.width,
                    height: ((element.size?.height || 0) / 100) * screenDimensions.height,
                    zIndex: index + 1
                  }}
                >
                  <Draggable
                    disabled={resizingElement === element.id}
                    handle=".drag-handle"
                    bounds={false}
                    position={{ x: 0, y: 0 }}
                    onStop={(e, data) => {
                      const newX = ((element.position?.x || 0) / 100) * screenDimensions.width + (data?.x || 0);
                      const newY = ((element.position?.y || 0) / 100) * screenDimensions.height + (data?.y || 0);
                      updateElement(element.id, {
                        position: {
                          x: (newX / screenDimensions.width) * 100,
                          y: (newY / screenDimensions.height) * 100
                        }
                      });
                    }}
                  >
                    <ResizableBox
                      width={((element.size?.width || 0) / 100) * screenDimensions.width}
                      height={((element.size?.height || 0) / 100) * screenDimensions.height}
                      onResizeStart={() => setResizingElement(element.id)}
                      onResize={(e, data) => {
                        updateElement(element.id, {
                          size: {
                            width: ((data?.size?.width || 0) / screenDimensions.width) * 100,
                            height: ((data?.size?.height || 0) / screenDimensions.height) * 100
                          }
                        });
                      }}
                      onResizeStop={() => setResizingElement(null)}
                      minConstraints={[50, 30]}
                      maxConstraints={[screenDimensions.width, screenDimensions.height]}
                      resizeHandles={['se']}
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
                          cursor: resizingElement === element.id ? 'default' : 'move',
                          zIndex: 1
                        }}
                      />
                      {element.type === 'text' ? (
                        <div 
                          className="carousel-element-text"
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: element.style?.textAlign === 'center' ? 'center' : 
                                          element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '2px',
                            padding: '8px',
                            position: 'relative',
                            zIndex: 0
                          }}
                        >
                          <span style={{
                            fontSize: element.style?.fontSize || 24,
                            color: element.style?.color || '#ffffff',
                            fontWeight: element.style?.fontWeight || 'normal',
                            // @ts-expect-error -- textAlign is not typed
                            textAlign: element.style?.textAlign || 'left',
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
                        <label className="control-label">Text</label>
                        <input
                          type="text"
                          value={selectedElementData.content}
                          onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                          className="control-input"
                  />
                </div>

                      <div className="control-group">
                        <label className="control-label">Font Size</label>
                        <input
                          type="number"
                          value={selectedElementData.style?.fontSize || 24}
                          onChange={(e) => updateElement(selectedElement, {
                            style: { ...selectedElementData.style, fontSize: parseInt(e.target.value, 10) }
                          })}
                          className="control-input"
                          min="8"
                          max="120"
                  />
                </div>

                      <div className="control-group">
                        <label className="control-label">Color</label>
                        <input
                          type="color"
                          value={selectedElementData.style?.color || '#ffffff'}
                          onChange={(e) => updateElement(selectedElement, {
                            style: { ...selectedElementData.style, color: e.target.value }
                          })}
                          className="color-input"
                        />
                      </div>

                      <div className="control-group">
                        <label className="control-label">Weight</label>
                        <select
                          value={selectedElementData.style?.fontWeight || 'normal'}
                          onChange={(e) => updateElement(selectedElement, {
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
                          onChange={(e) => updateElement(selectedElement, {
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
                      onClick={() => fitAsBackground(selectedElement)}
                      style={{ marginTop: '10px', marginRight: '10px' }}
                    >
                      <FaImage />
                      Fit as Background
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => deleteElement(selectedElement)}
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
                        className={`layer-item ${selectedElement === element.id ? 'selected' : ''}`}
                        onClick={() => setSelectedElement(element.id)}
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
          <div className="context-menu-item context-menu-delete" onClick={() => {
            deleteElement(contextMenu.elementId);
            closeContextMenu();
          }}>
            <FaTrash /> Delete Element
          </div>
        </div>
      )}
    </div>
  );
};

export default TVUpdate;
