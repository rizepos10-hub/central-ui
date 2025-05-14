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
        <div className="container mt-4">
            <Row>
                <Col md={4}>
                    <LayoutsCard
                        layouts={uiSettings.layouts}
                        layoutKey={SelectedLayoutEnum.LAYOUT_DEFAULT}
                        imageSrc="/content/images/LAYOUT_DEFAULT.png"
                    />
                </Col>
                <Col md={4}>
                    <LayoutsCard
                        layouts={uiSettings.layouts}
                        layoutKey={SelectedLayoutEnum.LAYOUT_ONE}
                        imageSrc="/content/images/LAYOUT_ONE.png"
                    />
                </Col>
            </Row>
            <Row className='border-top pt-4 mt-2'>
                {uiSettings.layouts?.selectedLayout === SelectedLayoutEnum.LAYOUT_ONE && <LayoutGabrielPizzaForm layouts={uiSettings.layouts} />}
                {uiSettings.layouts?.selectedLayout === SelectedLayoutEnum.LAYOUT_DEFAULT && <LayoutDefaultForm layouts={uiSettings.layouts} />}
                {/* Show Selectedd Form Here */}
            </Row>
            <Row>
                <Col md={12}>
                    <Button label="Save" className="mt-3" onClick={() => dispatch(updateEntity(uiSettings))} />
                </Col>
            </Row>
        </div>
    )
}

