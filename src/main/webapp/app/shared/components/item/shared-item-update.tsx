import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button, Row, Col, Table, Input, FormGroup } from 'reactstrap';
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
import { InputText } from 'primereact/inputtext';
import Select, { ActionMeta, MultiValue } from 'react-select';
import { IItem } from 'app/shared/model/ITEM/item.model';
import Attachment from 'app/shared/components/attachment/attachment';
import { Checkbox } from 'primereact/checkbox';
import { cloneDeep } from 'lodash';
import AddonImportModal from './addon-import-modal';
import { InputTextarea } from 'primereact/inputtextarea';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import DiscountDropdown from 'app/shared/components/item/discount-dropdown';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import MediaLibrary from '../media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { getEntities as getBrands } from 'app/entities/brand/brand.reducer';
import SharedAddon from 'app/shared/components/item/addon';
import { ItemVariantType } from 'app/shared/model/ENUMS/item-variant-type.model';
import { InputNumber } from 'primereact/inputnumber';

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
    <div>
      {/* Basic Information Section */}
      <div className="mb-4">
        <h2 className="mb-3 pb-2 border-bottom">
          <Translate contentKey={'items.update.sections.basicInfo'}>Basic Information</Translate>
        </h2>
        <Row>
          <Col md="6">
            <div className={'d-flex flex-column gap-1'}>
              <label className={'font-semibold'}>
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
                style={{ borderColor: showFormErrors && !item.name ? 'red' : '' }}
              />
            </div>
          </Col>
          <Col md="6">
            <div className={'d-flex flex-column gap-1'}>
              <label className={'font-semibold'}>
                <Translate contentKey={'items.update.shortDescription'}>Short Description</Translate>
              </label>
              <InputTextarea
                name="desc"
                id="desc"
                placeholder={translate('items.update.placeholders.shortDescription')}
                value={item.desc || ''}
                onChange={e => onFieldChange('desc', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); } }}
                rows={5}
              />
            </div>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col md="6">
            <div className={'d-flex flex-column gap-1'}>
              <label className={'font-semibold'}>
                <Translate contentKey="items.update.categories">Categories</Translate>
              </label>
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
          </Col>
          <Col md="6">
            <div className={'d-flex flex-column gap-1'}>
              <label className={'font-semibold'}>
                <Translate contentKey="items.update.tags">Tags</Translate>
              </label>
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
          </Col>
        </Row>
      </div>

      {/* Media Section */}
      <div className="mb-4">
        <h2 className="mb-3 pb-2 border-bottom">
          <Translate contentKey={'items.update.sections.media'}>Media</Translate>
        </h2>
        <Row>
          <Col md={12}>
            <div className={'d-flex flex-column'}>
              <label className={'font-semibold'}>
                <Translate contentKey={'items.update.image'}>Image</Translate>
              </label>
              <MediaLibrary
                multiSelect={true}
                handleFilesSelectCallback={files => addImage(files)}
                defaultValues={transformAttachmentStructure(item?.attachments, 'toFileLibraryListItem')}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* Pricing Section */}
      <div className="mb-4">
        <h2 className="mb-3 pb-2 border-bottom">
          <Translate contentKey={'items.update.sections.pricing'}>Pricing</Translate>
        </h2>
        <Row className="align-items-center">
          {!item.askForPrice && (
            <Col md="4">
              <div className={'d-flex flex-column gap-2'}>
                <label className={'font-semibold'}>
                  {isRetailVariable ? 'Default Price' : 'Price'}
                </label>
                <InputNumber
                  name="price"
                  id="price"
                  required={true}
                  min={0}
                  maxFractionDigits={2}
                  inputClassName={'w-1'}
                  placeholder={translate('items.update.placeholders.itemPrice')}
                  value={defaultPrice || null}
                  onChange={e => setDefaultPrice(e.value || 0)}
                  style={{ borderColor: showFormErrors && !item?.variants?.[0]?.price ? 'red' : '' }}
                />
              </div>
            </Col>
          )}
          <Col md="3" className="d-flex align-items-center mt-3 mt-md-0">
            <Checkbox
              checked={item?.askForPrice || false}
              onChange={(e) => onFieldChange('askForPrice', e.checked)}
              inputId="askForPrice"
              className="me-2"
            />
            <label htmlFor="askForPrice" className="font-semibold mb-0 ms-1">
              <Translate contentKey={'items.update.askForPrice'}>Ask for Price</Translate>
            </label>
          </Col>
          {item?.itemVariantType !== ItemVariantType.RESTAURANT_PIZZA && item?.variants?.length === 1 && (
            <Col md="3" className="d-flex align-items-center mt-3 mt-md-0">
              <Checkbox
                checked={item?.byWeight ? true : false}
                onChange={e => onFieldChange('byWeight', e.checked)}
                inputId="byWeight"
                className="me-2"
              />
              <label htmlFor="byWeight" className="font-semibold mb-0 ms-1">
                <Translate contentKey={'items.update.byWeight'}>By Weight</Translate>
              </label>
            </Col>
          )}
          {isVariableItem && (
            <Col md="6" className="mt-3">
              <DiscountDropdown discounts={item?.discounts} handleChange={onFieldChange} />
            </Col>
          )}
        </Row>
      </div>

      {/* Classification Section */}
      <div className="mb-4">
        <h2 className="mb-3 pb-2 border-bottom">
          <Translate contentKey={'items.update.sections.classification'}>Classification</Translate>
        </h2>
        <Row className="align-items-center">
          <Col md="4">
            <div className={'d-flex flex-column gap-1'}>
              <label className={'font-semibold'}>
                <Translate contentKey="items.update.productionCenter">Production Center</Translate>
              </label>
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
          </Col>
          <Col md="4">
            <div className={'d-flex flex-column gap-1'}>
              <label className={'font-semibold'}>
                <Translate contentKey="items.update.profileGroups">Profile Groups</Translate>
              </label>
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
          </Col>
          {isRetailItem && (
            <Col md="4">
              <div className={'d-flex flex-column gap-1'}>
                <label className={'font-semibold'}>
                  <Translate contentKey="items.update.brand">brand</Translate>
                </label>
                <Select
                  value={item?.brand || null}
                  isClearable
                  options={brands}
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={brand => onFieldChange('brand', brand)}
                />
              </div>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};

export default SharedItemUpdate;
