import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, Spinner, FormGroup, Table, FormText, Card, CardBody} from 'reactstrap';
import {getSortState, translate, Translate, ValidatedField} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import {Button as PrimeButton} from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './simple-item.reducer';
import SharedItemUpdate from "app/shared/layout/item/shared-item-update";
import {IExchangeMeasure, ISimpleItem} from "app/shared/model/ITEM/retail/simple-item.model";
import {Steps} from "primereact/steps";
import {MenuItem} from "primereact/menuitem";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {getEntities as getMeasures} from "app/entities/item-measure/item-measure.reducer";
import {CascadeSelect} from "primereact/cascadeselect";
import Select from "react-select";
import {getEntities as getAttributes} from "app/entities/item/retail/attributes/retail-attribute.reducer";
import {ITaxonomy} from "app/shared/model/taxonomy.model";
import {ITerm} from "app/shared/model/term.model";
import {getEntities as getAttributeValues, reset as resetAttributeValues} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import {AccordionTab, Accordion} from "primereact/accordion";
import AsyncSelect from "react-select/async";
import {ItemVariantType} from "app/shared/model/ENUMS/item-variant-type.model";
import simpleRetailItem from "app/entities/item/retail/simple-item/simple-item.reducer";
import Visibility from 'app/shared/Visibility/Visibility';
import {TabPanel, TabView} from "primereact/tabview";
import ItemStockTab from "app/shared/layout/item/item-stock-tab";
import {IItemMeasure} from "app/shared/model/item-measure.model";
import ItemLoyaltyTab from "app/shared/layout/item/item-loyalty-tab";



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
  const measureList = useAppSelector(state => state.itemMeasure.entities);
  const attributesList = useAppSelector(state => state.retailAttribute.entities);
  const location = useLocation();


  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);

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
  }>({
    attributeTax: {},
    attributeTerms: []
  });

  const filteredMeasures = useMemo(() => {
    const exchangeMeasuresIds = simpleItem?.measures?.map((exMeasure) => exMeasure.itemMeasure.id);
    return measureList.filter(m => m.id !== simpleItem?.baseMeasure?.id && !exchangeMeasuresIds?.includes(m.id) )
  }, [measureList?.length, simpleItem?.baseMeasure?.id, simpleItem?.measures?.length]) ;

  const filteredAvailableAttributes = () => {
    const existingAttributeIds = simpleItem?.attributes?.map(attr => attr.attributeTax.id);
    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };

  const isAttributeAddButtonDisabled =
    filteredAvailableAttributes().length === 0 ||
    Object.keys(itemAttribute.attributeTax).length === 0 &&
    itemAttribute.attributeTerms.length === 0;


  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/retail/simple");
    }
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    setSimpleItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleSimpleItemChange = (fieldName, value) => {
    console.log(fieldName, 'field', value, "value");
    setSimpleItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]:  value,
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleBranchPriceChange = (branchId, price) => {
    setSimpleItem(prev => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          branchVariantDetails: {
            ...prev.variants[0]?.branchVariantDetails,
            [branchId]: {
              branch: branchList.find(branch => branch.id === branchId),
              price: price,
              salePrice: prev.variants[0]?.branchVariantDetails?.[branchId]?.salePrice || 0,
            },
          },
        },
      ],
    }));
  };

  const handleBaseMeasureChange = (baseMeasure) => {
    if(!simpleItem?.measures || simpleItem?.measures?.length === 0){
      setSimpleItem(prev => ({...prev, baseMeasure}))
    }else{
      const isConfirmed = window.confirm("Changing base measure will reset the exchange rates");
      if(isConfirmed){
        setSimpleItem(prevState => {
          const updatedMeasures = prevState.measures.filter(exMeasure => exMeasure.itemMeasure.id !== baseMeasure.id)
            .map((exMeasure) => ({...exMeasure, exchangeRate: null}));
          return {
            ...prevState,
            baseMeasure,
            measures: updatedMeasures
          };
        });
      }
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


  const handleAddAttribute = () => {
    setSimpleItem((prev) => ({
      ...prev,
      attributes: [
        ...(prev.attributes || []),
        itemAttribute,
      ],
    }));
  };

  const handleItemAttributeSelect = (selectedOption) => {
      dispatch(getAttributeValues({
        id: selectedOption?.id,
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));
      setItemAttribute((prevState) => ({...prevState, attributeTax: selectedOption}))
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


  const handleNavigate = (simpleItemId) => {
    navigate(`/retail/simple/${simpleItemId}/edit` + location.search);
  };

  useEffect(() => {
    if(isNew){
      dispatch(reset())
    }else{
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
    }))



  },[id, isNew]);

  useEffect(() => {

    if(!isNew){
      setSimpleItem(simpleItemEntity);
    }
    const simpleItemId = simpleItemEntity?.id
    if(updateSuccess){
      handleNavigate(simpleItemId);
    }

  }, [simpleItemEntity, updateSuccess]);


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





  if(loading){
    return <Spinner />
  }

  return (
    <form onSubmit={saveEntity}>

      <Card>
        <CardBody>
          <Row>
            <Col md={10}>
              <TabView>
                <TabPanel header={translate('items.update.tabs.details.label')}>
                  <Row>
                    <Col md="8">
                      <h2>
                        {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.simple'}>Create New Simple Item</Translate> : <Translate contentKey={'items.update.tabs.details.titles.edit.simple'}>Edit Simple Item</Translate>}
                      </h2>
                    </Col>
                  </Row>

                  <Row>

                    <FormGroup  className={`${isNew ? "d-flex justify-content-center bg-white mt-3" : ""}`}>

                      <Col md="8" className={`d-flex flex-column p-3  bg-white mt-3 `} >

                        <SharedItemUpdate item={simpleItem} onFieldChange={handleFieldChange}/>

                        <Row className={"mb-3"} >

                          <Col md="4">
                            <div className={"d-flex flex-column gap-2"}>
                              <label className={"text-xl font-bold"}>
                                <Translate contentKey={'items.update.sku'}>SKU</Translate>
                              </label>
                              <InputText
                                name="sku"
                                id="sku"
                                required={true}
                                placeholder={translate('items.update.placeholders.itemSku')}
                                value={simpleItem?.variants?.[0]?.sku}
                                onChange={(e) => handleSimpleItemChange('sku', e.target.value)}
                              />
                            </div>
                          </Col>

                          <Col md="4">
                            <div className={"d-flex flex-column gap-2"}>
                              <label className={"text-xl font-bold"}>
                                <Translate contentKey={'items.update.price'}>Price</Translate>
                              </label>
                              <InputNumber
                                name="price"
                                id="price"
                                required={true}
                                maxFractionDigits={2}
                                inputClassName={"w-1"}
                                placeholder={translate('items.update.placeholders.itemPrice')}
                                value={simpleItem?.variants?.[0]?.price}
                                onChange={(e) => handleSimpleItemChange('price', e.value)}
                              />
                            </div>
                          </Col>

                          <Col md="4">
                            <div className={"d-flex flex-column gap-2"}>
                              <label className={"text-xl font-bold"}>
                                <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                              </label>
                              <InputNumber
                                name="sale-price"
                                id="sale-price"
                                maxFractionDigits={2}
                                placeholder={translate('items.update.placeholders.itemSalePrice')}
                                value={simpleItem?.variants?.[0]?.salePrice}
                                onChange={(e) => handleSimpleItemChange('salePrice', e.value)}
                              />
                            </div>
                          </Col>


                          <Col md="8" className={"mt-3"}>
                            <h4><Translate contentKey={'items.update.branchPrices'}>Branch Prices</Translate></h4>
                            <Table>
                              <thead>
                              <tr>
                                <th><Translate contentKey={'items.update.branch'}>Branch</Translate></th>
                                <th><Translate contentKey={'items.update.price'}>Price</Translate></th>
                              </tr>
                              </thead>
                              <tbody>
                              {branchList.map(branch => (
                                <tr key={branch.id}>
                                  <td>{branch.name}</td>
                                  <td>
                                    <InputNumber
                                      name={`branchPrice_${branch.id}`}
                                      placeholder={translate('items.update.placeholders.itemBranchPrice', {branchName: branch.name})}
                                      onWheel={(e: any) => e.target.blur()}
                                      size={60}
                                      value={simpleItem?.variants?.[0]?.branchVariantDetails?.[branch.id]?.price}
                                      onChange={e => handleBranchPriceChange(branch.id, e.value)}
                                    />
                                  </td>
                                </tr>
                              ))}
                              </tbody>
                            </Table>
                          </Col>

                          <Row>
                            <Col md="4">
                              <div className={"d-flex flex-column gap-2"}>
                                <label className={"text-xl font-bold"}>
                                  <Translate contentKey={'items.update.selectAttribute'}>Select Attribute</Translate>
                                </label>
                                <Select
                                  value={itemAttribute?.attributeTax}
                                  options={filteredAvailableAttributes()}
                                  getOptionValue={option => option.id}
                                  getOptionLabel={option => option.key}
                                  onChange={(attribute) => handleItemAttributeSelect(attribute)}
                                />
                              </div>
                            </Col>



                            <Col md="4" >
                              <Button
                                color="primary" className={"mt-5"} onClick={handleAddAttribute}
                                disabled={isAttributeAddButtonDisabled}
                              >
                                <Translate contentKey={'items.update.addAttribute'}>Add Attribute</Translate>
                              </Button>
                            </Col>
                            <Col md={"8"} className={"mt-2"}>
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
                  <ItemLoyaltyTab excludedFromLoyaltyPoints={simpleItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange}/>
                </TabPanel>

                <TabPanel header={translate('items.update.tabs.stock.label')} disabled={isNew}>
                  <ItemStockTab variants={simpleItem?.variants} itemId={simpleItem.id} />
                </TabPanel>

                <TabPanel header={translate('items.update.measures')}>
                  <Row className={"mb-3 d-flex flex-column gap-3"} >
                    <Col md="12" className={"d-flex gap-3 mb-3"}>
                      <div className={"d-flex flex-column gap-2 w-6 mt-3"}>
                        <label className={"text-xl font-bold"}>
                          <Translate contentKey={'items.update.baseMeasure'}>Select Measure</Translate>
                        </label>
                        <Select
                          value={simpleItem?.baseMeasure}
                          options={measureList}
                          name="baseMeasure"
                          getOptionValue={option => option.id}
                          getOptionLabel={option => option.name}
                          onChange={handleBaseMeasureChange}
                        />
                      </div>

                      <Table>
                        <thead>
                        <tr>
                          <th >Measure</th>
                          <th className="w-1">Exchange Rate</th>
                        </tr>
                        </thead>
                        <thead>
                        <tr>
                          <td>
                            <Select
                              value={measureToAdd?.itemMeasure || null}
                              isDisabled={!simpleItem?.baseMeasure}
                              options={filteredMeasures}
                              getOptionValue={option => option.id}
                              getOptionLabel={option => option.name}
                              onChange={(itemMeasure) => setMeasureToAdd(prev => ({...prev, itemMeasure}))}
                            />
                          </td>
                          <td>
                            <InputNumber
                              value={measureToAdd?.exchangeRate}
                              disabled={!measureToAdd?.itemMeasure}
                              onChange={(e) => setMeasureToAdd(prev => ({...prev, exchangeRate: e.value}))}
                            />
                          </td>
                          <td>
                            <Button
                              disabled={!measureToAdd?.exchangeRate} onClick={handleAddMeasure} color="primary"  className={"mb-2"} >Add</Button>
                          </td>
                        </tr>
                        </thead>
                      </Table>
                    </Col>

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
            <Col md={2}>
              <div className={"d-flex"}>
                <Button onClick={handleBackClick} id="cancel-save" data-cy="entityCreateCancelButton"  replace
                        color="info">
                  <FontAwesomeIcon icon="arrow-left"/>
                  &nbsp;
                  <span className="d-none d-md-inline">
                                  <Translate contentKey="entity.action.back">Back</Translate>
                              </span>
                </Button>
                &nbsp;
                <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                        disabled={updating}>
                  <FontAwesomeIcon icon="save"/>
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

    </form>
  );
};

export default SimpleItemUpdate;
