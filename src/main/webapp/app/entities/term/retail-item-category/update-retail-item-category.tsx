import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, } from 'reactstrap';
import { getSortState, Translate, } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';


import { getEntity, updateEntity, createEntity, reset, changeEntityField } from "./retail-item-category.reducer";
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';


import Select from 'app/shared/components/select/select';
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities } from "app/entities/term/retail-item-category/retail-item-category.reducer";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ITerm } from "app/shared/model/term.model";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

export const UpdateItemRestaurantCategory = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const categories = useAppSelector(state => state.retailCategory.entities)
  const categoryEntity: ITerm = useAppSelector(state => state.retailCategory.entity);
  const loading = useAppSelector(state => state.retailCategory.loading);
  const updating = useAppSelector(state => state.retailCategory.updating);
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
            navigate(`/category/retail-items/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/category/retail-items/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row >
        <Col md="8">
          <h2 data-cy="TermCreateUpdateHeading">
            {isNew ? <Translate contentKey={"itemCategories.update.retail.create.title"}>Create Retail Category</Translate> : <Translate contentKey={"itemCategories.update.retail.create.title"}>Edit Retail Category</Translate>}
          </h2>
        </Col>
      </Row>
      <Row >
        <Col md="8" className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>

              <div className="mb-3 d-flex flex-column">
                <Translate contentKey="itemCategories.update.name">Name</Translate>
                <InputText
                  name={"name"}
                  id={"category-name"}
                  required
                  value={categoryEntity.name || ''}
                  onChange={e => dispatch(changeEntityField({ name: "name", value: e.target.value }))}
                />
              </div>

              <div className="mb-3 d-flex flex-column">
                <Translate contentKey="itemCategories.update.description">Description</Translate>
                <InputTextarea
                  name={"description"}
                  id={"category-description"}
                  rows={3}
                  value={categoryEntity.description || ''}
                  onChange={e => dispatch(changeEntityField({ name: "description", value: e.target.value }))}
                />
              </div>


              <div className="mb-3">
                <Translate contentKey="itemCategories.update.profileGroups">Profile Groups</Translate>
                <Select
                  value={categoryEntity.accountingGroups || []}
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
                  defaultValues={transformAttachmentStructure(categoryEntity.attachments || [], 'toFileLibraryListItem')}
                />
              </div>


              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              &nbsp;
              <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UpdateItemRestaurantCategory;
