import React, { useState, useEffect, } from 'react';
import {useLocation,  useParams} from 'react-router-dom';
import {Button, Row, Col, Table, Input, FormGroup} from 'reactstrap';
import { getSortState,  Translate, translate, ValidatedField } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getRestaurantItemCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as  getRetailItemCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import {getEntities as getAddons} from "app/entities/addon/addon.reducer";
import { getEntities as getProductionCenters } from 'app/entities/location/production-center/production-center.reducer';
import { getEntities as getAccountingGroups } from 'app/entities/settings/accounting-groups/accounting-groups.reducer';
import {getEntities as getAddonGroups} from "app/entities/addon-groups/addon-groups.reducer";
import { ItemStatus } from 'app/shared/model/enumerations/item-status.model';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import {InputText} from "primereact/inputtext";
import Select, {ActionMeta, MultiValue} from "react-select";
import {IItem} from "app/shared/model/item.model";
import Attachment from "app/shared/layout/attachment/attachment";
import {Checkbox} from "primereact/checkbox";
import {IAddonGroups} from "app/shared/model/addon-groups.model";
import {cloneDeep} from "lodash";
import AddonImportModal from "app/entities/item/restaurant/regular-item/addon-import-modal";
import { getEntities as getRestaurantItems } from 'app/entities/item/restaurant/restaurant-item.reducer';

type OnFieldChangeFunction = (fieldName: string, value: any) => void;


