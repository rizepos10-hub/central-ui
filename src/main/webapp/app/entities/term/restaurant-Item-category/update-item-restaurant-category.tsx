import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './item-restaurant-category.reducer';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { getEntities } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import Select from 'app/shared/components/select/select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ITerm } from 'app/shared/model/term.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, PlusCircle } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const UpdateItemRestaurantCategory = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const categories = useAppSelector(state => state.restaurantCategory.entities);
  const categoryEntity: ITerm = useAppSelector(state => state.restaurantCategory.entity);
  const loading = useAppSelector(state => state.restaurantCategory.loading);
  const updating = useAppSelector(state => state.restaurantCategory.updating);
  const updateSuccess = useAppSelector(state => state.restaurantCategory.updateSuccess);
  const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams({ activePage: 1, itemsPerPage: ITEMS_PER_PAGE, sort: 'id', order: 'asc' }, location.search)
  );

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getEntities({
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

  const handleProfileGroupsChange = (profileGroups) => {
    dispatch(changeEntityField({
      name: "accountingGroups",
      value: [profileGroups]
    }))
  };

  const handleParentsChange = selectedParent => {
    dispatch(changeEntityField({
      name: "parents",
      value: selectedParent ? [selectedParent] : []
    }))
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...categoryEntity,
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
            navigate(`/category/${newId}/restaurant-items/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/category/restaurant-items/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? <Translate contentKey={'itemCategories.update.restaurant.create.title'} /> : <Translate contentKey={'itemCategories.update.restaurant.edit.title'} />}
        </h2>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-xs">Loading...</p>
            ) : (
              <form  className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name" className="text-xs">
                    <Translate contentKey="itemCategories.update.name">Name</Translate>
                  </Label>
                  <Input
                    name="name"
                    id="category-name"
                    required
                    value={categoryEntity.name || ''}
                    onChange={e => dispatch(changeEntityField({ name: "name", value: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    <Translate contentKey="itemCategories.update.profileGroups">Profile Groups</Translate>
                  </Label>
                  <Select
                    value={categoryEntity.accountingGroups || []}
                    isClearable
                    onChange={handleProfileGroupsChange}
                    options={profileGroupsOptions}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    <Translate contentKey="itemCategories.update.parents">Parents</Translate>
                  </Label>
                  <Select
                    value={categoryEntity?.parents || []}
                    isClearable
                    onChange={handleParentsChange}
                    options={categories}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Image</Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => {
                      const newAttachment = transformAttachmentStructure(files, 'toIAttachment')[0];
                      dispatch(changeEntityField({
                        name: 'attachments',
                        value: newAttachment ? [newAttachment] : []
                      }));
                    }}
                    defaultValues={transformAttachmentStructure(categoryEntity?.attachments || [], 'toFileLibraryListItem')}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => saveEntity(e, true)}
                    disabled={updating}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UpdateItemRestaurantCategory;
