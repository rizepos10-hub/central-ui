import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ICarouselItem, ILayouts, SelectedLayoutEnum } from 'app/shared/model/ONLINE_ORDERING/layouts/layouts.module';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { Checkbox } from 'primereact/checkbox';
import React, { useEffect, useMemo, useState } from 'react'
import { Card, Carousel, CarouselControl, CarouselItem, Col, FormGroup, Input, Label, Row, Spinner } from 'reactstrap'
import { getEntity, updateEntity, reset, changeEntityField } from 'app/entities/online-ordering/settings/settings.reducer';
import { InputText } from 'primereact/inputtext';
import { TabPanel, TabView } from 'primereact/tabview';
import ItemSelectionModal from 'app/entities/menu/item-selection-modal';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ColorPicker } from 'primereact/colorpicker';
import { searchEntities as getRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { ITerm } from 'app/shared/model/term.model';
import Select from 'react-select';
import { translate } from 'react-jhipster';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { IAttachment } from 'app/shared/model/attachment.model';
import { ISliderSettings } from 'app/shared/model/ONLINE_ORDERING/slider-settings';
import { buttonSettingsAlignment } from 'app/shared/model/ENUMS/button-settings-alignment';
import { FaDesktop, FaMobileAlt } from 'react-icons/fa';
import { debounce } from 'lodash';
import { searchEntities } from 'app/entities/item/all-items.reducer';
import { MultiSelect } from 'primereact/multiselect';
import CategoriesLayout from '../layout-settings/components/categories/categories';
import { Layout } from 'app/shared/model/ENUMS/layout.model';
import { searchEntities as SearchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import AsyncSelect from 'react-select/async';

const Layouts = () => {
    const dispatch = useAppDispatch();
    const uiSettings: IUiSettings = useAppSelector(state => state.uiSettings.entity);

    useEffect(() => {
        dispatch(getEntity())
    }, [])

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="mb-1">Layout Settings</h2>
                <p className="text-muted">Choose and configure your online ordering layout</p>
            </div>
            
            <Card className="shadow-sm mb-4">
                <div className="card-body p-4">
                    <h5 className="card-title mb-3">Select Layout</h5>
                    <Row className="g-4">
                        <Col md={6} lg={4}>
                            <LayoutsCard
                                layouts={uiSettings.layouts}
                                layoutKey={SelectedLayoutEnum.LAYOUT_DEFAULT}
                                imageSrc="/content/images/LAYOUT_DEFAULT.png"
                                title="Default Layout"
                                description="Standard layout with slider and categories"
                            />
                        </Col>
                        <Col md={6} lg={4}>
                            <LayoutsCard
                                layouts={uiSettings.layouts}
                                layoutKey={SelectedLayoutEnum.LAYOUT_ONE}
                                imageSrc="/content/images/LAYOUT_ONE.png"
                                title="Gabriel Pizza Layout"
                                description="Custom layout with featured sections"
                            />
                        </Col>
                    </Row>
                </div>
            </Card>

            {uiSettings.layouts?.selectedLayout && (
                <Card className="shadow-sm mb-4">
                    <div className="card-body p-0">
                        {uiSettings.layouts?.selectedLayout === SelectedLayoutEnum.LAYOUT_ONE && 
                            <LayoutGabrielPizzaForm layouts={uiSettings.layouts} />}
                        {uiSettings.layouts?.selectedLayout === SelectedLayoutEnum.LAYOUT_DEFAULT && 
                            <LayoutDefaultForm layouts={uiSettings.layouts} />}
                    </div>
                </Card>
            )}

            <div className="d-flex justify-content-end gap-2">
                <Button 
                    label="Cancel" 
                    outlined
                    className="px-4"
                />
                <Button 
                    label="Save Changes" 
                    className="px-4"
                    onClick={() => dispatch(updateEntity(uiSettings))}
                    disabled={!uiSettings.layouts?.selectedLayout}
                />
            </div>
        </div>
    )
}

const LayoutsCard = ({
    layouts,
    layoutKey,
    imageSrc,
    title,
    description
}: {
    layouts: ILayouts
    layoutKey: SelectedLayoutEnum
    imageSrc: string
    title: string
    description: string
}) => {
    const dispatch = useAppDispatch();
    const isSelected = layouts?.selectedLayout === layoutKey;

    return (
        <div 
            className={`card h-100 cursor-pointer ${isSelected ? 'border-primary shadow-sm' : 'border-light'}`}
            style={{ 
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}
            onClick={() => {
                dispatch(changeEntityField({
                    name: 'layouts.selectedLayout',
                    value: isSelected ? null : layoutKey
                }))
            }}
        >
            <div className="position-relative">
                <img
                    src={imageSrc}
                    className="card-img-top"
                    alt={title}
                    style={{ 
                        height: '200px', 
                        objectFit: 'cover',
                        filter: isSelected ? 'none' : 'grayscale(20%)'
                    }}
                />
                {isSelected && (
                    <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-primary">
                            <i className="pi pi-check"></i>
                        </span>
                    </div>
                )}
            </div>
            <div className="card-body d-flex flex-column">
                <p className="card-text text-muted small flex-grow-1">{description}</p>
                <div className="mt-auto">
                    <Button
                        label={isSelected ? "Selected" : "Select Layout"}
                        className="w-100"
                        severity={isSelected ? "success" : "secondary"}
                        outlined={!isSelected}
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            dispatch(changeEntityField({
                                name: 'layouts.selectedLayout',
                                value: isSelected ? null : layoutKey
                            }))
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

const LayoutGabrielPizzaForm = ({
    layouts,
}: {
    layouts: ILayouts;
}) => {
    const dispatch = useAppDispatch();
    const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);
    const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);

    useEffect(() => {
        dispatch(getRetailCategories({
            page: 0,
            size: 1000,
            sort: `id,desc`,
        }))
        dispatch(getRestaurantCategories({
            page: 0,
            size: 1000,
            sort: `id,desc`,
        }))
    }, [])

    const combinedCategories = useMemo(() => {
        return [...retailCategories, ...restaurantCategories]
    }, [retailCategories, restaurantCategories])

    const layoutOne: ILayouts["LAYOUT_ONE"] | undefined = layouts?.[SelectedLayoutEnum.LAYOUT_ONE];
    const selectedItems: IItem[] =
        useAppSelector(state =>
            state.uiSettings.entity?.layouts?.[SelectedLayoutEnum.LAYOUT_ONE]?.sections?.body?.featuredItems?.rightColumn?.items
        ) || [];
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFieldChange = (path: string, value: any) => {
        dispatch(
            changeEntityField({
                name: path,
                value,
            })
        );
    };

    const handleToggleSelect = (items: IItem[]) => {
        const updatedList = [...selectedItems];
        items.forEach(item => {
            const index = updatedList.findIndex(selected => selected.id === item.id);
            if (index === -1) {
                updatedList.push(item);
            } else {
                updatedList.splice(index, 1);
            }
        });
        // Update the store
        handleFieldChange(
            `layouts.${SelectedLayoutEnum.LAYOUT_ONE}.sections.body.featuredItems.rightColumn.items`,
            updatedList
        );
    };

    useEffect(() => {
        if (selectedItems.length > 0) {
            handleFieldChange(
                'layouts.LAYOUT_ONE.sections.featuredItems.rightColumn.items',
                selectedItems
            )
        }
    }, [selectedItems])

    return (
        <div className="p-4">
            <TabView className="layout-config-tabs">
                <TabPanel header="Colors">
                    <div className="mb-4">
                        <h5 className="mb-2">Color Settings</h5>
                        <p className="text-muted small">Configure your layout&apos;s color scheme</p>
                    </div>
                    
                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="background" className="form-label fw-semibold">Background Color</Label>
                                <div className="d-flex align-items-center gap-3">
                                    <ColorPicker
                                        value={layoutOne?.colorSettings?.background || '#ffffff'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.background',
                                                `#${e.value}`
                                            )
                                        }
                                        format="hex"
                                    />
                                    <InputText
                                        value={layoutOne?.colorSettings?.background || '#ffffff'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.background',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#ffffff"
                                        className="flex-grow-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="foreground" className="form-label fw-semibold">Foreground Color</Label>
                                <div className="d-flex align-items-center gap-3">
                                    <ColorPicker
                                        value={layoutOne?.colorSettings?.foreground || '#000000'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.foreground',
                                                `#${e.value}`
                                            )
                                        }
                                        format="hex"
                                    />
                                    <InputText
                                        value={layoutOne?.colorSettings?.foreground || '#000000'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.foreground',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#000000"
                                        className="flex-grow-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="primary" className="form-label fw-semibold">Primary Color</Label>
                                <div className="d-flex align-items-center gap-3">
                                    <ColorPicker
                                        value={layoutOne?.colorSettings?.primary || '#007bff'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.primary',
                                                `#${e.value}`
                                            )
                                        }
                                        format="hex"
                                    />
                                    <InputText
                                        value={layoutOne?.colorSettings?.primary || '#007bff'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.primary',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#007bff"
                                        className="flex-grow-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="primaryForeground" className="form-label fw-semibold">Primary Text Color</Label>
                                <div className="d-flex align-items-center gap-3">
                                    <ColorPicker
                                        value={layoutOne?.colorSettings?.primaryForeground || '#ffffff'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.primaryForeground',
                                                `#${e.value}`
                                            )
                                        }
                                        format="hex"
                                    />
                                    <InputText
                                        value={layoutOne?.colorSettings?.primaryForeground || '#ffffff'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.primaryForeground',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#ffffff"
                                        className="flex-grow-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="secondary" className="form-label fw-semibold">Secondary Color</Label>
                                <div className="d-flex align-items-center gap-3">
                                    <ColorPicker
                                        value={layoutOne?.colorSettings?.secondary || '#6c757d'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.secondary',
                                                `#${e.value}`
                                            )
                                        }
                                        format="hex"
                                    />
                                    <InputText
                                        value={layoutOne?.colorSettings?.secondary || '#6c757d'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.secondary',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#6c757d"
                                        className="flex-grow-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="muted" className="form-label fw-semibold">Muted Color</Label>
                                <div className="d-flex align-items-center gap-3">
                                    <ColorPicker
                                        value={layoutOne?.colorSettings?.muted || '#868e96'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.muted',
                                                `#${e.value}`
                                            )
                                        }
                                        format="hex"
                                    />
                                    <InputText
                                        value={layoutOne?.colorSettings?.muted || '#868e96'}
                                        onChange={e =>
                                            handleFieldChange(
                                                'layouts.LAYOUT_ONE.colorSettings.muted',
                                                e.target.value
                                            )
                                        }
                                        placeholder="#868e96"
                                        className="flex-grow-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Header">
                    <div className="mb-4">
                        <h5 className="mb-2">Header Configuration</h5>
                        <p className="text-muted small">Configure your header content</p>
                    </div>
                    
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="headerTitle" className="form-label fw-semibold">Header Title</Label>
                                <InputText
                                    id="headerTitle"
                                    value={layoutOne?.sections?.header?.title || ''}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.sections.header.title',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter header title"
                                    className="w-100"
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="headerCta" className="form-label fw-semibold">Call to Action</Label>
                                <InputText
                                    id="headerCta"
                                    value={layoutOne?.sections?.header?.callToAction || ''}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.sections.header.callToAction',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter call to action text"
                                    className="w-100"
                                />
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Content">
                    <div className="layout-body-sections">
                        <div className="content-section-card card mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 fw-bold text-primary">🎠 Carousel Section</h6>
                                <small className="text-muted">Manage rotating banner slides for your homepage</small>
                            </div>
                            <div className="card-body">
                                <LayoutGabrielPizzaCarousel carousel={layoutOne?.sections?.body?.carousel} />
                            </div>
                        </div>

                        <div className="content-section-card card mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 fw-bold text-primary">⭐ Featured Items Section</h6>
                                <small className="text-muted">Highlight specific products on your homepage</small>
                            </div>
                            <div className="card-body">
                                <LayoutGabrielPizzaFeaturedItems
                                    layoutOne={layoutOne}
                                    handleFieldChange={handleFieldChange}
                                    selectedItems={selectedItems}
                                    handleToggleSelect={handleToggleSelect}
                                    isModalOpen={isModalOpen}
                                    setIsModalOpen={setIsModalOpen}
                                />
                            </div>
                        </div>

                        <div className="content-section-card card mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 fw-bold text-primary">📂 Featured Categories Section</h6>
                                <small className="text-muted">Showcase product categories to guide customer navigation</small>
                            </div>
                            <div className="card-body">
                                <LayoutGabrielPizzaFeaturedCategories
                                    layoutOne={layoutOne}
                                    handleFieldChange={handleFieldChange}
                                    combinedCategories={combinedCategories}
                                />
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Footer">
                    <div className="mb-4">
                        <h5 className="mb-2">Footer Configuration</h5>
                        <p className="text-muted small">Configure your footer content</p>
                    </div>
                    
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="footerTitle" className="form-label fw-semibold">Footer Title</Label>
                                <InputText
                                    id="footerTitle"
                                    value={layoutOne?.sections?.footer?.title || ''}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.sections.footer.title',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter footer title"
                                    className="w-100"
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <Label htmlFor="footerCta" className="form-label fw-semibold">Call to Action</Label>
                                <InputText
                                    id="footerCta"
                                    value={layoutOne?.sections?.footer?.callToAction || ''}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.sections.footer.callToAction',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter call to action text"
                                    className="w-100"
                                />
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
};

const LayoutGabrielPizzaCarousel = ({
    carousel
}: {
    carousel: ICarouselItem[]
}) => {
    const dispatch = useAppDispatch();

    const handleFieldChange = (index: number, field: keyof ICarouselItem, value: string) => {
        const updatedCarousel = [...carousel];
        updatedCarousel[index] = {
            ...updatedCarousel[index],
            [field]: value,
        };
        dispatch(
            changeEntityField({
                name: `layouts.${SelectedLayoutEnum.LAYOUT_ONE}.sections.body.carousel`,
                value: updatedCarousel,
            })
        );
    };

    const handleAddItem = () => {
        const newItem: ICarouselItem = {
            order: (carousel?.length || 0) + 1,
            image: null,
            altText: '',
            primaryTitle: '',
            secondaryTitle: '',
            description: '',
            callToAction: '',
        };
        dispatch(
            changeEntityField({
                name: `layouts.${SelectedLayoutEnum.LAYOUT_ONE}.sections.body.carousel`,
                value: [...carousel || [], newItem],
            })
        );
    };

    const handleRemoveItem = (index: number) => {
        const updatedCarousel = carousel.filter((_, idx) => idx !== index);
        dispatch(
            changeEntityField({
                name: `layouts.${SelectedLayoutEnum.LAYOUT_ONE}.sections.body.carousel`,
                value: updatedCarousel,
            })
        );
    };

    return (
        <div>
            {carousel?.length === 0 || !carousel ? (
                <div className="text-center py-5 border border-dashed rounded bg-light">
                    <div className="mb-3">
                        <i className="pi pi-image" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                    </div>
                    <h6 className="text-muted mb-2">No carousel slides yet</h6>
                    <p className="text-muted mb-3 small">Add engaging slides to showcase your featured content</p>
                    <Button 
                        label="Add Your First Slide" 
                        icon="pi pi-plus" 
                        onClick={handleAddItem}
                        outlined
                        size="small"
                    />
                </div>
            ) : (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted small">{carousel?.length || 0} slide{(carousel?.length || 0) !== 1 ? 's' : ''} configured</span>
                        <Button 
                            label="Add Slide" 
                            icon="pi pi-plus" 
                            onClick={handleAddItem}
                            size="small"
                        />
                    </div>
                    {carousel?.map((item, index) => (
                    <div
                        key={index}
                        className="border rounded p-3 mb-2 position-relative"
                    >
                        <Button 
                            icon="pi pi-trash" 
                            severity="danger" 
                            text
                            rounded
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                            tooltip="Remove slide"
                            className="position-absolute"
                            style={{
                                top: '8px',
                                right: '8px',
                                zIndex: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid rgba(220, 53, 69, 0.3)',
                                width: '30px',
                                height: '30px',
                                minWidth: '30px'
                            }}
                        />
                        <div className="mb-3">
                            <h6 className="text-primary fw-bold mb-0">Slide {index + 1}</h6>
                            <small className="text-muted">Configure your carousel slide content</small>
                        </div>
                        <Row className="mb-2">
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`src-${index}`} className="form-label fw-semibold">Image</Label>
                                <MediaLibrary
                                    handleFilesSelectCallback={files => handleFieldChange(index,
                                        'image',
                                        transformAttachmentStructure(files, 'toIAttachment')[0]
                                    )}
                                    defaultValues={transformAttachmentStructure(item?.image ? [item?.image] : [], 'toFileLibraryListItem')}
                                />
                            </Col>
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`altText-${index}`} className="form-label fw-semibold">Alt Text</Label>
                                <InputText
                                    id={`altText-${index}`}
                                    value={item.altText || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'altText', e.target.value)
                                    }
                                    placeholder="Image description"
                                    className="w-100"
                                />
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`primaryTitle-${index}`} className="form-label fw-semibold">Primary Title</Label>
                                <InputText
                                    id={`primaryTitle-${index}`}
                                    value={item.primaryTitle || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'primaryTitle', e.target.value)
                                    }
                                    placeholder="Main headline"
                                    className="w-100"
                                />
                            </Col>
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`secondaryTitle-${index}`} className="form-label fw-semibold">Secondary Title</Label>
                                <InputText
                                    id={`secondaryTitle-${index}`}
                                    value={item.secondaryTitle || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'secondaryTitle', e.target.value)
                                    }
                                    placeholder="Subtitle"
                                    className="w-100"
                                />
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col md={12}>
                                <Label htmlFor={`description-${index}`} className="form-label fw-semibold">Description</Label>
                                <InputText
                                    id={`description-${index}`}
                                    value={item.description || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'description', e.target.value)
                                    }
                                    placeholder="Slide description"
                                    className="w-100"
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Label htmlFor={`callToAction-${index}`} className="form-label fw-semibold">Call to Action</Label>
                                <InputText
                                    id={`callToAction-${index}`}
                                    value={item.callToAction || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'callToAction', e.target.value)
                                    }
                                    placeholder="Button text"
                                    className="w-100"
                                />
                            </Col>
                        </Row>
                    </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LayoutGabrielPizzaFeaturedItems = ({
    layoutOne,
    handleFieldChange,
    selectedItems,
    handleToggleSelect,
    isModalOpen,
    setIsModalOpen
}: {
    layoutOne: ILayouts["LAYOUT_ONE"],
    handleFieldChange: any,
    selectedItems: IItem[],
    handleToggleSelect: any,
    isModalOpen: boolean,
    setIsModalOpen: any
}) => {
    return (
        <Row>
            <Col md={6}>
                {/* <div className='d-flex flex-column'>
                    <Label htmlFor="bodyOrder">Order</Label>
                    <InputNumber
                        value={layoutOne?.sections?.body?.featuredItems?.order}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.order',
                            e.value
                        )}
                        min={1}
                        max={3}
                    />
                </div> */}
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftTitle">Title</Label>
                    <InputText
                        id='bodyLeftTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.leftColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.leftColumn.title',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftSubTitle">SubTitle</Label>
                    <InputText
                        id='bodyLeftSubTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.leftColumn?.subtitle}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.leftColumn.subtitle',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftImage">Image</Label>
                    <MediaLibrary
                        handleFilesSelectCallback={files => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.leftColumn.image',
                            transformAttachmentStructure(files, 'toIAttachment')[0]
                        )}
                        defaultValues={transformAttachmentStructure(layoutOne?.sections?.body?.featuredItems?.leftColumn?.image ? [layoutOne?.sections?.body?.featuredItems?.leftColumn?.image] : [], 'toFileLibraryListItem')}
                    />
                </div>
            </Col>
            <Col md={6}>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftTitle">Title</Label>
                    <InputText
                        id='bodyLeftTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.rightColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.rightColumn.title',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftSubTitle">SubTitle</Label>
                    <InputText
                        id='bodyLeftSubTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.rightColumn?.subtitle}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.rightColumn.subtitle',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftCta">Call To Action Label</Label>
                    <InputText
                        id='bodyLeftCta'
                        value={layoutOne?.sections?.body?.featuredItems?.rightColumn?.callToAction}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.rightColumn.callToAction',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="headerTitle" className="form-label fw-semibold mb-2">Featured Items</Label>
                    <ItemSelectionModal
                        isOpen={isModalOpen}
                        toggle={() => setIsModalOpen(prev => !prev)}
                        selectedItems={selectedItems}
                        setSelectedItems={() => null}
                        handleToggleSelect={handleToggleSelect}
                    />
                    
                    {selectedItems?.length === 0 ? (
                        <div className="text-center py-3 border border-dashed rounded bg-light mb-2">
                            <p className="text-muted mb-2 small">No featured items selected</p>
                            <Button
                                label="Select Items"
                                icon="pi pi-plus"
                                onClick={() => setIsModalOpen(prev => !prev)}
                                outlined
                                size="small"
                            />
                        </div>
                    ) : (
                        <div className="mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small">{selectedItems?.length || 0} item{(selectedItems?.length || 0) !== 1 ? 's' : ''} selected</span>
                                <Button
                                    label="Add More"
                                    icon="pi pi-plus"
                                    onClick={() => setIsModalOpen(prev => !prev)}
                                    size="small"
                                />
                            </div>
                            <div className="selected-items-list">
                                {layoutOne?.sections?.body?.featuredItems?.rightColumn?.items?.map((item, idx) => (
                                    <div key={idx} className="d-flex align-items-center justify-content-between p-2 border rounded mb-1 bg-white">
                                        <span className="fw-medium">{item.name}</span>
                                        <Button 
                                            icon="pi pi-times" 
                                            severity="danger" 
                                            text 
                                            size="small"
                                            onClick={() => handleToggleSelect([item])}
                                            tooltip="Remove item"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Col>
        </Row>
    )
}

const LayoutGabrielPizzaFeaturedCategories = ({
    layoutOne,
    handleFieldChange,
    combinedCategories,
}: {
    layoutOne: ILayouts["LAYOUT_ONE"],
    handleFieldChange: any,
    combinedCategories: ITerm[]
}) => {

    return (
        <Row>
            <Col md={6}>
                {/* <div className='d-flex flex-column'>
                    <Label htmlFor="bodyOrder">Order</Label>
                    <InputNumber
                        value={layoutOne?.sections?.body?.featuredItems?.order}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.order',
                            e.value
                        )}
                        min={1}
                        max={3}
                    />
                </div> */}
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftTitle">Title</Label>
                    <InputText
                        id='bodyLeftTitle'
                        value={layoutOne?.sections?.body?.featuredCategories?.leftColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.leftColumn.title',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftCategories" className="form-label fw-semibold">Categories</Label>
                    <Select
                        value={layoutOne?.sections?.body?.featuredCategories?.leftColumn?.categories}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.leftColumn.categories',
                            e
                        )}
                        options={combinedCategories}
                        getOptionLabel={option => option.name}
                        getOptionValue={option => option.id}
                        isMulti
                        isClearable
                        placeholder="Select categories to feature"
                        className="mb-2"
                    />
                    {(!layoutOne?.sections?.body?.featuredCategories?.leftColumn?.categories || layoutOne?.sections?.body?.featuredCategories?.leftColumn?.categories?.length === 0) && (
                        <div className="text-center py-2 text-muted small">
                            No categories selected for this column
                        </div>
                    )}
                </div>
            </Col>
            <Col md={6}>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftTitle">Title</Label>
                    <InputText
                        id='bodyLeftTitle'
                        value={layoutOne?.sections?.body?.featuredCategories?.rightColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.title',
                            e.target.value
                        )}
                        min={1}
                        max={3}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftSubTitle">SubTitle</Label>
                    <InputText
                        id='bodyLeftSubTitle'
                        value={layoutOne?.sections?.body?.featuredCategories?.rightColumn?.subtitle}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.subtitle',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftDescription">Description</Label>
                    <InputText
                        id='bodyLeftDescription'
                        value={layoutOne?.sections?.body?.featuredCategories?.rightColumn?.description}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.description',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftImage">Image</Label>
                    <MediaLibrary
                        handleFilesSelectCallback={files => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.image',
                            transformAttachmentStructure(files, 'toIAttachment')[0]
                        )}
                        defaultValues={transformAttachmentStructure(layoutOne?.sections?.body?.featuredCategories?.rightColumn?.image ? [layoutOne?.sections?.body?.featuredCategories?.rightColumn?.image] : [], 'toFileLibraryListItem')}
                    />
                </div>
            </Col>
        </Row>
    )
}


// default layout 

const LayoutDefaultForm = ({
    layouts,
}: {
    layouts: ILayouts;
}) => {
    return (
        <Card>
            <TabView>
                <TabPanel header={translate('tempApp.layoutSettings.tabs.slider.label')}>
                    <LayoutDefaultSlider defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.specialProducts.label')}>
                    <LayoutDefaultProductSetting defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.restaurantCategories.label')}>
                    <LayoutDefaultRestaurantCategories defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.retailCategories.label')}>
                    <LayoutDefaultRetailCategories defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabPanel>
            </TabView>
        </Card >
    )
}

const LayoutDefaultSlider = ({
    defaultLayout,
}: {
    defaultLayout: ILayouts["LAYOUT_DEFAULT"]
}) => {
    const dispatch = useAppDispatch();
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [animating, setAnimating] = useState<boolean>(false);
    const [isMobileView, setIsMobileView] = useState(false);

    const [image, setImage] = useState<IAttachment[] | null>(null);
    const [text, setText] = useState<string>('');


    const next = () => {
        if (animating) return;
        const nextIndex = activeIndex === defaultLayout?.sliderSettings.length - 1 ? 0 : activeIndex + 1;
        setActiveIndex(nextIndex);
    };

    const previous = () => {
        if (animating) return;
        const nextIndex = activeIndex === 0 ? defaultLayout?.sliderSettings.length - 1 : activeIndex - 1;
        setActiveIndex(nextIndex);
    };

    useEffect(() => {
        if (!defaultLayout?.sliderSettings) return;

        if (defaultLayout?.sliderSettings.length === 0) {
            setActiveIndex(0);
        } else if (activeIndex >= defaultLayout?.sliderSettings.length) {
            setActiveIndex(defaultLayout?.sliderSettings.length - 1);
        }
    }, [defaultLayout?.sliderSettings, activeIndex]);

    const slides = defaultLayout?.sliderSettings?.map((slider, index) => (
        <CarouselItem
            key={index + 1}
            onExiting={() => setAnimating(true)}
            onExited={() => setAnimating(false)}
            style={{
                display: 'flex !important',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <img
                src={slider.image?.url}
                alt={`Preview ${index}`}
                style={{
                    width: '100%',
                    height: isMobileView ? '70vh' : '50vh',
                    objectFit: isMobileView ? 'cover' : 'fill',
                    objectPosition: 'center center'
                }}
            />
            <Button
                color="danger"
                onClick={() => dispatch(changeEntityField({ name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.sliderSettings`, value: defaultLayout?.sliderSettings.filter((_, i) => i !== index) }))}
                style={{
                    marginTop: '10px',
                    width: '100%',
                }}
            >
                Remove this slide
            </Button>
        </CarouselItem>
    ));

    const handleImageChange = () => {
        const newSlider: ISliderSettings = {
            image: image[0],
            text,
            buttonSetting: {
                text: '',
                color: '',
                alignment: buttonSettingsAlignment.CENTER
            }
        };
        setActiveIndex(defaultLayout?.sliderSettings?.length);
        dispatch(changeEntityField({ name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.sliderSettings`, value: [...defaultLayout.sliderSettings || [], newSlider] }));
        setImage(null);
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: isMobileView ? '300px' : '100%',
        width: '100%',
        margin: '0 auto',
        transition: 'max-width 0.3s ease',
    };

    return (
        <div>
            <FormGroup style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <MediaLibrary
                    handleFilesSelectCallback={(files) => setImage(transformAttachmentStructure(files, 'toIAttachment'))}
                    defaultValues={transformAttachmentStructure(image, 'toFileLibraryListItem')}
                />
                <InputText
                    placeholder="Enter text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <Button
                    color="primary"
                    onClick={handleImageChange}
                    disabled={!image}
                >
                    Add Slide
                </Button>
            </FormGroup>

            {defaultLayout?.sliderSettings && defaultLayout?.sliderSettings.length > 0 && (
                <>
                    <div style={{
                        marginTop: '20px',
                        marginBottom: "20px",
                        textAlign: 'center',
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <h3>
                            {translate('tempApp.layoutSettings.tabs.slider.preview')}
                        </h3>
                        <div style={{
                            textAlign: 'center',
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px"
                        }}>
                            <Button color={isMobileView ? "primary" : "secondary"} onClick={() => setIsMobileView(true)}>
                                <FaMobileAlt />
                            </Button>
                            <Button color={isMobileView ? "secondary" : "primary"} onClick={() => setIsMobileView(false)}>
                                <FaDesktop />
                            </Button>
                        </div>
                    </div>

                    <div style={containerStyle}>
                        <Carousel activeIndex={activeIndex} next={next} previous={previous}>
                            {slides}
                            <CarouselControl direction="prev" directionText="Previous" onClickHandler={previous} />
                            <CarouselControl direction="next" directionText="Next" onClickHandler={next} />
                        </Carousel>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px"
                    }}>
                    </div>
                </>
            )}
        </div>
    )
}

const LayoutDefaultProductSetting = ({
    defaultLayout,
}: {
    defaultLayout: ILayouts["LAYOUT_DEFAULT"];
}) => {
    const dispatch = useAppDispatch();
    const loading = useAppSelector(state => state.allItems.loading);

    const debouncedLoadOptions = useMemo(
        () =>
            debounce((inputValue, callback) => {
                dispatch(
                    searchEntities({
                        query: inputValue,
                        sort: 'id,asc',
                        page: 0,
                        size: 25,
                    })
                ).then(res => {
                    // @ts-expect-error -- unknown type
                    const options = (res.payload?.data || [])?.map(item => ({
                        value: item.id,
                        label: item.name,
                        data: item,
                    }));
                    callback(options);
                });
            }, 500),
        [dispatch]
    );

    const selectedOptions = defaultLayout?.productSetting?.FEATURED?.items?.map(item => ({
        value: item.id,
        label: item.name,
        data: item,
    }));

    return (
        <div>
            <Row>
                <div className="d-flex flex-column mb-3">
                    <Label htmlFor="featured-title"><strong>Title</strong></Label>
                    <InputText
                        id="featured-title"
                        value={defaultLayout?.productSetting?.FEATURED.title || ''}
                        onChange={e =>
                            dispatch(
                                changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                    value: {
                                        ...defaultLayout?.productSetting,
                                        FEATURED: {
                                            ...defaultLayout?.productSetting?.FEATURED,
                                            title: e.target.value,
                                        },
                                    },
                                })
                            )
                        }
                    />
                </div>

                <div className="d-flex flex-column gap-2">
                    <h5>Selected Items</h5>
                    <ol>
                        {defaultLayout?.productSetting?.FEATURED.items?.map(item => (
                            <li key={item.id}>{item.name}</li>
                        ))}
                    </ol>
                </div>

                <AsyncSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={debouncedLoadOptions}
                    isLoading={loading}
                    placeholder="Select Products"
                    className="w-full md:w-20rem"
                    value={selectedOptions}
                    onChange={selected => {
                        const selectedItems = selected
                            ? selected?.map(opt => opt.data)
                            : [];
                        dispatch(
                            changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                value: {
                                    ...defaultLayout?.productSetting,
                                    FEATURED: {
                                        ...defaultLayout?.productSetting?.FEATURED,
                                        items: selectedItems,
                                    },
                                },
                            })
                        );
                    }}
                />
            </Row>

            <Row style={{ marginTop: '1rem' }}>
                <div className="flex align-items-center">
                    <Checkbox
                        checked={defaultLayout?.productSetting?.FEATURED.showImages}
                        onChange={e =>
                            dispatch(
                                changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                    value: {
                                        ...defaultLayout?.productSetting,
                                        FEATURED: {
                                            ...defaultLayout?.productSetting?.FEATURED,
                                            showImages: e.checked,
                                        },
                                    },
                                })
                            )
                        }
                    />
                    <label className="ml-2">Show Images</label>
                </div>
            </Row>
        </div>
    );
};


