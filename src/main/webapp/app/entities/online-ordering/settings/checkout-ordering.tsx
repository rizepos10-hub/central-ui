import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { orderTakingOptions } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { ICheckoutOrderingSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { changeEntityField, getEntity, updateEntity } from './checkout-ordering.reducer';

const CheckoutOrderingSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: ICheckoutOrderingSettings = useAppSelector(state => state.checkoutOrderingSettings.entity);
  const loading = useAppSelector(state => state.checkoutOrderingSettings.loading);
  const updating = useAppSelector(state => state.checkoutOrderingSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  return (
    <PageWrapper className="max-w-5xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Checkout &amp; Ordering</h2>
          <p className="text-xs text-muted-foreground">Order flow, checkout behavior, and item visibility options</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Order flow</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <OptionButtons
              label="Order Taking"
              options={orderTakingOptions}
              value={entity.orderTaking}
              onSelect={value => dispatch(changeEntityField({ name: 'orderTaking', value }))}
            />
            <Toggle id="orderConfirmation" label="Order Confirmation" checked={entity.orderConfirmation || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'orderConfirmation', value }))} />
            <Toggle id="guestCheckout" label="Guest Checkout" checked={entity.guestCheckout || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'guestCheckout', value }))} />
            <Toggle id="canOrder" label="Can Order" checked={entity.canOrder || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'canOrder', value }))} />
            <Toggle id="canOrderOutOfStock" label="Can Order Out Of Stock" checked={entity.canOrderOutOfStock || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'canOrderOutOfStock', value }))} />
            <Toggle id="showDeliveryTips" label="Show Delivery Tips" checked={entity.showDeliveryTips || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'showDeliveryTips', value }))} />
            <Toggle id="scheduleOrders" label="Schedule Orders" checked={entity.scheduleOrders || false} onCheckedChange={value => dispatch(changeEntityField({ name: 'scheduleOrders', value }))} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="h-8 text-xs" disabled={loading || updating} onClick={() => dispatch(updateEntity(entity))}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

const Toggle = ({ id, label, checked, onCheckedChange }: { id: string; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <div className="flex items-center gap-2">
    <Checkbox id={id} checked={checked} onCheckedChange={value => onCheckedChange(value === true)} />
    <Label htmlFor={id} className="text-xs font-semibold">
      {label}
    </Label>
  </div>
);

const OptionButtons = ({ label, options, value, onSelect }: { label: string; options: string[]; value?: string; onSelect: (value: any) => void }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <Button key={option} type="button" variant={value === option ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => onSelect(option)}>
          {option}
        </Button>
      ))}
    </div>
  </div>
);

export default CheckoutOrderingSettingsPage;
