import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './loyalty-card.reducer';
import { filterOrders } from 'app/entities/order/order.reducer';
import Order from 'app/entities/order/order';
import { getEntities } from 'app/entities/loyalty/loyalty-records.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getWallets } from 'app/entities/wallet/wallet.reducer';
import { getEntities as getLoyalyPointsRecords } from 'app/entities/loyalty/loyalty-records.reducer';
import { ILoyaltyCard } from 'app/shared/model/loyalty-card.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';

export const LoyaltyCardUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();


  const loyaltyCardEntity: ILoyaltyCard = useAppSelector(state => state.loyaltycard.entity);
  const loyaltyRecord = useAppSelector(state => state.loyalty.entities?.[0]);
  const branchList = useAppSelector(state => state.branch.entities);
  const walletList = useAppSelector(state => state.wallet.entities);
  const loyaltyPointsRecordsList = useAppSelector(state => state.loyalty.entities);
  const loading = useAppSelector(state => state.loyaltycard.loading);
  const updating = useAppSelector(state => state.loyaltycard.updating);
  const updateSuccess = useAppSelector(state => state.loyaltycard.updateSuccess);

  const handleClose = () => {
    navigate('/loyalty-cards');
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
    }))

    dispatch(getWallets({
      page: 0,
      size: 1000,
      sort: 'id,desc',
    }))

    dispatch(getLoyalyPointsRecords({
      page: 0,
      size: 1000,
      sort: 'id,desc',
    }))
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...loyaltyCardEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/loyalty-cards/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/loyalty-cards/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="mb-2">
        <h2 className="text-sm font-semibold" id="common.loyalty-card.home.createOrEditLabel" data-cy="LoyaltyCardCreateUpdateHeading">
          {isNew ? (
            <Translate contentKey="common.createNewLoyaltyCard">Create New Customer</Translate>
          ) : (
            <Translate contentKey="common.editLoyaltyCard">Edit Customer</Translate>
          )}
        </h2>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form>
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
                    onChange={e => dispatch(changeEntityField({ name: 'referenceNumber', value: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="loyalty-card-code" className="text-xs">
                    {translate('common.code')}
                  </Label>
                  <Input
                    id="loyalty-card-code"
                    className="h-7 text-xs"
                    value={loyaltyCardEntity?.code || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'code', value: e.target.value }))}
                  />
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
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="h-8 text-xs" onClick={handleClose}>
                  <ArrowLeft className="h-3 w-3" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button className="h-8 text-xs" onClick={saveEntity} disabled={updating}>
                  <Save className="h-3 w-3" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button className="h-8 text-xs" onClick={e => saveEntity(e, true)} disabled={updating}>
                  <Save className="h-3 w-3" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default LoyaltyCardUpdate;
