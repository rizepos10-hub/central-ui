import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, Spinner, FormGroup, Table, Card, CardBody} from 'reactstrap';
import {getSortState, translate, Translate, ValidatedField} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import {Button as PrimeButton} from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './combo-item.reducer';
import SharedItemUpdate from "app/shared/layout/item/shared-item-update";
import {IComboItem} from "app/shared/model/ITEM/restaurant/combo-item.model";
import {Steps} from "primereact/steps";
import {MenuItem} from "primereact/menuitem";
import Select from "react-select";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {InputNumber} from "primereact/inputnumber";
import ComboItemSelection from "app/entities/item/restaurant/combo-item/combo-item-selection";
import ComboItemAddonDropDown from "app/entities/item/restaurant/combo-item/combo-item-addon";
import {TabPanel, TabView} from "primereact/tabview";
import Visibility from "app/shared/Visibility/Visibility";


export const ComboItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const comboItemEntity = useAppSelector(state => state.comboItem.entity);
  const loading = useAppSelector(state => state.comboItem.loading);
  const updating = useAppSelector(state => state.comboItem.updating);
  const updateSuccess = useAppSelector(state => state.comboItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [comboItem, setComboItem] = useState<IComboItem>({
    itemType: "RESTAURANT",
  });

  const [isModalOpen, setIsModalOpen] = useState(false)



  const toggleModal = () => {
    setIsModalOpen((prevState) => !prevState)
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setComboItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);

  const handlePriceChange = (price) => {
    setComboItem((prev) => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev?.variants?.[0] ? prev.variants[0] : {}),
          price
        }
      ]
    }))
  }


  const handleBranchPriceChange = (branchId, price) => {
    setComboItem(prev => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev?.variants?.[0] ? prev.variants[0] : {}),
          branchVariantDetails: {
            ...prev.variants?.[0]?.branchVariantDetails,
            [branchId]: {
              branch: branchList.find(branch => branch.id === branchId),
              price,
              salePrice: prev.variants?.[0]?.branchVariantDetails?.[branchId]?.salePrice || 0,
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
    if(isNew){
      dispatch(reset())
    }else{
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))

  },[id, isNew]);

  useEffect(() => {

    if(!isNew){
      setComboItem(comboItemEntity);
    }else{
      setComboItem({
        ...comboItemEntity,
        itemType: "RESTAURANT",
        itemVariantType: "RESTAURANT_COMBO",

      })
    }
    const comboItemId = comboItemEntity?.id
    if(updateSuccess){
      console.log("helloooo")
      handleNavigate(comboItemId);
    }

  }, [comboItemEntity, updateSuccess]);


  const saveEntity = e => {
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
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
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
                        {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.combo'}>Create New Combo Item</Translate> : <Translate contentKey={'items.update.tabs.details.titles.edit.combo'}>Edit Combo Item</Translate>}
                      </h2>
                    </Col>
                  </Row>
                  <Row>
                    <FormGroup  className={`${isNew ? "d-flex bg-white mt-3" : ""}`}>

                      <Col md="8" className={`d-flex flex-column p-3  bg-white mt-3 `} >

                        {isModalOpen ?<ComboItemSelection
                          isOpen={isModalOpen}
                          onAddItems={handleAddItems}
                          toggleModal={toggleModal}
                          comboPackages={comboItem?.variants?.[0]?.comboPackages}
                        /> : null}

                        <SharedItemUpdate
                          item={comboItem}
                          onFieldChange={handleFieldChange}
                        />

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
                              placeholder={translate('items.update.placeholders.itemPrice')}
                              value={comboItem?.variants?.[0]?.price}
                              onChange={(e) => handlePriceChange(e.value)}
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
                            {branchList?.map(branch => (
                              <tr key={branch.id}>
                                <td>{branch.name}</td>
                                <td>
                                  <InputNumber
                                    name={`branchPrice_${branch.id}`}
                                    placeholder={translate('items.update.placeholders.itemBranchPrice', {branchName: branch.name})}
                                    onWheel={(e: any) => e.target.blur()}
                                    size={60}
                                    value={comboItem?.variants?.[0]?.branchVariantDetails?.[branch.id]?.price}
                                    onChange={e => handleBranchPriceChange(branch.id, e.value)}
                                  />
                                </td>
                              </tr>
                            ))}
                            </tbody>
                          </Table>
                        </Col>

                        <Row>
                          <FormGroup>
                            <h3><Translate contentKey={'items.update.combo.title'}>Combo</Translate></h3>
                            <div className="d-flex justify-content-end mr-4">
                              <Button color="primary" onClick={toggleModal}>
                                <Translate contentKey={'items.update.combo.addItem'}>Add Item</Translate>
                              </Button>
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
                                      {comboPackage?.pizzaPackage?
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
                                        placeholder={translate('items.update.combo.quantityPlaceholder', {variantName: comboPackage?.variant?.name})}
                                        value={comboPackage.amount}
                                        onChange={(e) => handleComboAmountChange(index, e.value)}
                                      />
                                    </td>
                                    <td>
                                      <div>
                                        <ComboItemAddonDropDown
                                          itemAddons={comboPackage.item?.addons}
                                          variantAddons={comboPackage?.variant?.addons}
                                          selectedComboAddons={comboPackage?.addons}
                                          onIncrement={(addonIndex) => handleAddonAmountChange(index, addonIndex,"increment")}
                                          onDecrement={(addonIndex) => handleAddonAmountChange(index, addonIndex,"decrement")}
                                          onAddAddon={(addon) => handleAddComboAddon(index, addon)}
                                          onDeleteAddon={(addonIndex) => handleDeleteComboAddon(index, addonIndex)}
                                        />
                                      </div>
                                    </td>
                                    <td>
                                      <Button
                                        color="danger"
                                        onClick={() => handleDeleteComboPackage(index)}
                                      >
                                        <Translate contentKey={'items.update.combo.delete'}>Delete</Translate>
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                              </tbody>
                            </Table>
                          </FormGroup>
                        </Row>
                      </Col>
                    </FormGroup>
                  </Row>
                </TabPanel>
                <TabPanel header={translate('items.update.tabs.visibility.label')}>
                  <Visibility
                    initialState={comboItem.visibility}
                    title={translate('items.update.tabs.visibility.titles.combo')}
                    onStateChanged={(visibility)=>setComboItem(prev => {
                      return {...prev, visibility}
                    })}
                  />
                </TabPanel>
              </TabView>
            </Col>
            <Col md={2}>
              <div className={"d-flex"}>
                <Button  id="cancel-save" data-cy="entityCreateCancelButton" onClick={handleBackClick} replace
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

export default ComboItemUpdate;
