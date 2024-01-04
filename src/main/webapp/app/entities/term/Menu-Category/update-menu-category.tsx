import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity,getEntities, reset } from './menu-category.reducer';
import {uploadImage} from "app/entities/attachment/attachment.reducer";
import {faTrashAlt} from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";

export const UpdateMenuCategory = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const { id } = useParams<'id'>();
  console.log(id, 'identity1')

  const isNew = id === undefined;

  const terms = useAppSelector(state => state.menuCategory.entities);
  const termEntity = useAppSelector(state => state.menuCategory.entity);
  const loading = useAppSelector(state => state.menuCategory.loading);
  const updating = useAppSelector(state => state.menuCategory.updating);
  const updateSuccess = useAppSelector(state => state.menuCategory.updateSuccess);
  const newTerm = useAppSelector(state => state.menuCategory.entity)


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');

  const [selectedAttachments, setSelectedAttachments] = useState([])

  const [selectedParent, setSelectedParent] = useState([]);


  const termOptions = terms.map(term => ( {label: term?.name, value: term.id, id: term.id }))

  const handleParentChange = selected => {
    setSelectedParent([selected])
  }



  console.log(terms, 'termss')


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
    }))

    return () => {
      dispatch(reset());
    };

  }, []);


  useEffect(() => {



      const {id: newTermId} = newTerm
      if (updateSuccess && newTermId) {
        navigate(`/category/${newTermId}/menus/edit?page=1&sort=id,asc`)
      }
    if (termEntity?.attachments) {
      setSelectedAttachments(termEntity.attachments.map(attachment => ({ id: attachment.id, url: attachment.url })));
    }
    if (termEntity.parents?.length > 0){
      setSelectedParent((termEntity.parents.map((term) => ( {label: term?.name, value: term?.id, id: term?.id}) )))
    }
    console.log(termEntity, 'termEntity1')

  }, [updateSuccess, termEntity ]);


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

      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadImageStatus('error');

      return null;
    }

  };


console.log(termEntity)
  const saveEntity = values => {
    setSelectedImage('')
    setSelectedAttachments([])

    console.log(values, 'lol')

    const entity = {
      ...termEntity,
      ...values,
      // taxonomy: taxonomies.find(it => it.id.toString() === values.taxonomy.toString()),
      parents: selectedParent.map(parent => ({id :parent.id})),
      attachments: selectedAttachments,

    };
    console.log(entity, 'entity')

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const removeAttachment = (attachmentId) => {
    setSelectedAttachments((prevAttachments) =>
      prevAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const defaultValues = () =>
    isNew
      ? {
        // taxonomy: taxonomies.find(otherEntity => otherEntity?.name === 'Menu Category')?.id,
      }
      : {
        ...termEntity,
        // taxonomy: termEntity?.taxonomy?.id,
      };
  console.log(termEntity?.parents, 'ddd')
  return (
    <div>
      <Row>
        <Col md="8">
          <h2  data-cy="TermCreateUpdateHeading">
            {isNew ? "Create a Menu Category" : "Edit Menu Category"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {/* {!isNew ? ( */}
              {/*   <ValidatedField */}
              {/*     name="id" */}
              {/*     required */}
              {/*     readOnly */}
              {/*     id="term-id" */}
              {/*     label={translate('global.field.id')} */}
              {/*     validate={{ required: true }} */}
              {/*   /> */}
              {/* ) : null} */}
              <ValidatedField
                label={translate('tempApp.term.name')}
                id="term-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />


              <div className="mb-3">
                <ValidatedField
                  label={'Item Image'}
                  id="item-image"
                  name="image"
                  data-cy="image"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                <div className="mb-3">
                  {selectedAttachments.map((attachment, index) => (
                    <div key={index} style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="img-fluid"
                        style={{
                          maxWidth: '100px',
                          maxHeight: '100px',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '50%',
                          padding: '2px',
                          cursor: 'pointer',
                        }}
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <FontAwesomeIcon icon={faTrashAlt}  />
                      </div>
                    </div>

                  ))}
                  {selectedImage && (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected Image"
                      className="img-fluid m-lg-1"
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                      }}
                    />
                  )}

                  {selectedImage && uploadImageStatus === 'success' && (
                    <div className={`alert alert-${uploadImageStatus === 'success' ? 'success' : 'danger'}`}
                         role="alert">
                      {uploadImageStatus === 'success' && 'Uploaded successfully!'}
                    </div>
                  )}
                </div>
              </div>

              <div className="my-4 p-1">
                <label>Parents</label>
                <Select options={termOptions} value={selectedParent} onChange={handleParentChange} />
              </div>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/category/menus" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UpdateMenuCategory;

//
// {isNew ? (
//   <ValidatedField
//     id="term-parents"
//     name="parents"
//     data-cy="parents"
//     label={translate('tempApp.term.parents')}
//     type="select"
//   >
//     <option value="">{''}</option>
//     {terms &&
//       terms
//         .filter(term => term.taxonomy && term.taxonomy.name === 'Menu Category')
//         .map(otherEntity => (
//           <option value={otherEntity.id} key={otherEntity.id}>
//             {otherEntity.name}
//           </option>
//         ))}
//   </ValidatedField>
// ) : (
//   <ValidatedField
//     name="parents"
//     label={translate('tempApp.term.parents')}
//     type="select"
//   >
//     <option defaultValue={termEntity?.parents && termEntity.parents.length > 0 ?  termEntity.parents[0]?.name    : ''}>
//       {termEntity?.parents && termEntity.parents.length > 0 ? termEntity.parents[0]?.name : ''}
//     </option>
//
//     {terms &&
//       terms
//         .filter(term => term.taxonomy && term.taxonomy?.name === 'Menu Category')
//         .map(otherEntity => (
//           <option value={otherEntity.id} key={otherEntity.id}>
//             {otherEntity?.name}
//           </option>
//         ))}
//     {termEntity?.parents && termEntity.parents.length > 0 && termEntity.parents[0]?.name && (
//       <option value="">{''}</option>
//     )}
//   </ValidatedField>
// )}
//
