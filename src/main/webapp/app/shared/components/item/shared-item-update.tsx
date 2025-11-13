import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSortState, Translate, translate, ValidatedField } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getRestaurantItemCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailItemCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntities as getProductionCenters } from 'app/entities/location/production-center/production-center.reducer';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { ItemStatus } from 'app/shared/model/ENUMS/item-status.model';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import Select from 'app/shared/components/select/select';
import { IItem } from 'app/shared/model/ITEM/item.model';
import Attachment from 'app/shared/components/attachment/attachment';
import { cloneDeep } from 'lodash';
import AddonImportModal from './addon-import-modal';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import DiscountDropdown from 'app/shared/components/item/discount-dropdown';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import MediaLibrary from '../media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { getEntities as getBrands } from 'app/entities/brand/brand.reducer';
import SharedAddon from 'app/shared/components/item/addon';
import { ItemVariantType } from 'app/shared/model/ENUMS/item-variant-type.model';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type OnFieldChangeFunction = (fieldName: string, value: any) => void;

type SharedItemProps = {
  item: IItem;
  onFieldChange: OnFieldChangeFunction;
  defaultPrice?: number;
  setDefaultPrice?: (price: number) => void;
  showFormErrors?: boolean;
};

export const SharedItemUpdate = ({ item, onFieldChange, defaultPrice, setDefaultPrice, showFormErrors }: SharedItemProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const isRestaurantItem = item?.itemType === 'RESTAURANT';
  const isVariableItem = item?.itemVariantType === 'RESTAURANT_VARIABLE' || item?.itemVariantType === 'RETAIL_VARIABLE';
  const isRetailVariable = item?.itemVariantType === ItemVariantType.RETAIL_VARIABLE;
  const isRetailItem = item?.itemType === 'RETAIL';
  const isSimplePizza = isRestaurantItem && item?.variants?.[0]?.multiple === false;
  const isPredefinedPizza = item?.variants?.[0]?.pizzaVariantType === 'PREDEFINED';
  const isComboItem = item?.itemVariantType === 'RESTAURANT_COMBO';

  const itemCategoriesOptions = isRetailItem
    ? useAppSelector(state => state.retailCategory.entities)
    : useAppSelector(state => state.restaurantCategory.entities);

  const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);
  const tags = useAppSelector(state => state.tag.entities);
  const brands = useAppSelector(state => state.brand.entities);
  const productionCenterOptions = useAppSelector(state => state.productionCenter.entities);
  const discountList = useAppSelector(state => state.discount.entities);

  const removeImage = () => {
    onFieldChange('attachments', []);
  };

  const addImage = files => {
    onFieldChange('attachments', transformAttachmentStructure(files, 'toIAttachment'));
  };

  useEffect(() => {
    dispatch(
      getTags({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getDiscounts({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(
      getProductionCenters({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(
      getProfileGroups({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  useEffect(() => {
    if (isVariableItem) {
      dispatch(
        getDiscounts({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }

    if (isRestaurantItem) {
      dispatch(
        getRestaurantItemCategories({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
      dispatch(getAddonGroups({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
      );

    } else if (isRetailItem) {
      dispatch(
        getRetailItemCategories({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );

      dispatch(
        getBrands({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  }, [isRestaurantItem, isRetailItem, isVariableItem]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-semibold">
            <Translate contentKey={'items.update.name'}>Name</Translate>
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            required={true}
            placeholder={translate('items.update.placeholders.itemName')}
            value={item.name || ''}
            onChange={e => onFieldChange('name', e.target.value)}
            className={`h-8 text-xs ${showFormErrors && !item.name ? 'border-destructive' : ''}`}
          />
        </div>

        {!item.askForPrice && !isPredefinedPizza && !isComboItem && (
          <div className="space-y-2">
            <Label htmlFor="price" className="text-xs font-semibold">
              {isRetailVariable ? 'Default Price' : 'Price'}
            </Label>
            <Input
              type="number"
              name="price"
              id="price"
              required={true}
              min={0}
              step={0.01}
              placeholder={translate('items.update.placeholders.itemPrice')}
              value={defaultPrice ?? ''}
              onChange={e => {
                console.log(e.target.value)
                setDefaultPrice(parseFloat(e.target.value) ?? 0);
              }}
              className={`h-8 text-xs ${showFormErrors && !item?.variants?.[0]?.price ? 'border-destructive' : ''}`}
            />
          </div>
        )}

        {(item?.itemVariantType === ItemVariantType.RETAIL_SIMPLE || item?.itemVariantType === ItemVariantType.RESTAURANT_VARIABLE) && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              <Translate contentKey={'items.update.askForPrice'}>Ask for Price</Translate>
            </Label>
            <div className="flex items-center">
              <Checkbox
                checked={item?.askForPrice || false}
                onCheckedChange={(checked) => onFieldChange('askForPrice', checked)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc" className="text-xs font-semibold">
          <Translate contentKey={'items.update.shortDescription'}>Short Description</Translate>
        </Label>
        <Textarea
          name="desc"
          id="desc"
          placeholder={translate('items.update.placeholders.shortDescription')}
          value={item.desc || ''}
          onChange={e => onFieldChange('desc', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.stopPropagation();
            }
          }}
          rows={5}
          className="text-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.productionCenter">Production Center</Translate>
          </Label>
          <Select
            value={item?.productionCenter || null}
            options={productionCenterOptions}
            isClearable
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            onChange={productionCenter => onFieldChange('productionCenter', productionCenter)}
            onMenuOpen={() => {
              dispatch(
                getProductionCenters({
                  page: paginationState.activePage - 1,
                  size: paginationState.itemsPerPage,
                  sort: `${paginationState.sort},${paginationState.order}`,
                })
              );
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.profileGroups">Profile Groups</Translate>
          </Label>
          <Select
            value={item?.accountingGroups || []}
            isClearable
            options={profileGroupsOptions}
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            onChange={profileGroup => onFieldChange('accountingGroups', profileGroup ? [profileGroup] : [])}
            onMenuOpen={() => {
              dispatch(
                getProfileGroups({
                  page: paginationState.activePage - 1,
                  size: paginationState.itemsPerPage,
                  sort: `${paginationState.sort},${paginationState.order}`,
                })
              );
            }}
          />
        </div>

        {isVariableItem ? (
          <div>
            <DiscountDropdown discounts={item?.discounts} handleChange={onFieldChange} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.categories">Categories</Translate>
          </Label>
          <Select
            value={item?.categories || []}
            isMulti={true}
            options={itemCategoriesOptions}
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            onChange={selectedItemTerms => onFieldChange('categories', selectedItemTerms)}
            onMenuOpen={() => {
              if (isRestaurantItem) {
                dispatch(
                  getRestaurantItemCategories({
                    page: paginationState.activePage - 1,
                    size: paginationState.itemsPerPage,
                    sort: `${paginationState.sort},${paginationState.order}`,
                  })
                )
              } else {
                dispatch(
                  getRetailItemCategories({
                    page: paginationState.activePage - 1,
                    size: paginationState.itemsPerPage,
                    sort: `${paginationState.sort},${paginationState.order}`,
                  })
                )
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.tags">Tags</Translate>
          </Label>
          <Select
            value={item?.tags || []}
            isMulti={true}
            options={tags}
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            onChange={selectedTags => onFieldChange('tags', selectedTags)}
            onMenuOpen={() => {
              dispatch(
                getTags({
                  page: paginationState.activePage - 1,
                  size: paginationState.itemsPerPage,
                  sort: `${paginationState.sort},${paginationState.order}`,
                })
              );
            }}
          />
        </div>
      </div>

      {item?.itemVariantType !== ItemVariantType.RESTAURANT_PIZZA && item?.variants?.length === 1 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey={'items.update.byWeight'}>By Weight</Translate>
          </Label>
          <div className="flex items-center">
            <Checkbox checked={item?.byWeight ? true : false} onCheckedChange={checked => onFieldChange('byWeight', checked)} />
          </div>
        </div>
      )}

      {isRetailItem ? (
        <div className="space-y-2 md:w-1/2">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.brand">brand</Translate>
          </Label>
          <Select
            value={item?.brand || null}
            isClearable
            options={brands}
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            onChange={brand => onFieldChange('brand', brand)}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-xs font-semibold">
          <Translate contentKey={'items.update.image'}>Image</Translate>
        </Label>
        <MediaLibrary
          multiSelect={true}
          handleFilesSelectCallback={files => addImage(files)}
          defaultValues={transformAttachmentStructure(item?.attachments, 'toFileLibraryListItem')}
        />
      </div>
    </div>
  );
};

export default SharedItemUpdate;
