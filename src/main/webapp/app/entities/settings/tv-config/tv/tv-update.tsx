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

export const TVUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  // const branchList = useAppSelector(state => state.branch.entities);
  // const tvDisplayList = useAppSelector(state => state.tvDisplay.entities);
  const regularItemList = useAppSelector(state => state.regularItem.entities);
  const tv = useAppSelector(state => state.tv.entity);
  const loading = useAppSelector(state => state.tv.loading);
  const updating = useAppSelector(state => state.tv.updating);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');

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

  const updateCarouselPage = (pageIndex: number, updates: Partial<ICarouselPage>) => {
    const updatedPages = [...(tv.carouselPages || [])];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], ...updates };
    dispatch(changeEntityField({ name: "carouselPages", value: updatedPages }));
  };

  const handleItemSelection = (selectedItem: IRegularItem) => {
    updateCarouselPage(activePageIndex, { selectedItem });
  };

  const addElementToPage = (type: 'text' | 'image', content: string) => {
    const currentPage = tv.carouselPages?.[activePageIndex];
    if (!currentPage) return;

    const newElement: ICarouselItemElement = {
      id: `element-${Date.now()}`,
      type,
      content,
      position: { x: 10, y: 10 },
      size: { width: type === 'text' ? 30 : 20, height: type === 'text' ? 10 : 15 },
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
  const currentPage = tv.carouselPages?.[activePageIndex];
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
              {currentPage?.elements.map(element => (
                <Draggable
                  key={element.id}
                  position={{
                    x: (element.position.x / 100) * screenDimensions.width,
                    y: (element.position.y / 100) * screenDimensions.height
                  }}
                  onStop={(e, data) => {
                    updateElement(element.id, {
                      position: {
                        x: (data.x / screenDimensions.width) * 100,
                        y: (data.y / screenDimensions.height) * 100
                      }
                    });
                  }}
                >
                  <ResizableBox
                    width={(element.size.width / 100) * screenDimensions.width}
                    height={(element.size.height / 100) * screenDimensions.height}
                    onResize={(e, data) => {
                      updateElement(element.id, {
                        size: {
                          width: (data.size.width / screenDimensions.width) * 100,
                          height: (data.size.height / screenDimensions.height) * 100
                        }
                      });
                    }}
                    minConstraints={[50, 30]}
                    maxConstraints={[screenDimensions.width, screenDimensions.height]}
                  >
                    <div
                      className={`carousel-element ${selectedElement === element.id ? 'selected' : ''}`}
                      onClick={() => setSelectedElement(element.id)}
                      style={{
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {element.type === 'text' ? (
                        <div 
                          className="carousel-element-text"
                          style={{
                            fontSize: element.style?.fontSize || 24,
                            color: element.style?.color || '#ffffff',
                            fontWeight: element.style?.fontWeight || 'normal',
                            textAlign: element.style?.textAlign || 'left',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {element.content}
                        </div>
                      ) : (
                        <img src={element.content} alt="Element" />
                      )}
                    </div>
                  </ResizableBox>
                </Draggable>
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
                  {page.name}
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

              {/* Selected Item Fields */}
              {currentPage.selectedItem && (
                <div className="item-fields">
                  <h4>Item Details</h4>
                  
                  <div className="item-field">
                    <label className="form-label">Name</label>
                    <div className="item-field-content">{currentPage.selectedItem.name}</div>
                    <button 
                      className="btn btn-outline btn-small"
                      onClick={() => addElementToPage('text', currentPage.selectedItem.name)}
                    >
                      Add to Canvas
                    </button>
                  </div>

                  <div className="item-field">
                    <label className="form-label">Description</label>
                    <div className="item-field-content">{currentPage.selectedItem.desc || 'No description'}</div>
                    {currentPage.selectedItem.desc && (
                      <button 
                        className="btn btn-outline btn-small"
                        onClick={() => addElementToPage('text', currentPage.selectedItem.desc)}
                      >
                        Add to Canvas
                      </button>
                    )}
                  </div>

                  {currentPage.selectedItem.attachments?.[0]?.url && (
                    <div className="item-field">
                      <label className="form-label">Image</label>
                      <img 
                        src={currentPage.selectedItem.attachments[0].url} 
                        alt="Item" 
                        className="item-field-image"
                      />
                      <button 
                        className="btn btn-outline btn-small"
                        onClick={() => addElementToPage('image', currentPage.selectedItem.attachments[0].url)}
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

                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => deleteElement(selectedElement)}
                    style={{ marginTop: '10px' }}
                  >
                    Delete Element
                  </button>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="tv-actions">
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              <FontAwesomeIcon icon="arrow-left" />
              Cancel
            </button>
            <button 
              onClick={saveEntity} 
              className="btn btn-primary" 
              disabled={updating}
            >
              <FontAwesomeIcon icon="save" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVUpdate;
