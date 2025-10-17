import React, { useState } from 'react';
import Select, { ActionMeta } from 'react-select';
import { getEntities as getProductionCenters } from 'app/entities/location/production-center/production-center.reducer';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import { getEntities as getBrands } from 'app/entities/brand/brand.reducer';
import { getEntities as getRestaurantItemCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailItemCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { DraggableList } from 'app/shared/components/draggable-list/draggable-list';
import { IAddonGroup, IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';
import { Input } from '@/components/ui/input';
import { getSortState, Translate, translate } from 'react-jhipster';
import { Checkbox } from '@/components/ui/checkbox';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { useSearchParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dropdown } from 'primereact/dropdown';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const actionOptions = [
    { name: 'Edit', code: 'EDIT', disabled: false },
    { name: 'Move To Trash', code: 'MOVE_TO_TRASH', disabled: false },
    { name: 'Export', code: 'EXPORT', disabled: false },
];


export const BulkEdit = ({
    products,
    selectedProducts,
    setSelectedProducts,
    setSelectedActionOption,
    refetchEntities,
    loading,
    updateEntities,
    isRetail = false,
}: {
    products: IItem[];
    selectedProducts: IItem[];
    setSelectedProducts: React.Dispatch<React.SetStateAction<IItem[]>>;
    setSelectedActionOption: React.Dispatch<React.SetStateAction<any>>;
    refetchEntities: any;
    loading: boolean;
    updateEntities: any;
    isRetail: boolean;
}) => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const query = JSON.parse(searchParams.get("query")) || {
        first: 0,
        rows: 20,
        page: 0,
        sortField: null,
        sortOrder: null,
        query: '',
        filters: {
            "categories.id": { value: null, matchMode: FilterMatchMode.EQUALS },
            "attributes": { value: null, matchMode: FilterMatchMode.EQUALS },
            name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        }
    };

    const categories = isRetail
        ? useAppSelector(state => state.retailCategory.entities)
        : useAppSelector(state => state.restaurantCategory.entities);

    const categoriesLoading = isRetail
        ? useAppSelector(state => state.retailCategory.loading)
        : useAppSelector(state => state.restaurantCategory.loading);

    const productionCenters = useAppSelector(state => state.productionCenter.entities);
    const productionCentersLoading = useAppSelector(state => state.productionCenter.loading);
    const profileGroups = useAppSelector(state => state.profileGroup.entities);
    const profileGroupsLoading = useAppSelector(state => state.profileGroup.loading);
    const tags = useAppSelector(state => state.tag.entities);
    const tagsLoading = useAppSelector(state => state.tag.loading);
    const brands = useAppSelector(state => state.brand.entities);
    const brandsLoading = useAppSelector(state => state.brand.loading);
    const discounts = useAppSelector(state => state.discount.entities);
    const discountsLoading = useAppSelector(state => state.discount.loading);
    const addonGroupsOptions = useAppSelector(state => state.addonGroups.entities);

    const [selectedCategories, setSelectedCategories] = useState<any>([]);
    const [selectedTags, setSelectedTags] = useState<any>([]);
    const [selectedBrands, setSelectedBrands] = useState<any>({});
    const [selectedProfileGroup, setSelectedProfileGroup] = useState<any>({});
    const [selectedProuctionCenter, setSelectedProductionCenter] = useState<any>({});
    const [selectedDiscount, setSelectedDiscount] = useState<any>({});

    const [paginationState, setPaginationState] = useState(
        overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
    );
    const [addonGroups, setAddonGroups] = useState<IAddonGroups[]>([])
    const [selectedAddonGroup, setSelectedAddonGroup] = useState<IAddonGroups>();
    const [addonGroupsActionValue, setAddonGroupsActionValue] = useState<'Append To Items' | 'Override'>('Append To Items');

    const [isloadingUpdate, setIsLoadingUpdate] = useState(false);
    const [showOverrideConfirmation, setShowOverrideConfirmation] = useState(false);

    const selectedAddonGroupIds = addonGroups?.map(group => group.addonGroup.id);
    const filteredAddonGroupsOptions = addonGroupsOptions?.filter(
        option => !selectedAddonGroupIds?.includes(option.id)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if Override is selected and addon groups exist, show confirmation
        if (!isRetail && addonGroupsActionValue === 'Override' && addonGroups.length > 0) {
            setShowOverrideConfirmation(true);
            return;
        }

        // Proceed with update
        await performUpdate();
    };

    const performUpdate = async () => {
        setIsLoadingUpdate(true);

        const newSelectedProducts = products.filter(product => selectedProducts.some(selectedProduct => selectedProduct.id === product.id));

        const entitiesToUpdate = newSelectedProducts.map(sp => ({
            ...sp,
            categories: [
                ...sp.categories,
                ...selectedCategories.map(sc => ({
                    id: sc.value
                }))
            ],
            brand: selectedBrands?.value && isRetail ? {
                id: selectedBrands.value
            } : null,
            tags: [
                ...sp.tags,
                ...selectedTags.map(st => ({
                    id: st.value
                }))
            ],
            productionCenter: selectedProuctionCenter?.value ? {
                id: selectedProuctionCenter.value
            } : null,
            accountingGroups: selectedProfileGroup?.value ? [{
                id: selectedProfileGroup.value
            }] : [],
            discounts: selectedDiscount.value ? [{
                id: selectedDiscount.value
            }] : [],
            addonGroups: addonGroupsActionValue === 'Override'
                ? addonGroups
                : [
                    ...sp.addonGroups?.map(existing => {
                        const override = addonGroups.find(newItem => newItem.addonGroup.id === existing.addonGroup.id);
                        return override || existing;
                    }) || [],
                    ...addonGroups.filter(newItem => !sp.addonGroups.some(existing => existing.addonGroup.id === newItem.addonGroup.id))
                ],
        }));

        const updatedQuery = applyMatchModeMap(query);
        await dispatch(updateEntities({
            entity: entitiesToUpdate,
            query: updatedQuery
        }));
        await refetchEntities();

        setIsLoadingUpdate(false);
        setShowOverrideConfirmation(false);
    };

    const handleAddonGroupFieldChange = (addonGroupIndex: number, fieldName: string, value: any) => {
        const updatedAddonGroups = [...addonGroups];
        const updatedItem = {
            ...updatedAddonGroups[addonGroupIndex],
            [fieldName]: value,
        };

        updatedAddonGroups[addonGroupIndex] = updatedItem;
        setAddonGroups(updatedAddonGroups)
    };

    const handleAddonGroupReorder = (event) => {
        const reorderedAddonGroups = event.value?.map(group => {
            const existingGroup = addonGroups?.find(g => g.addonGroup.id === group.id);
            return existingGroup ? existingGroup : { addonGroup: group };
        });
        setAddonGroups(reorderedAddonGroups)
    };

    const handleRemoveAddonGroup = (e, groupId: string) => {
        e.stopPropagation();
        const updatedAddonGroups = addonGroups.filter(group => group.addonGroup.id !== groupId);
        setAddonGroups(updatedAddonGroups)
    };

    const handleAddonGroupOverridedPriceChange = (addonGroupIndex: number, addonId: string, price: number | null | undefined) => {
        const updatedAddonGroups = [...addonGroups];
        const addonGroup = updatedAddonGroups[addonGroupIndex];

        const updatedAddonPriceOverrides = [...addonGroup.addonPriceOverrides];
        const index = updatedAddonPriceOverrides?.findIndex(override => override.id === addonId);
        if (price !== null && price !== undefined) {
            if (index >= 0) {
                // Update existing price override
                updatedAddonPriceOverrides[index].price = price;
            } else {
                // Add new price override
                updatedAddonPriceOverrides.push({ id: addonId, price });
            }
        } else {
            // Remove price override if price is empty or null
            if (index >= 0) {
                updatedAddonPriceOverrides.splice(index, 1);
            }
        }

        const updatedItem: IAddonGroups = {
            ...addonGroup,
            addonPriceOverrides: updatedAddonPriceOverrides,
        };

        updatedAddonGroups[addonGroupIndex] = updatedItem;

        setAddonGroups(updatedAddonGroups)
    };

    const handleAddonGroupExcludedChange = (
        e,
        addonGroupIndex: number,
        value: IAddon,
    ) => {
        const updatedAddonGroups = [...addonGroups];

        const updatedItem: IAddonGroups = {
            ...updatedAddonGroups[addonGroupIndex],
            excluded: !e.checked
                ? [...updatedAddonGroups[addonGroupIndex].excluded, value]
                : updatedAddonGroups[addonGroupIndex].excluded.filter(
                    item => item.id !== value.id
                ),
        };

        updatedAddonGroups[addonGroupIndex] = updatedItem;
        setAddonGroups(updatedAddonGroups)
    };

    const handleAddonGroupChange = (
        selectedAddonGroup: IAddonGroup,
        actionMeta: ActionMeta<{ id: string; name: string }>
    ) => {
        const newGroup: IAddonGroups = {
            addonGroup: selectedAddonGroup,
            required: false,
            minQuantity: null,
            maxQuantity: null,
            addAutomatically: false,
            addonPriceOverrides: [],
            excluded: [],
            name: null,
        };

        // Ensure addonGroups is an array
        const updatedAddonGroups = Array.isArray(addonGroups) ? addonGroups : [];

        // Add the new group
        setAddonGroups([...updatedAddonGroups, newGroup])
    };

    const reorderHeader = (
        data: {
            id: string;
            name: string;
        }[],
        onChange: any,
        value: any,
        options,
        onFocus: any
    ) => {
        const [selected, setSelected] = useState(null);
        return (
            <div className="flex gap-2 items-center mb-2">
                <Dropdown
                    value={selected}
                    onChange={e => setSelected(e.value)}
                    options={data}
                    placeholder=""
                    className="w-full"
                    onFocus={onFocus}
                    optionLabel={'name'}
                    optionValue={'id'}
                />
                <Button
                    disabled={!selected}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                        onChange(options?.find(g => g?.id === selected))
                        setSelected(null)
                    }}
                >
                    Assign
                </Button>
            </div>
        )
    }

    return (
        <div className="p-0 h-[75vh] overflow-auto">
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form>
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                        <div className="font-bold text-xs mb-2">Bulk Edit</div>
                        <div className="h-[30vh] w-full border border-border overflow-y-auto">
                            {selectedProducts.map((prod, idx) => (
                                <Button
                                    key={idx}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs flex gap-2 w-full justify-start"
                                    onClick={() => setSelectedProducts(selectedProducts.filter(sp => sp.id !== prod.id))}
                                    type="button"
                                >
                                    <X className="h-3 w-3" />
                                    <span>{prod.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3">
                        <div className="font-bold text-xs mb-2">Categories</div>
                        <div className="h-[30vh] w-full border border-border overflow-y-auto">
                            <div className="flex flex-col gap-1 p-0">
                                <Select
                                    isMulti
                                    options={categories?.map(cat => ({ value: cat.id, label: cat.name }))}
                                    onMenuOpen={() => {
                                        isRetail ?
                                            dispatch(
                                                getRetailItemCategories({
                                                    page: 0,
                                                    size: 1000,
                                                    sort: `id,desc`,
                                                })
                                            ) : (
                                                dispatch(
                                                    getRestaurantItemCategories({
                                                        page: 0,
                                                        size: 1000,
                                                        sort: `id,desc`,
                                                    })
                                                )
                                            )
                                    }}
                                    value={selectedCategories}
                                    onChange={(e) => setSelectedCategories(e)}
                                    isLoading={categoriesLoading}
                                />
                            </div>
                            {selectedCategories.map((selectedCategory, idx) => (
                                <Button
                                    key={idx}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs flex gap-2 w-full justify-start"
                                    type="button"
                                    onClick={() => setSelectedCategories(selectedCategories.filter(sc => sc.value !== selectedCategory.value))}
                                >
                                    <X className="h-3 w-3" />
                                    <span>{selectedCategory.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="font-bold text-xs mb-2">Production Center</div>
                                <div className="flex flex-col gap-1">
                                    <Select
                                        options={productionCenters?.map(pc => ({ value: pc.id, label: pc.name }))}
                                        isClearable
                                        className="w-full"
                                        onMenuOpen={() => {
                                            dispatch(
                                                getProductionCenters({
                                                    page: 0,
                                                    size: 1000,
                                                    sort: `id,desc`,
                                                })
                                            );
                                        }}
                                        value={selectedProuctionCenter}
                                        onChange={(e) => setSelectedProductionCenter(e)}
                                        isLoading={productionCentersLoading}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-xs mb-2">Tags</div>
                                <div className="flex flex-col gap-1">
                                    <Select
                                        options={tags?.map(tag => ({ value: tag.id, label: tag.name }))}
                                        isMulti
                                        isClearable
                                        className="w-full"
                                        onMenuOpen={() => {
                                            dispatch(
                                                getTags({
                                                    page: 0,
                                                    size: 1000,
                                                    sort: `id,desc`,
                                                })
                                            );
                                        }}
                                        value={selectedTags}
                                        onChange={(e) => setSelectedTags(e)}
                                        isLoading={tagsLoading}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <div className="font-bold text-xs mb-2">Discount</div>
                                <div className="flex flex-col gap-1">
                                    <Select
                                        options={discounts?.map(disc => ({ value: disc.id, label: `${disc.value} (${disc.type})` }))}
                                        isClearable
                                        className="w-full"
                                        onMenuOpen={() => {
                                            dispatch(
                                                getDiscounts({
                                                    page: 0,
                                                    size: 1000,
                                                    sort: `id,desc`,
                                                })
                                            );
                                        }}
                                        value={selectedDiscount}
                                        onChange={(e) => setSelectedDiscount(e)}
                                        isLoading={discountsLoading}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-xs mb-2">Profile Group</div>
                                <div className="flex flex-col gap-1">
                                    <Select
                                        options={profileGroups?.map(pg => ({ value: pg.id, label: pg.name }))}
                                        isClearable
                                        className="w-full"
                                        onMenuOpen={() => {
                                            dispatch(
                                                getProfileGroups({
                                                    page: 0,
                                                    size: 1000,
                                                    sort: `id,desc`,
                                                })
                                            );
                                        }}
                                        value={selectedProfileGroup}
                                        onChange={(e) => setSelectedProfileGroup(e)}
                                        isLoading={profileGroupsLoading}
                                    />
                                </div>
                            </div>
                        </div>
                        {isRetail && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <div className="font-bold text-xs mb-2">Brand</div>
                                    <div className="flex flex-col gap-1">
                                        <Select
                                            options={brands?.map(brand => ({ value: brand.id, label: brand.name }))}
                                            isClearable
                                            className="w-full"
                                            onMenuOpen={() => {
                                                dispatch(
                                                    getBrands({
                                                        page: 0,
                                                        size: 1000,
                                                        sort: `id,desc`,
                                                    })
                                                );
                                            }}
                                            value={selectedBrands}
                                            onChange={(e) => setSelectedBrands(e)}
                                            isLoading={brandsLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {!isRetail && (
                    <div className="mt-3 border p-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="font-bold text-xs">Add ons</div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Action:</Label>
                                <ToggleGroup
                                    type="single"
                                    value={addonGroupsActionValue}
                                    onValueChange={(value) => value && setAddonGroupsActionValue(value as 'Append To Items' | 'Override')}
                                    className="gap-1"
                                >
                                    <ToggleGroupItem value="Append To Items" className="text-xs h-7">
                                        Append To Items
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="Override" className="text-xs h-7">
                                        Override
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <DraggableList
                                    value={addonGroups?.map(group => group.addonGroup) || []}
                                    onChange={handleAddonGroupReorder}
                                    dataKey="id"
                                    dragdrop
                                    selectable
                                    showArrows
                                    header={
                                        reorderHeader(
                                            filteredAddonGroupsOptions,
                                            handleAddonGroupChange,
                                            addonGroups?.map(group => ({
                                                id: group?.addonGroup?.id,
                                                name: group?.addonGroup?.name,
                                            })),
                                            addonGroupsOptions,
                                            () => {
                                                dispatch(getAddonGroups({
                                                    page: paginationState.activePage - 1,
                                                    size: paginationState.itemsPerPage,
                                                    sort: `${paginationState.sort},${paginationState.order}`,
                                                }))
                                            }
                                        )
                                    }
                                    itemTemplate={(addonGroup: IAddonGroup) => {
                                        const index = addonGroups?.findIndex(group => group.addonGroup.id === addonGroup.id);

                                        return (
                                            <div
                                                className="flex gap-2 items-end"
                                                onClick={() => setSelectedAddonGroup(addonGroups[index])}
                                            >
                                                <span className="flex flex-col gap-1">
                                                    <Label className="text-xs">{addonGroup?.name}</Label>
                                                    <Input
                                                        value={addonGroups[index]?.name ?? addonGroup?.name}
                                                        onChange={e => handleAddonGroupFieldChange(index, 'name', e.target.value)}
                                                        className="w-[120px] h-7 text-xs"
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ') {
                                                                e.stopPropagation();
                                                            }
                                                        }}
                                                    />
                                                </span>
                                                <span className="flex gap-1">
                                                    <span className="flex flex-col gap-1">
                                                        <Label className="text-xs">{translate('items.update.min')}</Label>
                                                        <Input
                                                            type="number"
                                                            value={addonGroups[index]?.minQuantity ?? ''}
                                                            onChange={e => {
                                                                handleAddonGroupFieldChange(index, 'minQuantity', e.target.value === '' ? null : Number(e.target.value))
                                                            }}
                                                            className="w-[40px] h-7 text-xs"
                                                        />
                                                    </span>
                                                    <span className="flex flex-col gap-1">
                                                        <Label className="text-xs">{translate('items.update.max')}</Label>
                                                        <Input
                                                            type="number"
                                                            value={addonGroups[index]?.maxQuantity ?? ''}
                                                            onChange={e => handleAddonGroupFieldChange(index, 'maxQuantity', e.target.value === '' ? null : Number(e.target.value))}
                                                            className="w-[40px] h-7 text-xs"
                                                        />
                                                    </span>
                                                </span>
                                                <span className="flex flex-col gap-1">
                                                    <Label className="text-xs">{translate('items.update.addAutomatically')}</Label>
                                                    <Checkbox
                                                        checked={addonGroups[index]?.addAutomatically}
                                                        onCheckedChange={(checked) => handleAddonGroupFieldChange(index, 'addAutomatically', checked)}
                                                    />
                                                </span>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => handleRemoveAddonGroup(e, addonGroup.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )
                                    }}
                                />
                            </div>
                        {selectedAddonGroup && (
                            <div>
                                <Label className="font-semibold text-xs mb-2">
                                    <Translate contentKey={'items.update.relatedAddons'}>Related Addons</Translate>
                                </Label>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">
                                                    <Translate contentKey={'items.update.name'}>Name</Translate>
                                                </TableHead>
                                                <TableHead className="text-xs">
                                                    <Translate contentKey={'items.update.price'}>Price</Translate>
                                                </TableHead>
                                                <TableHead className="text-xs">
                                                    <Translate contentKey={'items.update.include'}>Include</Translate>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedAddonGroup?.addonGroup.addons?.map((addon, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-xs">{addon.name}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price ?? ''}
                                                            onChange={e => handleAddonGroupOverridedPriceChange(
                                                                addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                addon.id,
                                                                e.target.value === '' ? null : Number(e.target.value)
                                                            )}
                                                            className="w-[50px] h-7 text-xs"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={!addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.excluded?.map(excluded => excluded.id).includes(addon.id)}
                                                            onCheckedChange={(checked) => handleAddonGroupExcludedChange(
                                                                { checked },
                                                                addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                addon
                                                            )}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                )}
                <div className="flex justify-end mt-3">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() =>
                                setSelectedActionOption(null)
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs"
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || isloadingUpdate}
                        >
                            {loading || isloadingUpdate ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update"
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            <AlertDialog open={showOverrideConfirmation} onOpenChange={setShowOverrideConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm">Confirm Override Action</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            You have selected "Override" mode. This will completely replace all existing addon groups for the selected items with the new addon groups you've configured.
                            <br /><br />
                            Are you sure you want to proceed? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="h-8 text-xs"
                            onClick={(e) => {
                                e.preventDefault();
                                performUpdate();
                            }}
                        >
                            Continue Override
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}