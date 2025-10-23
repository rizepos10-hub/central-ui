import { useAppDispatch, useAppSelector } from 'app/config/store';
import React, { useEffect, useState } from 'react';
import { getEntities, updateEntity, createEntity } from '../settings/business-details/business-detail.reducer';
import { ControlPosition, Map, MapMouseEvent, Marker, useMap } from '@vis.gl/react-google-maps';
import { IBusinessDetail, Metric, UnitCostCalculationMode, dayTypeEnum, IBranchDetails, DeliveryTaggingModeEnum } from 'app/shared/model/business-detail.model';
import { RequestType, fromAddress, geocode, setKey } from 'react-geocode';
import { toast } from 'react-toastify';
import _ from 'lodash';
import { CustomMapControl, autocompleteModes } from 'app/shared/components/google/map-control';
import { Save, AlertTriangle } from 'lucide-react';
import { Translate } from 'react-jhipster';
import BranchPaymentConfig from '../settings/business-details/branch-payment-config';
import Select from 'react-select'
import { getEntities as getZones } from 'app/entities/settings/zones/zones.reducer'
import { EndingType } from 'app/shared/model/ENUMS/ending-type.model';
import { EndOfDayReportSection } from 'app/shared/model/ENUMS/end-of-day-report-section.model';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export enum AddressTypesEnum {
  "premise" = "premise",
  "plus_code" = "plus_code",
  "administrative_area_level_1" = "administrative_area_level_1",
  "administrative_area_level_2" = "administrative_area_level_2",
  "political" = "political",
  "country" = "country",
  "locality" = "locality",
  "route" = "route",
}

export enum AddressComponentTypesEnum {
  "plus_code" = "plus_code",
  "administrative_area_level_1" = "administrative_area_level_1",
  "administrative_area_level_2" = "administrative_area_level_2",
  "political" = "political",
  "country" = "country",
  "locality" = "locality",
}

