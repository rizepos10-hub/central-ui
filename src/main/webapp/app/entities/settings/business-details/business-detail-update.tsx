import React, { useState, useEffect } from 'react';
import {  useNavigate } from 'react-router-dom';
import {Button, Row, Col, FormText, Table, ListGroup, ListGroupItem, Alert} from 'reactstrap';
import {  Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { updateEntity, createEntity, getEntities, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import {InputText} from "primereact/inputtext";
import {Button as PrimeButton} from "primereact/button"
import {IBusinessDetail} from "app/shared/model/business-detail.model";

export const BusinessDetailUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]

  const loading = useAppSelector(state => state.businessDetail.loading);
  const updating = useAppSelector(state => state.businessDetail.updating);
  const updateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);

  const isNew = businessDetailEntity === undefined;


  const [selectedAttachments, setSelectedAttachments]:any = useState(null)

  const [branchDetails, setBranchDetails] = useState([]);

  const [editingBranch, setEditingBranch] = useState(null);

  console.log(branchDetails, 'kfwpk')



  const handleBranchNameChange = (branchIndex, newName) => {
    const newData = JSON.parse(JSON.stringify(branchDetails));
    newData[branchIndex].name = newName;
    setBranchDetails(newData);
  };

  const handleAddressFieldChange = (branchIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(branchDetails));
    const branch = newData[branchIndex];

    if (!branch.address) {
      branch.address = {
        street: "",
        city: "",
        state: "",
        postalCode: ""
      };
    }
    branch.address[field] = value;
    setBranchDetails(newData);
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
                      <div className="d-flex justify-content-between">
                      {editingBranch === branchIndex ? (
                        <div className="d-flex flex-column">
                          <label className="font-bold">Branch Name</label>
                          <InputText
                            type="text"
                            value={branch.name}
                            onChange={(e) => handleBranchNameChange(branchIndex, e.target.value)}
                          />
                          <label className="font-bold my-2">Branch Address</label>

                          <div className='d-flex flex-column'>
                            <label className="font-bold">Street</label>

                            <InputText
                              type="text"
                              placeholder="Enter Street"
                              value={branch.address?.street}
                              onChange={(e) => handleAddressFieldChange(branchIndex, 'street', e.target.value)}
                            />
                            <label className="font-bold">City</label>

                            <InputText
                              type="text"
                              placeholder="Enter City"
                              value={branch.address?.city}
                              onChange={(e) => handleAddressFieldChange(branchIndex, 'city', e.target.value)}
                            />
                            <label className="font-bold">State</label>
                            <InputText
                              type="text"
                              placeholder="Enter State"
                              value={branch.address?.state}
                              onChange={(e) => handleAddressFieldChange(branchIndex, 'state', e.target.value)}
                            />
                            <label className="font-bold">Postal Code</label>
                            <InputText
                              type="text"
                              placeholder="Enter Postal Code"
                              value={branch.address?.postalCode}
                              onChange={(e) => handleAddressFieldChange(branchIndex, 'postalCode', e.target.value)}
                            />
                          </div>
                          <div className="ml-auto mt-2">
                          <Button
                            type="button"
                            className="btn btn-primary btn-sm ml-2"
                            onClick={() => setEditingBranch(null)}
                          >
                            Save
                          </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h2>{branch.name}</h2>
                            <div className="d-flex flex-column">
                              <h4>Branch Address</h4>
                              <p><strong>Street:</strong> {branch.address?.street}</p>
                              <p><strong>City:</strong> {branch.address?.city}</p>
                              <p><strong>State:</strong> {branch.address?.state}</p>
                              <p><strong>Postal Code:</strong> {branch.address?.postalCode}</p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            className="h-3rem"
                            onClick={() => setEditingBranch(branchIndex)}
                          >
                            <FontAwesomeIcon icon="pencil" />
                          </Button>
                            {editingBranch === branchIndex && (
                              <button
                                type="button"
                                className="btn btn-link"
                                onClick={() => setEditingBranch(null)}
                              >
                                <FontAwesomeIcon icon="pencil" />
                              </button>
                            )}
                        </>
                      )}
                    </div>
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
