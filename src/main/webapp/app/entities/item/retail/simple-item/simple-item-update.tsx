import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Spinner, FormGroup, Table, FormText, Card, CardBody, CardHeader } from 'reactstrap';
import { getSortState, translate, Translate, ValidatedField } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button as PrimeButton } from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './simple-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IExchangeMeasure, ISimpleItem, ISimpleItemVariant } from "app/shared/model/ITEM/retail/simple-item.model";
import { Steps } from "primereact/steps";
import { MenuItem } from "primereact/menuitem";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getMeasures } from "app/entities/item-measure/item-measure.reducer";
import { CascadeSelect } from "primereact/cascadeselect";
import Select from 'app/shared/components/select/select';
import { getEntities as getAttributes } from "app/entities/item/retail/attributes/retail-attribute.reducer";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { ITaxonomy } from "app/shared/model/taxonomy.model";
import { ITerm } from "app/shared/model/term.model";
import { getEntities as getAttributeValues, reset as resetAttributeValues } from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import { AccordionTab, Accordion } from "primereact/accordion";
import AsyncSelect from 'app/shared/components/select/async-select';
import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import simpleRetailItem from "app/entities/item/retail/simple-item/simple-item.reducer";
import Visibility from 'app/shared/Visibility/Visibility';
import { TabPanel, TabView } from "primereact/tabview";
import ItemStockTab from "app/shared/components/item/item-stock-tab";
import { IItemMeasure } from "app/shared/model/item-measure.model";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import WholesalePrices from "app/shared/components/item/wholsale-prices-modal";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';


const defaultItemPriceNumber = {
  "PRICE_1": null,
  "PRICE_2": null,
  "PRICE_3": null,
  "PRICE_4": null,
  "PRICE_5": null,
};

const defaultSpecialPrices = {
  "WHOLE_SALE": { ...defaultItemPriceNumber },
  "RETAIL": { ...defaultItemPriceNumber }
};