export const Branches = () => {
  const dispatch = useAppDispatch();

  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]
  const zones = useAppSelector(state => state.zones.entities)

  const updating = useAppSelector(state => state.businessDetail.updating);

  const isNew = businessDetailEntity === undefined;

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
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

  const handleEndOfDayReportSectionChange = (branchIndex: number, selectedOptions: any) => {
    const selectedSections = selectedOptions.map((option: any) => option.value as EndOfDayReportSection);
    const newData = JSON.parse(JSON.stringify(businessDetailsState.branchDetails));
    newData[branchIndex].endOfDayReportSection = selectedSections;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };


  const endOfDayReportSectionOptions = Object.keys(EndOfDayReportSection).map(section => ({
    value: EndOfDayReportSection[section as keyof typeof EndOfDayReportSection],
    label: EndOfDayReportSection[section as keyof typeof EndOfDayReportSection],
  }));

  const metrics = [Metric.KILOMETERS, Metric.MILES, Metric.NEUTRAL];

  // key for geocode
  setKey(GOOGLE_MAPS_API_KEY)

  const map = useMap();

  useEffect(() => {
    dispatch(getEntities({})).then((res: any) => {
      const businessData = res.payload.data[0];
      setBusinessDetailsState(businessData);
      // Initialize payment configurations for the first branch
      if (businessData?.branchDetails?.length > 0) {
        const firstBranch = businessData.branchDetails[0];
        // Initialize paymentConfigurations array if it doesn't exist
        if (!firstBranch.paymentConfigurations) {
          firstBranch.paymentConfigurations = [];
        }
        setEditingBranchPayments(firstBranch.paymentConfigurations);
        setEditingPaymentIndex(0);
      }
    });
    dispatch(getZones({}))
  }, []);

  const handleGeocode = (e: MapMouseEvent, branchIndex) => {
    geocode(RequestType.LATLNG, `${e.detail.latLng.lat},${e.detail.latLng.lng}`)
      .then(({ results }) => {
        const country = results.find(r => r.types.includes(AddressTypesEnum.country))?.formatted_address || ''
        const state = results.find(r => r.types.includes(AddressTypesEnum.administrative_area_level_1))?.formatted_address || ''
        const city = results.find(r => r.types.includes(AddressTypesEnum.administrative_area_level_2))?.formatted_address || ''
        const street = results.find(r => r.types.includes(AddressTypesEnum.route))?.formatted_address || ''
        const address = results[0]?.formatted_address || ''

        handleBranchAddressFieldChange(branchIndex, {
          latitude: e.detail.latLng.lat,
          longitude: e.detail.latLng.lng,
          fullAddress: results[0].formatted_address,
          country,
          state,
          city,
          street,
          address
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

  const handleImageChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    console.log(value, 'value')
    newData[branchIndex].logo = value?.[0];
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleWholesaleFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].wholesale = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleEBTEligibleFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].ebteligible = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleTokenExpiredFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].tokenExpired = checked;
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
          deliveryTaggingMode: DeliveryTaggingModeEnum.UNRESTRICTED,
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
    newData[branchIndex].days[dayIndex].openingHours.push({ from: '', to: '', dayType: 'TODAY' });
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

  const handleEndingTypeChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].endingType = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleSelectedDayTypeChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleUnitCostCalculationModeChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].unitCostCalculationMode = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
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

  const handlePaymentConfigChange = (branchIndex: number, paymentConfigs: any[]) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    if (!newData[branchIndex].paymentConfigurations) {
      newData[branchIndex].paymentConfigurations = [];
    }
    newData[branchIndex].paymentConfigurations = paymentConfigs;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
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

  const handleDetailsChange = (index: number, branch: any, branchIndex: number) => {
    setEditingPaymentIndex(branchIndex)
    setActiveBranchIndex(index)
    setEditingBranchPayments(branch.paymentConfigurations || [])
  }

  const handleDeleteChargeRule = (branchIndex, chargeRuleIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].deliveryConfiguration.definedChargeRules.splice(chargeRuleIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  }

  const dialogFooterTemplate = () => {
    return (
      <Button type="submit" onClick={() => handleSavePayments()} className="h-7 text-xs">
        <Save className="h-3 w-3 mr-1" />
        Save
      </Button>
    );
  };

  return (
    <PageWrapper>
      <Tabs
        value={String(activeIndex)}
        onValueChange={(v) => {
          const index = Number(v);
          setActiveIndex(index);
          const branch = businessDetailsState?.branchDetails?.[index];
          if (branch) {
            // Update payment configurations when switching branches
            const paymentConfigs = branch.paymentConfigurations || [];
            setEditingBranchPayments(paymentConfigs);
            setEditingPaymentIndex(index);

            // Initialize paymentConfigurations array if it doesn't exist
            if (!branch.paymentConfigurations) {
              const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
              newData[index].paymentConfigurations = [];
              setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
            }
          }
        }}
        className="flex gap-4"
        orientation="vertical"
      >
        <TabsList className="h-auto flex-col items-stretch w-48 bg-muted/30">
          {businessDetailsState?.branchDetails?.map((branch, index) => (
            <TabsTrigger
              key={index}
              value={String(index)}
              className="justify-start text-xs h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">
          {businessDetailsState?.branchDetails?.map((branch, branchIndex) => (
            <TabsContent
              key={branchIndex}
              value={String(branchIndex)}
              className="mt-0"
            >
            <Tabs value={String(activeBranchIndex)} onValueChange={(v) => handleDetailsChange(Number(v), branch, branchIndex)} className='w-100'>
              <TabsList className="h-9 w-full justify-start">
                <TabsTrigger value="0" className="text-xs h-7">Details</TabsTrigger>
                <TabsTrigger value="1" className="text-xs h-7">Address</TabsTrigger>
                <TabsTrigger value="2" className="text-xs h-7">Delivery Configuration</TabsTrigger>
                <TabsTrigger value="3" className="text-xs h-7">Opening Hours</TabsTrigger>
                <TabsTrigger value="4" className="text-xs h-7">Inventory Settings</TabsTrigger>
                <TabsTrigger value="5" className="text-xs h-7">Payment Configuration</TabsTrigger>
              </TabsList>
              <TabsContent value="0">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Branch Name</Label>
                    <Input
                      type="text"
                      value={branch.name || ''}
                      onChange={(e) => handleBranchNameChange(branchIndex, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Image</Label>
                    <MediaLibrary
                      handleFilesSelectCallback={files =>
                        handleImageChange(
                          branchIndex,
                          transformAttachmentStructure(files, 'toIAttachment')
                        )
                      }
                      defaultValues={transformAttachmentStructure(branch.logo ? [branch.logo] : [], 'toFileLibraryListItem')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.wholesale}
                      onCheckedChange={(checked) => handleWholesaleFlag(branchIndex, checked)}
                      id={`wholesale-${branchIndex}`}
                    />
                    <Label htmlFor={`wholesale-${branchIndex}`} className="font-bold text-xs cursor-pointer">Is Wholesale</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.ebteligible}
                      onCheckedChange={(checked) => handleEBTEligibleFlag(branchIndex, checked)}
                      id={`ebt-${branchIndex}`}
                    />
                    <Label htmlFor={`ebt-${branchIndex}`} className="font-bold text-xs cursor-pointer">Is EBT Eligible</Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Ending Type</Label>
                    <Select
                      value={{ label: branch.endingType, value: branch.endingType }}
                      options={Object.values(EndingType).map(type => ({ label: type, value: type }))}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      onChange={(selectedOption) => handleEndingTypeChange(branchIndex, selectedOption?.value)}
                      placeholder="Select Ending Type.."
                      className="text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Show End Of Day Report Section</Label>
                    <Select
                      isMulti
                      value={branch.endOfDayReportSection?.map(section => ({ value: section, label: section }))}
                      onChange={(selectedOptions) => handleEndOfDayReportSectionChange(branchIndex, selectedOptions)}
                      options={endOfDayReportSectionOptions}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.tokenExpired}
                      onCheckedChange={(checked) => handleTokenExpiredFlag(branchIndex, checked)}
                      id={`token-${branchIndex}`}
                    />
                    <Label htmlFor={`token-${branchIndex}`} className="font-bold text-xs cursor-pointer">Should token expire?</Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Zones</Label>
                    <Select
                      value={branch.zones}
                      isMulti={true}
                      options={zones}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(e) => handleZoneChange(e, activeIndex)}
                      className="text-xs"
                    />
                  </div>

                </div>
              </TabsContent>
              <TabsContent value="1">
                <div className='flex gap-5'>
                  <div>
                    <Label className="font-bold text-xs my-2">Branch Address</Label>
                    <div className='flex flex-col'>
                      <MapComponent
                        branch={branch}
                        branchIndex={branchIndex}
                        handleGeocode={handleGeocode}
                        handleBranchAddressFieldChange={handleBranchAddressFieldChange}
                      />
                    </div>
                  </div>
                  <div className='flex flex-col gap-2 w-100'>
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">Street</Label>
                      <Input
                        type="text"
                        placeholder="Enter Street"
                        value={branch.address?.street || ''}
                        onChange={(e) => handleAddressFieldChange(branchIndex, 'street', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">City</Label>
                      <Input
                        type="text"
                        placeholder="Enter City"
                        value={branch.address?.city || ''}
                        onChange={(e) => handleAddressFieldChange(branchIndex, 'city', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">State</Label>
                      <Input
                        type="text"
                        placeholder="Enter State"
                        value={branch.address?.state || ''}
                        onChange={(e) => handleAddressFieldChange(branchIndex, 'state', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">Postal Code</Label>
                      <Input
                        type="text"
                        placeholder="Enter Postal Code"
                        value={branch.address?.postalCode || ''}
                        onChange={(e) => handleAddressFieldChange(branchIndex, 'postalCode', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">Email</Label>
                      <Input
                        type="text"
                        placeholder="Enter Email"
                        value={branch.address?.email || ''}
                        onChange={(e) => handleAddressFieldChange(branchIndex, 'email', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">Phone Number</Label>
                      <Input
                        type="text"
                        placeholder="Enter Phone Number"
                        value={branch.address?.phoneNumber || ''}
                        onChange={(e) => handleAddressFieldChange(branchIndex, 'phoneNumber', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="2">
                <>
                  <div>
                    <div className='p-2'>
                      <div className='mb-4'>
                        <Label className="font-bold text-xs mb-2 block">
                          Charge Per Distance
                        </Label>
                        <div className='p-2 space-y-3'>
                          <div className="flex flex-wrap gap-3">
                            <div className='flex flex-col gap-1'>
                              <Label className='font-bold text-xs'>Distance</Label>
                              <Input
                                type="number"
                                placeholder="Distance Value"
                                value={branch.deliveryConfiguration?.chargePerDistance.distance.value || ''}
                                onChange={(e) =>
                                  handleDeliveryConfiguration(branchIndex, 'chargePerDistance.distance.value', Number(e.target.value))
                                }
                                className="h-7 text-xs"
                              />
                            </div>

                            <RadioGroup
                              value={branch.deliveryConfiguration?.chargePerDistance?.distance?.metric}
                              onValueChange={(value) => handleDeliveryConfiguration(branchIndex, 'chargePerDistance.distance.metric', value)}
                              className="flex flex-wrap gap-3"
                            >
                              {metrics.map((metric, idx) => (
                                <div className="flex items-center gap-2" key={idx}>
                                  <RadioGroupItem
                                    value={metric}
                                    id={`charge-metric-${branchIndex}-${idx}`}
                                  />
                                  <Label htmlFor={`charge-metric-${branchIndex}-${idx}`} className="text-xs cursor-pointer">{metric}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          <div className='flex flex-col gap-1'>
                            <Label className='font-bold text-xs'>Charge</Label>
                            <Input
                              type="number"
                              placeholder="Charge"
                              value={branch.deliveryConfiguration?.chargePerDistance.charge || ''}
                              onChange={(e) => handleDeliveryConfiguration(branchIndex, 'chargePerDistance.charge', Number(e.target.value))}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div className='mb-4'>
                        <Label className="font-bold text-xs mb-2 block">
                          Shipment Range
                        </Label>

                        <div className="flex flex-wrap gap-3 p-2">
                          <div className='flex flex-col gap-1'>
                            <Label className='font-bold text-xs'>Distance</Label>
                            <Input
                              type="number"
                              placeholder="Distance Value"
                              value={branch.deliveryConfiguration?.shipmentRange.value || ''}
                              onChange={(e) => handleDeliveryConfiguration(branchIndex, 'shipmentRange.value', Number(e.target.value))}
                              className="h-7 text-xs"
                            />
                          </div>

                          <RadioGroup
                            value={branch.deliveryConfiguration?.shipmentRange?.metric}
                            onValueChange={(value) => handleDeliveryConfiguration(branchIndex, 'shipmentRange.metric', value)}
                            className="flex flex-wrap gap-3"
                          >
                            {metrics.map((metric, idx) => (
                              <div className="flex items-center gap-2" key={idx}>
                                <RadioGroupItem
                                  value={metric}
                                  id={`shipment-metric-${branchIndex}-${idx}`}
                                />
                                <Label htmlFor={`shipment-metric-${branchIndex}-${idx}`} className="text-xs cursor-pointer">{metric}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                      <div className='mb-4'>
                        <Label className="font-bold text-xs mb-2 block">
                          Minimum Charge
                        </Label>

                        <Input
                          type="number"
                          placeholder="Distance Value"
                          value={branch.deliveryConfiguration?.minCharge || ''}
                          onChange={(e) => handleDeliveryConfiguration(branchIndex, 'minCharge', Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>

                    <div className='p-2'>
                      <div className='mb-4'>
                        <Label className="font-bold text-xs mb-2 block">
                          Cash on Delivery
                        </Label>
                        <Checkbox
                          checked={branch?.activeCOD}
                          onCheckedChange={(checked) => handleCODChange(branchIndex, checked)}
                          id={`cod-${branchIndex}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className='space-y-4'>
                      <div className="mb-2">
                        <Button onClick={() => handleAddChargeRule(branchIndex)} type='button' className="h-7 text-xs">Add Charge</Button>
                      </div>
                      {branch.deliveryConfiguration?.definedChargeRules.map((chargeRule, chargeRuleIndex) => (
                        <div className='grid grid-cols-1 md:grid-cols-6 gap-2 items-end' key={chargeRuleIndex}>
                          <div>
                            <Label htmlFor="minDistance" className="text-xs">Min Distance</Label>
                            <Input
                              type="number"
                              name="minDistance"
                              id="minDistance"
                              placeholder="Enter Min Distance"
                              value={chargeRule.minDistance.value || ''}
                              onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].minDistance.value`, Number(e.target.value))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxDistance" className="text-xs">Max Distance</Label>
                            <Input
                              type="number"
                              name="maxDistance"
                              id="maxDistance"
                              placeholder="Enter Max Distance"
                              value={chargeRule.maxDistance.value || ''}
                              onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].maxDistance.value`, Number(e.target.value))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="charge" className="text-xs">Charge</Label>
                            <Input
                              type="number"
                              name="charge"
                              id="charge"
                              placeholder="Enter Charge"
                              value={chargeRule.charge || ''}
                              onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].charge`, Number(e.target.value))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="minOrderAmount" className="text-xs">Min Order Amount</Label>
                            <Input
                              type="number"
                              name="orderAmount"
                              id="orderAmount"
                              placeholder="Enter Min Order"
                              value={chargeRule.orderAmount || ''}
                              onChange={(e) => handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].orderAmount`, Number(e.target.value))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="metric" className="text-xs">Metric</Label>
                            <RadioGroup
                              value={chargeRule.maxDistance.metric}
                              onValueChange={(value) => {
                                handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].maxDistance.metric`, value)
                                handleDeliveryConfiguration(branchIndex, `definedChargeRules[${chargeRuleIndex}].minDistance.metric`, value)
                              }}
                              className="flex flex-col gap-2"
                            >
                              {metrics.map((metric, idx) => (
                                <div className="flex items-center gap-2" key={idx}>
                                  <RadioGroupItem
                                    value={metric}
                                    id={`charge-rule-metric-${branchIndex}-${chargeRuleIndex}-${idx}`}
                                  />
                                  <Label htmlFor={`charge-rule-metric-${branchIndex}-${chargeRuleIndex}-${idx}`} className="text-xs cursor-pointer">{metric}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          <div>
                            <Button variant="destructive" onClick={() => handleDeleteChargeRule(branchIndex, chargeRuleIndex)} type='button' className="h-7 text-xs">Delete</Button>
                          </div>
                        </div>
                      ))}

                      <div className='p-2'>
                        <Label className="font-bold text-xs mb-2 block">
                          Delivery Tagging Mode
                        </Label>
                        <ShadSelect
                          value={branch.deliveryConfiguration?.deliveryTaggingMode}
                          onValueChange={(value) => handleDeliveryConfiguration(branchIndex, 'deliveryTaggingMode', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(DeliveryTaggingModeEnum).map(mode => (
                              <SelectItem key={mode} value={mode} className="text-xs">{mode}</SelectItem>
                            ))}
                          </SelectContent>
                        </ShadSelect>
                      </div>
                    </div>
                  </div>
                </>
              </TabsContent>
              <TabsContent value="3">
                <div>
                  <h4>Opening Hours By Branch</h4>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please ensure that opening hours are provided in the following format: <b>HH:mm:ss</b>
                    </AlertDescription>
                  </Alert>
                </div>
                <div>
                  <div className="flex flex-col gap-2">
                    {branch.days.map((day, dayIndex) => (
                      <Card key={day.day} className="flex flex-col py-2 px-3">
                        <div className="flex flex-row items-center justify-between">
                          <strong className="text-sm">{day.day}</strong>
                          <strong className="text-sm">Opens {day.day} &nbsp; {day.opensToday ? <span>&#10003;</span> : <span>&#10007;</span>}</strong>
                          <strong className="text-sm"> Status: {day.status}</strong>
                        </div>

                        <div className="border-t border-gray-300 my-3" />

                        <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                          <div className='md:col-span-5 border-r pr-4'>
                            <Button type="button" className="my-2 h-7 text-xs" onClick={() => handleAddOpeningHour(branchIndex, dayIndex)} >
                              Add Opening Hour
                            </Button>

                            {day.openingHours.map((openingHour, hourIndex) => (
                              <div key={hourIndex} className="flex flex-row items-center mb-3 gap-2">
                                <ShadSelect
                                  value={openingHour.dayType}
                                  onValueChange={(value) => handleSelectedDayTypeChange(branchIndex, dayIndex, hourIndex, 'dayType', value)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-32">
                                    <SelectValue placeholder="Day Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(dayTypeEnum).map(dayType => (
                                      <SelectItem key={dayType} value={dayType} className="text-xs">{dayType}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </ShadSelect>

                                <Label className="text-xs">From:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={openingHour.from || ''}
                                  onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Label className="text-xs">To:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={openingHour.to || ''}
                                  onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => handleRemoveOpeningHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className='md:col-span-7'>
                            <div className="flex">
                              <Button type="button" className="my-2 h-7 text-xs" onClick={() => handleAddShiftsHour(branchIndex, dayIndex)}>
                                Add Shifts
                              </Button>
                            </div>
                            {day.shifts.map((shift, hourIndex) => (
                              <div key={hourIndex} className="flex flex-row items-center mb-3 gap-2">
                                <Label className="text-xs">Name:</Label>
                                <Input
                                  type="text"
                                  placeholder="Enter shift name"
                                  value={shift.shiftName || ''}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'shiftName', e.target.value)}
                                  className='w-32 h-7 text-xs'
                                />
                                <Label className="text-xs">From:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.from || ''}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Label className="text-xs">To:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.to || ''}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => handleRemoveShiftsHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="4">
                <div className='w-100'>
                  <Label className="font-semibold text-xs mb-2 block">
                    Unit Cost Rule
                  </Label>
                  <ShadSelect
                    value={branch?.unitCostCalculationMode}
                    onValueChange={(value) => handleUnitCostCalculationModeChange(branchIndex, value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UnitCostCalculationMode).map(mode => (
                        <SelectItem key={mode} value={mode} className="text-xs">{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </ShadSelect>
                </div>
              </TabsContent>
              <TabsContent value="5">
                <Tabs defaultValue="converge" className='w-100'>
                  <TabsList className="h-9">
                    <TabsTrigger value="converge" className="text-xs h-7">Converge</TabsTrigger>
                    <TabsTrigger value="bambora" className="text-xs h-7">Bambora</TabsTrigger>
                  </TabsList>
                  <TabsContent value="converge">
                    <BranchPaymentConfig
                      editingBranchPayments={editingBranchPayments}
                      setEditingBranchPayments={setEditingBranchPayments}
                      branchIndex={branchIndex}
                      moduleCode="CONVERGE_LIGHTBOX"
                      onPaymentConfigChange={handlePaymentConfigChange}
                    />
                  </TabsContent>
                  <TabsContent value="bambora">
                    <BranchPaymentConfig
                      editingBranchPayments={editingBranchPayments}
                      setEditingBranchPayments={setEditingBranchPayments}
                      branchIndex={branchIndex}
                      moduleCode="BAMBORA"
                      onPaymentConfigChange={handlePaymentConfigChange}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
            </TabsContent>
          ))}

          <div className="mt-4">
            <Button id="save-entity" type='button' data-cy="entityCreateSaveButton" disabled={updating} onClick={saveEntity} className='h-8 text-xs'>
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
          </div>
        </div>
      </Tabs>
    </PageWrapper>
  )
};

export default Branches;


const MapComponent = ({
  branch,
  branchIndex,
  handleGeocode,
  handleBranchAddressFieldChange
}: {
  branch: IBranchDetails,
  branchIndex: number,
  handleGeocode: (e: MapMouseEvent, branchIndex: number) => void,
  handleBranchAddressFieldChange: any
}) => {
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);

  const map = useMap(`map-${branchIndex}`);

  useEffect(() => {
    if (selectedPlace) {
      selectePlaceHandler(selectedPlace);
    }
  }, [selectedPlace]);

  const selectePlaceHandler = (place: google.maps.places.PlaceResult | null) => {
    fromAddress(place.formatted_address).then((response) => {
      const { lat, lng } = response.results[0].geometry.location;
      handleBranchAddressFieldChange(branchIndex, {
        latitude: lat,
        longitude: lng,
        fullAddress: place.formatted_address
      });
      map.setCenter({ lat, lng });
    }).catch((error) => {
      console.error('Geocode error:', error);
    });
  };

  return (
    <Map
      style={{ width: '500px', height: '500px' }}
      defaultZoom={3}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
      onClick={(e) => handleGeocode(e, branchIndex)}
      defaultCenter={{ lat: branch.address?.latitude || 0, lng: branch.address?.longitude || 0 }}
      id={`map-${branchIndex}`}
    >
      <Marker position={{ lat: branch.address?.latitude || 0, lng: branch.address?.longitude || 0 }} />

      <CustomMapControl
        controlPosition={ControlPosition.TOP}
        selectedAutocompleteMode={autocompleteModes[0]}
        onPlaceSelect={setSelectedPlace}
      />
    </Map>
  );
};