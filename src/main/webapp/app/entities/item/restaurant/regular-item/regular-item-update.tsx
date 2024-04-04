import React, {useCallback, useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Card, CardBody, CardHeader, Col, FormGroup, Row, Spinner, Table} from 'reactstrap';
import {getSortState, translate, Translate} from 'react-jhipster';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import {useAppDispatch, useAppSelector} from 'app/config/store';

import {createEntity, getEntity, reset, updateEntity} from './regular-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import {IRegularItem, IRegularItemVariant} from "app/shared/model/ITEM/restaurant/regular-item.model";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import Select from "react-select";
import {Accordion, AccordionTab} from "primereact/accordion";
import {ItemVariantType} from "app/shared/model/ENUMS/item-variant-type.model";
import Visibility from 'app/shared/Visibility/Visibility';
import {TabPanel, TabView} from "primereact/tabview";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import {getEntities as getDiscounts} from "app/entities/discount/discount.reducer";
import {getEntities as getMixAndMatchRules} from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import Attachment from "app/shared/layout/attachment/attachment";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import { IDiscount } from "app/shared/model/discount.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";






export const RegularItemUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const regularItemEntity = useAppSelector(state => state.regularItem.entity);
  const loading = useAppSelector(state => state.regularItem.loading);
  const updating = useAppSelector(state => state.regularItem.updating);
  const updateSuccess = useAppSelector(state => state.regularItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const addonList = useAppSelector(state => state.addon.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [regularItem, setRegularItem] = useState<IRegularItem>({
    itemType: "RESTAURANT",
    itemVariantType: ItemVariantType.RESTAURANT_VARIABLE,
    variants: []
  });

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/regular");
    }
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setRegularItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleVariantFieldChange = <K extends keyof IRegularItemVariant>(variantIndex, fieldName: K, value: IRegularItemVariant[K]) => {
    setRegularItem((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        [fieldName]: value,
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };


  const handleBranchPriceChange = useCallback((variantIndex, branchId, priceType, price ) => {
    setRegularItem((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...(prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId]),
            branch: {id: branchId},
            [priceType]: price,
          },
        },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  },[]);




  const handleAddVariant = () => {
    setRegularItem((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          name: regularItem?.name,
          attachments: [],
          discounts: [],
          sku: '',
          price: null,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: {},
        },
      ],
    }));
  };


  const handleNavigate = (RegularItemId) => {
    navigate(`/restaurant/regular/${RegularItemId}/edit` + location.search);
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

  },[id, isNew]);

  useEffect(() => {

    if(!isNew){
      setRegularItem(regularItemEntity);
    }

    const regularItemId = regularItemEntity?.id
    if(updateSuccess){
      handleNavigate(regularItemId);
    }

  }, [regularItemEntity, updateSuccess]);


  const saveEntity = e => {
    e.preventDefault();

    const entity = {
      ...regularItem,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };





  const handleDeleteVariant = (variantIndex) => {
    const isConfirmed = window.confirm(translate('items.update.deleteVariantMessage'));
    if(isConfirmed){
      setRegularItem((prev) => {
        const updatedVariants = [...prev.variants];
        updatedVariants.splice(variantIndex, 1);
        return {
          ...prev,
          variants: updatedVariants,
        };
      });
    }
  };

  const VariantAccordionHeader = (variantIndex) => (
    <div onClick={(e) => {
      e.preventDefault();
      e.stopPropagation()
    }} className={"d-flex gap-3 ml-2"}>
      <label className={"mt-2"}><strong>{regularItem?.variants?.[variantIndex]?.name}</strong></label>
      <Button className={"ml-auto"} color="danger" onClick={() => handleDeleteVariant(variantIndex)}>
        <Translate contentKey={'items.update.deleteVariant'}>Delete Variant</Translate>
      </Button>
    </div>
  );


  if(loading){
    return <Spinner />
  }

  return (
    <form onSubmit={saveEntity}>
      <div className={"d-flex flex-row"}>
        <Col md={9}>
          <Card>
            <CardBody>
              <Row>
                <Col md={12}>
                  <TabView>
                    <TabPanel header={translate('items.update.tabs.details.label')}>
                      <Row>
                        <Col md="8">
                          <h2>
                            {isNew ? translate('items.update.tabs.details.titles.create.variable') : translate('items.update.tabs.details.titles.edit.variable')}
                          </h2>
                        </Col>
                      </Row>

                      <Row>

                        <FormGroup  className={`${isNew ? "d-flex bg-white mt-3" : ""}`}>

                          <Col md="12" className={`d-flex flex-column p-3  bg-white mt-3 `} >

                            <SharedItemUpdate item={regularItem} onFieldChange={handleFieldChange} />


                          </Col>
                        </FormGroup>
                      </Row>
                    </TabPanel>
                    <TabPanel header={translate('items.update.variants')} >
                      <Col md="5" className={"d-flex gap-3"}>

                        <Button color="primary" className={"mt-5"} onClick={handleAddVariant}>
                          <Translate contentKey={'items.update.addSingleVariant'}>Add Variant</Translate>
                        </Button>
                      </Col>
                      <Col md={"12"} className={"mt-2"}>
                        <Row className={"mt-2"}>

                          {regularItem?.variants?.map((variant, variantIndex) => (
                            <Col md={"12"} key={variantIndex} className={"mt-2"}>
                              <Accordion multiple >
                                <AccordionTab headerTemplate={() => VariantAccordionHeader(variantIndex)} key={variantIndex} >
                                  <Row>
                                    <Col md="4">
                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <label className={"text-xl font-bold"}>
                                          <Translate contentKey={'items.update.name'}>Name</Translate>
                                        </label>
                                        <InputText
                                          name="variant-name"
                                          id="name"
                                          required={true}
                                          placeholder={translate('items.update.placeholders.variantName')}
                                          value={variant?.name}
                                          onChange={(e) => handleVariantFieldChange(variantIndex, 'name', e.target.value)}
                                        />
                                      </div>
                                    </Col>



                                    <Col md="4">
                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <label htmlFor="price" className={"text-xl font-bold"}>
                                          <Translate contentKey={'items.update.price'}>Price</Translate>
                                        </label>
                                        <InputNumber
                                          name="price"
                                          id="price"
                                          inputId={"price"}
                                          inputClassName={"w-1"}
                                          required={true}
                                          placeholder="Variant Price"
                                          value={variant?.price}
                                          size={6}
                                          min={0}
                                          maxFractionDigits={2}
                                          onChange={(e) => handleVariantFieldChange(variantIndex, 'price', e.value)}
                                        />
                                      </div>
                                    </Col>

                                    <Col md="4">
                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <label className={"text-xl font-bold"}>
                                          <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                        </label>
                                        <InputNumber
                                          name="sale-price"
                                          id="sale-price"
                                          placeholder="Variant Sale Price"
                                          min={0}
                                          size={6}
                                          maxFractionDigits={2}
                                          value={variant?.salePrice}
                                          onChange={(e) => handleVariantFieldChange(variantIndex, 'salePrice', e.value)}
                                        />
                                      </div>
                                    </Col>
                                  </Row>

                                  <Row>
                                    <Col md="7">
                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <label className={"text-xl font-bold"}>
                                          <Translate contentKey={'items.update.addons'}>Addons</Translate>
                                        </label>
                                        <Select
                                          value={variant.addons}
                                          options={addonList}
                                          isMulti
                                          getOptionLabel={option => option.name}
                                          getOptionValue={option => option.id}
                                          onChange={(addons) => handleVariantFieldChange(variantIndex, 'addons', addons as IAddon[])}
                                        />
                                      </div>

                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <label className={"text-xl font-bold"}>
                                          <Translate contentKey={'items.update.discounts'}>Discounts</Translate>
                                        </label>
                                        <Select
                                          value={variant.discounts}
                                          options={discountList}
                                          isMulti
                                          getOptionLabel={option => option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`}
                                          getOptionValue={option => option.id}
                                          onChange={(discounts) => handleVariantFieldChange(variantIndex, 'discounts', discounts as IDiscount[])}
                                        />
                                      </div>

                                      <div className={"d-flex flex-column gap-2 mt-2"}>
                                        <label className={"text-xl font-bold"}>
                                          <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                        </label>
                                        <Select
                                          value={variant?.mixAndMatchRule}
                                          options={mixAndMatchRuleList}
                                          getOptionLabel={option => option.name}
                                          getOptionValue={option => option.id}
                                          onChange={(mixAndMatchRule) => handleVariantFieldChange(variantIndex,'mixAndMatchRule', mixAndMatchRule)}
                                        />
                                      </div>

                                    </Col>
                                  </Row>

                                  <Row className={'my-3'}>
                                    <Col md={'7'}>
                                      <div className={'d-flex flex-column'}>
                                        <label className={'text-xl mt-2 font-bold'}>
                                          <Translate contentKey={'items.update.image'}>Image</Translate>
                                        </label>
                                        <Attachment
                                          image={variant?.attachments?.[0]}
                                          onRemoveImage={() =>  handleVariantFieldChange(variantIndex,'attachments', [])}
                                          onAddImage={(imageInfo) =>  handleVariantFieldChange(variantIndex,'attachments', [imageInfo])}
                                        />
                                      </div>
                                    </Col>
                                  </Row>

                                 <VariantBranchPrice
                                  branchList={branchList}
                                  handleBranchPriceChange={handleBranchPriceChange}
                                  variantIndex={variantIndex}
                                  branchVariantDetails={variant.branchVariantDetails}
                                 />

                                </AccordionTab>
                              </Accordion>
                            </Col>
                          ))}
                        </Row>
                      </Col>
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.visibility.label')}>
                      <Visibility
                        initialState={regularItem.visibility}
                        title={translate('items.update.tabs.visibility.titles.variable')}
                        onStateChanged={(visibility)=>setRegularItem(prev => {
                          return {...prev, visibility}
                        })}/>
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.excludedFromLoyaltyPoints.label')}>
                      <ItemLoyaltyTab excludedFromLoyaltyPoints={regularItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange}/>
                    </TabPanel>



                  </TabView>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <CardHeader>Actions</CardHeader>
            <div className={'d-flex gap-3 mt-2'}>
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
          </Card>
          {regularItem?.id &&  <AuditLogs entityId={regularItem?.id} />}
        </Col>
      </div>
    </form>
  );
};

export default RegularItemUpdate;
