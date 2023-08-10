import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { getEntities as getTaxonomies } from 'app/entities/taxonomy/taxonomy.reducer';
import {getEntities as getTerms, getMenuCategories} from 'app/entities/term/term.reducer';
import { IItem } from 'app/shared/model/item.model';
import { getEntities as getItems } from 'app/entities/item/item.reducer';
import { ITerm } from 'app/shared/model/term.model';
import { getEntity, updateEntity, createEntity, reset } from '../term.reducer';
import {uploadImage} from "app/entities/attachment/attachment.reducer";

export const UpdateMenuCategory = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const location = useLocation();


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const taxonomies = useAppSelector(state => state.taxonomy.entities);
  const terms = useAppSelector(state => state.term.entities);
  const items = useAppSelector(state => state.item.entities);
  const termEntity = useAppSelector(state => state.term.entity);
  const loading = useAppSelector(state => state.term.loading);
  const updating = useAppSelector(state => state.term.updating);
  const updateSuccess = useAppSelector(state => state.term.updateSuccess);
  const newTerm = useAppSelector(state => state.term.entity)

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');
  const [refresh, setRefresh] = useState(false)

  const [selectedAttachments, setSelectedAttachments] = useState([])

  const handleRefresh = () => {
    setRefresh(prev => !prev)
  };



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getTaxonomies({}));
    dispatch(getMenuCategories({}))

    return () => {
      dispatch(reset());
    };

  }, [refresh]);


  useEffect(() => {



      const {id: newTermId} = newTerm
      if (updateSuccess && newTermId) {
        navigate(`/term/${newTermId}/menus/edit?page=1&sort=id,asc`)
      }
    if (termEntity?.attachments) {
      setSelectedAttachments(termEntity.attachments.map(attachment => ({ id: attachment.id, url: attachment.url })));


    }
    console.log(termEntity, 'termos1')

  }, [updateSuccess, termEntity?.attachments ]);


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
      setSelectedAttachments((prevAttachments) => [...prevAttachments, imageInfo]);
      setUploadImageStatus('success');
      console.log(imageInfo, 'helloi')

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

    const entity = {
      ...termEntity,
      ...values,
      taxonomy: taxonomies.find(it => it.id.toString() === values.taxonomy.toString()),
      parents: [terms.find(it => it.id.toString() === values.term.toString())],
      attachments: selectedAttachments,

      // item: items.find(it => it.id.toString() === values.item.toString()),
    };

    console.log(entity, 'entity saved')
    if (isNew) {

      dispatch(createEntity(entity));
    } else {
      // entity.parents = [terms.find(it => it.id.toString() === values.term.toString())];
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {
        taxonomy: taxonomies.find(otherEntity => otherEntity?.name === 'Menu Category')?.id,
        term: '',
      }
      : {
        ...termEntity,
        taxonomy: termEntity?.taxonomy?.id,
        parents: termEntity?.parents && termEntity.parents?.length > 0 ? termEntity.parents[0]?.name : '',
      };
  console.log(termEntity?.parents, 'ddd')
  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="tempApp.term.home.createOrEditLabel" data-cy="TermCreateUpdateHeading">
            Create or edit an Menu Category
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
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
              {/* <ValidatedField */}
              {/*   id="term-taxonomy" */}
              {/*   name="taxonomy" */}
              {/*   data-cy="taxonomy" */}
              {/*   label={'Category'} */}
              {/*   type="select" */}
              {/*   required */}
              {/* > */}
              {/*   <option value={''}></option> */}
              {/*   { taxonomies && */}
              {/*     taxonomies */}
              {/*       .filter((otherEntity) => otherEntity.name === "Menu Category") */}
              {/*       .map((filteredEntity) => ( */}
              {/*           <option value={filteredEntity.id} key={filteredEntity.id}> */}
              {/*             {filteredEntity.name} */}
              {/*           </option> */}
              {/*         ) */}
              {/*       )} */}
              {/* </ValidatedField> */}


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
                  {selectedAttachments && selectedAttachments.length > 0 && (
                    <div>
                      {selectedAttachments.map((attachment, index) => (
                        <img
                          key={index}
                          src={attachment.url}
                          alt={attachment?.name}
                          className="img-fluid m-lg-1"
                          style={{
                            maxWidth: '100px',
                            maxHeight: '100px',
                          }}
                        />
                      ))}
                    </div>
                  )}
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

              {isNew ? (
                <ValidatedField
                  id="term-term"
                  name="term"
                  data-cy="term"
                  label={translate('tempApp.term.parents')}
                  type="select"
                >
                  {/* Add an empty option */}
                  <option value="">{''}</option>
                  {terms &&
                    terms
                      .filter(term => term.taxonomy && term.taxonomy?.name === 'Menu Category')
                      .map(otherEntity => (
                        <option value={otherEntity.id} key={otherEntity.id}>
                          {otherEntity?.name}
                        </option>
                      ))}
                </ValidatedField>
              ) : (
                <ValidatedField
                  id="term-term"
                  name="term"
                  data-cy="term"
                  label={translate('tempApp.term.parents')}
                  type="select"
                >
                  <option value={termEntity?.parents && termEntity.parents.length > 0 ? termEntity.parents[0]?.name : ''}>
                    {termEntity?.parents && termEntity.parents.length > 0 ? termEntity.parents[0]?.name : ''}
                  </option>


                  {terms &&
                    terms
                      .filter(term => term.taxonomy && term.taxonomy?.name === 'Menu Category')
                      .map(otherEntity => (
                        <option value={otherEntity.id} key={otherEntity.id}>
                          {otherEntity?.name}
                        </option>
                      ))}
                  { termEntity?.parents && termEntity.parents.length > 0 && termEntity.parents[0]?.name &&
                    <option value="">{''}</option>
                  }
                </ValidatedField>
              )}


              {/* <ValidatedField id="term-item" name="item" data-cy="item" label={translate('tempApp.term.item')} type="select"> */}
              {/*   <option value="" key="0" /> */}
              {/*   {items */}
              {/*     ? items.map(otherEntity => ( */}
              {/*         <option value={otherEntity.id} key={otherEntity.id}> */}
              {/*           {otherEntity.name} */}
              {/*         </option> */}
              {/*       )) */}
              {/*     : null} */}
              {/* </ValidatedField> */}
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/term/menus" replace color="info">
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
