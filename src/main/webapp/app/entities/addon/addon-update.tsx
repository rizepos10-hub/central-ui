import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from 'app/shared/components/select/select';
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import { IDiscount } from "app/shared/model/discount.model";
import { ITag } from "app/shared/model/TAG/tag.model";
import { getEntities as getTags } from "app/entities/tag/tag.reducer";
import { getEntities as getProfileGroups } from "app/entities/settings/profile-group/profile-group.reducer";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import IngredientsPicker from 'app/shared/ingredients-picker';
import { IIngredient } from 'app/shared/model/ingredient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';


export const AddonUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addonEntity: IAddon = useAppSelector(state => state.addon.entity);
  const loading = useAppSelector(state => state.addon.loading);
  const updating = useAppSelector(state => state.addon.updating);
  const discounts = useAppSelector(state => state.discount.entities);
  const tags = useAppSelector(state => state.tag.entities);
  const profileGroups = useAppSelector(state => state.profileGroup.entities);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }))
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getTags({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getProfileGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const entity = {
      ...addonEntity,
      ingredients: addonEntity.ingredients?.map(ingredient => ({
        ...ingredient,
        item: {
          id: ingredient.item.id,
          itemVariantType: ingredient.item.itemVariantType,
        }
      }))
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/addon/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/addon/new`)
        }
      })
    }
  };


  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  }));

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {isNew ? (
              <Translate contentKey={'tempApp.addon.createNewAddon'}>Create New Addon</Translate>
            ) : (
              <Translate contentKey={'tempApp.addon.editAddon'}>Edit Addon</Translate>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="addon-name" className="text-xs">
                  <Translate contentKey={'common.name'}>Name</Translate>
                </Label>
                <Input
                  name="name"
                  required={true}
                  id="addon-name"
                  value={addonEntity.name || ''}
                  onChange={handleChange}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="addon-desc" className="text-xs">
                  <Translate contentKey={'common.description'}>Description</Translate>
                </Label>
                <Textarea
                  name="desc"
                  id="addon-desc"
                  value={addonEntity.desc || ''}
                  onChange={handleChange}
                  className="min-h-[80px] text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="addon-price" className="text-xs">
                  <Translate contentKey={'common.price'}>Price</Translate>
                </Label>
                <Input
                  id="addon-price"
                  type="number"
                  step="0.01"
                  value={addonEntity.price || ''}
                  onChange={(e) => dispatch(changeEntityField({ name: 'price', value: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="addon-profileGroup" className="text-xs">
                  <Translate contentKey={'common.profileGroup'}>Profile Group</Translate>
                </Label>
                <Select
                  value={addonEntity?.accountingGroups?.[0] || null}
                  options={profileGroups}
                  id="addon-profileGroup"
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedProfileGroup => dispatch(changeEntityField({
                    name: 'accountingGroups',
                    value: selectedProfileGroup ? [selectedProfileGroup] : []
                  }))}
                  isClearable
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="addon-tags" className="text-xs">
                  <Translate contentKey={'common.tags'}>Tags</Translate>
                </Label>
                <Select
                  value={addonEntity?.tags || []}
                  isMulti={true}
                  options={tags}
                  id="addon-tags"
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedTags => dispatch(changeEntityField({
                    name: 'tags',
                    value: selectedTags as ITag[]
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <IngredientsPicker
                  ingredients={addonEntity.ingredients || []}
                  onChange={(newIngredients) => {
                    dispatch(changeEntityField({
                      name: 'ingredients',
                      value: newIngredients
                    }));
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="addon-discount" className="text-xs">
                  <Translate contentKey={'common.discount'}>Discounts</Translate>
                </Label>
                <Select
                  value={addonEntity.discounts?.[0] || null}
                  id="addon-discount"
                  options={discountsOptions}
                  isClearable
                  getOptionLabel={option => (option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`)}
                  getOptionValue={option => option.id}
                  onChange={selectedDiscount =>
                    dispatch(changeEntityField({
                      name: 'discounts',
                      value: selectedDiscount ? [selectedDiscount] : []
                    }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="h-8 text-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button
                  type="button"
                  onClick={saveEntity}
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button
                  type="button"
                  onClick={(e) => saveEntity(e, true)}
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default AddonUpdate;
