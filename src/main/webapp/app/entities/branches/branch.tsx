import { useAppDispatch, useAppSelector } from 'app/config/store';
import React, { useEffect, useMemo, useState } from 'react';
import { getEntities, updateEntity, createEntity } from '../settings/business-details/business-detail.reducer';
import { TabPanel, TabView } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import SearchPredictions from 'app/shared/components/google/search-predictions';
import { ControlPosition, Map, MapMouseEvent, Marker } from '@vis.gl/react-google-maps';
import { Alert, Card, Col, Container, FormGroup, Input, Label, ListGroup, Row } from 'reactstrap';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton } from 'primereact/radiobutton';
import { InputSwitch } from 'primereact/inputswitch';
import { IBusinessDetail, Metric } from 'app/shared/model/business-detail.model';
import { RequestType, fromAddress, geocode, setKey } from 'react-geocode';
import { toast } from 'react-toastify';
import usePlacesService from 'react-google-autocomplete/lib/usePlacesAutocompleteService';
import _ from 'lodash';
import MapHandler from 'app/shared/components/google/map-handler';
import { AutocompleteMode, CustomMapControl, autocompleteModes } from 'app/shared/components/google/map-control';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate } from 'react-jhipster';
import BranchPaymentConfig from '../settings/business-details/branch-payment-config';
import { Dialog } from 'primereact/dialog';
import Select from 'react-select'
import { getEntities as getZones } from 'app/entities/settings/zones/zones.reducer'

