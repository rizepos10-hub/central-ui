import React, { useState, useEffect, useMemo } from 'react';
import {  useNavigate } from 'react-router-dom';
import {Button, Row, Col, FormText, Table, ListGroup, ListGroupItem, Alert, Card} from 'reactstrap';
import {Card as PrimeCard} from 'primereact/card'
import {  Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { updateEntity, createEntity, getEntities, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import {InputText} from "primereact/inputtext";
import {Button as PrimeButton} from "primereact/button"
import {IBusinessDetail, Metric} from "app/shared/model/business-detail.model";
import {Checkbox} from "primereact/checkbox";
import { APIProvider, Map, MapMouseEvent, Marker } from '@vis.gl/react-google-maps';
import { RequestType, fromAddress, geocode, setKey } from 'react-geocode';
import { toast } from 'react-toastify';
import { InputNumber } from 'primereact/inputnumber';
import SearchPredictions from 'app/shared/components/google/search-predictions';
import usePlacesService from "react-google-autocomplete/lib/usePlacesAutocompleteService";
import _ from 'lodash';
import { RadioButton } from 'primereact/radiobutton';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';

export const BusinessDetailUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]

  const loading = useAppSelector(state => state.businessDetail.loading);
  const updating = useAppSelector(state => state.businessDetail.updating);
  const updateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);

  const isNew = businessDetailEntity === undefined;


  const [businessDetailsState, setBusinessDetailsState] = useState<IBusinessDetail>({
    businessName: '',
    slogan: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      fullAddress: '',
      longitude: 0,
      latitude: 0,
    },
    branchDetails: []
  });


  const [openResultMenu, setOpenResultMenu] = useState<boolean>(false);

  // key for geocode
  setKey(GOOGLE_MAPS_API_KEY)
  
  const {
    placesService,
    placePredictions,
    getPlacePredictions,
    isPlacePredictionsLoading,
  } = usePlacesService({
    apiKey: GOOGLE_MAPS_API_KEY,
  });

  const searchPredictionsChangeHandler = (e: React.ChangeEvent<HTMLInputElement>, branchIndex) => {
    getPlacePredictions({ input: e.target.value });
    handleBranchAddressFieldChange(branchIndex, {
      ...businessDetailsState?.branchDetails[branchIndex].address,
      fullAddress: e.target.value,
    });
    setOpenResultMenu(true);
  }

  const handlePredictionResultClick = (result: string, branchIndex) => {
      fromAddress(result).then((response) => {
          const { lat, lng } = response.results[0].geometry.location;
          handleBranchAddressFieldChange(branchIndex, {
            latitude: lat,
            longitude: lng,
            fullAddress: result
          });
      }).catch((error) => {
          console.log('Geocode error:', error);
      });
      setOpenResultMenu(false);
  }


  const predictionsTextResults = useMemo(() => {
    return placePredictions.map((prediction) => prediction.description);
  }, [placePredictions])

  const handleGeocode = (e: MapMouseEvent, branchIndex) => {
    geocode(RequestType.LATLNG, `${e.detail.latLng.lat},${e.detail.latLng.lng}`)
    .then(({ results }) => {
      handleBranchAddressFieldChange(branchIndex, {
        latitude: e.detail.latLng.lat,
        longitude: e.detail.latLng.lng,
        fullAddress: results[0].formatted_address
      });
    })
    .catch(err => (
      toast.error(`Error fetching address: ${err}`)
    ));
  }

  const [selectedAttachments, setSelectedAttachments]:any = useState(null)


  const [editingBranch, setEditingBranch] = useState(null);




  const handleBranchNameChange = (branchIndex, newName) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].name = newName;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };

  const handleWholesaleFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].wholesale = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };

  const handleAddressFieldChange = (branchIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    const branch = newData[branchIndex];

    if (!branch.address) {
      branch.address = {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        fullAddress: "",
        longitude: 0,
        latitude: 0,
      };
    }
    branch.address[field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };
  

  const handleBranchAddressFieldChange = (branchIndex, updates) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    const branch = newData[branchIndex];
  
    if (!branch.address) {
      branch.address = {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        fullAddress: "",
        longitude: 0,
        latitude: 0,
      };
    }
  
    Object.keys(updates).forEach(field => {
      branch.address[field] = updates[field];
    });
  
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
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
    if (updateSuccess) {
      handleClose();
    }

  }, [updateSuccess]);

  useEffect(() => {
    if (businessDetailEntity?.logo) {
      setSelectedAttachments(businessDetailEntity?.logo);

    }



    setBusinessDetailsState(businessDetailEntity)
    console.log("logged")




  }, [businessDetailEntity]);



  const saveEntity = values => {

    console.log(values, 'save')
    const entity :IBusinessDetail = {
      ...businessDetailEntity,
      ...values,
      logo:  selectedAttachments  ,
      branchDetails: businessDetailsState?.branchDetails,
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


  const defaultValues = isNew ? {}  : {
          ...businessDetailEntity,
       };






  console.log(selectedAttachments, 'selectedAttachments');



  const handleOpeningHourInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };


  const handleAddOpeningHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.push({ from: '', to: '' });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };

  const handleRemoveOpeningHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.splice(hourIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };


  const handleShiftInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };
  const handleAddShiftsHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts.push({ from: '', to: '' });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };

  const handleRemoveShiftsHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts.splice(hourIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData}));
  };

  const metrics = [Metric.KILOMETERS, Metric.MILES, Metric.NEUTRAL];
  
  const handleDeliveryConfiguration = (branchIndex, field, value) => {
    setBusinessDetailsState(prevState => {
      const newState = _.cloneDeep(prevState);
      _.set(newState.branchDetails[branchIndex].deliveryConfiguration, field, value);
      return newState;
    });
  };

  const handleFieldChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name.includes('.')) {
      const [fieldName, subFieldName] = name.split('.');
      setBusinessDetailsState({
        ...businessDetailsState,
        [fieldName]: {
          ...businessDetailsState[fieldName],
          [subFieldName]: value,
        },
      });
    } else {
      setBusinessDetailsState({
        ...businessDetailsState,
        [name]: value,
      });
    }
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
        <Col md="8"  className="d-flex flex-column p-3 ">
          <PrimeCard>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={businessDetailsState} onSubmit={saveEntity}>
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
                name="businessName"

                data-cy="value"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 30 }) },
                }}
                onChange={handleFieldChange}
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
                onChange={handleFieldChange}

              />
              {/* <ValidatedField
                label={'Logo'}
                id="item-image"
                name="image"
                data-cy="image"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              /> */}
              <div className='d-flex flex-column gap-2'>
                <div className='fw-light'>
                  Logo
                </div>
                <div className='w-25'>
                  {businessDetailsState && (
                    <MediaLibrary
                      sizePerPage={80}
                      handleFilesSelectCallback={(files) => setSelectedAttachments(transformAttachmentStructure(files, 'toIAttachment')[0])}
                      defaultValues={
                        businessDetailsState?.logo ?  transformAttachmentStructure([businessDetailsState.logo], 'toFileLibraryListItem') :
                        undefined
                      }
                    />
                  )}  
                </div>
                <div style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
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
                          onClick={() => setSelectedAttachments(() => null)}
                        >     <FontAwesomeIcon icon={faTrashAlt}  />
                        </div>}
                      </div>
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
                onChange={handleFieldChange}

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
                onChange={handleFieldChange}

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
                onChange={handleFieldChange}

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
                onChange={handleFieldChange}

              />

              {!isNew && <><h4>Opening Hours By Branch</h4><Alert color="warning">Please ensure that opening hours are
                provided in the following format: HH:mm:ss</Alert>
                <div>
                  {businessDetailsState?.branchDetails?.map((branch, branchIndex) => (
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

                          <label className="font-bold">Is Wholesale</label>
                          <Checkbox
                            checked={branch.wholesale}
                            onChange={(e) => handleWholesaleFlag(branchIndex, e.checked)}
                          />

                          <label className="font-bold my-2">Branch Address</label>
                          <div className='d-flex flex-column'>
                              
                            <SearchPredictions 
                              placeHolder="Search for an address"
                              handleInputChange={(e) => searchPredictionsChangeHandler(e, branchIndex)}
                              searchTerm={branch.address?.fullAddress || ''}
                              searchResults={predictionsTextResults}
                              isLoading={isPlacePredictionsLoading}
                              showResults={openResultMenu}
                              handleClick={(result) => handlePredictionResultClick(result, branchIndex)}
                            />
                            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                              <Map
                                style={{width: '500px', height: '500px'}}
                                defaultCenter={{lat: branch.address?.latitude || 0 , lng: branch.address?.longitude || 0}}
                                defaultZoom={3}
                                gestureHandling={'greedy'}
                                disableDefaultUI={true}
                                onClick={(e) => handleGeocode(e, branchIndex)}
                              >
                                <Marker position={{lat: branch.address?.latitude || 0 , lng: branch.address?.longitude || 0}} />
                              </Map>
                            </APIProvider>
                           
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
                          <div className="mt-2">
                            <Col>
                              <Row>
                                <label className="font-bold my-2">
                                  Delivery Configuration
                                </label>
                              </Row>

                              <div className='p-2'>
                                <Row>
                                  <label className="font-bold">
                                    Charge Per Distance
                                  </label>
                                </Row>
                                <div className='p-2'>
                                  <div className="flex flex-wrap gap-3">
                                    <div className='flex flex-column gap-1'>
                                      <label className='font-bold'>Distance</label>
                                      <InputNumber
                                        placeholder="Distance Value"
                                        value={branch.deliveryConfiguration?.chargePerDistance.distance.value}
                                        onChange={(e) => 
                                          handleDeliveryConfiguration(branchIndex, 'chargePerDistance.distance.value', e.value)
                                        }
                                      />
                                    </div>

                                    {metrics.map((metric, idx) => (
                                      <div className="flex align-items-center" key={idx}>
                                        <RadioButton
                                          inputId={`charge-metric-${idx}`}
                                          name={`charge-metric-${branchIndex}`}
                                          value={metric}
                                          checked={branch.deliveryConfiguration?.chargePerDistance?.distance?.metric === metric}
                                          onChange={(e) => handleDeliveryConfiguration(branchIndex, 'chargePerDistance.distance.metric', metric)}
                                        />
                                        <label htmlFor={`charge-metric-${idx}`} className="ml-2">{metric}</label>
                                      </div>
                                    ))}
                                  </div>

                                  <div className='flex flex-column gap-1'>
                                      <label className='font-bold'>Charge</label>
                                      <InputNumber
                                        placeholder="Charge"
                                        value={branch.deliveryConfiguration?.chargePerDistance.charge}
                                        onChange={(e) => handleDeliveryConfiguration(branchIndex, 'chargePerDistance.charge', e.value)}
                                      />
                                  </div>
                                </div>
                              </div>
                              <div className='p-2'>
                                <Row>
                                  <label className="font-bold">
                                    Shipment Range
                                  </label>
                                </Row>
                                
                                <div className="flex flex-wrap gap-3 p-2">
                                  <div className='flex flex-column gap-1'>
                                    <label className='font-bold'>Distance</label>
                                    <InputNumber
                                      placeholder="Distance Value"
                                      value={branch.deliveryConfiguration?.shipmentRange.value}
                                      onChange={(e) => handleDeliveryConfiguration(branchIndex, 'shipmentRange.value', e.value)}
                                    />
                                  </div>

                                  {metrics.map((metric, idx) => (
                                    <div className="flex align-items-center" key={idx}>
                                      <RadioButton
                                        inputId={`shipment-metric-${idx}`}
                                        name={`shipment-metric-${branchIndex}`}
                                        value={metric}
                                        checked={branch.deliveryConfiguration?.shipmentRange?.metric === metric}
                                        onChange={(e) => handleDeliveryConfiguration(branchIndex, 'shipmentRange.metric', metric)}
                                      />
                                      <label htmlFor={`shipment-metric-${idx}`} className="ml-2">{metric}</label>
                                    </div>
                                  ))}
                                </div>
                            </div>
                            <div className='p-2'>
                                <Row>
                                  <label className="font-bold">
                                    Minimum Charge
                                  </label>
                                </Row>

                                <InputNumber
                                  placeholder="Distance Value"
                                  value={branch.deliveryConfiguration?.minCharge}
                                  onChange={(e) => handleDeliveryConfiguration(branchIndex, 'minCharge', e.value)}
                                />
                            </div>
                            </Col>

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
                              <strong>Is Wholesale:</strong><Checkbox checked={branch?.wholesale} disabled />
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
                      <ListGroup className="d-flex gap-6">
                        {branch.days.map((day, dayIndex) => (
                          <Card key={day.day} className="d-flex flex-column">
                            <div className="d-flex flex-row align-items-center justify-content-between">

                                <strong className="text-xl">{day.day}</strong>

                               <strong className="text-xl">Opens {day.day} &nbsp; {day.opensToday ? 	<span>&#10003;</span> : <span>&#10007;</span>}</strong>

                              <strong className="text-xl"> Status: {day.status}</strong>
                            </div>
                            <br/>

                            <div className="d-flex justify-content-end mt-3">
                              <PrimeButton type="button" className="my-3" onClick={() => handleAddOpeningHour(branchIndex, dayIndex)}>
                                Add Opening Hour
                              </PrimeButton>
                            </div>

                           <h5><strong className="mb-3">Opening Hours:</strong> </h5>


                            {day.openingHours.map((openingHour, hourIndex) => (
                              <div key={hourIndex} className="d-flex flex-row align-items-center mb-3">

                                <label className="mr-2">From:</label>
                                  <InputText
                                    type="text"
                                    placeholder="HH:mm:ss"
                                    pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"

                                    value={openingHour.from}
                                    onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}/>

                                  <label className="ml-2 mr-2">To:</label>
                                  <InputText
                                    type="text"
                                    placeholder="HH:mm:ss"
                                    pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                    value={openingHour.to}
                                    onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}/>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm ml-2"
                                  onClick={() => handleRemoveOpeningHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </button>

                              </div>

                            ))}



                            <tr style={{ border: '1px solid rgba(0, 0, 0, 0.5)', color: 'black' }} className="border border-black my-3"/>
                            <br/>
                            <div className="d-flex justify-content-end">
                              <PrimeButton type="button" className="my-3" onClick={() => handleAddShiftsHour(branchIndex, dayIndex)}>
                                Add Shifts
                              </PrimeButton>
                            </div>
                            <h5><strong className="mb-3">Shifts:</strong></h5>



                            {day.shifts.map((shift, hourIndex) => (
                              <div key={hourIndex} className="d-flex flex-row align-items-center mb-3">

                                <label className="mr-2">Shift Name:</label>
                                <InputText
                                  type="text"
                                  placeholder="Enter shift name"

                                  value={shift.shiftName}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'shiftName', e.target.value)}/>

                                <label className="mx-2">From:</label>
                                <InputText
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"

                                  value={shift.from}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}/>

                                <label className="ml-2 mr-2">To:</label>
                                <InputText
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.to}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}/>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm ml-2"
                                  onClick={() => handleRemoveShiftsHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </button>

                              </div>

                            ))}
                            <div className="d-flex justify-content-end">
                            <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                              <FontAwesomeIcon icon="save" />
                              &nbsp;
                              <Translate contentKey="entity.action.save">Save</Translate>
                            </Button>
                            </div>
                          </Card>
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
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default BusinessDetailUpdate;