export const SimpleItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const simpleItemEntity = useAppSelector(state => state.simpleRetailItem.entity);
  const loading = useAppSelector(state => state.simpleRetailItem.loading);
  const updating = useAppSelector(state => state.simpleRetailItem.updating);
  const updateSuccess = useAppSelector(state => state.simpleRetailItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const measureList = useAppSelector(state => state.itemMeasure.entities);
  const attributesList = useAppSelector(state => state.retailAttribute.entities);
  const location = useLocation();
  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [simpleItem, setSimpleItem] = useState<ISimpleItem>({
    itemType: "RETAIL",
    itemVariantType: ItemVariantType.RETAIL_SIMPLE,
    variants: [{
      branchVariantDetails: {},
    }]
  });

  const [measureToAdd, setMeasureToAdd] = useState<IExchangeMeasure>();


  const [itemAttribute, setItemAttribute] = useState<{
    attributeTax: ITaxonomy;
    attributeTerms: ITerm[];
  } | null>(null);


  const filteredMeasures = useMemo(() => {
    const exchangeMeasuresIds = simpleItem?.measures?.map((exMeasure) => exMeasure.itemMeasure.id);
    return measureList.filter(m => m.id !== simpleItem?.baseMeasure?.id && !exchangeMeasuresIds?.includes(m.id))
  }, [measureList?.length, simpleItem?.baseMeasure?.id, simpleItem?.measures?.length]);

  const filteredAvailableAttributes = () => {
    const existingAttributeIds = simpleItem?.attributes?.map(attr => attr.attributeTax.id);
    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };



  const isAttributeAddButtonDisabled =
    filteredAvailableAttributes()?.length === 0 ||
    !itemAttribute ||
    itemAttribute?.attributeTax &&
    Object.keys(itemAttribute?.attributeTax)?.length === 0 &&
    itemAttribute?.attributeTerms?.length === 0;


  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/product");
    }
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    setSimpleItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleSimpleItemVariantChange = (fieldName: keyof ISimpleItemVariant, value) => {
    setSimpleItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]: value,
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };



  const handleBranchPriceChange = (variantIndex = 0, branchId, priceType, price) => {
    setSimpleItem(prev => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
          branchVariantDetails: {
            ...prev.variants[variantIndex]?.branchVariantDetails,
            [branchId]: {
              ...(prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId]),
              branch: { id: branchId },
              [priceType]: price,
            },
          },
        },
      ],
    }));
  };

  const handleSaveWholesalePrices = (prices, branchId) => {
    setSimpleItem(prev => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          branchVariantDetails: {
            ...prev.variants[0]?.branchVariantDetails,
            [branchId]: {
              ...prev?.variants?.[0]?.branchVariantDetails?.[branchId],
              wholesalePrices: prices,
            },
          },
        },
      ],
    }));
  }

  const confirm1 = (baseMeasure) => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => handleBaseMeasureChange(baseMeasure)
    });
  };

  const handleBaseMeasureChange = (baseMeasure) => {
    if (!simpleItem?.measures || simpleItem?.measures?.length === 0) {
      setSimpleItem(prev => ({ ...prev, baseMeasure }))
    } else {
      setSimpleItem(prevState => {
        const updatedMeasures = prevState.measures.filter(exMeasure => exMeasure.itemMeasure.id !== baseMeasure.id)
          .map((exMeasure) => ({ ...exMeasure, exchangeRate: null }));
        return {
          ...prevState,
          baseMeasure,
          measures: updatedMeasures
        };
      });
    }
    setMeasureToAdd({})
  };

  const handleAddMeasure = () => {
    setSimpleItem((prevState) => ({
      ...prevState,
      measures: [measureToAdd, ...(prevState.measures || [])]
    }));
    setMeasureToAdd({})
  };

  const handleMeasuresChange = (measureIndex, newRate) => {
    setSimpleItem((prevState) => {
      const updatedMeasures = prevState.measures.map((exMeasure, index) => {
        if (measureIndex === index) {
          return { ...exMeasure, exchangeRate: newRate };
        }
        return exMeasure;
      });

      return {
        ...prevState,
        measures: updatedMeasures
      };
    });
  };

  const handleRemoveMeasure = (measureIndex) => {
    setSimpleItem((prevState) => {
      const updatedMeasures = prevState.measures.filter((_, index) => index !== measureIndex);
      return {
        ...prevState,
        measures: updatedMeasures
      };
    });
  };


  const handleAddAttribute = (): void => {
    const attributeExists = simpleItem?.attributes?.some(attr => attr === itemAttribute);

    if (!attributeExists) {
      setSimpleItem((prev) => ({
        ...prev,
        attributes: [
          ...(prev.attributes || []),
          itemAttribute,
        ],
      }));
      setItemAttribute(null)
    }
  };

  const handleItemAttributeSelect = selectedOption => {
    if (!selectedOption) {
      setItemAttribute(null);
      return
    }

    dispatch(getAttributeValues({
      id: selectedOption?.id,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    })
    );

    setItemAttribute(prevState => ({ ...prevState, attributeTax: selectedOption }));
  };

  const handleAttributeTermChange = (index, selectedTerms) => {
    setSimpleItem((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index
          ? {
            ...attr,
            attributeTerms: selectedTerms,
          }
          : attr
      ),
    }));
  };

  const refreshProduct =() => {
    dispatch(getEntity(id));
    setActiveIndex(3)
  }


  const handleNavigate = (simpleItemId) => {
    navigate(`/retail/simple/${simpleItemId}/edit` + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset())
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getAttributes({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getMeasures({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getMixAndMatchRules({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));



  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      setSimpleItem(simpleItemEntity);
    }

    const simpleItemId = simpleItemEntity?.id;
    if (updateSuccess) {
      handleNavigate(simpleItemId);
    }
  }, [simpleItemEntity?.id, updateSuccess]);


  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...simpleItem,
      variants: [
        {
          ...(simpleItem.variants && simpleItem.variants[0] && simpleItem.variants[0]),
          name: simpleItem.name
        },
      ],
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const loadOptions = (attributeId) => {

    dispatch(resetAttributeValues())
    dispatch(getAttributeValues({
      id: attributeId,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  };





  if (loading) {
    return <Spinner />
  }

  return (
    <form>
      <div className={"d-flex row"}>
        <Col md={9}>
          <Card className='p-0'>
            <CardBody>
              <Row>
                <Col md={10}>
                  <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                    <TabPanel header={translate('items.update.tabs.details.label')}>
                      <div className='w-100'>
                        <div className='text-xl font-semibold'>
                          {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.simple'}>Create New Simple Item</Translate> : <span>Edit {simpleItem.name}</span>}
                        </div>
                      </div>

                      <Row>

                        <FormGroup className={`${isNew ? "d-flex bg-white" : ""}`}>

                          <Col md="12" className={`d-flex flex-column bg-white gap-1 p-1`} >

                            <div className={"d-flex flex-column gap-2"}>
                              <label className={"font-semibold"}>
                                <Translate contentKey={'items.update.sku'}>SKU</Translate>
                              </label>
                              <InputText
                                name="sku"
                                id="sku"
                                required={true}
                                placeholder={translate('items.update.placeholders.itemSku')}
                                value={simpleItem?.variants?.[0]?.sku}
                                onChange={(e) => handleSimpleItemVariantChange('sku', e.target.value)}
                              />
                            </div>

                            <SharedItemUpdate item={simpleItem} onFieldChange={handleFieldChange} />

                            <Row className="">
                              <Col md="6">
                                <div className={"d-flex flex-column gap-2"}>
                                  <label className={"font-semibold"}>
                                    <Translate contentKey={'items.update.price'}>Price</Translate>
                                  </label>
                                  <InputNumber
                                    name="price"
                                    id="price"
                                    required={true}
                                    min={0}
                                    maxFractionDigits={2}
                                    inputClassName={"w-1"}
                                    placeholder={translate('items.update.placeholders.itemPrice')}
                                    value={simpleItem?.variants?.[0]?.price}
                                    onChange={(e) => handleSimpleItemVariantChange('price', e.value)}
                                  />
                                </div>
                              </Col>

                              <Col md="6">
                                <div className={"d-flex flex-column gap-2"}>
                                  <label className={"font-semibold"}>
                                    <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                  </label>
                                  <InputNumber
                                    name="sale-price"
                                    id="sale-price"
                                    min={0}
                                    maxFractionDigits={2}
                                    placeholder={translate('items.update.placeholders.itemSalePrice')}
                                    value={simpleItem?.variants?.[0]?.salePrice}
                                    onChange={(e) => handleSimpleItemVariantChange('salePrice', e.value)}
                                  />
                                </div>
                              </Col>
                            </Row>


                            {/* <VariantBranchPrice
                              itemVariantType={"RETAIL"}
                              branchVariantDetails={simpleItem?.variants?.[0]?.branchVariantDetails}
                              variantIndex={0}
                              branchList={branchList}
                              handleBranchPriceChange={handleBranchPriceChange}
                              handleSavePricingPoint={handleSaveWholesalePrices}
                            /> */}

                            <Row>
                              <Col md="7">

                                <DiscountDropdown
                                  discounts={simpleItem?.variants?.[0]?.discounts}
                                  handleChange={handleSimpleItemVariantChange}
                                />

                                <div className={"d-flex flex-column gap-2 mt-2"}>
                                  <label className={"font-semibold"}>
                                    <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                  </label>
                                  <Select
                                    value={simpleItem?.variants?.[0]?.mixAndMatchRule}
                                    options={mixAndMatchRuleList}
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.id}
                                    onChange={(mixAndMatchRule) => handleSimpleItemVariantChange('mixAndMatchRule', mixAndMatchRule)}
                                  />
                                </div>
                              </Col>
                            </Row>

                            <Row>
                              <Col md="12">
                                <div className={"d-flex flex-row gap-2"}>
                                  <div className={"d-flex flex-column gap-2"}>
                                    <label className={"font-semibold"}>
                                      <Translate contentKey={'items.update.attributes'}>Attributes</Translate>
                                    </label>
                                    <Select
                                      value={itemAttribute?.attributeTax || null}
                                      isClearable
                                      options={filteredAvailableAttributes()}
                                      getOptionValue={option => option.id}
                                      getOptionLabel={option => option.key}
                                      onChange={(attribute) => handleItemAttributeSelect(attribute)}
                                    />
                                  </div>
                                  <PrimeButton
                                    type="button"
                                    color="primary" className={"mt-5"} onClick={handleAddAttribute}
                                    disabled={isAttributeAddButtonDisabled}
                                  >
                                    <Translate contentKey={'items.update.addAttribute'}>Add Attribute</Translate>
                                  </PrimeButton>
                                </div>
                              </Col>



                              <Col md={"7"} className={"mt-2"}>
                                <Accordion multiple activeIndex={[0]}>
                                  {simpleItem?.attributes?.map((attribute, index) => (
                                    <AccordionTab key={index} header={attribute?.attributeTax?.key}>
                                      <div className={"d-flex gap-3"}>
                                        <label className={"mt-2"}>{translate('items.update.name')}: {attribute?.attributeTax?.key}</label>
                                        <Col md={"9"}>
                                          <AsyncSelect
                                            value={attribute?.attributeTerms}
                                            isMulti
                                            getOptionLabel={option => option.name}
                                            getOptionValue={option => option.id}
                                            onChange={(selectedOptions) => handleAttributeTermChange(index, selectedOptions)}
                                            isLoading={loadingAttributesValues}
                                            onFocus={() => loadOptions(attribute?.attributeTax?.id)}
                                            defaultOptions={attributeValuesList}
                                          />

                                        </Col>
                                      </div>
                                    </AccordionTab>
                                  ))}

                                </Accordion>
                              </Col>
                            </Row>
                          </Col>
                        </FormGroup>


                      </Row>
                    </TabPanel>
                    <TabPanel header={translate('items.update.tabs.visibility.label')}>
                      <Visibility
                        initialState={simpleItem.visibility}
                        title={translate('items.update.tabs.visibility.titles.simple')}
                        onStateChanged={(state) => setSimpleItem(prev => {
                          return { ...prev, visibility: state }
                        })} />
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.excludedFromLoyaltyPoints.label')}>
                      <ItemLoyaltyTab excludedFromLoyaltyPoints={simpleItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.stock.label')} disabled={isNew}>
                      <ItemStockTab refreshProduct={refreshProduct} variants={simpleItem?.variants} itemId={simpleItem.id} />
                    </TabPanel>

                    <TabPanel header={translate('items.update.measures')}>
                      <div className='row align-items-end'>
                        <div className='row col-10'>
                          <div className='col d-flex flex-column gap-2 mt-3'>
                            <label className={"font-semibold"}>
                              <Translate contentKey={'items.update.baseMeasure'}>Select Measure</Translate>
                            </label>
                            <Select
                              value={simpleItem?.baseMeasure}
                              options={measureList}
                              name="baseMeasure"
                              getOptionValue={option => option.id}
                              getOptionLabel={option => option.name}
                              onChange={confirm1}
                            />
                          </div>

                          <div className='col d-flex flex-column gap-2 mt-3'>
                            <label className={"font-semibold"}>
                              <Translate contentKey={'items.update.measure'}>Measure</Translate>
                            </label>
                            <Select
                              value={measureToAdd?.itemMeasure || null}
                              isDisabled={!simpleItem?.baseMeasure}
                              options={filteredMeasures}
                              getOptionValue={option => option.id}
                              getOptionLabel={option => option.name}
                              onChange={(itemMeasure) => setMeasureToAdd(prev => ({ ...prev, itemMeasure }))}
                            />
                          </div>

                          <div className='col d-flex flex-column gap-2 mt-3'>
                            <label className={"font-semibold"}>
                              <Translate contentKey={'items.update.exchangeRate'}>Exchange Rate</Translate>
                            </label>
                            <InputNumber
                              value={measureToAdd?.exchangeRate}
                              disabled={!measureToAdd?.itemMeasure}
                              onChange={(e) => setMeasureToAdd(prev => ({ ...prev, exchangeRate: e.value }))}
                              className='p-1'
                            />
                          </div>
                        </div>
                        <div className='col-2'>
                          <PrimeButton
                            type="button"
                            disabled={!measureToAdd?.exchangeRate}
                            onClick={handleAddMeasure}
                            color="primary"
                            className={"mb-2"}
                          >
                            Add
                          </PrimeButton>
                        </div>
                      </div>


                      <Row className={" d-flex flex-column gap-3"} >
                        <Col md="8">
                          <Table>
                            <thead>
                              <tr>
                                <th><Translate contentKey={'items.update.measure'}>Measure</Translate></th>
                                <th><Translate contentKey={'items.update.exchangeRate'}>Exchange Rate</Translate></th>
                                <th>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {simpleItem?.measures?.map((exMeasure, index) => (
                                <tr key={index}>
                                  <td>
                                    {exMeasure?.itemMeasure?.name}
                                  </td>
                                  <td>
                                    <InputNumber
                                      value={exMeasure?.exchangeRate}
                                      required
                                      onChange={(e) => handleMeasuresChange(index, e.value)}
                                    />
                                  </td>
                                  <td>
                                    <PrimeButton type={"button"} onClick={() => handleRemoveMeasure(index)} severity={"danger"} >
                                      <Translate contentKey={'items.update.remove'}>Remove</Translate>
                                    </PrimeButton>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                    </TabPanel>

                  </TabView>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} style={{
          position: 'sticky',
          top: '0',
          height: '90vh',
        }}>
          <Card>
            <CardHeader>Actions</CardHeader>
            <div className={'d-flex gap-3 mt-2'}>
              <PrimeButton type="button" onClick={handleBackClick} id="cancel-save" data-cy="entityCreateCancelButton"
                severity='secondary'>
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </PrimeButton>
              &nbsp;
              <PrimeButton color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="button"
                onClick={saveEntity} disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </PrimeButton>
            </div>
          </Card>
          {simpleItemEntity?.id && <AuditLogs entityId={simpleItemEntity?.id} />}
        </Col>

      </div>
    </form>
  );
};

export default SimpleItemUpdate;
