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
import { getEntities as getAccountingGroups } from 'app/entities/settings/accounting-group/accounting-group.reducer';
import {getEntities as getAddonGroups} from "app/entities/addon-groups/addon-groups.reducer";
import { ItemStatus } from 'app/shared/model/ENUMS/item-status.model';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import {InputText} from "primereact/inputtext";
import Select, {ActionMeta, MultiValue} from "react-select";
import {IItem} from "app/shared/model/ITEM/item.model";
import Attachment from "app/shared/components/attachment/attachment";
import {Checkbox} from "primereact/checkbox";
import {cloneDeep} from "lodash";
import AddonImportModal from "./addon-import-modal";
import { getEntities as getRestaurantItems } from 'app/entities/item/restaurant/restaurant-item.reducer';
import {InputTextarea} from "primereact/inputtextarea";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";

type OnFieldChangeFunction = (fieldName: string, value: any) => void;

type SharedItemProps = {
  item: IItem,
  onFieldChange: OnFieldChangeFunction,
}


export const SharedItemUpdate = ({item, onFieldChange}: SharedItemProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const isRestaurantItem = item?.itemType === "RESTAURANT";
  const isVariableItem = item?.itemVariantType === "RESTAURANT_VARIABLE" || item?.itemVariantType === "RETAIL_VARIABLE";

  const isRetailItem = item?.itemType === "RETAIL";
  const isSimplePizza = isRestaurantItem && item?.variants?.[0]?.multiple === false;

  const itemCategoriesOptions =
    isRetailItem ? useAppSelector(state => state.retailCategory.entities) :
      useAppSelector(state => state.restaurantCategory.entities) ;

  const accountingGroupsOptions = useAppSelector(state => state.accountingGroup.entities);
  const addonsOptions = useAppSelector(state => state.addon.entities);
  const addonGroupsOptions = useAppSelector(state => state.addonGroups.entities);
  const productionCenterOptions = useAppSelector(state => state.productionCenter.entities);
  const discountList = useAppSelector(state => state.discount.entities);


  const removeImage = () => {
    onFieldChange('attachments', []);
  };

  const addImage = (newImage) => {
    onFieldChange('attachments', [newImage]);
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

    if(isVariableItem){
      dispatch(getDiscounts({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));
    }

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

    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

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
    const uniqueAddonIds = Array.from(new Set([...addons, ...extraAddons].map(addon => addon.id)));
    const mergedAddons = uniqueAddonIds.map(id => [...addons, ...extraAddons].find(addon => addon.id === id));

    const addonGroups = item.addonGroups || [];
    const extraAddonGroups = option.addonGroups;
    const uniqueAddonGroupIds = Array.from(new Set([...addonGroups, ...extraAddonGroups]));
    const mergedAddonGroups = uniqueAddonGroupIds.map(id => [...addonGroups, ...extraAddonGroups].find(addonGroup => addonGroup.addonGroup.id === id));

    onFieldChange('addonGroups', mergedAddonGroups);
    onFieldChange('addons', mergedAddons);
  };

  const handleImportAddonModalClose = () => {
    setOpenedAddonModal(false);
  };
  console.log(item, 'itemitem')

  return (
    <div>
      <Row>
        <FormGroup className={'d-flex flex-column gap-3'}>
          <Col md="7">
          {!isSimplePizza ? (
              <div className={'d-flex flex-column gap-2 mt-2'}>
                <label className={'text-xl font-bold'}>
                  <Translate contentKey={'items.update.name'}>Name</Translate>
                </label>
                <InputText
                  type="text"
                  name="name"
                  id="name"
                  required={true}
                  placeholder={translate('items.update.placeholders.itemName')}
                  value={item.name || ''}
                  onChange={e => onFieldChange('name', e.target.value)}
                />
              </div>
          ) : null}

            <div className={'d-flex flex-column gap-2 mt-2'}>
              <label className={'text-xl font-bold'}>
                <Translate contentKey={'items.update.description'}>Description</Translate>
              </label>
              <InputTextarea
                name="desc"
                id="desc"
                placeholder={translate('items.update.placeholders.itemDescription')}
                value={item.desc || ''}
                onChange={e => onFieldChange('desc', e.target.value)}
              />
            </div>

            <div className={'d-flex flex-column gap-2 mt-2'}>
              <label className={'text-xl font-bold'}>
                <Translate contentKey="items.update.productionCenter">Production Center</Translate>
              </label>
              <Select
                value={item?.productionCenter}
                options={productionCenterOptions}
                isClearable
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                onChange={productionCenter => onFieldChange('productionCenter', productionCenter)}
              />
            </div>

            <div className={'d-flex flex-column gap-2 mt-2'}>
              <label className={'text-xl font-bold'}>
                <Translate contentKey="items.update.categories">Categories</Translate>
              </label>
              <Select
                value={item?.categories}
                isMulti={true}
                options={itemCategoriesOptions}
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                onChange={selectedItemTerms => onFieldChange('categories', selectedItemTerms)}
              />
            </div>

            <div className={'d-flex flex-column gap-2 mt-2'}>
              <label className={'text-xl font-bold'}>
                <Translate contentKey="items.update.accountingGroups">Accounting Groups</Translate>
              </label>
              <Select
                value={item?.accountingGroups}
                isClearable
                options={accountingGroupsOptions}
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                onChange={accountingGroup => onFieldChange('accountingGroups', accountingGroup ? [accountingGroup] : [])}
              />
            </div>

          {isVariableItem ?
              <DiscountDropdown
                discounts={item?.discounts}
                handleChange={onFieldChange}
              />
         : null}

          <Row className={'my-3'}>
            <Col md={'7'}>
              <div className={'d-flex flex-column mt-2'}>
                <label className={'text-xl mt-2 font-bold'}>
                  <Translate contentKey={'items.update.image'}>Image</Translate>
                </label>
                <Attachment image={item?.attachments?.[0]} onRemoveImage={removeImage} onAddImage={addImage} />
              </div>
            </Col>
          </Row>

          {isRestaurantItem ? (
            <>
              {openedAddonModal && (
                <AddonImportModal
                  showModal={openedAddonModal}
                  handleSave={handleImportAddonModalSave}
                  handleClose={handleImportAddonModalClose}
                  itemOptions={restaurantItemsOptions}
                />
              )}
              <Row className={'my-3'}>
                  <div className={'d-flex flex-column gap-2 mt-2'}>
                    <label className={'text-xl font-bold'}>
                      <Translate contentKey={'items.update.addons'}>Addons</Translate>
                    </label>
                    <Select
                      value={item?.addons}
                      isMulti={true}
                      options={addonsOptions}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={selectedAddons => onFieldChange('addons', selectedAddons)}
                    />
                  </div>
                  <div className={'d-flex flex-column gap-2 flex-start mt-3'}>
                    <label className={'text-xl font-bold'}>
                      <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
                    </label>
                    <div>
                      <Button onClick={openImportAddonModal}>
                        <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
                      </Button>
                    </div>
                  </div>
              </Row>
              <Row>
                <div className="mt-2">
                  <label className={'text-xl font-bold'}>
                    <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
                  </label>
                  <div className="col-md-6">
                    <Select
                      isMulti={true}
                      value={item?.addonGroups?.map(group => ({
                        id: group.addonGroup?.id,
                        name: group.addonGroup?.name,
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
                        <th>
                          <Translate contentKey={'items.update.name'}>Name</Translate>
                        </th>
                        <th>
                          <Translate contentKey={'items.update.required'}>Required</Translate>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item?.addonGroups?.map((group, index) => (
                        <tr key={index}>
                          <td>{group?.addonGroup?.name}</td>
                          <td>
                            <Checkbox checked={group?.required} onChange={e => handleCheckboxChange(index)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Row>
            </>
          ) : null}
          </Col>
        </FormGroup>
      </Row>
    </div>
  );
};

export default SharedItemUpdate;
