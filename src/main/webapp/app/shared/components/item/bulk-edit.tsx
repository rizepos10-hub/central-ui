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
import { Col, Container, Row, Spinner, Table } from 'reactstrap';
import { Button } from 'primereact/button';
import { IoMdCloseCircle } from 'react-icons/io';
import { OrderList } from 'primereact/orderlist';
import { IAddonGroup, IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { getSortState, Translate, translate } from 'react-jhipster';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { SelectButton } from 'primereact/selectbutton';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { useSearchParams } from 'react-router-dom';

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

    const selectedAddonGroupIds = addonGroups?.map(group => group.addonGroup.id);
    const filteredAddonGroupsOptions = addonGroupsOptions?.filter(
        option => !selectedAddonGroupIds?.includes(option.id)
    );

    const handleSubmit = async (e) => {
        setIsLoadingUpdate(true);
        e.preventDefault();

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
    }

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
            <div className='d-flex gap-2 align-items-center'>
                <Dropdown
                    value={selected}
                    onChange={e => setSelected(e.value)}
                    options={data}
                    placeholder=""
                    className="w-full md:w-14rem"
                    onFocus={onFocus}
                    optionLabel={'name'}
                    optionValue={'id'}
                />
                <Button
                    disabled={!selected}
                    onClick={() => {
                        onChange(options?.find(g => g?.id === selected))
                        setSelected(null)
                    }}
                    color="primary"
                    className='p-1 mr-2'
                >
                    Assign
                </Button>
                {/* <div className={'d-flex flex-column gap-1 flex-end justify-content-end col-2 pe-0'}>
                    <div>
                        <Button type="button" onClick={openImportAddonModal}>
                            <Translate contentKey={'items.update.importAddons'}>Import</Translate>
                        </Button>
                    </div>
                </div> */}
            </div>
        )
    }

    return (
        <Container className="p-0 m-0" style={{
            height: '75vh',
            overflow: 'auto'
        }}>
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form>
                <Row>
                    <Col md="4">
                        <div className="fw-bold">Bulk Edit</div>
                        <div style={{
                            height: '30vh',
                            width: '100%',
                            border: '1px solid rgb(215 215 215)',
                            overflowY: 'auto',
                        }}>
                            {selectedProducts.map((prod, idx) => (
                                <Button
                                    key={idx}
                                    className="d-flex gap-2"
                                    text
                                    onClick={() => setSelectedProducts(selectedProducts.filter(sp => sp.id !== prod.id))}
                                    type="button"
                                >
                                    <span>
                                        <IoMdCloseCircle
                                            style={{
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </span>
                                    <span>
                                        {prod.name}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </Col>
                    <Col md="3">
                        <div className="fw-bold">Categories</div>
                        <div style={{
                            height: '30vh',
                            width: '100%',
                            border: '1px solid rgb(215 215 215)',
                            overflowY: 'auto',
                        }}>
                            <div className={'d-flex flex-column gap-1 col p-0'}>
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
                                    className="d-flex gap-2"
                                    text type="button"
                                    onClick={() => setSelectedCategories(selectedCategories.filter(sc => sc.value !== selectedCategory.value))}
                                >
                                    <span>
                                        <IoMdCloseCircle style={{
                                            cursor: 'pointer',
                                        }} />
                                    </span>
                                    <span>
                                        {selectedCategory.label}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </Col>
                    <Col md="5">
                        <Row>
                            <Col md="6">
                                <div className="fw-bold">Production Center</div>
                                <div style={{}}>
                                    <div className={'d-flex flex-column gap-1 col p-0'}>
                                        <Select
                                            options={productionCenters?.map(pc => ({ value: pc.id, label: pc.name }))}
                                            isClearable
                                            className="w-100"
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
                            </Col>
                            <Col md="6">
                                <div className="fw-bold">Tags</div>
                                <div style={{}}>
                                    <div className={'d-flex flex-column gap-1 col p-0'}>
                                        <Select
                                            options={tags?.map(tag => ({ value: tag.id, label: tag.name }))}
                                            isMulti
                                            isClearable
                                            className="w-100"
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
                            </Col>
                        </Row>
                        <Row>
                            <Col md="6">
                                <div className="fw-bold">Discount</div>
                                <div style={{}}>
                                    <div className={'d-flex flex-column gap-1 col p-0'}>
                                        <Select
                                            options={discounts?.map(disc => ({ value: disc.id, label: `${disc.value} (${disc.type})` }))}
                                            isClearable
                                            className="w-100"
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
                            </Col>
                            <Col md="6">
                                <div className="fw-bold">Profile Group</div>
                                <div style={{}}>
                                    <div className={'d-flex flex-column gap-1 col p-0'}>
                                        <Select
                                            options={profileGroups?.map(pg => ({ value: pg.id, label: pg.name }))}
                                            isClearable
                                            className="w-100"
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
                            </Col>
                        </Row>
                        {isRetail && (
                            <Row>
                                <Col md="6">
                                    <div className="fw-bold">Brand</div>
                                    <div style={{}}>
                                        <div className={'d-flex flex-column gap-1 col p-0'}>
                                            <Select
                                                options={brands?.map(brand => ({ value: brand.id, label: brand.name }))}
                                                isClearable
                                                className="w-100"
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
                                </Col>
                            </Row>
                        )}
                    </Col>
                </Row>
                {!isRetail && (
                    <Row className='mt-3 border mx-0 p-1'>
                        <Col md={6}>
                            <div className="fw-bold">Add ons</div>
                            <OrderList
                                value={addonGroups?.map(group => group.addonGroup) || []}
                                onChange={handleAddonGroupReorder}
                                style={{ padding: '0px' }}
                                listStyle={{ padding: '0px' }}
                                itemTemplate={(addonGroup: IAddonGroup) => {
                                    const index = addonGroups?.findIndex(group => group.addonGroup.id === addonGroup.id);

                                    return (
                                        <div
                                            className="p-orderlist-item d-flex gap-2 align-items-end p-0"
                                            onClick={() => setSelectedAddonGroup(addonGroups[index])}
                                        >
                                            <span className='d-flex flex-column gap-1'>
                                                <label>{addonGroup?.name}</label>
                                                <InputText
                                                    value={addonGroups[index]?.name ?? addonGroup?.name}
                                                    onChange={e => handleAddonGroupFieldChange(index, 'name', e.target.value)}
                                                    style={{ width: '120px' }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ') {
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                />
                                            </span>
                                            <span className='d-flex gap-1'>
                                                <span className='d-flex flex-column gap-1'>
                                                    <label>{translate('items.update.min')}</label>
                                                    <InputNumber
                                                        value={addonGroups[index]?.minQuantity}
                                                        onChange={e => {
                                                            handleAddonGroupFieldChange(index, 'minQuantity', e.value)
                                                        }}
                                                        inputStyle={{ width: '40px' }}
                                                    />
                                                </span>
                                                <span className='d-flex flex-column gap-1'>
                                                    <label>{translate('items.update.max')}</label>
                                                    <InputNumber
                                                        value={addonGroups[index]?.maxQuantity}
                                                        onChange={e => handleAddonGroupFieldChange(index, 'maxQuantity', e.value)}
                                                        inputStyle={{ width: '40px' }}
                                                    />
                                                </span>
                                            </span>
                                            <span className='d-flex flex-column gap-1'>
                                                <label>{translate('items.update.addAutomatically')}</label>
                                                <Checkbox
                                                    checked={addonGroups[index]?.addAutomatically}
                                                    onChange={e => handleAddonGroupFieldChange(index, 'addAutomatically', e.checked)}
                                                />
                                            </span>
                                            <Button color="danger" onClick={(e) => handleRemoveAddonGroup(e, addonGroup.id)}>
                                                X
                                            </Button>
                                        </div>
                                    )
                                }}
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
                                dragdrop
                                dataKey="id"
                            />
                        </Col>
                        {selectedAddonGroup && (
                            <Col md={6}>
                                <label className={'font-semibold'}>
                                    <Translate contentKey={'items.update.relatedAddons'}>Related Addons</Translate>
                                </label>
                                <div className='border'>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>
                                                    <Translate contentKey={'items.update.name'}>Name</Translate>
                                                </th>
                                                <th>
                                                    <Translate contentKey={'items.update.price'}>Price</Translate>
                                                </th>
                                                <th>
                                                    <Translate contentKey={'items.update.include'}>Include</Translate>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedAddonGroup?.addonGroup.addons?.map((addon, index) => (
                                                <tr key={index}>
                                                    <td className='align-content-center'>{addon.name}</td>
                                                    <td className='align-content-center'>
                                                        <InputNumber
                                                            value={selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price}
                                                            onChange={e => handleAddonGroupOverridedPriceChange(
                                                                addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                addon.id,
                                                                e.value
                                                            )}
                                                            inputStyle={{ width: '50px' }}
                                                            mode="decimal"
                                                            minFractionDigits={2}
                                                            maxFractionDigits={2}
                                                        />
                                                    </td>
                                                    <td className='align-content-center'>
                                                        <Checkbox
                                                            checked={!addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.excluded?.map(excluded => excluded.id).includes(addon.id)}
                                                            onChange={e => handleAddonGroupExcludedChange(
                                                                e,
                                                                addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                addon
                                                            )}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Col>
                        )}
                        <Row>
                            <div className="flex justify-content-start">
                                <SelectButton
                                    value={addonGroupsActionValue}
                                    onChange={(e) => setAddonGroupsActionValue(e.value)}
                                    options={['Append To Items', 'Override']}
                                />
                            </div>
                        </Row>
                    </Row>
                )}
                <Row>
                    <Col md="12" className="d-flex justify-content-end">
                        <div className="d-flex gap-2">
                            <Button
                                className="mt-3"
                                label="Cancel"
                                icon="pi pi-save"
                                outlined
                                onClick={() =>
                                    setSelectedActionOption(null)
                                }
                            />
                            <Button className="mt-3" icon="pi pi-save" type="button" onClick={handleSubmit} disabled={loading || isloadingUpdate}>
                                {loading || isloadingUpdate ? <Spinner /> : "Update"}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </form>
        </Container>
    )
}