const LayoutsCard = ({
    layouts,
    layoutKey,
    imageSrc
}: {
    layouts: ILayouts
    layoutKey: SelectedLayoutEnum
    imageSrc: string
}) => {
    const dispatch = useAppDispatch();

    return (
        <>
            <div className="mb-3" style={{ maxWidth: '540px' }}>
                <div className="row g-0">
                    <div className="col-md-12">
                        <img
                            src={imageSrc}
                            className="img-fluid"
                            alt="Card background"
                        />
                    </div>
                </div>
            </div>
            <div className="form-check">
                <Checkbox
                    className="form-check-input"
                    type="checkbox"
                    id="checkMe"
                    value={layouts?.selectedLayout}
                    onChange={(e) => {
                        if (e?.checked) {
                            dispatch(changeEntityField({
                                name: 'layouts.selectedLayout',
                                value: layoutKey
                            }))
                        } else {
                            dispatch(changeEntityField({
                                name: 'layouts.selectedLayout',
                                value: null
                            }))
                        }
                    }}
                    checked={layouts?.selectedLayout === layoutKey}
                />
                <Label className="form-check-label" htmlFor="checkMe">
                    Check me
                </Label>
            </div>
        </>
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
        <TabView>
            <TabPanel header="Color Settings">
                <Row className="mb-3">
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="background">Background</Label>
                        <InputText
                            id="background"
                            value={layoutOne?.colorSettings?.background}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.colorSettings.background',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="foreground">Foreground</Label>
                        <InputText
                            id="foreground"
                            value={layoutOne?.colorSettings?.foreground}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.colorSettings.foreground',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="primary">Primary</Label>
                        <InputText
                            id="primary"
                            value={layoutOne?.colorSettings?.primary}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.colorSettings.primary',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="primaryForeground">Primary Foreground</Label>
                        <InputText
                            id="primaryForeground"
                            value={layoutOne?.colorSettings?.primaryForeground}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.colorSettings.primaryForeground',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="secondary">Secondary</Label>
                        <InputText
                            id="secondary"
                            value={layoutOne?.colorSettings?.secondary}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.colorSettings.secondary',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="muted">Muted</Label>
                        <InputText
                            id="muted"
                            value={layoutOne?.colorSettings?.muted}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.colorSettings.muted',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                </Row>
            </TabPanel>

            <TabPanel header="Header">
                <Row className="mb-3">
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="headerTitle">Header Title</Label>
                        <InputText
                            id="headerTitle"
                            value={layoutOne?.sections?.header?.title}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.sections.header.title',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="headerCta">Header CTA</Label>
                        <InputText
                            id="headerCta"
                            value={layoutOne?.sections?.header?.callToAction}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.sections.header.callToAction',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                </Row>
            </TabPanel>

            <TabPanel header="Body">
                <LayoutGabrielPizzaCarousel carousel={layoutOne?.sections?.body?.carousel} />
                <LayoutGabrielPizzaFeaturedItems
                    layoutOne={layoutOne}
                    handleFieldChange={handleFieldChange}
                    selectedItems={selectedItems}
                    handleToggleSelect={handleToggleSelect}
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                />
                <LayoutGabrielPizzaFeaturedCategories
                    layoutOne={layoutOne}
                    handleFieldChange={handleFieldChange}
                    combinedCategories={combinedCategories}
                />
            </TabPanel>

            <TabPanel header="Footer">
                <Row className="mb-3">
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="footerTitle">Footer Title</Label>
                        <InputText
                            id="footerTitle"
                            value={layoutOne?.sections?.footer?.title}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.sections.footer.title',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="footerCta">Footer CTA</Label>
                        <InputText
                            id="footerCta"
                            value={layoutOne?.sections?.footer?.callToAction}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_ONE.sections.footer.callToAction',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                </Row>
            </TabPanel>
        </TabView>
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
        <Row>
            <Col md={12}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Carousel</h5>
                    <Button color="primary" onClick={handleAddItem}>
                        + Add Slide
                    </Button>
                </div>
                {carousel?.map((item, index) => (
                    <div
                        key={index}
                        className="border rounded p-3 mb-2"
                    >
                        <Row className="mb-2">
                            <Col md={6} className="d-flex align-items-end justify-content-end">
                                <Button color="danger" onClick={() => handleRemoveItem(index)}>
                                    Remove
                                </Button>
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`src-${index}`}>Image Src</Label>
                                <MediaLibrary
                                    handleFilesSelectCallback={files => handleFieldChange(index,
                                        'image',
                                        transformAttachmentStructure(files, 'toIAttachment')[0]
                                    )}
                                    defaultValues={transformAttachmentStructure(item?.image ? [item?.image] : [], 'toFileLibraryListItem')}
                                />
                            </Col>
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`altText-${index}`}>Alt Text</Label>
                                <InputText
                                    id={`altText-${index}`}
                                    value={item.altText}
                                    onChange={e =>
                                        handleFieldChange(index, 'altText', (e.target as HTMLInputElement).value)
                                    }
                                />
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`primaryTitle-${index}`}>Title 1</Label>
                                <InputText
                                    id={`primaryTitle-${index}`}
                                    value={item.primaryTitle}
                                    onChange={e =>
                                        handleFieldChange(index, 'primaryTitle', (e.target as HTMLInputElement).value)
                                    }
                                />
                            </Col>
                            <Col md={6} className='d-flex flex-column'>
                                <Label htmlFor={`secondaryTitle-${index}`}>Title 2</Label>
                                <InputText
                                    id={`secondaryTitle-${index}`}
                                    value={item.secondaryTitle}
                                    onChange={e =>
                                        handleFieldChange(index, 'secondaryTitle', (e.target as HTMLInputElement).value)
                                    }
                                />
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col md={12}>
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <InputText
                                    id={`description-${index}`}
                                    value={item.description}
                                    onChange={e =>
                                        handleFieldChange(index, 'description', (e.target as HTMLInputElement).value)
                                    }
                                    className="w-100"
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Label htmlFor={`callToAction-${index}`}>CTA</Label>
                                <InputText
                                    id={`callToAction-${index}`}
                                    value={item.callToAction}
                                    onChange={e =>
                                        handleFieldChange(index, 'callToAction', (e.target as HTMLInputElement).value)
                                    }
                                    className="w-100"
                                />
                            </Col>
                        </Row>
                    </div>
                ))}
            </Col>
        </Row>
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
            <div>
                <h5>
                    Featured Items
                </h5>
            </div>
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
                <div>
                    <div>
                        <Label htmlFor="headerTitle">Featured Items</Label>
                        <ItemSelectionModal
                            isOpen={isModalOpen}
                            toggle={() => setIsModalOpen(prev => !prev)}
                            selectedItems={selectedItems}
                            setSelectedItems={() => null}
                            handleToggleSelect={handleToggleSelect}
                        />
                        <Button
                            label="Add New Item"
                            icon="pi pi-plus"
                            onClick={() => setIsModalOpen(prev => !prev)}
                        />
                    </div>
                    <div>
                        {layoutOne?.sections?.body?.featuredItems?.rightColumn?.items?.map((item, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-2">
                                <span>{item.name}</span>
                                <Button color="danger" onClick={() => handleToggleSelect([item])}>
                                    x
                                </Button>
                            </div>
                        ))}
                    </div>
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
            <div>
                <h5>
                    Featured Categories
                </h5>
            </div>
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
                    <Label htmlFor="bodyLeftCategories">Categories</Label>
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
                    />
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
                    const options = (res.payload?.data || []).map(item => ({
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
                        value={defaultLayout.productSetting.FEATURED.title || ''}
                        onChange={e =>
                            dispatch(
                                changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                    value: {
                                        ...defaultLayout.productSetting,
                                        FEATURED: {
                                            ...defaultLayout.productSetting.FEATURED,
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
                        {defaultLayout.productSetting.FEATURED.items.map(item => (
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
                            ? selected.map(opt => opt.data)
                            : [];
                        dispatch(
                            changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                value: {
                                    ...defaultLayout.productSetting,
                                    FEATURED: {
                                        ...defaultLayout.productSetting.FEATURED,
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
                        checked={defaultLayout.productSetting.FEATURED.showImages}
                        onChange={e =>
                            dispatch(
                                changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                    value: {
                                        ...defaultLayout.productSetting,
                                        FEATURED: {
                                            ...defaultLayout.productSetting.FEATURED,
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
                    const options = (res.payload?.data || []).map(item => ({
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
                            ? selected.map(opt => opt.data)
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
                                {layouts.map((layout, index) => (
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
                    const options = (res.payload?.data || []).map(item => ({
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
                            ? selected.map(opt => opt.data)
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
                                {layouts.map((layout, index) => (
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