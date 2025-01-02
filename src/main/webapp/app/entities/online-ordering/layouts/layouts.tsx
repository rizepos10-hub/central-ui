import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ICarouselItem, ILayouts, SelectedLayoutEnum } from 'app/shared/model/ONLINE_ORDERING/layouts/layouts.module';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { Checkbox } from 'primereact/checkbox';
import React, { useEffect, useMemo, useState } from 'react'
import { Col, Label, Row } from 'reactstrap'
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

const Layouts = () => {
    const dispatch = useAppDispatch();
    const uiSettings: IUiSettings = useAppSelector(state => state.uiSettings.entity);


    const [layoutToEdit, setLayoutToEdit] = useState<SelectedLayoutEnum>(SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA);


    console.log(uiSettings, 'uiSettings')

    return (
        <div className="container mt-4">
            <Row>
                <Col md={4}><LayoutsCard layout={uiSettings.layouts} /></Col>
            </Row>
            <Row className='border-top pt-4 mt-2'>
                {layoutToEdit === SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA && <LayoutGabrielPizzaForm layout={uiSettings.layouts} />}
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
    layout
}: {
    layout: ILayouts
}) => {
    const dispatch = useAppDispatch();

    return (
        <>
            <div className="mb-3" style={{ maxWidth: '540px' }}>
                <div className="row g-0">
                    <div className="col-md-12">
                        <img
                            src="https://via.placeholder.com/540x200"
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
                    value={layout?.selectedLayout}
                    onChange={(e) => {
                        if (e?.checked) {
                            dispatch(changeEntityField({
                                name: 'layouts.selectedLayout',
                                value: SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA
                            }))
                        } else {
                            dispatch(changeEntityField({
                                name: 'layouts.selectedLayout',
                                value: null
                            }))
                        }
                    }}
                    checked={layout?.selectedLayout === SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA}
                />
                <Label className="form-check-label" htmlFor="checkMe">
                    Check me
                </Label>
            </div>
        </>
    )
}

