import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Spinner, FormGroup, Table, Card, CardBody, CardHeader } from 'reactstrap';
import { getSortState, translate, Translate, ValidatedField } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button as PrimeButton } from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './combo-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IComboItem } from "app/shared/model/ITEM/restaurant/combo-item.model";
import { Steps } from "primereact/steps";
import { MenuItem } from "primereact/menuitem";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { InputNumber } from "primereact/inputnumber";
import ComboItemSelection from "app/entities/item/restaurant/combo-item/combo-item-selection";
import ComboItemAddonDropDown from "app/entities/item/restaurant/combo-item/combo-item-addon";
import { TabPanel, TabView } from "primereact/tabview";
import Visibility from "app/shared/Visibility/Visibility";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";
import { preventEnterSubmit } from "app/shared/util/form-utils";
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { InputTextarea } from 'primereact/inputtextarea';
import SharedAddon from 'app/shared/components/item/addon';


export const ComboItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const comboItemEntity: IComboItem = useAppSelector(state => state.comboItem.entity);
  const loading = useAppSelector(state => state.comboItem.loading);
  const updating = useAppSelector(state => state.comboItem.updating);
  const updateSuccess = useAppSelector(state => state.comboItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [comboItem, setComboItem] = useState<IComboItem>({});

  const [isModalOpen, setIsModalOpen] = useState(false);



  const toggleModal = () => {
    setIsModalOpen((prevState) => !prevState)
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setComboItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);



  const handleComboVariantChange = (fieldName, value) => {
    setComboItem((prev) => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev?.variants?.[0] ? prev.variants[0] : {}),
          [fieldName]: value,
        }
      ]
    }))
  };


  const handleBranchPriceChange = (variantIndex = 0, branchId, priceType, price) => {
    setComboItem(prev => ({
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

  const handleAddItems = (selectedVariants) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: [
            ...(comboItem.variants?.[0]?.comboPackages || []),
            ...selectedVariants,
          ],
        },
      ],
    };

    setComboItem(updatedComboItem);
    toggleModal();
  };


  const handleComboAmountChange = (index, newAmount) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === index) {
              return {
                ...comboPackage,
                amount: newAmount,
              };
            }
            return comboPackage;
          }),
        },
      ],
    };
    setComboItem(updatedComboItem)
  }

  const handleAddComboAddon = (index, addon) => {
    const newComboAddon = {
      addon,
      amount: 1
    }
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === index) {
              return {
                ...comboPackage,
                addons: [...(comboPackage.addons || []), newComboAddon],
              };
            }
            return comboPackage;
          }),
        },
      ],
    };
    setComboItem(updatedComboItem);
  };

  const handleAddonAmountChange = (packageIndex, addonIndex, action) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === packageIndex) {
              return {
                ...comboPackage,
                addons: comboPackage.addons?.map((addon, j) => {
                  if (j === addonIndex) {
                    return {
                      ...addon,
                      amount: action === 'increment' ? addon.amount + 1 : Math.max(addon.amount - 1, 0),
                    };
                  }
                  return addon;
                }),
              };
            }
            return comboPackage;
          }),
        },
      ],
    };

    setComboItem(updatedComboItem);
  };

  const handleDeleteComboAddon = (packageIndex, addonIndex) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === packageIndex) {
              return {
                ...comboPackage,
                addons: comboPackage.addons.filter((_, j) => j !== addonIndex), // Remove the selected addon
              };
            }
            return comboPackage;
          }),
        },
      ],
    };

    setComboItem(updatedComboItem);
  };

  const handleDeleteComboPackage = (index) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages.filter((_, i) => i !== index),
        },
      ],
    };

    setComboItem(updatedComboItem);
  };

  const handleNavigate = (comboItemId) => {
    navigate(`/restaurant/combo/${comboItemId}/edit` + location.search);
  };

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/combo");
    }
  }

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
    setComboItem({
      ...comboItemEntity,
    })
  }, [comboItemEntity, updateSuccess]);

  const handleHideItemPerBranch = (branchId, variantIndex, field: 'hideItem' | 'hideOnline') => {
    setComboItem(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId],
            [field]: !prev?.variants?.[variantIndex]?.branchVariantDetails?.[branchId]?.[field],
          },
        },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };


  const saveEntity = (e, createNew = false, clone = false) => {
    e.preventDefault();
    const entity = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants[0] && comboItem.variants[0]),
          name: comboItem.name
        },
      ],
    };
    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          reset()
          setComboItem({
            itemType: "RESTAURANT",
          })
        } else {
          const payload = res?.payload as any;
          const newProductId = payload?.data?.id;

          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
          }));
          if (clone) {
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/restaurant/combo/${newProductId}/edit`)
              }
            });
          }
          // @ts-expect-error -- unknown type
          if (!res?.error) {
            handleNavigate(newProductId)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (clone) {
          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
          }));
          dispatch(createEntity(entityWithoutId)).then(res => {
            const payload = res?.payload as any;
            const newProductId = payload?.data?.id;

            // @ts-expect-error -- unknown type
            if (!res?.error) {
              navigate(`/restaurant/combo/${newProductId}/edit`)
            }
          });
        }
        if (createNew) {
          navigate(`/restaurant/combo/new`)
        }
      })
    }
  };


  if (loading) {
    return <Spinner />
  }

  return (
    <form onKeyDown={preventEnterSubmit}>
      <div className={"d-flex row"}>
        <Col md={9}>
          <Card>
            <TabView>
              <TabPanel header={translate('items.update.tabs.details.label')}>
                <div className='w-100'>
                  <div className='text-xl font-semibold'>
                    {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.combo'}>Create New Combo Item</Translate> : <span>Edit {comboItem.name}</span>}
                  </div>
                </div>
                <Row>
                  <FormGroup className={`${isNew ? "d-flex bg-white" : ""}`}>

                    <div className={`d-flex flex-column p-3  bg-white w-100`} >

                      {isModalOpen ?
                        <ComboItemSelection
                          isOpen={isModalOpen}
                          onAddItems={handleAddItems}
                          toggleModal={toggleModal}
                          comboPackages={comboItem?.variants?.[0]?.comboPackages}
                        />
                        : null}

                      <SharedItemUpdate
                        item={comboItem}
                        onFieldChange={handleFieldChange}
                      />

                      <Row>
                        <Col md="12">
                          <div className={'d-flex flex-column gap-1'}>
                            <label className={'font-semibold'}>
                              <Translate contentKey={'items.update.description'}>Description</Translate>
                            </label>
                            <InputTextarea
                              name="desc"
                              id="desc"
                              placeholder={translate('items.update.description')}
                              value={comboItem?.variants?.[0]?.description || ''}
                              onChange={e => setComboItem(prev => {
                                return {
                                  ...prev, variants: prev.variants.map(variant => {
                                    return { ...variant, description: e.target.value }
                                  })
                                }
                              })}
                            />
                          </div>
                          <DiscountDropdown
                            discounts={comboItem?.variants?.[0]?.discounts}
                            handleChange={handleComboVariantChange}
                          />

                          <div className={"d-flex flex-column gap-2"}>
                            <label className={"font-semibold"}>
                              <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                            </label>
                            <Select
                              isClearable
                              value={comboItem?.variants?.[0]?.mixAndMatchRule || null}
                              options={mixAndMatchRuleList}
                              getOptionLabel={option => option.name}
                              getOptionValue={option => option.id}
                              onChange={(mixAndMatchRule) => handleComboVariantChange('mixAndMatchRule', mixAndMatchRule)}
                              onMenuOpen={() => {
                                dispatch(getMixAndMatchRules({
                                  page: paginationState.activePage - 1,
                                  size: paginationState.itemsPerPage,
                                  sort: `${paginationState.sort},${paginationState.order}`,
                                }));
                              }}
                            />
                          </div>
                        </Col>
                      </Row>

                      <Col md="4">
                        <div className={"d-flex flex-column gap-2 mt-3"}>
                          <label className={"font-semibold"}>
                            <Translate contentKey={'items.update.price'}>Price</Translate>
                          </label>
                          <InputNumber
                            name="price"
                            id="price"
                            required={true}
                            min={0}
                            maxFractionDigits={2}
                            placeholder={translate('items.update.placeholders.itemPrice')}
                            value={comboItem?.variants?.[0]?.price || null}
                            onChange={(e) => handleComboVariantChange("price", e.value)}
                          />
                        </div>
                      </Col>

                      <Col md="4">
                        <div className={"d-flex flex-column gap-2 mt-2"}>
                          <label className={"font-semibold"}>
                            <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                          </label>
                          <InputNumber
                            name="sale-price"
                            id="sale-price"
                            placeholder="Variant Sale Price"
                            min={0}
                            size={6}
                            maxFractionDigits={2}
                            value={comboItem?.variants?.[0]?.salePrice || null}
                            onChange={(e) => handleComboVariantChange('salePrice', e.value)}
                          />
                        </div>
                      </Col>

                      <VariantBranchPrice
                        branchVariantDetails={comboItem?.variants?.[0].branchVariantDetails}
                        branchList={branchList}
                        handleBranchPriceChange={handleBranchPriceChange}
                        variantIndex={0}
                        itemVariantType={"RESTAURANT"}
                        handleHideItemPerBranch={handleHideItemPerBranch}
                        variant={comboItem?.variants?.[0]}
                        setItem={setComboItem}
                      />

                      <Row>
                        <FormGroup>
                          <h3><Translate contentKey={'items.update.combo.title'}>Combo</Translate></h3>
                          <div className="d-flex justify-content-end mr-4">
                            <PrimeButton type={"button"} color="primary" onClick={toggleModal}>
                              <Translate contentKey={'items.update.combo.addItem'}>Add Item</Translate>
                            </PrimeButton>
                          </div>
                          <Table>
                            <thead>
                              <tr>
                                <th><Translate contentKey={'items.update.combo.itemName'}>Item Name</Translate></th>
                                <th><Translate contentKey={'items.update.combo.itemVariants'}>Item Variants</Translate></th>
                                <th><Translate contentKey={'items.update.combo.quantity'}>Quantity</Translate></th>
                                <th><Translate contentKey={'items.update.combo.addons'}>Addons</Translate></th>
                                <th><Translate contentKey={'items.update.combo.delete'}>Delete</Translate></th>
                              </tr>
                            </thead>
                            <tbody>
                              {comboItem?.variants?.[0]?.comboPackages?.map((comboPackage: any, index) => {
                                console.log(comboPackage, 'comboPackagecomboPackage')
                                return (
                                  <tr key={index}>
                                    <td><p>{comboPackage.item?.name}
                                      {comboPackage?.pizzaPackage ?
                                        <div className={"d-flex"}>
                                          <span className="text-sm mb-0">{comboPackage?.pizzaPackage?.pizzaSize?.name}&nbsp;</span>
                                          <span className="text-sm mb-0">{comboPackage?.pizzaPackage?.crustType?.name}&nbsp;</span>
                                          <span className="text-sm mb-0">{comboPackage?.pizzaPackage?.crustThickness?.name}</span>
                                        </div>
                                        : null}
                                    </p></td>
                                    <td>{comboPackage?.variant?.name}</td>
                                    <td>
                                      <InputNumber
                                        name={`quantity_${comboPackage?.variant?.id}`}
                                        placeholder={translate('items.update.combo.quantityPlaceholder', { variantName: comboPackage?.variant?.name })}
                                        value={comboPackage.amount || null}
                                        min={0}
                                        onChange={(e) => handleComboAmountChange(index, e.value)}
                                      />
                                    </td>
                                    <td>
                                      <div>
                                        <ComboItemAddonDropDown
                                          itemAddons={comboPackage.item?.addons}
                                          variantAddons={comboPackage?.variant?.addons}
                                          selectedComboAddons={comboPackage?.addons}
                                          onIncrement={(addonIndex) => handleAddonAmountChange(index, addonIndex, "increment")}
                                          onDecrement={(addonIndex) => handleAddonAmountChange(index, addonIndex, "decrement")}
                                          onAddAddon={(addon) => handleAddComboAddon(index, addon)}
                                          onDeleteAddon={(addonIndex) => handleDeleteComboAddon(index, addonIndex)}
                                        />
                                      </div>
                                    </td>
                                    <td>
                                      <PrimeButton
                                        type={"button"}
                                        severity='danger'
                                        onClick={() => handleDeleteComboPackage(index)}
                                      >
                                        <Translate contentKey={'items.update.combo.delete'}>Delete</Translate>
                                      </PrimeButton>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </Table>
                          <Row>
                            <Col>
                              <CustomDefinitionValuesWrapper
                                entityId={comboItem.id}
                                entityType={CustomDefinitionEntityType.ITEM}
                              />
                            </Col>
                          </Row>
                        </FormGroup>
                      </Row>
                    </div>
                  </FormGroup>
                </Row>
              </TabPanel>
              <TabPanel header={translate('items.update.tabs.addons.label')}>
                {comboItem ? <SharedAddon onFieldChange={handleFieldChange} addons={comboItem.addons || []} addonGroups={comboItem.addonGroups || []} item={comboItem} /> : null}
              </TabPanel>
              <TabPanel header={translate('items.update.tabs.visibility.label')}>
                <Visibility
                  initialState={comboItem.visibility}
                  title={translate('items.update.tabs.visibility.titles.combo')}
                  onStateChanged={(visibility) => setComboItem(prev => {
                    return { ...prev, visibility }
                  })}
                />
              </TabPanel>

              <TabPanel header={translate('items.update.tabs.excludedFromLoyaltyPoints.label')}>
                <ItemLoyaltyTab excludedFromLoyaltyPoints={comboItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
              </TabPanel>
            </TabView>
          </Card>
        </Col>
        <Col md={3} style={{
          position: 'sticky',
          top: '0',
          height: '90vh',
        }}>
          <Card>
            <CardHeader>Actions</CardHeader>
            <Row>
              <Row>
                <Col>
                  <PrimeButton
                    className='p-1 fs-6 w-100'
                    onClick={handleBackClick}
                    type={'button'}
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                    severity="secondary"
                  >
                    <span className="d-none d-md-inline">
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </span>
                  </PrimeButton>
                </Col>
                <Col>
                  <PrimeButton className='p-1 fs-6 w-100' onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </PrimeButton>
                </Col>
              </Row>
              <Row>
                <Col>
                  <PrimeButton className='p-1 fs-6 w-100' onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                  </PrimeButton>
                </Col>
                <Col>
                  <PrimeButton className='p-1 fs-6 w-100' onClick={(e) => saveEntity(e, false, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                  </PrimeButton>
                </Col>
              </Row>
            </Row>
          </Card>
          {comboItemEntity?.id && <AuditLogs entityId={comboItemEntity?.id} />}
        </Col>
      </div>
    </form>
  );
};

export default ComboItemUpdate;
