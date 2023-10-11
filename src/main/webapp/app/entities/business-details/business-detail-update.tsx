import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, FormText, Table, ListGroup, ListGroupItem, Alert} from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from '../branch/branch.reducer';

import { getEntity, updateEntity, createEntity, getEntities, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { DayOfWeek } from 'app/shared/model/enumerations/day-of-week.model';
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {Calendar} from "primereact/calendar";
import {Checkbox} from "primereact/checkbox";
import {Button as PrimeButton} from "primereact/button"
import {IBusinessDetail} from "app/shared/model/business-detail.model";
const dayOfWeekValues = Object.keys(DayOfWeek);

export const BusinessDetailUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();

  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]

  const loading = useAppSelector(state => state.businessDetail.loading);
  const updating = useAppSelector(state => state.businessDetail.updating);
  const updateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);

  const isNew = businessDetailEntity === undefined;


  const [selectedAttachments, setSelectedAttachments]:any = useState(null)

  const branchList = useAppSelector(state => state.branch.entities);
  const [branchDetails, setBranchDetails] = useState([]);

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
      dispatch(getEntities({}))
    }
    dispatch(getEntities({}))
    dispatch(getBranches({}));

  }, []);

  useEffect(() => {
    if (businessDetailEntity?.logo) {
      setSelectedAttachments(businessDetailEntity?.logo);

    }
    if (businessDetailEntity?.branchDetails) {
      setBranchDetails(businessDetailEntity.branchDetails);
    }

    if (updateSuccess) {
      handleClose();
    }

  }, [updateSuccess, businessDetailEntity?.logo, businessDetailEntity?.address,businessDetailEntity?.branchDetails]);

  console.log(businessDetailEntity, 'lol4')

  const removeAttachment = (attachmentId) => {
    setSelectedAttachments((prevAttachments) =>
      prevAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };
  const saveEntity = values => {

    console.log(values, 'save')
    const entity :IBusinessDetail = {
      ...businessDetailEntity,
      ...values,
      logo:  selectedAttachments  ,
      branchDetails: branchDetails,
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
      setSelectedAttachments((imageInfo));
      console.log(imageInfo, 'helloi');

      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);

      return null;
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...businessDetailEntity,
        };





  console.log(branchDetails, 'lol');


  const handleInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(branchDetails));
    newData[branchIndex].days[dayIndex].openingHours[hourIndex][field] = value;
    setBranchDetails(newData);
  };


  const handleAddOpeningHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.push({ from: '', to: '' });
    setBranchDetails(newData);
  };

  const handleRemoveOpeningHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.splice(hourIndex, 1);
    setBranchDetails(newData);
  };




  console.log(businessDetailEntity, 'businessDetailEntity');

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.businessDetail.home.createOrEditLabel" data-cy="DetailCreateUpdateHeading">
            {isNew? 'Create Business Details' : "Edit Business Details"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
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
                label={'Name'}
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
                label={'Slogan'}
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
                  label={'Item Image'}
                  id="item-image"
                  name="image"
                  data-cy="image"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                <div className="mb-3">
                    <div style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
                      <img
                        src={selectedAttachments?.url}
                        alt={selectedAttachments?.name}
                        className="img-fluid"
                        style={{
                          maxWidth: '100px',
                          maxHeight: '100px',
                        }}
                      />
                      {selectedAttachments?.id && <div
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '50%',
                          padding: '2px',
                          cursor: 'pointer',
                        }}
                        onClick={() => removeAttachment(selectedAttachments?.id)}
                      >     <FontAwesomeIcon icon={faTrashAlt}  />
                      </div>
                      }

                    </div>




                </div>
              </div>
              <h4>Address Details</h4>
              <ValidatedField
                label={'Street'}
                id="details-address-street"
                name="address.street"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <ValidatedField
                label={'City'}
                id="details-address-city"
                name="address.city"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <ValidatedField
                label={'State'}
                id="details-address-state"
                name="address.state"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              <ValidatedField
                label={'PostalCode'}
                id="details-address-postalCode"
                name="address.postalCode"
                data-cy="value"
                type="text"
                validate={{
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                }}
              />
              {!isNew && <><h4>Opening Hours By Branch</h4><Alert color="warning">Please ensure that opening hours are
                provided in the following format: HH:mm:ss</Alert>
                <div>
                  {branchDetails?.map((branch, branchIndex) => (
                    <div className="d-flex flex-column gap-1 mb-3" key={branch.branchId}>
                      <h2>{getBranchName(branch.branchId)}</h2>
                      <ListGroup>
                        {branch.days.map((day, dayIndex) => (
                          <ListGroupItem key={day.day}>
                            <div className="d-flex flex-row align-items-center justify-content-between">

                            <strong>{day.day}</strong>
                              <strong>Opens {day.day} &nbsp; {day.opensToday ? 	<span>&#10003;</span> : <span>&#10007;</span>}</strong>


                              <strong> Status: {day.status}</strong>
                            </div>
                            <br/>
                            <strong className="mb-3">Opening Hours:</strong>

                            {day.openingHours.map((openingHour, hourIndex) => (
                              <div key={hourIndex} className="d-flex flex-row align-items-center">

                                  <label className="mr-2">From:</label>
                                  <InputText
                                    type="text"
                                    placeholder="HH:mm:ss"
                                    pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"

                                    value={openingHour.from}
                                    onChange={(e) => handleInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}/>

                                  <label className="ml-2 mr-2">To:</label>
                                  <InputText
                                    type="text"
                                    placeholder="HH:mm:ss"
                                    pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                    value={openingHour.to}
                                    onChange={(e) => handleInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}/>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm ml-2"
                                  onClick={() => handleRemoveOpeningHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </button>

                              </div>

                            ))}

                            <PrimeButton type="button" className="my-3"
                                         onClick={() => handleAddOpeningHour(branchIndex, dayIndex)}>Add Opening
                              Hour</PrimeButton>

                          </ListGroupItem>
                        ))}
                      </ListGroup>
                    </div>
                  ))}
               </div>
             </>
                  }






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
