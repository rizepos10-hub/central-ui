import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import React, { useState } from 'react'
import AsyncSelect from "react-select/async";
import { useAppDispatch } from 'app/config/store';
import { Container, Row, Col, Input, Button, InputGroup, InputGroupText } from 'reactstrap';
import { MdDeleteForever } from "react-icons/md";
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { GoPackageDependencies } from "react-icons/go";
import { TiArrowRightThick } from "react-icons/ti";
import { filterEntities } from 'app/entities/item/retail/product/product.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { FilterMatchMode } from 'primereact/api';

const VariantPackaging = ({
    product,
    variantIndex,
    variant,
    handleVariantFieldChange
}: {
    product: IProduct;
    variantIndex: number;
    variant: IVariableItemVariant;
    handleVariantFieldChange: any;
}) => {
    const [showInputs, setShowInputs] = useState<boolean>(variant?.variantPackage ? true : false);

    const dispatch = useAppDispatch();

    const loadVariantOptions = async (inputValue) => {
        if (!inputValue) return [];

        try {
            const updatedQuery = applyMatchModeMap({
                ...initialItemFilterState,
                filters: {
                    ...initialItemFilterState.filters,
                    name: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
                }
            });
            const response = await dispatch(
                filterEntities({
                    query: updatedQuery,
                })
            );;
            const payload = response.payload as any;
            const data = payload?.data;
            return data?.flatMap(item => (item?.variants?.map(
                variant => ({
                    variantId: variant?.id,
                    name: `(${item?.name}) ${variant?.name}`
                })
            )))
        } catch (error) {
            console.error('Error loading options:', error);
            return [];
        }
    };

    const handleDeleteInput = () => {
        handleVariantFieldChange(variantIndex, 'variantPackage', null)
        setShowInputs(false)
    }

    return (
        <div className=''>
            <Row className="">
                <Col className='flex gap-2 align-items-baseline justify-content-center w-100'>
                    <h5>The product that this product breaks into</h5>
                    <h6 className='text-muted'>Products can only break into one other product</h6>
                </Col>
            </Row>
            {showInputs ? (
                <Container>
                    <Row className="align-items-center mt-3 p-2 border">
                        <Col md="1">
                            <div className="d-flex align-items-center">
                                <span>1</span>
                            </div>
                        </Col>
                        <Col md="3">
                            <div className="d-flex align-items-center">
                                <span className="mr-2">{variant.name}</span>
                                <span className="text-muted">{variant.sku}</span>
                            </div>
                        </Col>
                        <Col md="1" className='d-flex justify-content-end'>
                            <TiArrowRightThick size={24} className="text-muted" />
                        </Col>
                        <Col md="2">
                            <Input
                                type="number"
                                placeholder="Qty"
                                onChange={(e) => handleVariantFieldChange(variantIndex, 'variantPackage', {
                                    ...variant?.variantPackage,
                                    quantity: e.target.value
                                })}
                                value={variant?.variantPackage?.quantity || null}
                            />
                        </Col>
                        <Col md="4">
                            <InputGroup>
                                <AsyncSelect
                                    value={variant?.variantPackage || null}
                                    defaultOptions
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.variantId}
                                    loadOptions={loadVariantOptions}
                                    className="w-100"
                                    cacheOptions
                                    onChange={(val) => {
                                        handleVariantFieldChange(variantIndex, 'variantPackage', {
                                            ...variant?.variantPackage,
                                            variantId: val?.variantId,
                                            name: val?.name
                                        })
                                    }}
                                    placeholder="Search to add a product"
                                />
                            </InputGroup>
                        </Col>
                        <Col md="1" className="text-right">
                            <Button color="danger" onClick={handleDeleteInput}>
                                <MdDeleteForever />
                            </Button>
                        </Col>
                    </Row>
                </Container>
            ) : (
                <Container className="text-center mt-5">
                    <Row>
                        <Col>
                            <GoPackageDependencies size={64} className="text-muted mb-3" />
                            <p className="text-muted">If this product breaks into another product, add the product here</p>
                            <hr />
                            <Button color="link" className="text-primary" onClick={() => setShowInputs(true)}>
                                <i className="fas fa-plus"></i> Add a product relationship
                            </Button>
                        </Col>
                    </Row>
                </Container>
            )}
        </div>
    )
}

export default VariantPackaging