import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText, Table } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from '../branch/branch.reducer';

import { getEntity, updateEntity, createEntity, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { DayOfWeek } from 'app/shared/model/enumerations/day-of-week.model';
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {Calendar} from "primereact/calendar";

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
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');
  const branchList = useAppSelector(state => state.branch.entities);
  const [businessDayDetailsByBranchMap, setBusinessDayDetailsByBranchMap] = useState({});

  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID')
    const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };
  const handleClose = () => {
    navigate('/details' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({}));

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

  }, [updateSuccess, businessDetailEntity?.logo, businessDetailEntity?.address,businessDetailEntity?.businessDayDetailsByBranch]);

  console.log(businessDetailEntity?.businessDayDetailsByBranch, 'lol4')

  const removeAttachment = () => {
    setSelectedAttachment({});
  };
  const saveEntity = values => {
    const entity = {
      ...businessDetailEntity,
      ...values,
      logo: selectedAttachment && selectedAttachment ,
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
    // setBusinessDayDetailsByBranchMap(businessDayDetailsByBranchMap);
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
  const handleOpeningHourChange = (e, branchId, day, field) => {
    const newOpeningHour = e.target.value.toString(); // Convert to string

    console.log(e.target.value, "debug e");
    console.log(branchId, "debug branchId");
    console.log(day, "debug day");
    console.log(field, "debug field");

    // Create a deep copy of the branch details
    const updatedBranchDetails = { ...(businessDetailEntity.businessDayDetailsByBranch || {}) };

    // Find the dayDetail for the specified day
    const dayDetail = updatedBranchDetails[branchId]?.find(detail => detail.day === day);

    console.log(dayDetail, "debug dayDetail");

    console.log(updatedBranchDetails, " updatedBranchDetails");

    console.log("dayDetail (before modification):", dayDetail);

    if (dayDetail?.openingHours?.length > 0) {
      // Create a new dayDetail object with the modified openingHours
      const updatedDayDetail = {
        ...dayDetail,
        openingHours: dayDetail.openingHours.map((hour, index) => {
          if (index === 0) {
            return {
              ...hour,
              [field]: newOpeningHour,
            };
          }
          return hour;
        }),
      };

      // Replace the existing dayDetail with the updated one
      updatedBranchDetails[branchId] = updatedBranchDetails[branchId].map(detail => {
        if (detail.day === day) {
          return updatedDayDetail;
        }
        return detail;
      });
    } else {
      console.log(dayDetail, 'dayDetail')
      const newDayDetail = {
        day,
        openingHours: [
          {
            from: newOpeningHour,
            to: newOpeningHour, // You can set both from and to to the same value
          },
        ],
        opensToday: false, status: "CLOSED"
      };

      console.log(newDayDetail, 'updated5')
      updatedBranchDetails[branchId] = [...updatedBranchDetails[branchId],newDayDetail];
    }

    console.log("updatedBranchDetails:", updatedBranchDetails);

    // Update the state with the modified branch details
    setBusinessDayDetailsByBranchMap({...updatedBranchDetails});
  };


  const handleAddOpeningHours = (branchIndex) => {
    // Create a new branch object with an empty opening hours field
    const newBranchDetails = {...businessDayDetailsByBranchMap};
    newBranchDetails[branchIndex] = {
      ...newBranchDetails[branchIndex],
      openingHours: {
        from: '',
        to: '',
      },
    };
    setBusinessDayDetailsByBranchMap(newBranchDetails);
  };



  console.log(businessDetailEntity.businessDayDetailsByBranch, 'lol');


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
  console.log(businessDetailEntity, 'businessDetailEntity');
// Function to format and validate time input
  const formatTime = (time) => {
    // Remove non-numeric characters and keep the first 8 characters (HH:mm:ss)
    const cleanedTime = time.replace(/[^\d:]/g, '').substring(0, 8);

    // Split the cleaned time string into hours, minutes, and seconds
    const [hh, mm, ss] = cleanedTime.split(':').map(part => parseInt(part, 10) || 0);

    // Format the time as "HH:mm:ss"
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
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

                <Table>
                  <thead>
                  <tr>
                    <th>Branch</th>
                    {dayOfWeekValues.map(day => (
                      <th key={day}>{translate(`tempApp.businessDetail.${day}`)}</th>
                    ))}
                    <th>Opens Today</th>
                    <th>Status</th>
                  </tr>
                  </thead>
                  <tbody>
                  {branchList.map(branch => {
                    const branchDetails = businessDetailEntity?.businessDayDetailsByBranch?.[branch.id];
                    return (
                      <tr key={branch.id}>
                        <td>{branch.name}</td>
                        {dayOfWeekValues.map((day, index) => {
                          const dayDetail = branchDetails
                            ? branchDetails.find(detail => detail.day === day)
                            : null;
                          return (
                            <td key={index}>
                              {dayDetail ? (
                                <div>
                                  {dayDetail.openingHours.length > 0 ? (
                                    <>
                                      <InputText
                                        type="text"
                                        defaultValue={dayDetail.openingHours[0].from}
                                        onChange={e => handleOpeningHourChange(e, branch.id, day, 'from')}
                                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                        placeholder="HH:mm:ss"
                                      />

                                      <InputText
                                        type="text"
                                        defaultValue={formatTime(dayDetail.openingHours[0].to)}
                                        onChange={e => handleOpeningHourChange(e, branch.id, day, 'to')}
                                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                        placeholder="HH:mm:ss"
                                      />
                                    </>
                                  ) : (
                                    // Render input fields for opening hours
                                    <>
                                      <InputText
                                        type="text"
                                        defaultValue=""
                                        onChange={e => handleOpeningHourChange(e, branch.id, day, 'from')}
                                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                        placeholder="HH:mm:ss"
                                      />

                                      <InputText
                                        type="text"
                                        defaultValue=""
                                        onChange={e => handleOpeningHourChange(e, branch.id, day, 'to')}
                                        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                        placeholder="HH:mm:ss"
                                      />
                                    </>
                                  )}
                                </div>
                              ) : (
                                // Render input fields for opening hours when "Closed"
                                <>
                                  <InputText
                                    type="text"
                                    defaultValue=""
                                    onChange={e => handleOpeningHourChange(e, branch.id, day, 'from')}
                                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                    placeholder="HH:mm:ss"
                                  />

                                  <InputText
                                    type="text"
                                    defaultValue=""
                                    onChange={e => handleOpeningHourChange(e, branch.id, day, 'to')}
                                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                    placeholder="HH:mm:ss"
                                  />
                                </>
                              )}
                            </td>
                          );
                        })}
                        <td>
                          {branchDetails ? (branchDetails[0]?.opensToday ? ("Yes") : ("No")) : null}
                        </td>
                        <td>{branchDetails && branchDetails[0].status}</td>
                      </tr>
                    );
                  })}
                  </tbody>
                </Table>


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
