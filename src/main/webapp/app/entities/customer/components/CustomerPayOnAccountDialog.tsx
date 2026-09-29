import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { ICustomerPayByOnAccountRequest } from 'app/shared/model/customer-pay-by-on-account.model';
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';
import { formatTransactionMethodLabel } from 'app/shared/util/payment-method-utils';
import { sortPaymentMethodSettings } from 'app/shared/util/payment-method-setting-utils';
import { getAllEntities as getPaymentMethodSettings } from 'app/entities/settings/payment-method-setting/payment-method-setting.reducer';
import { getCustomerOnAccountPaydownValidation } from '../customer-pay-by-on-account.utils';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WsDialogContent as DialogContent } from 'app/modules/logistics/wholesale-ui/wholesale-overlays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'app/shared/components/select/select';

interface CustomerPayOnAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: ICustomer | null;
  submitting?: boolean;
  onSubmit: (payload: ICustomerPayByOnAccountRequest) => void | Promise<void>;
}

const CustomerPayOnAccountDialog = ({
  open,
  onOpenChange,
  customer,
  submitting = false,
  onSubmit,
}: CustomerPayOnAccountDialogProps) => {
  const dispatch = useAppDispatch();
  const paymentMethodSettings = useAppSelector(state => state.paymentMethodSetting.entities);
  const paymentMethodSettingsLoading = useAppSelector(state => state.paymentMethodSetting.loading);

  const [paymentMethodValue, setPaymentMethodValue] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [note, setNote] = useState('');

  const paymentMethodOptions = useMemo(
    () =>
      sortPaymentMethodSettings(paymentMethodSettings)
        .filter(setting => setting.show && setting.transactionMethod !== TransactionMethodEnum.onAccount)
        .map(setting => ({
          value: setting.transactionMethod || '',
          label: setting.name || formatTransactionMethodLabel(setting.transactionMethod),
        }))
        .filter(option => Boolean(option.value)),
    [paymentMethodSettings]
  );

  const selectedPaymentMethod = paymentMethodOptions.find(option => option.value === paymentMethodValue) || null;

  const paydownValidation = useMemo(
    () =>
      getCustomerOnAccountPaydownValidation({
        customer,
      }),
    [customer]
  );

  const maxPayableAmount = paydownValidation.payableBalance;
  const amountExceedsBalance = paymentAmount > maxPayableAmount;
  const amountValidationMessage =
    paymentAmount <= 0
      ? 'Enter an amount greater than 0.'
      : amountExceedsBalance
        ? 'Amount cannot be greater than the customer on account balance.'
        : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!paymentMethodSettings.length) {
      dispatch(getPaymentMethodSettings());
    }
  }, [dispatch, open, paymentMethodSettings.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPaymentAmount(0);
    setNote('');
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!paymentMethodOptions.length) {
      setPaymentMethodValue('');
      return;
    }

    if (!paymentMethodOptions.some(option => option.value === paymentMethodValue)) {
      setPaymentMethodValue(paymentMethodOptions[0].value);
    }
  }, [open, paymentMethodOptions, paymentMethodValue]);

  const handlePayFullBalance = () => {
    setPaymentAmount(maxPayableAmount);
  };

  const handleSubmit = async () => {
    if (!customer?.id) {
      toast.error('Customer details are required before paying on account.');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }

    if (amountValidationMessage) {
      toast.error(amountValidationMessage);
      return;
    }

    if (!paydownValidation.canProceed) {
      toast.error(paydownValidation.validationMessage || 'Unable to continue with this on account payment.');
      return;
    }

    await onSubmit({
      amount: paymentAmount * -1,
      branchId: null,
      orderId: null,
      paymentMethodName: selectedPaymentMethod.label,
      billSequenceNumber: null,
      note: note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={openState => !submitting && onOpenChange(openState)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pay On Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Payment Method</Label>
              <Select
                value={selectedPaymentMethod}
                options={paymentMethodOptions}
                onChange={option => setPaymentMethodValue(option?.value || '')}
                placeholder="Select payment method"
                isClearable
                isLoading={paymentMethodSettingsLoading}
                isDisabled={submitting}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Available Balance</span>
              <span className="font-semibold">${maxPayableAmount.toFixed(2)}</span>
            </div>
            {paydownValidation.validationMessage ? (
              <div className="text-xs font-medium text-destructive">{paydownValidation.validationMessage}</div>
            ) : null}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="customer-pay-on-account-amount" className="text-xs">Amount</Label>
              <Button
                type="button"
                variant="outline"
                className="h-7 text-xs"
                onClick={handlePayFullBalance}
                disabled={submitting || maxPayableAmount <= 0}
              >
                Pay Full Balance
              </Button>
            </div>
            <Input
              id="customer-pay-on-account-amount"
              type="number"
              min={0}
              step={0.01}
              max={maxPayableAmount}
              className="h-9"
              value={paymentAmount || ''}
              onChange={e => setPaymentAmount(Math.max(0, Number(e.target.value) || 0))}
              disabled={submitting}
            />
            {amountValidationMessage ? <div className="text-xs font-medium text-destructive">{amountValidationMessage}</div> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customer-pay-on-account-note" className="text-xs">Note (Optional)</Label>
            <textarea
              id="customer-pay-on-account-note"
              className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !selectedPaymentMethod ||
              !paydownValidation.canProceed ||
              Boolean(amountValidationMessage)
            }
            className="h-8 text-xs"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPayOnAccountDialog;
