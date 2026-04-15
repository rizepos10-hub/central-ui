import React, { useState, useEffect } from 'react';
import { Translate, translate } from 'react-jhipster';
import { Loader2, Save, RotateCw } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { updateEntity, createEntity, getEntities } from './business-detail.reducer';
import { updateSetupStatus } from 'app/entities/settings/guided-tour/guided-tour.reducer';
import { IBusinessDetail } from "app/shared/model/business-detail.model";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const BusinessDetailUpdate = () => {
  const dispatch = useAppDispatch();


  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]

  const loading = useAppSelector(state => state.businessDetail.loading);
  const updating = useAppSelector(state => state.businessDetail.updating);
  const updateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);
  const guidedTourUpdating = useAppSelector(state => state.guidedTour.updating);

  const isNew = businessDetailEntity === undefined;

  const [businessDetailsState, setBusinessDetailsState] = useState<IBusinessDetail>({
    businessName: '',
    slogan: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      fullAddress: '',
      longitude: 0,
      latitude: 0,
    },
    branchDetails: []
  });

  const [selectedAttachments, setSelectedAttachments]: any = useState(null)

  const handleResetTour = () => {
    dispatch(updateSetupStatus(false));
  };

  useEffect(() => {
    dispatch(getEntities({}));
  }, [dispatch, updateSuccess]);

  useEffect(() => {
    if (businessDetailEntity?.logo) {
      setSelectedAttachments(businessDetailEntity?.logo);
    }
    setBusinessDetailsState(businessDetailEntity)
  }, [businessDetailEntity]);



  const saveEntity = async () => {
    const entity: IBusinessDetail = {
      ...businessDetailEntity,
      ...businessDetailsState,
      logo: selectedAttachments,
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
      await dispatch(createEntity(entity));
    } else {
      await dispatch(updateEntity(entity));
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 id="tempApp.businessDetail.home.createOrEditLabel" data-cy="DetailCreateUpdateHeading" className="text-2xl font-bold">
          {isNew ? 'Create Business Details' : "Edit Business Details"}
        </h2>

        <Card>
            <CardContent className="pt-6">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                {!isNew ? (
                  <div className="space-y-2">
                    <Label htmlFor="details-id" className="text-xs font-semibold">
                      {translate('global.field.id')}
                    </Label>
                    <Input
                      name="id"
                      id="details-id"
                      value={businessDetailsState?.id || ''}
                      readOnly
                      className="h-7 text-xs bg-muted"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-xs font-semibold">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    name="businessName"
                    id="businessName"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.businessName || ''}
                    onChange={handleFieldChange}
                    required
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-solgan" className="text-xs font-semibold">
                    Slogan
                  </Label>
                  <Input
                    name="slogan"
                    id="details-solgan"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.slogan || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='font-light text-sm'>
                    Logo
                  </div>
                  <div className='w-1/4' data-tour="logo-upload">
                    {businessDetailsState && (
                      <MediaLibrary
                        sizePerPage={80}
                        handleFilesSelectCallback={(files) => setSelectedAttachments(transformAttachmentStructure(files, 'toIAttachment')[0])}
                        defaultValues={
                          selectedAttachments ? transformAttachmentStructure([selectedAttachments], 'toFileLibraryListItem') :
                            []
                        }
                      />
                    )}
                  </div>
                </div>
                <h4 className="text-base font-semibold mt-6 mb-4">Address Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="details-address-street" className="text-xs font-semibold">
                    Street
                  </Label>
                  <Input
                    id="details-address-street"
                    name="address.street"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.address?.street || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-address-city" className="text-xs font-semibold">
                    City
                  </Label>
                  <Input
                    id="details-address-city"
                    name="address.city"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.address?.city || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-address-state" className="text-xs font-semibold">
                    State
                  </Label>
                  <Input
                    id="details-address-state"
                    name="address.state"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.address?.state || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-address-postalCode" className="text-xs font-semibold">
                    Postal Code
                  </Label>
                  <Input
                    id="details-address-postalCode"
                    name="address.postalCode"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.address?.postalCode || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-address-country" className="text-xs font-semibold">
                    Country
                  </Label>
                  <Input
                    id="details-address-country"
                    name="address.country"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.address?.country || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-address-fullAddress" className="text-xs font-semibold">
                    Full Address
                  </Label>
                  <Input
                    id="details-address-fullAddress"
                    name="address.fullAddress"
                    data-cy="value"
                    type="text"
                    value={businessDetailsState?.address?.fullAddress || ''}
                    onChange={handleFieldChange}
                    maxLength={255}
                    className="h-7 text-xs"
                  />
                </div>

                <h4 className="text-base font-semibold mt-6 mb-4">Contact Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="details-address-email" className="text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="details-address-email"
                    name="address.email"
                    data-cy="value"
                    type="email"
                    value={businessDetailsState?.address?.email || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-address-phone-number" className="text-xs font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="details-address-phone-number"
                    name="address.phoneNumber"
                    data-cy="value"
                    type="tel"
                    value={businessDetailsState?.address?.phoneNumber || ''}
                    onChange={handleFieldChange}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    data-tour="business-save-button"
                    onClick={saveEntity}
                    disabled={updating}
                    className="h-8 text-xs"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleResetTour}
                    disabled={guidedTourUpdating}
                    title="Reset the guided tour to start from the beginning"
                    className="h-8 text-xs"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Reset Tour
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default BusinessDetailUpdate;
