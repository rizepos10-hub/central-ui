import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import {getSortState, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity,changeEntityField, reset } from './item-restaurant-category.reducer';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import {uploadImage} from "app/entities/attachment/attachment.reducer";
import Select from "react-select";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {getEntities} from "app/entities/term/restaurant-Item-category/item-restaurant-category.reducer";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ITerm } from "app/shared/model/term.model";
import { InputText } from "primereact/inputtext";

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
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
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

    return () => {
      dispatch(reset());
    };
  }, [updateSuccess]);



  useEffect(() => {
    if (updateSuccess) {
      navigate(`/category/${categoryEntity.id}/restaurant-items/edit?page=1&sort=id,asc`)
    }

  }, [updateSuccess]);

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





  const saveEntity = (e) => {
    e.preventDefault();
    const entity = {
      ...categoryEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };



  return (
    <div>
      <Row >
        <Col md="8">
          <h2  data-cy="TermCreateUpdateHeading">
            {isNew ? <Translate contentKey={'itemCategories.update.restaurant.create.title'}/> : <Translate contentKey={'itemCategories.update.restaurant.edit.title'}/>}
          </h2>
        </Col>
      </Row>
      <Row >
        <Col md="8" className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <div className="mb-3 d-flex flex-column">
                <Translate contentKey="itemCategories.update.name">Name</Translate>
                <InputText
                  name={"name"}
                  id={"category-name"}
                  required
                  value={categoryEntity.name}
                  onChange={e => dispatch(changeEntityField({ name: "name", value: e.target.value }))}
                />
              </div>

              <div className="mb-3">
                <Translate contentKey="itemCategories.update.profileGroups">Profile Groups</Translate>
                <Select
                  value={categoryEntity.accountingGroups}
                  isClearable
                  onChange={handleProfileGroupsChange}
                  options={profileGroupsOptions}
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                />
              </div>

              <div className="mb-3">
                <Translate contentKey="itemCategories.update.parents">Parents</Translate>
                <Select
                  value={categoryEntity?.parents || []}
                  isClearable
                  onChange={handleParentsChange}
                  options={categories}
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                />
              </div>
              <div className="mb-3">
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


              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/category/restaurant-items"
                      replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="common.buttons.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                      disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="common.buttons.save">Save</Translate>
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UpdateItemRestaurantCategory;
