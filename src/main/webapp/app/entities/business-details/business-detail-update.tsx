import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

export const BusinessDetailUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const businessDetailEntity = useAppSelector(state => state.businessDetail.entity);
  const loading = useAppSelector(state => state.businessDetail.loading);
  const updating = useAppSelector(state => state.businessDetail.updating);
  const updateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState({});
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');
  // const [selectedAddress, setSelectedAddress] = useState(null);

  const handleClose = () => {
    navigate('/details' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (businessDetailEntity?.logo) {
      setSelectedAttachment(businessDetailEntity.logo);
    }
    // if (businessDetailEntity?.address) {
    //   setSelectedAddress(businessDetailEntity.address);
    // }
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess, businessDetailEntity?.logo, businessDetailEntity?.address]);

  const removeAttachment = () => {
    setSelectedAttachment({});
  };
  const saveEntity = values => {
    const entity = {
      ...businessDetailEntity,
      ...values,
      logo: selectedAttachment,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };
  const handleImageChange = async event => {
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
      setSelectedAttachment(imageInfo);
      setUploadImageStatus('success');
      console.log(imageInfo, 'helloi');

      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadImageStatus('error');

      return null;
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...businessDetailEntity,
        };

  const businessDayDetailsByBranch = businessDetailEntity?.businessDayDetailsByBranch;

  console.log(businessDayDetailsByBranch, 'lol')

  // businessDayDetailsByBranch &&  Object.keys(businessDayDetailsByBranch).forEach((branchId) => {
  //   const branchDetails = businessDayDetailsByBranch[branchId];
  //
  //   branchDetails.forEach((dayDetail) => {
  //     console.log(dayDetail, 'houssein');
  //   });
  // });
  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="tempApp.businessDetail.home.createOrEditLabel" data-cy="DetailCreateUpdateHeading">
            <Translate contentKey="tempApp.businessDetail.home.createOrEditLabel">Create or edit a Business detail</Translate>
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="details-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={'name'}
                id="details-name"
                name="businessName"
                data-cy="value"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 30 }) },
                }}
              />
              <ValidatedField
                label={'slogan'}
                id="details-solgan"
                name="slogan"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <div className="mb-3">
                <ValidatedField
                  label={'Logo'}
                  id="item-image"
                  name="image"
                  data-cy="image"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                <div className="mb-3">
                  {selectedImage ? (
                    <div key={selectedImage.id} style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.name}
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
                        onClick={() => removeAttachment()}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </div>
                    </div>
                  ) : (
                    ''
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
                    <div className={`alert alert-${uploadImageStatus === 'success' ? 'success' : 'danger'}`} role="alert">
                      {uploadImageStatus === 'success' && 'Uploaded successfully!'}
                    </div>
                  )}
                </div>
              </div>
              <h4>Address Details</h4>
              <ValidatedField
                label={'address-street'}
                id="details-address-street"
                name="address.street"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <ValidatedField
                label={'address-city'}
                id="details-address-city"
                name="address.city"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <ValidatedField
                label={'address-state'}
                id="details-address-state"
                name="address.state"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <ValidatedField
                label={'address-postalCode'}
                id="details-address-postalCode"
                name="address.postalCode"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <h4>Opening Hours By Branch</h4>
              {businessDetailEntity?.businessDayDetailsByBranch ? (
                Object.entries(businessDetailEntity.businessDayDetailsByBranch).map(([branchId, branchDetails]) => (
                  <div key={branchId}>
                    <h5>Branch ID: {branchId}</h5>
                    {(branchDetails as any[]).map((dayDetail, index) => (
                      <div key={index}>
                        <p>Day: {dayDetail.day}</p>
                        <p>Status: {dayDetail.status}</p>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p>No business day details available</p>
              )}
              {/*{Object.keys(businessDetailEntity.businessDayDetailsByBranch).map((branchId) => (*/}
              {/*  // <BranchComponent key={branchId} branchId={branchId} businessDayDetails={businessDayDetailsByBranch[branchId]} />*/}
              {/*  <div>*/}
              {/*    {branchId}*/}
              {/*  </div>*/}
              {/*))}*/}
              {/*{branchIds.map((branchId) => (*/}
              {/*  <div key={branchId}>*/}
              {/*    <h2>Branch ID: {branchId}</h2>*/}
              {/*    <ul>*/}
              {/*      {Array.from(businessDetailEntity.businessDayDetailsByBranch[branchId]).map((businessDayDetail, index) => (*/}
              {/*        <li key={index}>*/}
              {/*          <p>Day of Week: {businessDetailEntity?.day}</p>*/}
              {/*          /!*<p>Opening Time: {businessDayDetail.openingTime}</p>*!/*/}
              {/*          /!*<p>Closing Time: {businessDayDetail.closingTime}</p>*!/*/}
              {/*        </li>*/}
              {/*      ))}*/}
              {/*    </ul>*/}
              {/*  </div>*/}
              {/*))}*/}
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/details" replace color="info">
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

export default BusinessDetailUpdate;
