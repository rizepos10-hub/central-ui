import React, { useState } from 'react';
import Select from 'react-select';
import { getEntities as getProductionCenters } from 'app/entities/location/production-center/production-center.reducer';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import { getEntities as getBrands } from 'app/entities/brand/brand.reducer';
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Col, Container, Row, Spinner } from 'reactstrap';
import { Button } from 'primereact/button';
import { IoMdCloseCircle } from 'react-icons/io';

export const actionOptions = [
    { name: 'Edit', code: 'EDIT' },
    { name: 'Move To Trash', code: 'MOVE_TO_TRASH' },
    { name: 'Export', code: 'EXPORT' },
];


export const BulkEdit = ({
    products,
    selectedProducts,
    setSelectedProducts,
    setSelectedActionOption,
    refetchEntities,
    loading,
    updateEntities,
    isRetail = false
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

    const categories = useAppSelector(state => state.retailCategory.entities)
    const productionCenters = useAppSelector(state => state.productionCenter.entities);
    const profileGroups = useAppSelector(state => state.profileGroup.entities);
    const tags = useAppSelector(state => state.tag.entities);
    const brands = useAppSelector(state => state.brand.entities);
    const discounts = useAppSelector(state => state.discount.entities);

    const [selectedCategories, setSelectedCategories] = useState<any>([]);
    const [selectedTags, setSelectedTags] = useState<any>([]);
    const [selectedBrands, setSelectedBrands] = useState<any>({});
    const [selectedProfileGroup, setSelectedProfileGroup] = useState<any>({});
    const [selectedProuctionCenter, setSelectedProductionCenter] = useState<any>({});
    const [selectedDiscount, setSelectedDiscount] = useState<any>({});

    const [isloadingUpdate, setIsLoadingUpdate] = useState(false);

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
        }));

        console.log(entitiesToUpdate)

        await dispatch(updateEntities(entitiesToUpdate));
        await refetchEntities();

        setIsLoadingUpdate(false);
    }

    console.log(isloadingUpdate, 'isloadingUpdate')

    return (
        <Container className="p-0 m-0" style={{
            height: '65vh'
        }}>
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form onSubmit={handleSubmit}>
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
                                        dispatch(
                                            getCategories({
                                                page: 0,
                                                size: 1000,
                                                sort: `id,desc`,
                                            })
                                        );
                                    }}
                                    value={selectedCategories}
                                    onChange={(e) => setSelectedCategories(e)}
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
                                            />
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </Col>
                </Row>
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
                            <Button className="mt-3" icon="pi pi-save" type="submit" disabled={loading || isloadingUpdate}>
                                {loading || isloadingUpdate ? <Spinner /> : "Update"}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </form>
        </Container>
    )
}