export const Branches = () => {
  const dispatch = useAppDispatch();

  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]
  const zones = useAppSelector(state => state.zones.entities)

  const updating = useAppSelector(state => state.businessDetail.updating);

  const isNew = businessDetailEntity === undefined;

  const [activeIndex, setActiveIndex] = useState(0);
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
  const [editingBranchPayments, setEditingBranchPayments] = useState(null);
  const [editPaymentIndex, setEditingPaymentIndex] = useState(null);

  const showDialog = (branch, index) => {
    setEditingBranchPayments(branch.paymentConfigurations)
    setEditingPaymentIndex(index)
  }

  const hideDialog = () => {
    setEditingBranchPayments(null)
  }

  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);

  const metrics = [Metric.KILOMETERS, Metric.MILES, Metric.NEUTRAL];

  // key for geocode
  setKey(GOOGLE_MAPS_API_KEY)

  useEffect(() => {
    dispatch(getEntities({})).then((res: any) => setBusinessDetailsState(res.payload.data[0]));
    dispatch(getZones({}))
  }, []);

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

  const handleBranchNameChange = (branchIndex, newName) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].name = newName;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleWholesaleFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].wholesale = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
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
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleCODChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].activeCOD = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
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

  const handleDeliveryConfiguration = (branchIndex, field, value) => {
    setBusinessDetailsState(prevState => {
      const newState = _.cloneDeep(prevState);

      // Check if deliveryConfiguration is null and initialize it if necessary
      if (!newState.branchDetails[branchIndex].deliveryConfiguration) {
        newState.branchDetails[branchIndex].deliveryConfiguration = {
          chargePerDistance: {
            charge: 0,
            distance: {
              metric: undefined,
              value: 0,
            }
          },
          shipmentRange: {
            metric: undefined,
            value: 0,
          },
          minCharge: 0,
          definedChargeRules: [],
        };
      }

      _.set(newState.branchDetails[branchIndex].deliveryConfiguration, field, value);
      return newState;
    });
  };


  const handleOpeningHourInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleAddOpeningHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.push({ from: '', to: '' });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleRemoveOpeningHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.splice(hourIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleShiftInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };
  const handleAddShiftsHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts.push({ from: '', to: '' });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleRemoveShiftsHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts.splice(hourIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleZoneChange = (selectedZones, branchIndex) => {
    setBusinessDetailsState((prev) => ({
      ...prev, branchDetails: prev.branchDetails.map((branch, i) => {
        if (i === branchIndex) {
          return { ...branch, zones: selectedZones.map(zone => ({ id: zone.id, name: zone.name })) };
        }
        return branch;
      })
    }));
  }

  useEffect(() => {
    if (selectedPlace) {
      selectePlaceHandler(selectedPlace, activeIndex);
    }
  }, [selectedPlace]);

  const selectePlaceHandler = (place: google.maps.places.PlaceResult | null, branchIndex) => {
    fromAddress(place.formatted_address).then((response) => {
      const { lat, lng } = response.results[0].geometry.location;
      handleBranchAddressFieldChange(branchIndex, {
        latitude: lat,
        longitude: lng,
        fullAddress: place
      });
    }).catch((error) => {
      console.error('Geocode error:', error);
    });
  };


  const saveEntity = () => {
    const entity: IBusinessDetail = {
      ...businessDetailEntity,
      // change the coordinates sent inside every zone in the branches in the array
      branchDetails: businessDetailsState?.branchDetails?.map(branch => {
        return {
          ...branch, zones: branch.zones?.map(zone => {
            return {
              ...zone, coordinates: zone.coordinates?.map(coordinate => {
                return { x: coordinate.x, y: coordinate.y };
              })
            };
          })
        };
      }),
    };

    if (isNew) {
      dispatch(createEntity(entity)).then(() => {
        dispatch(getEntities({}));
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        dispatch(getEntities({}));
      });
    }
  };

  const handleSavePayments = () => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[editPaymentIndex].paymentConfigurations = editingBranchPayments;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
    hideDialog();
  }

  const handleAddChargeRule = (branchIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].deliveryConfiguration.definedChargeRules.push({
      minDistance: {
        value: 0,
        metric: 'KILOMETERS'
      },
      maxDistance: {
        value: 0,
        metric: 'KILOMETERS'
      },
      charge: 0,
      orderAmount: 0,
    });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  }

  const handleDeleteChargeRule = (branchIndex, chargeRuleIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].deliveryConfiguration.definedChargeRules.splice(chargeRuleIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  }

  const dialogFooterTemplate = () => {
    return <Button label="Save" type={"submit"} icon="pi pi-check" onClick={() => handleSavePayments()} />;
  };

  return (
    <form className="d-flex align-items-start w-100">
      <div className="nav flex-column nav-pills me-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
        {businessDetailsState?.branchDetails?.map((branch, index) => (
          <button
            key={index}
            className={`nav-link ${activeIndex === index ? 'fw-bolder text-decoration-underline' : 'opacity-75'} fs-6`}
            id={`v-pills-${index}-tab`}
            data-bs-toggle="pill"
            data-bs-target={`#v-pills-${index}`}
            type="button"
            role="tab"
            aria-controls={`v-pills-${index}`}
            aria-selected="true"
            onClick={() => setActiveIndex(index)}
            style={{
              width: '160px',
            }}
          >
            {branch.name}
          </button>
        ))}
      </div>
      <div className="tab-content w-100" id="v-pills-tabContent">
        {businessDetailsState?.branchDetails?.map((branch, branchIndex) => (
          <div
            key={branchIndex}
            className={`tab-pane fade ${activeIndex === branchIndex ? 'show active' : ''}`}
            id={`v-pills-${branchIndex}`}
            role="tabpanel"
            aria-labelledby={`v-pills-${branchIndex}-tab`}
          >
            <TabView className='w-100'>
              <TabPanel header="Details">
                <div className="d-flex flex-column">
                  <label className="font-bold">Branch Name</label>
                  <InputText
                    type="text"
                    value={branch.name}
                    onChange={(e) => handleBranchNameChange(branchIndex, e.target.value)}
                  />
                  <label className="font-bold mt-3">Is Wholesale</label>
                  <Checkbox
                    checked={branch.wholesale}
                    onChange={(e) => handleWholesaleFlag(branchIndex, e.checked)}
                  />

                  <label className="font-bold mt-3">Payment</label>
                  <Button
                    label="Payment Configs"
                    type={"button"}
                    icon="pi pi-external-link"
                    style={{
                      width: '160px',
                    }}
                    onClick={() => showDialog(branch, branchIndex)}
                  />
                  <Dialog
                    header="payment config" visible={editingBranchPayments} style={{ width: '75vw' }} maximizable
                    modal draggable={false} contentStyle={{ height: '300px' }} onHide={hideDialog}
                    footer={dialogFooterTemplate}
                  >
                    <BranchPaymentConfig
                      editingBranchPayments={editingBranchPayments}
                      setEditingBranchPayments={setEditingBranchPayments}
                    />
                  </Dialog>

                  <label className="font-bold mt-3">Zones</label>
                  <Select
                    value={branch.zones}
                    isMulti={true}
                    options={zones}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={(e) => handleZoneChange(e, activeIndex)}
                  />

                </div>
              </TabPanel>
              <TabPanel header="Address">
                <div className='d-flex gap-5'>
                  <div>
                    <label className="font-bold my-2">Branch Address</label>
                    <div className='d-flex flex-column'>
                      <Map
                        style={{ width: '500px', height: '500px' }}
                        defaultZoom={3}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        onClick={(e) => handleGeocode(e, branchIndex)}
                        defaultCenter={{ lat: branch.address?.latitude || 0, lng: branch.address?.longitude || 0 }}
                      >
                        <Marker position={{ lat: branch.address?.latitude || 0, lng: branch.address?.longitude || 0 }} />

                        <CustomMapControl
                          controlPosition={ControlPosition.TOP}
                          selectedAutocompleteMode={autocompleteModes[0]}
                          onPlaceSelect={setSelectedPlace}
                        />
                      </Map>
                    </div>
                  </div>
                  <div className='d-flex flex-column gap-2 w-100'>
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
                </div>
              </TabPanel>
              <TabPanel header="Delivery Configuration">
                <>
                  <div>
                    <Col>
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
                                  onClick={(e) => handleDeliveryConfiguration(branchIndex, 'chargePerDistance.distance.metric', metric)}
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
                                onClick={(e) => handleDeliveryConfiguration(branchIndex, 'shipmentRange.metric', metric)}
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

                    <div className='p-2'>
                      <Row>
                        <label className="font-bold">
                          Cash on Delivery
                        </label>
                      </Row>
                      <InputSwitch
                        checked={branch?.activeCOD}
                        onChange={(e) => handleCODChange(branchIndex, e.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Col>
                      <Row className="mb-2">
                        <Col>
                          <Button color="primary" onClick={() => handleAddChargeRule(branchIndex)} type='button'>Add Charge</Button>
                        </Col>
                      </Row>
                      {branch.deliveryConfiguration?.definedChargeRules.map((chargeRule, chargeRuleIndex) => (
                        <Row className='align-items-center' key={chargeRuleIndex}>
                          <Col md={2}>
                            <FormGroup>
                              <Label for="minDistance">Min Distance</Label>
                              <InputNumber
                                type="text"
                                name="minDistance"
                                id="minDistance"
                                placeholder="Enter Min Distance"
                                value={chargeRule.minDistance.value}
                                onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].minDistance.value`, e.value)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md={2}>
                            <FormGroup>
                              <Label for="maxDistance">Max Distance</Label>
                              <InputNumber
                                type="text"
                                name="maxDistance"
                                id="maxDistance"
                                placeholder="Enter Max Distance"
                                value={chargeRule.maxDistance.value}
                                onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].maxDistance.value`, e.value)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md={2}>
                            <FormGroup>
                              <Label for="charge">Charge</Label>
                              <InputNumber
                                type="text"
                                name="charge"
                                id="charge"
                                placeholder="Enter Charge"
                                value={chargeRule.charge}
                                onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].charge`, e.value)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md={2}>
                            <FormGroup>
                              <Label for="minOrderAmount">Minimum Order Amount</Label>
                              <InputNumber
                                type="text"
                                name="orderAmount"
                                id="orderAmount"
                                placeholder="Enter Minimum Order Amount"
                                value={chargeRule.orderAmount}
                                onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].orderAmount`, e.value)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md={2}>
                            <FormGroup>
                              <Label for="metric">Metric</Label>
                              {metrics.map((metric, idx) => (
                                <div className="flex align-items-center" key={idx}>
                                  <RadioButton
                                    inputId={`charge-metric-${idx}`}
                                    name={`charge-metric-${chargeRuleIndex}`}
                                    value={metric}
                                    checked={chargeRule.maxDistance.metric === metric}
                                    onClick={(e) => {
                                      handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].maxDistance.metric`, metric)
                                      handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].minDistance.metric`, metric)
                                    }}
                                  />
                                  <label htmlFor={`charge-metric-${idx}`} className="ml-2">{metric}</label>
                                </div>
                              ))}
                            </FormGroup>
                          </Col>
                          <Col md={2}>
                            <Button color="danger" onClick={() => handleDeleteChargeRule(branchIndex, chargeRuleIndex)} type='button'>Delete</Button>
                          </Col>
                        </Row>
                      ))}
                    </Col>
                  </div>
                </>
              </TabPanel>
              <TabPanel header="Opening Hours">
                <div>
                  <h4>Opening Hours By Branch</h4>
                  <Alert color="warning">Please ensure that opening hours are
                    provided in the following format: <b>HH:mm:ss</b>
                  </Alert>
                </div>
                <div>
                  <ListGroup className="d-flex flex-column gap-1">
                    {branch.days.map((day, dayIndex) => (
                      <Card key={day.day} className="d-flex flex-column py-0 px-3">
                        <div className="d-flex flex-row align-items-center justify-content-between">
                          <strong className="fs-6">{day.day}</strong>
                          <strong className="fs-6">Opens {day.day} &nbsp; {day.opensToday ? <span>&#10003;</span> : <span>&#10007;</span>}</strong>
                          <strong className="fs-6"> Status: {day.status}</strong>
                        </div>

                        <div style={{ border: '1px solid rgba(0, 0, 0, 0.5)', color: 'black' }} className="border border-black my-3" />

                        <div className='row'>
                          <div className='border-end col-5'>
                            <Button type="button" className="my-2 p-1" onClick={() => handleAddOpeningHour(branchIndex, dayIndex)} >
                              Add Opening Hour
                            </Button>

                            {day.openingHours.map((openingHour, hourIndex) => (
                              <div key={hourIndex} className="d-flex flex-row align-items-center mb-3">

                                <label className="mr-2">From:</label>
                                <InputText
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={openingHour.from}
                                  onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}
                                  className='w-25'
                                />

                                <label className="mx-2">To:</label>
                                <InputText
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={openingHour.to}
                                  onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}
                                  className='w-25'
                                />

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm ml-2"
                                  onClick={() => handleRemoveOpeningHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </button>

                              </div>
                            ))}
                          </div>
                          <div className='col-7'>
                            <div className="d-flex">
                              <Button type="button" className="my-2 p-1" onClick={() => handleAddShiftsHour(branchIndex, dayIndex)}>
                                Add Shifts
                              </Button>
                            </div>
                            {day.shifts.map((shift, hourIndex) => (
                              <div key={hourIndex} className="d-flex flex-row align-items-center mb-3">
                                <label className="mr-2">Name:</label>
                                <InputText
                                  type="text"
                                  placeholder="Enter shift name"
                                  value={shift.shiftName}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'shiftName', e.target.value)}
                                  className='w-25'
                                />
                                <label className="mx-2">From:</label>
                                <InputText
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.from}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}
                                  className='w-25'
                                />

                                <label className="mx-2">To:</label>
                                <InputText
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.to}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}
                                  className='w-25'
                                />

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm ml-2"
                                  onClick={() => handleRemoveShiftsHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </ListGroup>
                </div>
              </TabPanel>
            </TabView>
          </div>
        ))}

        <Button color="primary" id="save-entity" type='button' data-cy="entityCreateSaveButton" disabled={updating} onClick={saveEntity} className='mt-2'>
          <FontAwesomeIcon icon="save" />
          &nbsp;
          <Translate contentKey="entity.action.save">Save</Translate>
        </Button>
      </div>
    </form>
  )
};

export default Branches;