const LayoutDefaultRestaurantCategories = ({
    defaultLayout,
}: {
    defaultLayout: ILayouts["LAYOUT_DEFAULT"]
}) => {
    const dispatch = useAppDispatch();

    const loading = useAppSelector(state => state.restaurantCategory.loading);

    const [activeIndex, setActiveIndex] = useState(0);

    const debouncedLoadOptions = useMemo(
        () =>
            debounce((inputValue, callback) => {
                dispatch(
                    SearchRestaurantCategories({
                        query: inputValue,
                        sort: 'id,asc',
                        page: 0,
                        size: 25,
                    })
                ).then(res => {
                    // @ts-expect-error -- unknown type
                    const options = (res.payload?.data || [])?.map(item => ({
                        value: item.id,
                        label: item.name,
                        data: item,
                    }));
                    callback(options);
                });
            }, 500),
        [dispatch]
    );

    const selectedOptions = defaultLayout?.restuarantCategorySetting?.categories?.map(item => ({
        value: item.id,
        label: item.name,
        data: item,
    })) || [];

    const layouts = [
        {
            id: 1,
            name: 'layout 1',
            value: Layout.layoutOne
        },
        {
            id: 2,
            name: 'layout 2',
            value: Layout.layoutTwo
        }
    ]

    return (
        <div>
            <div>
                <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="UiSettings-domain">
                        <strong>title</strong>
                    </Label>
                    <InputText
                        id="UiSettings-domain"
                        value={defaultLayout?.restuarantCategorySetting?.title || ''}
                        onChange={e => dispatch(changeEntityField({
                            name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting`,
                            value: { ...defaultLayout?.restuarantCategorySetting, title: e.target.value }
                        }))}
                    />
                </div>

                <div className='d-flex flex-column gap-2'>
                    <ol>
                        {defaultLayout?.restuarantCategorySetting?.categories?.map(category => (
                            <li key={category.id}>{category.name}</li>
                        ))}
                    </ol>
                </div>

                <AsyncSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={debouncedLoadOptions}
                    isLoading={loading}
                    placeholder="Select Products"
                    className="w-full md:w-20rem"
                    value={selectedOptions}
                    onChange={selected => {
                        const selectedItems = selected
                            ? selected?.map(opt => opt.data)
                            : [];
                        dispatch(
                            changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting.categories`,
                                value: selectedItems,
                            })
                        );
                    }}
                />

                {defaultLayout?.restuarantCategorySetting?.categories?.length > 0 && (
                    <>
                        <Row style={{
                            marginTop: '1rem'
                        }}>
                            <div className="flex align-items-center">
                                <Checkbox
                                    onChange={e => {
                                        dispatch(changeEntityField({
                                            name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting`,
                                            value: {
                                                ...defaultLayout?.restuarantCategorySetting, showImages: e.checked
                                            }
                                        }))
                                    }
                                    }
                                    checked={defaultLayout?.restuarantCategorySetting?.showImages}
                                />
                                <label htmlFor="ingredient1" className="ml-2">Show Images</label>
                            </div>
                        </Row>
                        <div>
                            <TabView activeIndex={activeIndex} onTabChange={(e) => {
                                setActiveIndex(e.index)
                                dispatch(changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting`,
                                    value: {
                                        ...defaultLayout?.restuarantCategorySetting, layout: layouts[e.index].value
                                    }
                                }))
                            }}>
                                {layouts?.map((layout, index) => (
                                    <TabPanel key={layout.id} header={layout.name}>
                                        <CategoriesLayout layout={layout.value} categories={defaultLayout?.restuarantCategorySetting?.categories || []} />
                                    </TabPanel>
                                ))}
                            </TabView>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const LayoutDefaultRetailCategories = ({
    defaultLayout,
}: {
    defaultLayout: ILayouts["LAYOUT_DEFAULT"]
}) => {
    const dispatch = useAppDispatch();

    const loading = useAppSelector(state => state.retailCategory.loading);
    const [activeIndex, setActiveIndex] = useState(0);

    const debouncedLoadOptions = useMemo(
        () =>
            debounce((inputValue, callback) => {
                dispatch(
                    getRetailCategories({
                        query: inputValue,
                        sort: 'id,asc',
                        page: 0,
                        size: 25,
                    })
                ).then(res => {
                    // @ts-expect-error -- unknown type
                    const options = (res.payload?.data || [])?.map(item => ({
                        value: item.id,
                        label: item.name,
                        data: item,
                    }));
                    callback(options);
                });
            }, 500),
        [dispatch]
    );

    const selectedOptions = defaultLayout?.retailCategorySetting?.categories?.map(item => ({
        value: item.id,
        label: item.name,
        data: item,
    })) || [];

    const layouts = [
        {
            id: 1,
            name: 'layout 1',
            value: Layout.layoutOne,
        },
        {
            id: 2,
            name: 'layout 2',
            value: Layout.layoutTwo
        }
    ]

    return (
        <div>
            <div>
                <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="UiSettings-domain">
                        <strong>title</strong>
                    </Label>
                    <InputText
                        id="UiSettings-domain"
                        value={defaultLayout?.retailCategorySetting?.title || ''}
                        onChange={e => dispatch(changeEntityField({
                            name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting`,
                            value: { ...defaultLayout?.retailCategorySetting, title: e.target.value }
                        }))}
                    />
                </div>

                <div className='d-flex flex-column gap-2'>
                    <ol>
                        {defaultLayout?.retailCategorySetting?.categories?.map(category => (
                            <li key={category.id}>{category.name}</li>
                        ))}
                    </ol>
                </div>

                <AsyncSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={debouncedLoadOptions}
                    isLoading={loading}
                    placeholder="Select Products"
                    className="w-full md:w-20rem"
                    value={selectedOptions}
                    onChange={selected => {
                        const selectedItems = selected
                            ? selected?.map(opt => opt.data)
                            : [];
                        dispatch(
                            changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting.categories`,
                                value: selectedItems,
                            })
                        );
                    }}
                />

                {defaultLayout?.retailCategorySetting?.categories?.length > 0 && (
                    <>
                        <Row style={{
                            marginTop: '1rem'
                        }}>
                            <div className="flex align-items-center">
                                <Checkbox
                                    onChange={e => {
                                        dispatch(changeEntityField({
                                            name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting`,
                                            value: {
                                                ...defaultLayout?.retailCategorySetting, showImages: e.checked
                                            }
                                        }))
                                    }
                                    }
                                    checked={defaultLayout?.retailCategorySetting?.showImages}
                                />
                                <label htmlFor="ingredient1" className="ml-2">Show Images</label>
                            </div>
                        </Row>
                        <div>
                            <TabView activeIndex={activeIndex} onTabChange={(e) => {
                                setActiveIndex(e.index)
                                dispatch(changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting`,
                                    value: {
                                        ...defaultLayout?.retailCategorySetting, layout: layouts[e.index].value
                                    }
                                }))
                            }}>
                                {layouts?.map((layout, index) => (
                                    <TabPanel key={layout.id} header={layout.name}>
                                        <CategoriesLayout layout={layout.value} categories={defaultLayout?.retailCategorySetting?.categories} />
                                    </TabPanel>
                                ))}
                            </TabView>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Layouts