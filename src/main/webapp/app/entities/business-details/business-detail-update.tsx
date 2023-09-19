import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { DayOfWeek } from 'app/shared/model/enumerations/day-of-week.model';

const dayOfWeekValues = Object.keys(DayOfWeek);

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
  const branchList = useAppSelector(state => state.branch.entities);
  const [businessDayDetailsByBranchMap, setBusinessDayDetailsByBranchMap] = useState(new Map());
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
    if (businessDetailEntity?.businessDayDetailsByBranch) {
      setBusinessDayDetailsByBranchMap(businessDetailEntity.businessDayDetailsByBranch);
    }
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
      businessDayDetailsByBranch: businessDayDetailsByBranchMap,
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

  const backgroundStyle = {
    backgroundColor: 'white',
  };

  // Handle branch selection
  // const handleBranchSelection = (e, branchId) => {
  //   const selectedBranchId = e.target.value;
  //   // Update the branch details in your component's state
  //   const updatedBranchDetails = { ...businessDetailEntity.businessDayDetailsByBranch[branchId] };
  //   businessDetailEntity.businessDayDetailsByBranch[selectedBranchId] = updatedBranchDetails;
  //   // Remove the branch from the old key if it's not the same as the new one
  //   if (branchId !== selectedBranchId) {
  //     delete businessDetailEntity.businessDayDetailsByBranch[branchId];
  //   }
  //   // Update the selected branch
  //   setBusinessDayDetailsByBranchMap({ ...businessDetailEntity });
  // };

  // Handle day change
  //   const handleDayChange = (e, branchId, index) => {
  //     const selectedDay = e.target.value;
  //     // Update the day in your component's state
  //
  //     const updatedBranchDetails = { ...businessDetailEntity.businessDayDetailsByBranch[branchId] };
  //     updatedBranchDetails[index].day = selectedDay;
  //     // console.log(updatedBranchDetails[index].day)
  //     console.log(updatedBranchDetails, "updated")
  //     businessDetailEntity.businessDayDetailsByBranch[branchId] = updatedBranchDetails;
  //     // setBusinessDetailEntity({ ...businessDetailEntity });
  //   };

  // Handle day change
  const handleDayChange = (e, branchId, index) => {
    const selectedDay = e.target.value;
    // Create a copy of the branch details
    const updatedBranchDetails = [...businessDayDetailsByBranchMap[branchId]];
    // Update the day in the copy
    updatedBranchDetails[index] = { ...updatedBranchDetails[index], day: selectedDay };
    console.log(updatedBranchDetails);
    // Update the branch details in your component's state

    // updateBusinessDayDetailsForBranch(branchId, updatedBranchDetails);
    // setBusinessDayDetailsByBranchMap((pre) =>[...pre, businessDayDetailsByBranchMap[branchId] = updatedBranchDetails])
    setBusinessDayDetailsByBranchMap(businessDayDetailsByBranchMap);
    // You may need to use setBusinessDetailEntity to update the state if it's a React state variable
  };
  // const updateBusinessDayDetailsForBranch = (branchId, updatedBranchDetails) => {
  //   setBusinessDayDetailsByBranchMap(prevMap => {
  //     const newMap = new Map(prevMap);
  //     newMap.set(branchId, updatedBranchDetails);
  //     return newMap;
  //   });
  // };

  // Handle opening hour change
  // Handle opening hour change
  const handleOpeningHourChange = (e, branchId, index, hourIndex) => {
    const newOpeningHour = e.target.value;
    // Create a deep copy of the branch details
    const updatedBranchDetails = { ...businessDetailEntity.businessDayDetailsByBranch };
    updatedBranchDetails[branchId] = [...updatedBranchDetails[branchId]];
    updatedBranchDetails[branchId][index] = { ...updatedBranchDetails[branchId][index] };
    updatedBranchDetails[branchId][index].openingHours = [...updatedBranchDetails[branchId][index].openingHours];
    updatedBranchDetails[branchId][index].openingHours[hourIndex] = {
      ...updatedBranchDetails[branchId][index].openingHours[hourIndex],
      from: newOpeningHour,
    };
    console.log(businessDetailEntity);

    // Update the branch details in your component's state
    // setBusinessDetailEntity({ ...businessDetailEntity, businessDayDetailsByBranch: updatedBranchDetails });
  };

  // Handle closing hour change
  const handleClosingHourChange = (e, branchId, index, hourIndex) => {
    const newClosingHour = e.target.value;
    // Update the closing hour in your component's state
    const updatedBranchDetails = { ...businessDetailEntity.businessDayDetailsByBranch[branchId] };
    updatedBranchDetails[index].openingHours[hourIndex].to = newClosingHour;
    businessDetailEntity.businessDayDetailsByBranch[branchId] = updatedBranchDetails;
    console.log(businessDetailEntity);
    // setBusinessDetailEntity({ ...businessDetailEntity });
  };

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
              {/*todo
              should list the opening hours by day in branch
              can assign new branch opening hours from the available branches
              edit opening hours in a day for a branch*/}
              {businessDetailEntity?.businessDayDetailsByBranch ? (
                Object.entries(businessDetailEntity.businessDayDetailsByBranch).map(([branchId, branchDetails]) => (
                  <div key={branchId}>
                    <h5>Branch ID: {branchId}</h5>

                    {(branchDetails as any[]).map((dayDetail, index) => (
                      <section key={index}>
                        {/*<select*/}
                        {/*  name={`branchId${index}`}*/}
                        {/*  onChange={(e) => handleBranchSelection(e, branchId)}*/}
                        {/*  value={branchId}*/}
                        {/*>*/}
                        {/*  {branchList.map((branch) => (*/}
                        {/*    <option key={branch.id} value={branch.id}>*/}
                        {/*      {branch.name}*/}
                        {/*    </option>*/}
                        {/*  ))}*/}
                        {/*</select>*/}
                        {/* Display the selected day */}
                        <ValidatedField
                          label={translate('tempApp.businessDetail.day')}
                          id={`day-${branchId}-${index}`}
                          name={`day-${branchId}-${index}`}
                          data-cy={`day-${branchId}-${index}`}
                          type="select"
                          defaultValue={dayDetail.day} // Set the selected day
                          onChange={e => handleDayChange(e, branchId, index)} // Implement handleDayChange
                        >
                          {dayOfWeekValues.map(day => (
                            <option value={day} key={day}>
                              {translate('tempApp.businessDetail.' + day)}
                            </option>
                          ))}
                        </ValidatedField>

                        {/* Display opening hours for the selected day */}
                        {dayDetail.openingHours.map((openingHour, hourIndex) => (
                          <div key={hourIndex}>
                            <input
                              type="text"
                              defaultValue={openingHour.from}
                              // value={openingHour.from} // Set the opening hour value
                              onChange={e => handleOpeningHourChange(e, branchId, index, hourIndex)} // Implement handleOpeningHourChange
                            />
                            <input
                              type="text"
                              defaultValue={openingHour.from}
                              onChange={e => handleClosingHourChange(e, branchId, index, hourIndex)} // Implement handleClosingHourChange
                            />
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                ))
              ) : (
                <p>No business day details available</p>
              )}
              {/***********************************************/}
              {/*{businessDetailEntity?.businessDayDetailsByBranch ? (*/}
              {/*  Object.entries(businessDetailEntity.businessDayDetailsByBranch).map(([branchId, branchDetails]) => (*/}
              {/*    <div key={branchId}>*/}
              {/*      <h5>Branch ID: {branchId}</h5>*/}
              {/*      {(branchDetails as any[]).map((dayDetail, index) => (*/}
              {/*        <section key={index}  >*/}
              {/*          <ValidatedField label={translate('tempApp.businessDetail.day')} id="item-status" name="day" data-cy="day" type="select">*/}
              {/*            {dayOfWeekValues.map(day => (*/}
              {/*              <option value={day} key={day} selected={dayDetail.day}>*/}
              {/*                {translate('tempApp.businessDetail.' + day)}*/}
              {/*              </option>*/}
              {/*            ))}*/}
              {/*          </ValidatedField>*/}
              {/*          /!*<p>Status: {dayDetail.status}</p>*!/*/}
              {/*          {*/}
              {/*            dayDetail.openingHours.map((openingHour, index) => (*/}
              {/*              <div key={index}>{openingHour.from} {openingHour.to}</div>*/}
              {/*            ))*/}
              {/*          }*/}
              {/*          <svg width="200" height="100">*/}
              {/*            <line x1="10" y1="50" x2="190" y2="50" stroke="black" strokeWidth="2" />*/}
              {/*          </svg>*/}
              {/*        </section>*/}
              {/*      ))}*/}
              {/*    </div>*/}
              {/*  ))*/}
              {/*) : (*/}
              {/*  <p>No business day details available</p>*/}
              {/*)}*/}
              {/************************************************/}
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
