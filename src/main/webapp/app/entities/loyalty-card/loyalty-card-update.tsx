import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { changeEntityField, createEntity, getEntity, reset, unassignCard, updateEntity } from './loyalty-card.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getLoyalyPointsRecords } from 'app/entities/loyalty/loyalty-records.reducer';
import { assignCard as assignCustomerCard } from 'app/entities/customer/customer.reducer';
import { ILoyaltyCard } from 'app/shared/model/loyalty-card.model';
import type { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import AsyncSelect from 'app/shared/components/select/async-select';
import { FilterMatchMode } from 'primereact/api';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

interface CustomerSearchOption {
  value: string;
  label: string;
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    mobileNumber?: string;
    email?: string;
    accountNumber?: string;
  };
}

export const LoyaltyCardUpdate = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const loyaltyCardEntity: ILoyaltyCard = useAppSelector(state => state.loyaltycard.entity);
  const branchList = useAppSelector(state => state.branch.entities);
  const loading = useAppSelector(state => state.loyaltycard.loading);
  const updating = useAppSelector(state => state.loyaltycard.updating);
  const [selectedCustomerToAssign, setSelectedCustomerToAssign] = useState<CustomerSearchOption | null>(null);
  const [confirmAssignCardOpen, setConfirmAssignCardOpen] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>((location.state as { assignmentError?: string } | null)?.assignmentError || null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    navigate('/loyalty-cards');
  };

  const validatePin = (pin?: string | null) => {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return 'PIN must be exactly 4 digits.';
    }
    return null;
  };

  const formatAssignedCustomer = (customer?: ICustomer | null) => {
    if (!customer) {
      return 'Unassigned';
    }

    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
    const secondary = customer.mobileNumber || customer.phone || customer.email || customer.accountNumber || customer.id;

    if (fullName && secondary) {
      return `${fullName} (${secondary})`;
    }

    return fullName || secondary || 'Unassigned';
  };

  const assignedCustomerOption = loyaltyCardEntity?.wallet?.assignedTo
    ? {
        value: loyaltyCardEntity.wallet.assignedTo.id || '',
        label: formatAssignedCustomer(loyaltyCardEntity.wallet.assignedTo),
        customer: {
          id: loyaltyCardEntity.wallet.assignedTo.id || '',
          firstName: loyaltyCardEntity.wallet.assignedTo.firstName,
          lastName: loyaltyCardEntity.wallet.assignedTo.lastName,
          phone: loyaltyCardEntity.wallet.assignedTo.phone,
          mobileNumber: loyaltyCardEntity.wallet.assignedTo.mobileNumber,
          email: loyaltyCardEntity.wallet.assignedTo.email,
          accountNumber: loyaltyCardEntity.wallet.assignedTo.accountNumber,
        },
      }
    : null;

  const loadCustomerOptions = async (inputValue: string) => {
    const query = {
      first: 0,
      rows: 10,
      page: 0,
      sortField: null,
      sortOrder: null,
      query: '',
      filters: {
        firstName: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);
    const response = await axios.post('api/_search/customers', updatedQuery);
    const options = (response?.data || []).map((customer: CustomerSearchOption['customer']) => {
      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
      const secondaryLabel = customer.mobileNumber || customer.phone || customer.email || customer.accountNumber || customer.id;
      return {
        value: customer.id,
        label: fullName ? `${fullName} (${secondaryLabel})` : secondaryLabel,
        customer,
      };
    });
    return options;
  };

  const handleAssignCard = () => {
    if (!loyaltyCardEntity?.id || !loyaltyCardEntity?.referenceNumber || !selectedCustomerToAssign?.customer?.id) {
      return;
    }

    setAssignmentError(null);
    dispatch(
      assignCustomerCard({
        entity: { id: selectedCustomerToAssign.customer.id } as any,
        cardRefNumber: loyaltyCardEntity.referenceNumber,
      })
    )
      .unwrap()
      .then(() => {
        dispatch(getEntity(loyaltyCardEntity.id));
        setSelectedCustomerToAssign(null);
        setConfirmAssignCardOpen(false);
      })
      .catch(() => {
        setAssignmentError('Card was saved, but assigning the selected customer failed. Please retry the assignment.');
        setConfirmAssignCardOpen(false);
      });
  };

  const handleUnassignCard = () => {
    if (!loyaltyCardEntity?.id) {
      return;
    }
    setAssignmentError(null);
    dispatch(unassignCard(loyaltyCardEntity.id))
      .unwrap()
      .then(() => {
        setSelectedCustomerToAssign(null);
      })
      .catch(error => {
        setAssignmentError(error?.response?.data?.message || error?.message || 'Unable to unassign card.');
      });
  };

  useEffect(() => {

    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: 0,
      size: 100,
      sort: 'id,desc',
    }));

    dispatch(getLoyalyPointsRecords({
      page: 0,
      size: 1000,
      sort: 'id,desc',
    }));
  }, []);

  const saveEntity = (e: React.MouseEvent<HTMLButtonElement>, createNew = false) => {
    e.preventDefault();
    const sanitizedCode = (loyaltyCardEntity?.code || '').replace(/\D+/g, '').slice(0, 4);
    const pinValidationError = validatePin(sanitizedCode);
    if (pinValidationError) {
      setFormError(pinValidationError);
      return;
    }

    const entity = {
      ...loyaltyCardEntity,
      code: sanitizedCode,
    };

    setAssignmentError(null);
    setFormError(null);

    if (isNew) {
      dispatch(createEntity(entity))
        .unwrap()
        .then(async res => {
          const newId = res?.data?.id;
          const referenceNumber = res?.data?.referenceNumber;
          const selectedCustomerId = selectedCustomerToAssign?.customer?.id;

          if (selectedCustomerId && referenceNumber) {
            try {
              await dispatch(
                assignCustomerCard({
                  entity: { id: selectedCustomerId } as any,
                  cardRefNumber: referenceNumber,
                })
              ).unwrap();
            } catch {
              const assignmentFailureMessage = 'Card was created, but assigning the selected customer failed. Please retry from the edit page.';
              if (newId) {
                navigate(`/loyalty-cards/${newId}/edit`, { state: { assignmentError: assignmentFailureMessage } });
                return;
              }
              setAssignmentError(assignmentFailureMessage);
              return;
            }
          }

          setSelectedCustomerToAssign(null);

          if (createNew) {
            dispatch(reset());
            return;
          }

          if (newId) {
            navigate(`/loyalty-cards/${newId}/edit`);
          }
        });
    } else {
      dispatch(updateEntity(entity))
        .unwrap()
        .then(() => {
        if (createNew) {
          navigate(`/loyalty-cards/new`);
        }
        });
    }
  };

  return (
    <PageWrapper>
      <div className="mb-2">
        <h2 className="text-sm font-semibold" id="common.loyalty-card.home.createOrEditLabel" data-cy="LoyaltyCardCreateUpdateHeading">
          {isNew ? (
            <Translate contentKey="common.createNewLoyaltyCard">Create New Loyalty Card</Translate>
          ) : (
            <Translate contentKey="common.editLoyaltyCard">Edit Loyalty Card</Translate>
          )}
        </h2>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form>
              {assignmentError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {assignmentError}
                </div>
              )}
              {formError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {formError}
                </div>
              )}
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="loyalty-card-cardHolderName" className="text-xs">
                    {translate('common.cardHolderName')}
                  </Label>
                  <Input
                    id="loyalty-card-cardHolderName"
                    className="h-7 text-xs"
                    value={loyaltyCardEntity?.cardHolderName || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'cardHolderName', value: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="loyalty-card-referenceNumber" className="text-xs">
                    {translate('common.referenceNumber')}
                  </Label>
                  <Input
                    id="loyalty-card-referenceNumber"
                    className="h-7 text-xs"
                    value={loyaltyCardEntity?.referenceNumber || ''}
                    placeholder={isNew ? 'Auto-generated on save' : ''}
                    disabled
                    readOnly
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {isNew ? 'This card number is generated automatically when you save the card.' : 'This card number is generated by the backend and cannot be edited.'}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="loyalty-card-code" className="text-xs">
                    PIN
                  </Label>
                  <Input
                    id="loyalty-card-code"
                    className="h-7 text-xs"
                    value={loyaltyCardEntity?.code || ''}
                    inputMode="numeric"
                    maxLength={4}
                    onChange={e => {
                      setFormError(null);
                      dispatch(changeEntityField({ name: 'code', value: e.target.value.replace(/\D+/g, '').slice(0, 4) }));
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">PIN must be exactly 4 digits.</p>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="loyalty-card-expiryDate" className="text-xs">
                    {translate('common.expiryDate')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('h-7 text-xs justify-start text-left font-normal', !loyaltyCardEntity?.expiryDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {loyaltyCardEntity?.expiryDate ? formatDateForDisplay(loyaltyCardEntity.expiryDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={loyaltyCardEntity?.expiryDate ? new Date(loyaltyCardEntity.expiryDate) : undefined}
                        onSelect={date => dispatch(changeEntityField({ name: 'expiryDate', value: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="loyalty-card-createdByBranchId" className="text-xs">
                    {translate('common.branch')}
                  </Label>
                  <Select
                    value={loyaltyCardEntity?.createdByBranchId || ''}
                    onValueChange={value => dispatch(changeEntityField({ name: 'createdByBranchId', value }))}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Branch Id" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchList.map(branch => (
                        <SelectItem key={branch.id} value={branch.id} className="text-xs">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="loyalty-card-active"
                    checked={loyaltyCardEntity?.active === true}
                    onCheckedChange={checked => dispatch(changeEntityField({ name: 'active', value: checked }))}
                  />
                  <Label htmlFor="loyalty-card-active" className="text-xs cursor-pointer">
                    {translate('common.active')}
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="loyalty-card-printed"
                    checked={loyaltyCardEntity?.printed === true}
                    onCheckedChange={checked => dispatch(changeEntityField({ name: 'printed', value: checked }))}
                  />
                  <Label htmlFor="loyalty-card-printed" className="text-xs cursor-pointer">
                    {translate('common.printed')}
                  </Label>
                </div>

                <div className="flex flex-col gap-2 border rounded-md p-3">
                  <Label htmlFor="loyalty-card-assign-customer" className="text-xs font-medium">
                    {isNew ? 'Assign Customer After Create' : 'Assign Card to Customer'}
                  </Label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <AsyncSelect<CustomerSearchOption, false>
                        cacheOptions
                        loadOptions={loadCustomerOptions}
                        defaultOptions
                        value={selectedCustomerToAssign || assignedCustomerOption}
                        onChange={option => setSelectedCustomerToAssign(option as CustomerSearchOption | null)}
                        placeholder={isNew ? 'Search customer' : 'Search or replace customer'}
                        isClearable
                      />
                    </div>
                    {!isNew && (
                      <>
                        <Button
                          type="button"
                          className="h-8 text-xs"
                          onClick={() => setConfirmAssignCardOpen(true)}
                          disabled={!selectedCustomerToAssign || !loyaltyCardEntity?.referenceNumber || updating}
                        >
                          Assign Card
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={handleUnassignCard}
                          disabled={!loyaltyCardEntity?.wallet?.assignedToId || updating}
                        >
                          Unassign
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isNew
                      ? 'Select a customer now if you want the new card to be assigned immediately after it is created.'
                      : 'Assigns this existing card to the selected customer using the current card number.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={handleClose}>
                  <ArrowLeft className="h-3 w-3" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button type="button" className="h-8 text-xs" onClick={saveEntity} disabled={updating}>
                  <Save className="h-3 w-3" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button type="button" className="h-8 text-xs" onClick={e => saveEntity(e, true)} disabled={updating}>
                  <Save className="h-3 w-3" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmAssignCardOpen} onOpenChange={setConfirmAssignCardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to assign this card to the selected customer?
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
    </PageWrapper>
  );
};

export default LoyaltyCardUpdate;
