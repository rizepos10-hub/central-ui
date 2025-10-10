import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { ArrowLeft, Save, Pencil, Trash2, Plus, X } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer, IWholesalePriceLine } from 'app/shared/model/CUSTOMER/customer.model';
import {
  getEntity,
  updateEntity,
  createEntity,
  reset,
  changeEntityField,
  updatePrices,
  getPricesForCustomer,
  assignCard,
} from './customer.reducer';
import { filterOrders } from 'app/entities/order/order.reducer';
import Order from 'app/entities/order/order';
import { getEntities } from 'app/entities/loyalty/loyalty-records.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { searchEntities as getLoyaltCards } from 'app/entities/loyalty-card/loyalty-card.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import AsyncSelect from 'react-select/async';
import { ILoyaltyCard } from 'app/shared/model/loyalty-card.model';
import { AddressTypeEnum, IAddress } from 'app/shared/model/address.model';
import { v4 as uuidv4 } from 'uuid';
import { COUNTRIES } from './customer-addresses';
import { getEntities as getPricingPoints } from 'app/entities/settings/pricing-point/pricing-point.reducer';
import { IPricingPoint } from 'app/shared/model/PRICING-POINT/pricing-point';
import { IBranch } from 'app/shared/model/branch.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Select from 'react-select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const CustomerUpdate = ({
  firstName,
  isPopUp,
  closePopUp,
}: {
  firstName?: string;
  isPopUp?: boolean;
  closePopUp?: (id) => void;
}) => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();
  const fromLocation = new URLSearchParams(search).get('from');

  const customerEntity: ICustomer = useAppSelector(state => state.customer.entity);
  const loyaltyRecord = useAppSelector(state => state.loyalty.entities?.[0]);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const loyaltyCardsList = useAppSelector(state => state.loyaltycard.entities);
  const loading = useAppSelector(state => state.customer.loading);
  const updating = useAppSelector(state => state.customer.updating);
  const updateSuccess = useAppSelector(state => state.customer.updateSuccess);

  const [selectedCardToAssign, setSelectedCardToAssign] = useState(null);
  const [addressDialogOptions, setAddressDialogOptions] = useState<{
    isOpen: boolean;
    address: IAddress | null;
  }>({
    isOpen: false,
    address: null,
  });
  const [currentAddress, setCurrentAddress] = useState<IAddress | null>(null);
  const [confirmAssignCardOpen, setConfirmAssignCardOpen] = useState(false);
  const [deleteAddressConfirm, setDeleteAddressConfirm] = useState<{ open: boolean; address: IAddress | null }>({ open: false, address: null });
  const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);

  useEffect(() => {
    if (addressDialogOptions.isOpen) {
      setCurrentAddress(addressDialogOptions.address || {});
    }
  }, [addressDialogOptions.isOpen]);

  const handleBranchPricingPointChange = (branchId, pricingPoint) => {
    dispatch(
      changeEntityField({
        name: 'pricingPoints',
        value: {
          ...customerEntity.pricingPoints,
          [branchId]: pricingPoint,
        },
      })
    );
  };

  const loadOptions = (inputValue, callback) => {
    const query = {
      first: 0,
      rows: 10,
      page: 0,
      sortField: null,
      sortOrder: null,
      query: '',
      filters: {
        referenceNumber: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);

    dispatch(
      getLoyaltCards({
        query: updatedQuery,
      })
    ).then(response => {
      const res = response.payload as any;
      const data = res?.data;

      const options = data.map(card => ({
        value: card.referenceNumber,
        label: card.referenceNumber,
        card,
      }));
      callback(options);
    });
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
      const filters = {};
      filters['customer.id'] = { value: id, matchMode: 'EQUALS' };
      const params = {
        first: 0,
        rows: 100,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters,
      };
      dispatch(getEntities(params));
    }

    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );

    dispatch(
      getPricingPoints({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, []);

  useEffect(() => {
    if (customerEntity?.loyaltyCard?.id) {
      setSelectedCardToAssign({
        value: customerEntity?.loyaltyCard?.referenceNumber,
        label: customerEntity?.loyaltyCard?.referenceNumber,
        card: customerEntity?.loyaltyCard,
      });
    }
  }, [customerEntity?.loyaltyCard?.id]);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const entity = {
      ...customerEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then(res => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            if (isPopUp) {
              closePopUp(newId);
              return;
            }
            navigate(`/customer/${newId}/edit`);
          }
        }
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/customer/new`);
        }
      });
    }
  };

  const confirmAssignCard = () => {
    setConfirmAssignCardOpen(true);
  };

  const handleAssignCard = () => {
    dispatch(
      assignCard({
        entity: customerEntity,
        cardRefNumber: selectedCardToAssign?.card?.referenceNumber,
      })
    );
    setConfirmAssignCardOpen(false);
  };

  const handleDeleteAddress = addressToDelete => {
    let updatedAddresses = [...(customerEntity.deliveryAddresses || [])];
    updatedAddresses = updatedAddresses.filter(address => address.id !== addressToDelete.id);

    dispatch(
      changeEntityField({
        name: 'deliveryAddresses',
        value: updatedAddresses,
      })
    );
    setDeleteAddressConfirm({ open: false, address: null });
  };

  const handleAddressChange = (fieldName, value) => {
    setCurrentAddress(prevState => ({
      ...prevState,
      [fieldName]: value,
    }));
  };

  const handleCloseAddressDialog = () => {
    let updatedAddresses = [...(customerEntity.deliveryAddresses || [])];
    if (currentAddress.id) {
      // Update existing address
      updatedAddresses = updatedAddresses.map(address => {
        if (address.id === currentAddress.id) {
          return currentAddress;
        } else {
          return address;
        }
      });
    } else {
      // Add new address
      currentAddress.id = uuidv4();
      updatedAddresses.push(currentAddress);
    }

    dispatch(
      changeEntityField({
        name: 'deliveryAddresses',
        value: updatedAddresses,
      })
    );

    setAddressDialogOptions({
      isOpen: false,
      address: null,
    });
  };

  const getPricingPointsPerBranch = (branchId) => {
    const pricingPointsPerBranch = pricingPoints.filter(pricingPoint => pricingPoint.applicableBranches?.some(b => b.id === branchId));
    return pricingPointsPerBranch;
  }

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isNew ? (
              <Translate contentKey="tempApp.createNewCustomer">Create New Customer</Translate>
            ) : (
              <Translate contentKey="tempApp.editCustomer">Edit Customer</Translate>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form>
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal" className="text-xs h-7">Personal Details</TabsTrigger>
                <TabsTrigger value="addresses" className="text-xs h-7">Addresses</TabsTrigger>
                <TabsTrigger value="additional" className="text-xs h-7">{translate('common.additionalInfo')}</TabsTrigger>
                <TabsTrigger value="pricing" className="text-xs h-7">Pricing Point</TabsTrigger>
                <TabsTrigger value="orders" className="text-xs h-7">Customer Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-firstName" className="text-xs">{translate('tempApp.firstName')}</Label>
                  <Input
                    id="customer-firstName"
                    className="h-8 text-xs"
                    value={customerEntity?.firstName || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'firstName', value: e.target.value }))}
                    required={!customerEntity?.businessDetails?.businessName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-lastName" className="text-xs">{translate('tempApp.lastName')}</Label>
                  <Input
                    id="customer-lastName"
                    className="h-8 text-xs"
                    value={customerEntity?.lastName || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'lastName', value: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-phone" className="text-xs">{translate('tempApp.phone')}</Label>
                  <Input
                    id="customer-phone"
                    className="h-8 text-xs"
                    value={customerEntity?.phone || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'phone', value: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-mobileNumber" className="text-xs">{translate('tempApp.mobileNumber')}</Label>
                  <Input
                    id="customer-mobileNumber"
                    className="h-8 text-xs"
                    value={customerEntity?.mobileNumber || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'mobileNumber', value: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-fax" className="text-xs">{translate('tempApp.fax')}</Label>
                  <Input
                    id="customer-fax"
                    className="h-8 text-xs"
                    value={customerEntity?.fax || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'fax', value: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-email" className="text-xs">{translate('tempApp.email')}</Label>
                  <Input
                    id="customer-email"
                    className="h-8 text-xs"
                    value={customerEntity?.email || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'email', value: e.target.value }))}
                  />
                </div>

                {!isNew && (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="customer-card" className="text-xs">{translate('tempApp.assignCard')}</Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <AsyncSelect
                          cacheOptions
                          loadOptions={loadOptions}
                          defaultOptions
                          value={selectedCardToAssign}
                          onChange={option => {
                            setSelectedCardToAssign(option);
                          }}
                          placeholder="Select a Card"
                          isClearable
                          styles={{
                            control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                            option: (base) => ({ ...base, fontSize: '0.75rem' })
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => confirmAssignCard()}
                        disabled={!selectedCardToAssign}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {translate('tempApp.assignCard')}
                      </Button>
                    </div>
                  </div>
                )}

                {!isNew && (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="customer-loyaltyRecord" className="text-xs">{translate('tempApp.loyaltyRecord')}</Label>
                    <Input
                      id="customer-loyaltyRecord"
                      className="h-8 text-xs"
                      type="number"
                      value={loyaltyRecord?.points ?? ''}
                      disabled
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="addresses" className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">
                    <Translate contentKey={'common.addresses'}>Addresses</Translate>
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setAddressDialogOptions({
                        isOpen: true,
                        address: null,
                      });
                    }}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Address
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Contact Person Name</TableHead>
                      <TableHead className="text-xs">Phone Number</TableHead>
                      <TableHead className="text-xs">Address</TableHead>
                      <TableHead className="text-xs">Address Type</TableHead>
                      <TableHead className="text-xs">Country</TableHead>
                      <TableHead className="text-xs">City</TableHead>
                      <TableHead className="text-xs">Street</TableHead>
                      <TableHead className="text-xs w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerEntity?.deliveryAddresses?.map((address) => (
                      <TableRow key={address.id}>
                        <TableCell className="text-xs">{address.contactPersonName}</TableCell>
                        <TableCell className="text-xs">{address.phoneNumber}</TableCell>
                        <TableCell className="text-xs">{address.address}</TableCell>
                        <TableCell className="text-xs">{address.addressType}</TableCell>
                        <TableCell className="text-xs">{address.country}</TableCell>
                        <TableCell className="text-xs">{address.city}</TableCell>
                        <TableCell className="text-xs">{address.street}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setAddressDialogOptions({
                                  isOpen: true,
                                  address: address,
                                });
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => setDeleteAddressConfirm({ open: true, address })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="additional" className="space-y-3">
                <h4 className="text-sm font-semibold">{translate('common.additionalInfo')}</h4>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="customer-businessName" className="text-xs">{translate('tempApp.businessName')}</Label>
                  <Input
                    id="customer-businessName"
                    className="h-8 text-xs"
                    value={customerEntity?.businessDetails?.businessName || ''}
                    onChange={e =>
                      dispatch(
                        changeEntityField({
                          name: 'businessDetails',
                          value: {
                            ...customerEntity.businessDetails,
                            businessName: e.target.value,
                          },
                        })
                      )
                    }
                    required={!customerEntity?.firstName}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-3">
                {pricingPoints?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">
                          <Translate contentKey={'common.branch'}>Branch</Translate>
                        </TableHead>
                        <TableHead className="text-xs">Pricing Point</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchList.map(branch => {
                        return (
                          <TableRow key={branch.id}>
                            <TableCell className="text-xs">{branch.name}</TableCell>
                            <TableCell className="text-xs">
                              <Select
                                placeholder="Enter Pricing Point"
                                value={getPricingPointsPerBranch(branch.id)
                                  .map(pp => ({ label: pp.name, value: pp.id }))
                                  .find(opt => opt.value === customerEntity?.pricingPoints?.[branch.id]?.id) || null}
                                options={getPricingPointsPerBranch(branch.id).map(pricingPoint => ({ label: pricingPoint.name, value: pricingPoint.id }))}
                                onChange={option => handleBranchPricingPointChange(branch.id, pricingPoints.find(pricingPoint => pricingPoint.id === option?.value))}
                                isClearable
                                styles={{
                                  control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                                  option: (base) => ({ ...base, fontSize: '0.75rem' })
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : null}
              </TabsContent>

              <TabsContent value="orders" className="space-y-3">
                <h4 className="text-sm font-semibold">{translate('tempApp.customerOrders')}</h4>
                {customerEntity?.id && (
                  <div>
                    <Order customer={customerEntity?.id} />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-4">
              {!isPopUp ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={saveEntity}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={e => saveEntity(e, true)}
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={saveEntity}
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Address Dialog */}
      <Dialog open={addressDialogOptions.isOpen} onOpenChange={(open) => {
        if (!open) {
          setAddressDialogOptions({ isOpen: false, address: null });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Address Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Contact Person Name</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.contactPersonName || ''}
                onChange={e => handleAddressChange('contactPersonName', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.phoneNumber || ''}
                onChange={e => handleAddressChange('phoneNumber', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <Label className="text-xs">Address</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.address || ''}
                onChange={e => handleAddressChange('address', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Address Type</Label>
              <Select
                value={Object.values(AddressTypeEnum).map(val => ({ label: val, value: val })).find(opt => opt.value === currentAddress?.addressType) || null}
                options={Object.values(AddressTypeEnum).map(val => ({ label: val, value: val }))}
                onChange={option => handleAddressChange('addressType', option?.value)}
                styles={{
                  control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                  option: (base) => ({ ...base, fontSize: '0.75rem' })
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Country/Region</Label>
              <Select
                value={COUNTRIES.map(c => ({ label: c.name, value: c.name })).find(opt => opt.value === currentAddress?.country) || null}
                options={COUNTRIES.map(c => ({ label: c.name, value: c.name }))}
                onChange={option => handleAddressChange('country', option?.value)}
                styles={{
                  control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                  option: (base) => ({ ...base, fontSize: '0.75rem' })
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">City</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.city || ''}
                onChange={e => handleAddressChange('city', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Street</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.street || ''}
                onChange={e => handleAddressChange('street', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">State</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.state || ''}
                onChange={e => handleAddressChange('state', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Floor</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.floor || ''}
                onChange={e => handleAddressChange('floor', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Postal Code</Label>
              <Input
                className="h-8 text-xs"
                value={currentAddress?.postalCode || ''}
                onChange={e => handleAddressChange('postalCode', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Longitude</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                step="0.00000001"
                value={currentAddress?.longitude || ''}
                onChange={e => handleAddressChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Latitude</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                step="0.00000001"
                value={currentAddress?.latitude || ''}
                onChange={e => handleAddressChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setAddressDialogOptions({ isOpen: false, address: null })}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={handleCloseAddressDialog}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Assign Card AlertDialog */}
      <AlertDialog open={confirmAssignCardOpen} onOpenChange={setConfirmAssignCardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to assign this card?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={handleAssignCard}>
              Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Address Confirmation AlertDialog */}
      <AlertDialog open={deleteAddressConfirm.open} onOpenChange={(open) => {
        if (!open) {
          setDeleteAddressConfirm({ open: false, address: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this address?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">No</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-destructive hover:bg-destructive/90"
              onClick={() => deleteAddressConfirm.address && handleDeleteAddress(deleteAddressConfirm.address)}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default CustomerUpdate;
