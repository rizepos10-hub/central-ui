import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ICarouselItem, ILayouts, SelectedLayoutEnum } from 'app/shared/model/ONLINE_ORDERING/layouts/layouts.module';
import {
    IColorSetting,
    IFontSetting,
    IUiSettings,
    IOnlineOrderingLogo,
    variantsUiLayoutOptions,
} from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useEffect, useMemo, useState } from 'react'
import { getEntity, updateEntity, changeEntityField } from 'app/entities/online-ordering/settings/layouts-settings.reducer';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ItemSelectionModal from 'app/entities/menu/item-selection-modal';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ColorPicker } from 'primereact/colorpicker';
import { searchEntities as getRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { ITerm } from 'app/shared/model/term.model';
import Select from 'app/shared/components/select/select';
import { translate } from 'react-jhipster';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { IAttachment } from 'app/shared/model/attachment.model';
import { ISliderSettings } from 'app/shared/model/ONLINE_ORDERING/slider-settings';
import { buttonSettingsAlignment } from 'app/shared/model/ENUMS/button-settings-alignment';
import { Monitor, Smartphone, Trash2, Plus } from 'lucide-react';
import { debounce } from 'lodash';
import { searchEntities } from 'app/entities/item/all-items.reducer';
import CategoriesLayout from '../layout-settings/components/categories/categories';
import { Layout } from 'app/shared/model/ENUMS/layout.model';
import { searchEntities as SearchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import AsyncSelect from 'app/shared/components/select/async-select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Carousel, CarouselItem, CarouselControl } from 'reactstrap';
import { hslToHex, hexToHSL } from 'app/shared/util/color-utils';
import { ILayoutsSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';

const Layouts = () => {
    const dispatch = useAppDispatch();
    const themeSettings: ILayoutsSettings = useAppSelector(state => state.layoutsSettings.entity);
    const loading = useAppSelector(state => state.layoutsSettings.loading);
    const updating = useAppSelector(state => state.layoutsSettings.updating);
    const [fontSettings] = useState<IFontSetting>({
        fontFamily: '',
        fontSize: '',
        fontWeight: '',
        lineHeight: '',
        letterSpacing: ''
    });

    useEffect(() => {
        dispatch(getEntity())
    }, [])

    return (
        <PageWrapper className="max-w-7xl mx-auto">
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold mb-1">Pick A Layout</h2>
                    <p className="text-xs text-muted-foreground">Layout selection and layout-specific storefront sections</p>
                </div>

                <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm">Select Layout</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LayoutsCard
                                layouts={themeSettings.layouts}
                                layoutKey={SelectedLayoutEnum.LAYOUT_DEFAULT}
                                imageSrc="/content/images/LAYOUT_DEFAULT.png"
                                title="Default Layout"
                                description="Standard layout with slider and categories"
                            />
                            <LayoutsCard
                                layouts={themeSettings.layouts}
                                layoutKey={SelectedLayoutEnum.LAYOUT_ONE}
                                imageSrc="/content/images/LAYOUT_ONE.png"
                                title="Gabriel Pizza Layout"
                                description="Custom layout with featured sections"
                            />
                        </div>
                    </CardContent>
                </Card>

                {themeSettings.layouts?.selectedLayout && (
                    <Card>
                        <CardContent className="p-0">
                            {themeSettings.layouts?.selectedLayout === SelectedLayoutEnum.LAYOUT_ONE &&
                                <LayoutGabrielPizzaForm layouts={themeSettings.layouts} />}
                            {themeSettings.layouts?.selectedLayout === SelectedLayoutEnum.LAYOUT_DEFAULT &&
                                <LayoutDefaultForm layouts={themeSettings.layouts} />}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-2">
                    <Button
                        className="h-8 text-xs"
                        onClick={() => dispatch(updateEntity(themeSettings))}
                        disabled={loading || updating || !themeSettings.layouts?.selectedLayout}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </PageWrapper>
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
        <Card
            className={`h-full cursor-pointer transition-all ${isSelected ? 'border-primary shadow-md' : 'border-border'}`}
            onClick={() => {
                dispatch(changeEntityField({
                    name: 'layouts.selectedLayout',
                    value: isSelected ? null : layoutKey
                }))
            }}
        >
            <div className="relative">
                <img
                    src={imageSrc}
                    className="w-full h-48 object-cover rounded-t-lg"
                    alt={title}
                    style={{
                        filter: isSelected ? 'none' : 'grayscale(20%)'
                    }}
                />
                {isSelected && (
                    <div className="absolute top-2 right-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            &#10004;
                        </span>
                    </div>
                )}
            </div>
            <CardContent className="p-3 flex flex-col">
                <p className="text-xs text-muted-foreground flex-grow mb-3">{description}</p>
                <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full h-7 text-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch(changeEntityField({
                            name: 'layouts.selectedLayout',
                            value: isSelected ? null : layoutKey
                        }))
                    }}
                >
                    {isSelected ? "Selected" : "Select Layout"}
                </Button>
            </CardContent>
        </Card>
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
            state.layoutsSettings.entity?.layouts?.[SelectedLayoutEnum.LAYOUT_ONE]?.sections?.body?.featuredItems?.rightColumn?.items
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
            <Tabs defaultValue="header" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="header" className="text-xs">Header</TabsTrigger>
                    <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                    <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-3 mt-4">
                    <div className="mb-4">
                        <h5 className="text-sm font-semibold mb-1">Color Settings</h5>
                        <p className="text-xs text-muted-foreground">Configure your layout&apos;s color scheme</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="background" className="text-xs font-semibold">Background Color</Label>
                            <div className="flex items-center gap-2">
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
                                <Input
                                    value={layoutOne?.colorSettings?.background || '#ffffff'}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.colorSettings.background',
                                            e.target.value
                                        )
                                    }
                                    placeholder="#ffffff"
                                    className="h-7 text-xs flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="foreground" className="text-xs font-semibold">Foreground Color</Label>
                            <div className="flex items-center gap-2">
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
                                <Input
                                    value={layoutOne?.colorSettings?.foreground || '#000000'}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.colorSettings.foreground',
                                            e.target.value
                                        )
                                    }
                                    placeholder="#000000"
                                    className="h-7 text-xs flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="primary" className="text-xs font-semibold">Primary Color</Label>
                            <div className="flex items-center gap-2">
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
                                <Input
                                    value={layoutOne?.colorSettings?.primary || '#007bff'}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.colorSettings.primary',
                                            e.target.value
                                        )
                                    }
                                    placeholder="#007bff"
                                    className="h-7 text-xs flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="primaryForeground" className="text-xs font-semibold">Primary Text Color</Label>
                            <div className="flex items-center gap-2">
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
                                <Input
                                    value={layoutOne?.colorSettings?.primaryForeground || '#ffffff'}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.colorSettings.primaryForeground',
                                            e.target.value
                                        )
                                    }
                                    placeholder="#ffffff"
                                    className="h-7 text-xs flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="secondary" className="text-xs font-semibold">Secondary Color</Label>
                            <div className="flex items-center gap-2">
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
                                <Input
                                    value={layoutOne?.colorSettings?.secondary || '#6c757d'}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.colorSettings.secondary',
                                            e.target.value
                                        )
                                    }
                                    placeholder="#6c757d"
                                    className="h-7 text-xs flex-1"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="muted" className="text-xs font-semibold">Muted Color</Label>
                            <div className="flex items-center gap-2">
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
                                <Input
                                    value={layoutOne?.colorSettings?.muted || '#868e96'}
                                    onChange={e =>
                                        handleFieldChange(
                                            'layouts.LAYOUT_ONE.colorSettings.muted',
                                            e.target.value
                                        )
                                    }
                                    placeholder="#868e96"
                                    className="h-7 text-xs flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="header" className="space-y-3 mt-4">
                    <div className="mb-3">
                        <h5 className="text-sm font-semibold mb-1">Header Configuration</h5>
                        <p className="text-xs text-muted-foreground">Configure your header content</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="headerTitle" className="text-xs font-semibold">Header Title</Label>
                            <Input
                                id="headerTitle"
                                value={layoutOne?.sections?.header?.title || ''}
                                onChange={e =>
                                    handleFieldChange(
                                        'layouts.LAYOUT_ONE.sections.header.title',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter header title"
                                className="h-7 text-xs"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="headerCta" className="text-xs font-semibold">Call to Action</Label>
                            <Input
                                id="headerCta"
                                value={layoutOne?.sections?.header?.callToAction || ''}
                                onChange={e =>
                                    handleFieldChange(
                                        'layouts.LAYOUT_ONE.sections.header.callToAction',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter call to action text"
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-3 mt-4">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="p-3 bg-muted">
                                <CardTitle className="text-sm text-primary mb-0">🎠 Carousel Section</CardTitle>
                                <CardDescription className="text-xs">Manage rotating banner slides for your homepage</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3">
                                <LayoutGabrielPizzaCarousel carousel={layoutOne?.sections?.body?.carousel} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-3 bg-muted">
                                <CardTitle className="text-sm text-primary mb-0">⭐ Featured Items Section</CardTitle>
                                <CardDescription className="text-xs">Highlight specific products on your homepage</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3">
                                <LayoutGabrielPizzaFeaturedItems
                                    layoutOne={layoutOne}
                                    handleFieldChange={handleFieldChange}
                                    selectedItems={selectedItems}
                                    handleToggleSelect={handleToggleSelect}
                                    isModalOpen={isModalOpen}
                                    setIsModalOpen={setIsModalOpen}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="p-3 bg-muted">
                                <CardTitle className="text-sm text-primary mb-0">📂 Featured Categories Section</CardTitle>
                                <CardDescription className="text-xs">Showcase product categories to guide customer navigation</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3">
                                <LayoutGabrielPizzaFeaturedCategories
                                    layoutOne={layoutOne}
                                    handleFieldChange={handleFieldChange}
                                    combinedCategories={combinedCategories}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="footer" className="space-y-3 mt-4">
                    <div className="mb-3">
                        <h5 className="text-sm font-semibold mb-1">Footer Configuration</h5>
                        <p className="text-xs text-muted-foreground">Configure your footer content</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="footerTitle" className="text-xs font-semibold">Footer Title</Label>
                            <Input
                                id="footerTitle"
                                value={layoutOne?.sections?.footer?.title || ''}
                                onChange={e =>
                                    handleFieldChange(
                                        'layouts.LAYOUT_ONE.sections.footer.title',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter footer title"
                                className="h-7 text-xs"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="footerCta" className="text-xs font-semibold">Call to Action</Label>
                            <Input
                                id="footerCta"
                                value={layoutOne?.sections?.footer?.callToAction || ''}
                                onChange={e =>
                                    handleFieldChange(
                                        'layouts.LAYOUT_ONE.sections.footer.callToAction',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter call to action text"
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
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
                <div className="text-center py-8 border border-dashed rounded bg-muted/30">
                    <div className="mb-3">
                        <i className="pi pi-image" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                    </div>
                    <h6 className="text-xs text-muted-foreground mb-2">No carousel slides yet</h6>
                    <p className="text-xs text-muted-foreground mb-3">Add engaging slides to showcase your featured content</p>
                    <Button
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleAddItem}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Your First Slide
                    </Button>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-muted-foreground">{carousel?.length || 0} slide{(carousel?.length || 0) !== 1 ? 's' : ''} configured</span>
                        <Button
                            className="h-7 text-xs"
                            onClick={handleAddItem}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Slide
                        </Button>
                    </div>
                    {carousel?.map((item, index) => (
                    <div
                        key={index}
                        className="border rounded p-3 mb-2 relative"
                    >
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 z-10"
                            onClick={() => handleRemoveItem(index)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="mb-3">
                            <h6 className="text-sm text-primary font-semibold mb-0">Slide {index + 1}</h6>
                            <small className="text-xs text-muted-foreground">Configure your carousel slide content</small>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={`src-${index}`} className="text-xs font-semibold">Image</Label>
                                <MediaLibrary
                                    handleFilesSelectCallback={files => handleFieldChange(index,
                                        'image',
                                        transformAttachmentStructure(files, 'toIAttachment')[0]
                                    )}
                                    defaultValues={transformAttachmentStructure(item?.image ? [item?.image] : [], 'toFileLibraryListItem')}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={`altText-${index}`} className="text-xs font-semibold">Alt Text</Label>
                                <Input
                                    id={`altText-${index}`}
                                    value={item.altText || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'altText', e.target.value)
                                    }
                                    placeholder="Image description"
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={`primaryTitle-${index}`} className="text-xs font-semibold">Primary Title</Label>
                                <Input
                                    id={`primaryTitle-${index}`}
                                    value={item.primaryTitle || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'primaryTitle', e.target.value)
                                    }
                                    placeholder="Main headline"
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={`secondaryTitle-${index}`} className="text-xs font-semibold">Secondary Title</Label>
                                <Input
                                    id={`secondaryTitle-${index}`}
                                    value={item.secondaryTitle || ''}
                                    onChange={e =>
                                        handleFieldChange(index, 'secondaryTitle', e.target.value)
                                    }
                                    placeholder="Subtitle"
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>
                        <div className="mb-2">
                            <Label htmlFor={`description-${index}`} className="text-xs font-semibold">Description</Label>
                            <Input
                                id={`description-${index}`}
                                value={item.description || ''}
                                onChange={e =>
                                    handleFieldChange(index, 'description', e.target.value)
                                }
                                placeholder="Slide description"
                                className="h-7 text-xs"
                            />
                        </div>
                        <div>
                            <Label htmlFor={`callToAction-${index}`} className="text-xs font-semibold">Call to Action</Label>
                            <Input
                                id={`callToAction-${index}`}
                                value={item.callToAction || ''}
                                onChange={e =>
                                    handleFieldChange(index, 'callToAction', e.target.value)
                                }
                                placeholder="Button text"
                                className="h-7 text-xs"
                            />
                        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyLeftTitle" className="text-xs font-semibold">Title</Label>
                    <Input
                        id='bodyLeftTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.leftColumn?.title || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.leftColumn.title',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyLeftSubTitle" className="text-xs font-semibold">SubTitle</Label>
                    <Input
                        id='bodyLeftSubTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.leftColumn?.subtitle || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.leftColumn.subtitle',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyLeftImage" className="text-xs font-semibold">Image</Label>
                    <MediaLibrary
                        handleFilesSelectCallback={files => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.leftColumn.image',
                            transformAttachmentStructure(files, 'toIAttachment')[0]
                        )}
                        defaultValues={transformAttachmentStructure(layoutOne?.sections?.body?.featuredItems?.leftColumn?.image ? [layoutOne?.sections?.body?.featuredItems?.leftColumn?.image] : [], 'toFileLibraryListItem')}
                    />
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightTitle" className="text-xs font-semibold">Title</Label>
                    <Input
                        id='bodyRightTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.rightColumn?.title || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.rightColumn.title',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightSubTitle" className="text-xs font-semibold">SubTitle</Label>
                    <Input
                        id='bodyRightSubTitle'
                        value={layoutOne?.sections?.body?.featuredItems?.rightColumn?.subtitle || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.rightColumn.subtitle',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightCta" className="text-xs font-semibold">Call To Action Label</Label>
                    <Input
                        id='bodyRightCta'
                        value={layoutOne?.sections?.body?.featuredItems?.rightColumn?.callToAction || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredItems.rightColumn.callToAction',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="headerTitle" className="text-xs font-semibold mb-2">Featured Items</Label>
                    <ItemSelectionModal
                        isOpen={isModalOpen}
                        toggle={() => setIsModalOpen(prev => !prev)}
                        selectedItems={selectedItems}
                        setSelectedItems={() => null}
                        handleToggleSelect={handleToggleSelect}
                    />

                    {selectedItems?.length === 0 ? (
                        <div className="text-center py-3 border border-dashed rounded bg-muted/30 mb-2">
                            <p className="text-muted-foreground mb-2 text-xs">No featured items selected</p>
                            <Button
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setIsModalOpen(prev => !prev)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Select Items
                            </Button>
                        </div>
                    ) : (
                        <div className="mb-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground text-xs">{selectedItems?.length || 0} item{(selectedItems?.length || 0) !== 1 ? 's' : ''} selected</span>
                                <Button
                                    className="h-7 text-xs"
                                    onClick={() => setIsModalOpen(prev => !prev)}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add More
                                </Button>
                            </div>
                            <div className="space-y-1">
                                {layoutOne?.sections?.body?.featuredItems?.rightColumn?.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 border rounded bg-background">
                                        <span className="font-medium text-xs">{item.name}</span>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleToggleSelect([item])}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyLeftTitle" className="text-xs font-semibold">Title</Label>
                    <Input
                        id='bodyLeftTitle'
                        value={layoutOne?.sections?.body?.featuredCategories?.leftColumn?.title || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.leftColumn.title',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyLeftCategories" className="text-xs font-semibold">Categories</Label>
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
                        <div className="text-center py-2 text-muted-foreground text-xs">
                            No categories selected for this column
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightTitle" className="text-xs font-semibold">Title</Label>
                    <Input
                        id='bodyRightTitle'
                        value={layoutOne?.sections?.body?.featuredCategories?.rightColumn?.title || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.title',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightSubTitle" className="text-xs font-semibold">SubTitle</Label>
                    <Input
                        id='bodyRightSubTitle'
                        value={layoutOne?.sections?.body?.featuredCategories?.rightColumn?.subtitle || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.subtitle',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightDescription" className="text-xs font-semibold">Description</Label>
                    <Input
                        id='bodyRightDescription'
                        value={layoutOne?.sections?.body?.featuredCategories?.rightColumn?.description || ''}
                        onChange={(e) => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.description',
                            e.target.value
                        )}
                        className="h-7 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bodyRightImage" className="text-xs font-semibold">Image</Label>
                    <MediaLibrary
                        handleFilesSelectCallback={files => handleFieldChange(
                            'layouts.LAYOUT_ONE.sections.body.featuredCategories.rightColumn.image',
                            transformAttachmentStructure(files, 'toIAttachment')[0]
                        )}
                        defaultValues={transformAttachmentStructure(layoutOne?.sections?.body?.featuredCategories?.rightColumn?.image ? [layoutOne?.sections?.body?.featuredCategories?.rightColumn?.image] : [], 'toFileLibraryListItem')}
                    />
                </div>
            </div>
        </div>
    )
}


// default layout 

const LayoutDefaultForm = ({
    layouts,
}: {
    layouts: ILayouts;
}) => {
    return (
        <div className="p-4">
            <Tabs defaultValue="slider" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="slider" className="text-xs">{translate('tempApp.layoutSettings.tabs.slider.label')}</TabsTrigger>
                    <TabsTrigger value="products" className="text-xs">{translate('tempApp.layoutSettings.tabs.specialProducts.label')}</TabsTrigger>
                    <TabsTrigger value="restaurant" className="text-xs">{translate('tempApp.layoutSettings.tabs.restaurantCategories.label')}</TabsTrigger>
                    <TabsTrigger value="retail" className="text-xs">{translate('tempApp.layoutSettings.tabs.retailCategories.label')}</TabsTrigger>
                </TabsList>

                <TabsContent value="slider" className="space-y-3 mt-4">
                    <LayoutDefaultSlider defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabsContent>

                <TabsContent value="products" className="space-y-3 mt-4">
                    <LayoutDefaultProductSetting defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabsContent>

                <TabsContent value="restaurant" className="space-y-3 mt-4">
                    <LayoutDefaultRestaurantCategories defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabsContent>

                <TabsContent value="retail" className="space-y-3 mt-4">
                    <LayoutDefaultRetailCategories defaultLayout={layouts.LAYOUT_DEFAULT} />
                </TabsContent>
            </Tabs>
        </div>
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
                variant="destructive"
                onClick={() => dispatch(changeEntityField({ name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.sliderSettings`, value: defaultLayout?.sliderSettings.filter((_, i) => i !== index) }))}
                className="mt-2 w-full h-8 text-xs"
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
            <div className="flex flex-col gap-3">
                <MediaLibrary
                    handleFilesSelectCallback={(files) => setImage(transformAttachmentStructure(files, 'toIAttachment'))}
                    defaultValues={transformAttachmentStructure(image, 'toFileLibraryListItem')}
                />
                <Input
                    placeholder="Enter text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="h-7 text-xs"
                />
                <Button
                    onClick={handleImageChange}
                    disabled={!image}
                    className="h-8 text-xs"
                >
                    Add Slide
                </Button>
            </div>

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
                        <div className="flex gap-2">
                            <Button
                                variant={isMobileView ? "default" : "outline"}
                                onClick={() => setIsMobileView(true)}
                                className="h-8 text-xs"
                            >
                                <Smartphone className="h-3 w-3" />
                            </Button>
                            <Button
                                variant={isMobileView ? "outline" : "default"}
                                onClick={() => setIsMobileView(false)}
                                className="h-8 text-xs"
                            >
                                <Monitor className="h-3 w-3" />
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
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                <Label htmlFor="featured-title" className="text-xs font-semibold">Title</Label>
                <Input
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
                    className="h-7 text-xs"
                />
            </div>

            <div className="flex flex-col gap-2">
                <h5 className="text-sm font-semibold">Selected Items</h5>
                <ol className="text-xs space-y-1">
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

            <div className="flex items-center gap-2">
                <Checkbox
                    checked={defaultLayout?.productSetting?.FEATURED.showImages || false}
                    onCheckedChange={checked =>
                        dispatch(
                            changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.productSetting`,
                                value: {
                                    ...defaultLayout?.productSetting,
                                    FEATURED: {
                                        ...defaultLayout?.productSetting?.FEATURED,
                                        showImages: checked,
                                    },
                                },
                            })
                        )
                    }
                />
                <Label className="text-xs font-semibold">Show Images</Label>
            </div>
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
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                <Label htmlFor="UiSettings-domain" className="text-xs font-semibold">
                    Title
                </Label>
                <Input
                    id="UiSettings-domain"
                    value={defaultLayout?.restuarantCategorySetting?.title || ''}
                    onChange={e => dispatch(changeEntityField({
                        name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting`,
                        value: { ...defaultLayout?.restuarantCategorySetting, title: e.target.value }
                    }))}
                    className="h-7 text-xs"
                />
            </div>

            <div className="flex flex-col gap-2">
                <ol className="text-xs space-y-1">
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
                    <div className="flex items-center gap-2 mt-4">
                        <Checkbox
                            onCheckedChange={checked => {
                                dispatch(changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting`,
                                    value: {
                                        ...defaultLayout?.restuarantCategorySetting, showImages: checked
                                    }
                                }))
                            }}
                            checked={defaultLayout?.restuarantCategorySetting?.showImages}
                        />
                        <Label htmlFor="ingredient1" className="text-xs font-semibold">Show Images</Label>
                    </div>
                    <div>
                        <Tabs value={String(activeIndex)} onValueChange={(v) => {
                            const index = Number(v);
                            setActiveIndex(index);
                            dispatch(changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.restuarantCategorySetting`,
                                value: {
                                    ...defaultLayout?.restuarantCategorySetting, layout: layouts[index].value
                                }
                            }))
                        }}>
                            <TabsList className="h-9">
                                {layouts?.map((layout, index) => (
                                    <TabsTrigger key={layout.id} value={String(index)} className="text-xs">
                                        {layout.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {layouts?.map((layout, index) => (
                                <TabsContent key={layout.id} value={String(index)}>
                                    <CategoriesLayout layout={layout.value} categories={defaultLayout?.restuarantCategorySetting?.categories || []} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </>
            )}
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
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                <Label htmlFor="UiSettings-domain" className="text-xs font-semibold">
                    Title
                </Label>
                <Input
                    id="UiSettings-domain"
                    value={defaultLayout?.retailCategorySetting?.title || ''}
                    onChange={e => dispatch(changeEntityField({
                        name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting`,
                        value: { ...defaultLayout?.retailCategorySetting, title: e.target.value }
                    }))}
                    className="h-7 text-xs"
                />
            </div>

            <div className="flex flex-col gap-2">
                <ol className="text-xs space-y-1">
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
                    <div className="flex items-center gap-2 mt-4">
                        <Checkbox
                            onCheckedChange={checked => {
                                dispatch(changeEntityField({
                                    name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting`,
                                    value: {
                                        ...defaultLayout?.retailCategorySetting, showImages: checked
                                    }
                                }))
                            }}
                            checked={defaultLayout?.retailCategorySetting?.showImages}
                        />
                        <Label htmlFor="ingredient1" className="text-xs font-semibold">Show Images</Label>
                    </div>
                    <div>
                        <Tabs value={String(activeIndex)} onValueChange={(v) => {
                            const index = Number(v);
                            setActiveIndex(index);
                            dispatch(changeEntityField({
                                name: `layouts.${SelectedLayoutEnum.LAYOUT_DEFAULT}.retailCategorySetting`,
                                value: {
                                    ...defaultLayout?.retailCategorySetting, layout: layouts[index].value
                                }
                            }))
                        }}>
                            <TabsList className="h-9">
                                {layouts?.map((layout, index) => (
                                    <TabsTrigger key={layout.id} value={String(index)} className="text-xs">
                                        {layout.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {layouts?.map((layout, index) => (
                                <TabsContent key={layout.id} value={String(index)}>
                                    <CategoriesLayout layout={layout.value} categories={defaultLayout?.retailCategorySetting?.categories} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </>
            )}
        </div>
    )
}

export default Layouts
