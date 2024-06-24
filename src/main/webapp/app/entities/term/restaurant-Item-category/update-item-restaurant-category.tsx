import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getTaxonomies } from 'app/entities/taxonomy/taxonomy.reducer';

import { getEntity, updateEntity, createEntity, reset } from './item-restaurant-category.reducer';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';

import {uploadImage} from "app/entities/attachment/attachment.reducer";
import {faTrashAlt} from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {getEntities} from "app/entities/term/restaurant-Item-category/item-restaurant-category.reducer";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';

export const UpdateItemRestaurantCategory = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const location = useLocation();


  const { id } = useParams<'id'>();

  console.log(id, 'identity')
  const isNew = id === undefined;

  const categories = useAppSelector(state => state.restaurantCategory.entities).map((category) => ({label: category.name, value: category.id}))
  const categoryEntity = useAppSelector(state => state.restaurantCategory.entity);
  const loading = useAppSelector(state => state.restaurantCategory.loading);
  const updating = useAppSelector(state => state.restaurantCategory.updating);
  const updateSuccess = useAppSelector(state => state.restaurantCategory.updateSuccess);
  const newTerm = useAppSelector(state => state.restaurantCategory.entity)

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');

  const [selectedAttachments, setSelectedAttachments] = useState([])

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities).map(category => ({ value: category.id, label: category.name }));

  const [profileGroupsToSave, setProfileGroupsToSave] = useState([])

  const [selectedProfileGroups, setSelectedProfileGroups] = useState('');
  const [selectedParents, setSelectedParents] :any = useState();

  const [parentsToSave, setParentsToSave] :any = useState([]);




  console.log(categoryEntity, 'categoryEntity')




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

    if (categoryEntity?.attachments) {
      setSelectedAttachments(categoryEntity.attachments.map(attachment => ({ id: attachment.id, url: attachment.url })));
    }

    if (categoryEntity?.accountingGroups) {
      setSelectedProfileGroups(categoryEntity.accountingGroups?.map(group => ({ label: group.name, value : group.id })));
      setProfileGroupsToSave(categoryEntity.accountingGroups?.map(group => ({  id : group.id })));
    }

    if(categoryEntity?.parents && categoryEntity.parents.length > 0){
      setSelectedParents({label : categoryEntity.parents[0]?.name, value: categoryEntity.parents[0]?.id})
      setParentsToSave(categoryEntity?.parents?.map(group => ({  id : group?.id })));

    }
    const {id: newTermId} = newTerm
    if (updateSuccess && newTermId) {
      navigate(`/category/${newTermId}/restaurant-items/edit?page=1&sort=id,asc`)
    }

  }, [updateSuccess, categoryEntity?.attachments]);

  const removeAttachment = (attachmentId) => {
    setSelectedAttachments((prevAttachments) =>
      prevAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };
  const handleProfileGroupsChange = selectedAccounting => {
    setSelectedProfileGroups(selectedAccounting);
    setProfileGroupsToSave([{id: selectedAccounting.value}])
  };

  const handleParentsChange = selectedParent => {
    setSelectedParents(selectedParent);
    setParentsToSave([{id: selectedParent.value}])
  };


  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      console.error('No image selected.');
      return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadImageStatus('uploading');
      const response: any = await dispatch(uploadImage(formData));
      const imageUrl = response?.payload?.url;
      const imageInfo = {
        id: response?.payload?.id,
        name: response?.payload?.name,
        path: response?.payload?.path,
        size: response?.payload?.size,
        type: response?.payload?.type,
        createdAt: response?.payload?.createdAt,
        updatedAt: response?.payload?.updatedAt,
        url: imageUrl,
      };
      setSelectedAttachments((prevAttachments) => [ imageInfo]);
      setUploadImageStatus('success');
      console.log(imageInfo, 'helloi')

      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadImageStatus('error');

      return null;
    }

  };

  console.log(categoryEntity, 'categoryEntity')

  const saveEntity = values => {
    const entity = {
      ...categoryEntity,
      ...values,
      accountingGroups: profileGroupsToSave,
      parents: parentsToSave,
      attachments: selectedAttachments,

    };

    console.log(entity, 'entity saved')
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {
        category: '',
      }
      : {
        ...categoryEntity,
      };
  console.log(categories, 'categories')
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
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {/* {! isNew ? ( */}
              {/*    <ValidatedField */}
              {/*     name="id" */}
              {/*     required */}
              {/*     readOnly */}
              {/*     id="category-id" */}
              {/*     label={translate('global. field.id')} */}
              {/*     validate={{ required: tru e }} */}
              {/*    /> */}
              {/* )  : null} */}
               <ValidatedField
                label={translate('itemCategories.update.name')}
                id="category-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('common.validation.required') },
                }}
              />
              {/* <V alidatedField */}
              {/*    id="category-taxonomy" */}
              {/*    name="taxonomy" */}
              {/*    data-cy="taxonomy" */}
              {/*    label={'Category'} */}
              {/*    type="select" */}
              {/*    readOnly={true} */}
              {/*    required */}
              {/* > * /}
              {/*    { taxonomies && */}
              {/*     taxonomies */}
              {/*       .filter((otherEntity) = > otherEntity.name === "Item Category") */}
              {/*       .map((filteredEntity) = > ( */}
              {/*         <option value={filter edEntity.id} key={filteredEntity.id}> */}
              {/*           {filteredEntity.nam e} */}
              {/*         </option> */}
              {/*       ) */}
              {/*    )} */}
              {/* < / ValidatedField> */}
              <div className="mb-3">
              <Translate contentKey="itemCategories.update.profileGroups">Profile Groups</Translate>
              <Select  value={selectedProfileGroups} isClearable onChange={handleProfileGroupsChange} options={profileGroupsOptions} />
              </div>

              <div className="mb-3">
                <Translate contentKey="itemCategories.update.parents">Parents</Translate>
                <Select  value={selectedParents} isClearable  onChange={handleParentsChange} options={categories} />
              </div>
              <div className="mb-3">
                <MediaLibrary
                  handleFilesSelectCallback={(files) => setSelectedAttachments((prevAttachments) => [transformAttachmentStructure(files, 'toIAttachment')[0]])}
                  defaultValues={transformAttachmentStructure(selectedAttachments ? selectedAttachments : [], 'toFileLibraryListItem')}
                />
              </div>



              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/category/restaurant-items" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="common.buttons.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="common.buttons.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UpdateItemRestaurantCategory;
