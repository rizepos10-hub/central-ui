import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Spinner, FormGroup, Card, CardBody, CardHeader } from 'reactstrap';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'primereact/dropdown';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button as PrimeButton } from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './giftcard-item.reducer';
import SharedVirtualItemUpdate from "app/shared/components/item/shared-virtual-update";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";

import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import Visibility from 'app/shared/Visibility/Visibility';
import { TabPanel, TabView } from "primereact/tabview";
import AuditLogs from "app/shared/components/logs/audit-logs";
import { IGiftCardItem } from 'app/shared/model/ITEM/virtual/giftcard-item.model';


const defaultItemPriceNumber = {
  "PRICE_1": null,
  "PRICE_2": null,
  "PRICE_3": null,
  "PRICE_4": null,
  "PRICE_5": null,
};


export const GiftCardItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const giftCardItemEntity = useAppSelector(state => state.GiftCardItem.entity);
  const giftCardsCouponEntities = useAppSelector(state => state.GiftCardCoupon.entities);
  const loading = useAppSelector(state => state.GiftCardItem.loading);
  const updating = useAppSelector(state => state.GiftCardItem.updating);
  const updateSuccess = useAppSelector(state => state.GiftCardItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [giftCardItem, setGiftCardItem] = useState<IGiftCardItem>({
    itemType: "VIRTUAL",
    itemVariantType: ItemVariantType.VIRTUAL_GIFTCARD,
    variants: [{
      branchVariantDetails: {},
    }]
  });

  const findGiftCardById = (id) => {
    return giftCardsCouponEntities.find((giftCard) => giftCard.id === id);
  };


  const [selectedGiftCard, setSelectedGiftCard] = useState(giftCardItem?.variants ? giftCardItem?.variants[0]?.giftCard: null);

  const handleGiftCardChange = (selectedOption) => {
    setSelectedGiftCard(selectedOption);
    handleGiftCardItemVariantChange("giftCard", findGiftCardById(selectedOption));
  };
  
  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/product");
    }
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    setGiftCardItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleGiftCardItemVariantChange = (fieldName, value) => {
    setGiftCardItem((prev) => {
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

  const handleNavigate = (giftCardItemId) => {
    navigate(`/gift-cards/${giftCardItemId}/edit` + location.search);
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


  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      setGiftCardItem(giftCardItemEntity);
    }

    const giftCardItemId = giftCardItemEntity?.id;
    if (updateSuccess) {
      handleNavigate(giftCardItemId);
    }
  }, [giftCardItemEntity?.id, updateSuccess]);


  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...giftCardItem,
      variants: [
        {
          ...(giftCardItem.variants && giftCardItem.variants[0] && giftCardItem.variants[0]),
          name: giftCardItem.name
        },
      ],
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  if (loading) {
    return <Spinner />
  }

  return (
    <form onSubmit={saveEntity}>
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
                          {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.giftcard'}>Create New Gift Card Item</Translate> : <span>Edit {giftCardItem.name}</span>}
                        </div>
                      </div>

                      <Row>

                        <FormGroup className={`${isNew ? "d-flex bg-white" : ""}`}>

                          <Col md="12" className={`d-flex flex-column bg-white gap-1 p-1`} >

                            <SharedVirtualItemUpdate item={giftCardItem} onFieldChange={handleFieldChange} />

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
                                    value={giftCardItem?.variants?.[0]?.price}
                                    onChange={(e) => handleGiftCardItemVariantChange('price', e.value)}
                                  />
                                </div>
                              </Col>
                            </Row>

                          </Col>
                        </FormGroup>


                      </Row>
                    </TabPanel>
                    <TabPanel header={translate('items.update.tabs.visibility.label')}>
                      <Visibility
                        initialState={giftCardItem.visibility}
                        title={translate('items.update.tabs.visibility.titles.giftCard')}
                        onStateChanged={(state) => setGiftCardItem(prev => {
                          return { ...prev, visibility: state }
                        })} />
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
              <PrimeButton color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </PrimeButton>
            </div>
          </Card>
          {giftCardItemEntity?.id && <AuditLogs entityId={giftCardItemEntity?.id} />}
        </Col>

      </div>
    </form>
  );
};

export default GiftCardItemUpdate;