export const SharedItemUpdate = ({item, onFieldChange}:{item: IItem, onFieldChange: OnFieldChangeFunction}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const isRestaurantItem = item?.itemType === "RESTAURANT";
  console.log(isRestaurantItem, 'isRestaurantItemisRestaurantItem')

  const isRetailItem = item?.itemType === "RETAIL";
  const isSimplePizza = isRestaurantItem && item?.variants?.[0]?.multiple === false;

  const itemCategoriesOptions =
    isRetailItem ? useAppSelector(state => state.retailCategory.entities) :
      useAppSelector(state => state.restaurantCategory.entities) ;

  const accountingGroupsOptions = useAppSelector(state => state.accountingGroups.entities);
  const addonsOptions = useAppSelector(state => state.addon.entities);
  const addonGroupsOptions = useAppSelector(state => state.addonGroups.entities);
  const productionCenterOptions = useAppSelector(state => state.productionCenter.entities);


  const removeImage = () => {
    const updatedItem = { ...item };
    updatedItem.attachments = [];
    onFieldChange('attachments', updatedItem.attachments);
  };

  const addImage = (newImage) => {
    const updatedItem = { ...item };
    updatedItem.attachments = [newImage];
    onFieldChange('attachments', updatedItem.attachments);
  };

  const handleCheckboxChange = (addonGroupIndex: number) => {
    const updatedAddonGroups = cloneDeep([...item.addonGroups]);
    updatedAddonGroups[addonGroupIndex].required = !updatedAddonGroups[addonGroupIndex].required;
    onFieldChange('addonGroups', updatedAddonGroups);
  };

  const handleAddonGroupChange = (selectedAddonGroups: MultiValue<{ id: string; name: string; }>, actionMeta: ActionMeta<{ id: string; name: string; }>) => {

    const existingAddonGroupsMap = new Map(item?.addonGroups?.map((group) => [group.addonGroup?.id, group]));

    const updatedAddonGroups = selectedAddonGroups.map((selectedGroup) => {
      const existingGroup = existingAddonGroupsMap.get(selectedGroup?.id);
      return {
        required: existingGroup ? existingGroup.required : false,
        addonGroup: selectedGroup,
      };
    });
    onFieldChange('addonGroups', updatedAddonGroups);
  };


  useEffect(() => {
    if (isRestaurantItem){
      dispatch(getRestaurantItemCategories({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));
      dispatch(
        getRestaurantItems({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
      dispatch(getAddonGroups({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }))
      dispatch(getAddons({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }))
    }else if(isRetailItem){
      dispatch(getRetailItemCategories({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));

    }
    dispatch(getProductionCenters({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getAccountingGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

  }, []);

  const [openedAddonModal, setOpenedAddonModal] = useState(false);
  const openImportAddonModal = () => {
    setOpenedAddonModal(true);
  };
  const restaurantItemsOptions = useAppSelector(state => state.restaurantItems.entities);

  const handleImportAddonModalSave = (option: IItem) => {
    const addons = item.addons || [];
    const extraAddons = option.addons;
    const uniqueIds = Array.from(new Set([...addons, ...extraAddons].map(item => item.id)));
    const mergedAddons = uniqueIds.map(id => [...addons, ...extraAddons].find(item => item.id === id));

    onFieldChange('addons', mergedAddons);
  };
  const handleImportAddonModalClose = () => {
    setOpenedAddonModal(false);
  };
  console.log(item, 'itemitem')

  return (
    <div>
      <Row >
              <FormGroup>
              <Row className={"my-3"} >
                {!isSimplePizza ? <Col md="6">
                  <div className={"d-flex flex-column gap-2"}>
                    <label className={"text-xl font-bold"}>
                    <Translate contentKey={"tempApp.item.name"}>Name</Translate>
                    </label>
                    <InputText
                      type="text"
                      name="name"
                      id="name"
                      required={true}
                      placeholder="Item Name"
                      value={item.name || ''}
                      onChange={(e) => onFieldChange('name', e.target.value)}
                    />
                  </div>
                </Col> : null}

                <Col md="6">
                  <div className={"d-flex flex-column gap-2"}>
                    <label className={"text-xl font-bold"}>
                    <Translate contentKey={"tempApp.item.desc"}>Description</Translate>
                    </label>
                    <InputText
                      type="text"
                      name="desc"
                      id="desc"
                      placeholder="Item Description"
                      value={item.desc || ''}
                      onChange={(e) => onFieldChange('desc', e.target.value)}
                    />
                  </div>
                </Col>
              </Row>

                <Row className={"my-3"} >
                <Col md="4">
                    <div className={"d-flex flex-column gap-2"}>
                      <label className={"text-xl font-bold"}>
                      <Translate contentKey="tempApp.item.productionCenter">Production Center</Translate>
                      </label>
                      <Select
                        value={item?.productionCenter}
                        options={productionCenterOptions}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        onChange={(productionCenter) => onFieldChange('productionCenter',productionCenter)}
                      />
                    </div>
                  </Col>

                  <Col md="4">
                    <div className={"d-flex flex-column gap-2"}>
                      <label className={"text-xl font-bold"}>
                      <Translate contentKey="tempApp.item.terms">Category</Translate>
                      </label>
                      <Select
                        value={item?.categories}
                        isMulti={true}
                        options={itemCategoriesOptions}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        onChange={(selectedItemTerms) => onFieldChange('categories',selectedItemTerms)}
                      />
                    </div>
                  </Col>

                  <Col md="4">
                    <div className={"d-flex flex-column gap-2"}>
                      <label className={"text-xl font-bold"}>
                      <Translate contentKey="tempApp.item.accountingGroups">Accounting Groups</Translate>
                      </label>
                      <Select
                        value={item?.accountingGroups}
                        options={accountingGroupsOptions}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        onChange={(accountingGroup) => onFieldChange('accountingGroups',[accountingGroup])}
                      />
                    </div>
                  </Col>
                </Row>
                <Row className={"my-3"} >
                  <Col md={"4"}>
                <div className={"d-flex my-3 gap-2"}>
                  <label className={"text-xl font-bold"}>
                    Excluded From Loyalty Points
                  </label>
                  <Checkbox
                    checked={item?.excludedFromLoyaltyPoints}
                    onChange={(e) => onFieldChange('excludedFromLoyaltyPoints', e.checked)}
                  />
                </div>
                  </Col>
                </Row>
                <Row className={"my-3"} >
                  <Col md={"6"}>
                <div className={"d-flex flex-column"}>
                  <label className={"text-xl mt-2 font-bold"}>

                  <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                    </label>
                    <Attachment
                      image={item?.attachments?.[0]}
                      onRemoveImage={removeImage}
                      onAddImage={addImage}
                    />
                  </div>
                  </Col>
                </Row>

                {isRestaurantItem ?
                  <>
                    {openedAddonModal && (
                      <AddonImportModal
                        showModal={openedAddonModal}
                        handleSave={handleImportAddonModalSave}
                        handleClose={handleImportAddonModalClose}
                        itemOptions={restaurantItemsOptions}
                      />
                    )}
                    <Row className={"my-3"}>
                    <Col md="6">
                      <div className={"d-flex flex-column gap-2"}>
                        <label className={"text-xl font-bold"}>
                        <Translate contentKey={"tempApp.item.addons"}>Addons</Translate>
                        </label>
                        <Select
                          value={item?.addons}
                          isMulti={true}
                          options={addonsOptions}
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          onChange={(selectedAddons) => onFieldChange('addons', selectedAddons)}
                        />
                      </div>
                    </Col>
                    <Col md={'6'}>
                      <div className={'d-flex flex-column gap-2 flex-start'}>
                        <label className={"text-xl font-bold"}>
                          <Translate contentKey={'tempApp.item.importAddons'}>Addons</Translate>
                        </label>
                        <div>
                          <Button onClick={openImportAddonModal}> Import Addons</Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                    <Row>
                      <div className="mt-2">

                        <label className={"text-xl font-bold"}>
                          Addon Groups
                        </label>
                        <div className="col-md-6">
                          <Select
                            isMulti={true}
                            value={item?.addonGroups?.map((group) => ({
                              id: group.addonGroup?.id,
                              name: group.addonGroup?.name
                            }))}
                            getOptionLabel={option => option?.name}
                            getOptionValue={option => option?.id}
                            options={addonGroupsOptions}
                            onChange={handleAddonGroupChange}
                          />
                        </div>
                        <Table>
                          <thead>
                          <tr>
                            <th>Name</th>
                            <th>Required</th>
                          </tr>
                          </thead>
                          <tbody>
                          {item?.addonGroups?.map((group, index) => (
                            <tr key={index}>
                              <td>{group?.addonGroup?.name}</td>
                              <td>
                                <Checkbox
                                  checked={group?.required}
                                  onChange={(e) => handleCheckboxChange(index)}
                                />
                              </td>
                            </tr>
                          ))}
                          </tbody>
                        </Table>
                      </div>
                    </Row>
                  </>
                : null}
              </FormGroup>
      </Row>
    </div>
  );
};

export default SharedItemUpdate;