const LayoutGabrielPizzaForm = ({
    layout,
}: {
    layout: ILayouts;
}) => {
    const dispatch = useAppDispatch();
    const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);
    const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);

    useEffect(() => {
        dispatch(getEntity());
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

    const gabrielPizza: ILayouts["LAYOUT_GABRIEL_PIZZA"] | undefined = layout?.[SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA];
    const selectedItems: IItem[] =
        useAppSelector(state =>
            state.uiSettings.entity?.layouts?.[SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA]?.sections?.body?.featuredItems?.rightColumn?.items
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
            `layouts.${SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA}.sections.body.featuredItems.rightColumn.items`,
            updatedList
        );
    };

    useEffect(() => {
        if (selectedItems.length > 0) {
            handleFieldChange(
                'layouts.LAYOUT_GABRIEL_PIZZA.sections.featuredItems.rightColumn.items',
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
                            value={gabrielPizza?.colorSettings?.backgroundColor}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.colorSettings.backgroundColor',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="foreground">Foreground</Label>
                        <InputText
                            id="foreground"
                            value={gabrielPizza?.colorSettings?.footerColor}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.colorSettings.footerColor',
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
                            value={gabrielPizza?.colorSettings?.primaryTextColor}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.colorSettings.primaryTextColor',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="primaryForeground">Primary Foreground</Label>
                        <InputText
                            id="primaryForeground"
                            value={gabrielPizza?.colorSettings?.primaryForegroundColor}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.colorSettings.primaryForegroundColor',
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
                            value={gabrielPizza?.colorSettings?.secondaryTextColor}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.colorSettings.secondaryTextColor',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="muted">Muted</Label>
                        <InputText
                            id="muted"
                            value={gabrielPizza?.colorSettings?.mutedTextColor}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.colorSettings.mutedTextColor',
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
                            value={gabrielPizza?.sections?.header?.title}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.sections.header.title',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="headerCta">Header CTA</Label>
                        <InputText
                            id="headerCta"
                            value={gabrielPizza?.sections?.header?.callToAction}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.sections.header.callToAction',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                </Row>
            </TabPanel>

            <TabPanel header="Body">
                <Carousel carousel={gabrielPizza?.sections?.body?.carousel} />
                <FeaturedItems
                    gabrielPizza={gabrielPizza}
                    handleFieldChange={handleFieldChange}
                    selectedItems={selectedItems}
                    handleToggleSelect={handleToggleSelect}
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                />
                <FeaturedCategories
                    gabrielPizza={gabrielPizza}
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
                            value={gabrielPizza?.sections?.footer?.title}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.sections.footer.title',
                                    (e.target as HTMLInputElement).value
                                )
                            }
                        />
                    </Col>
                    <Col md={6} className="d-flex flex-column">
                        <Label htmlFor="footerCta">Footer CTA</Label>
                        <InputText
                            id="footerCta"
                            value={gabrielPizza?.sections?.footer?.callToAction}
                            onChange={e =>
                                handleFieldChange(
                                    'layouts.LAYOUT_GABRIEL_PIZZA.sections.footer.callToAction',
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

export const Carousel = ({
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
                name: `layouts.${SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA}.sections.body.carousel`,
                value: updatedCarousel,
            })
        );
    };

    const handleAddItem = () => {
        const newItem: ICarouselItem = {
            order: carousel.length + 1,
            image: null,
            altText: '',
            primaryTitle: '',
            secondaryTitle: '',
            description: '',
            callToAction: '',
        };
        dispatch(
            changeEntityField({
                name: `layouts.${SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA}.sections.body.carousel`,
                value: [...carousel, newItem],
            })
        );
    };

    const handleRemoveItem = (index: number) => {
        const updatedCarousel = carousel.filter((_, idx) => idx !== index);
        dispatch(
            changeEntityField({
                name: `layouts.${SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA}.sections.body.carousel`,
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

export const FeaturedItems = ({
    gabrielPizza,
    handleFieldChange,
    selectedItems,
    handleToggleSelect,
    isModalOpen,
    setIsModalOpen
}: {
    gabrielPizza: ILayouts["LAYOUT_GABRIEL_PIZZA"],
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
                        value={gabrielPizza?.sections?.body?.featuredItems?.order}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.order',
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
                        value={gabrielPizza?.sections?.body?.featuredItems?.leftColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.leftColumn.title',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftSubTitle">SubTitle</Label>
                    <InputText
                        id='bodyLeftSubTitle'
                        value={gabrielPizza?.sections?.body?.featuredItems?.leftColumn?.subtitle}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.leftColumn.subtitle',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftImage">Image</Label>
                    <MediaLibrary
                        handleFilesSelectCallback={files => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.leftColumn.image',
                            transformAttachmentStructure(files, 'toIAttachment')[0]
                        )}
                        defaultValues={transformAttachmentStructure(gabrielPizza?.sections?.body?.featuredItems?.leftColumn?.image ? [gabrielPizza?.sections?.body?.featuredItems?.leftColumn?.image] : [], 'toFileLibraryListItem')}
                    />
                </div>
            </Col>
            <Col md={6}>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftTitle">Title</Label>
                    <InputText
                        id='bodyLeftTitle'
                        value={gabrielPizza?.sections?.body?.featuredItems?.rightColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.rightColumn.title',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftSubTitle">SubTitle</Label>
                    <InputText
                        id='bodyLeftSubTitle'
                        value={gabrielPizza?.sections?.body?.featuredItems?.rightColumn?.subtitle}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.rightColumn.subtitle',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftCta">Call To Action Label</Label>
                    <InputText
                        id='bodyLeftCta'
                        value={gabrielPizza?.sections?.body?.featuredItems?.rightColumn?.callToAction}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.rightColumn.callToAction',
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
                        {gabrielPizza?.sections?.body?.featuredItems?.rightColumn?.items?.map((item, idx) => (
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

export const FeaturedCategories = ({
    gabrielPizza,
    handleFieldChange,
    combinedCategories,
}: {
    gabrielPizza: ILayouts["LAYOUT_GABRIEL_PIZZA"],
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
                        value={gabrielPizza?.sections?.body?.featuredItems?.order}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredItems.order',
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
                        value={gabrielPizza?.sections?.body?.featuredCategories?.leftColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredCategories.leftColumn.title',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftCategories">Categories</Label>
                    <Select
                        value={gabrielPizza?.sections?.body?.featuredCategories?.leftColumn?.categories}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredCategories.leftColumn.categories',
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
                        value={gabrielPizza?.sections?.body?.featuredCategories?.rightColumn?.title}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredCategories.rightColumn.title',
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
                        value={gabrielPizza?.sections?.body?.featuredCategories?.rightColumn?.subtitle}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredCategories.rightColumn.subtitle',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftDescription">Description</Label>
                    <InputText
                        id='bodyLeftDescription'
                        value={gabrielPizza?.sections?.body?.featuredCategories?.rightColumn?.description}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredCategories.rightColumn.description',
                            e.target.value
                        )}
                    />
                </div>
                <div className='d-flex flex-column'>
                    <Label htmlFor="bodyLeftImage">Image</Label>
                    <MediaLibrary
                        handleFilesSelectCallback={files => handleFieldChange(
                            'layouts.LAYOUT_GABRIEL_PIZZA.sections.body.featuredCategories.rightColumn.image',
                            transformAttachmentStructure(files, 'toIAttachment')[0]
                        )}
                        defaultValues={transformAttachmentStructure(gabrielPizza?.sections?.body?.featuredCategories?.rightColumn?.image ? [gabrielPizza?.sections?.body?.featuredCategories?.rightColumn?.image] : [], 'toFileLibraryListItem')}
                    />
                </div>
            </Col>
        </Row>
    )
}


export default Layouts