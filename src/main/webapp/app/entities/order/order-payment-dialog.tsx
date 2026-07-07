import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getEntity as getCustomerEntity } from 'app/entities/customer/customer.reducer';
import { getOnAccountSettings } from 'app/entities/settings/on-account/on-account-settings.reducer';
import { getEntity as getLoyaltyExchange } from 'app/entities/loyalty/loyalty-exchange.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { ILoyaltyExChange } from 'app/shared/model/CUSTOMER/loyalty.model';
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';
import { getOnAccountPaymentValidation } from './order-on-account.utils';
import { formatTransactionMethodLabel } from 'app/shared/util/payment-method-utils';
import { cn } from 'app/lib/utils';
import { getAllEntities as getPaymentMethodSettings } from 'app/entities/settings/payment-method-setting/payment-method-setting.reducer';
import { sortPaymentMethodSettings } from 'app/shared/util/payment-method-setting-utils';

interface ChargePreviewRow {
  key: string;
  label: string;
  amount: number;
}

interface OrderPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  orderBranchId?: string | null;
  customerId?: string | null;
  baseOrderTotal?: number | null;
  chargePreviewRows?: ChargePreviewRow[];
  loyaltyPreviewEligible?: boolean;
  loyaltyPreviewPoints?: number | null;
  totalAmount?: number | null;
  totalPaid?: number | null;
  defaultPaymentAmount?: number;
  submitLabel: string;
  onSubmit: (payload: { amount: number; tipAmount: number; loyaltyPointsToRedeem?: number; transactionMethod: string }) => void | Promise<void>;
  submitting?: boolean;
  submitDisabled?: boolean;
}

const incrementIntegerString = (value: string) => {
  let carry = 1;
  const digits = value.split('');

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const nextDigit = Number(digits[index]) + carry;
    if (nextDigit >= 10) {
      digits[index] = '0';
      carry = 1;
    } else {
      digits[index] = String(nextDigit);
      carry = 0;
      break;
    }
  }

  return carry > 0 ? `1${digits.join('')}` : digits.join('');
};

const toPlainDecimalString = (value: number) => {
  const absoluteValue = Math.abs(value);
  const asString = absoluteValue.toString();

  if (!asString.includes('e') && !asString.includes('E')) {
    return asString;
  }

  return absoluteValue.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
};

const scaleMoney = (value?: number | null) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return 0;
  }

  const sign = numericValue < 0 ? -1 : 1;
  const absoluteString = toPlainDecimalString(numericValue);
  const [wholePart = '0', decimalPart = ''] = absoluteString.split('.');
  let cents = decimalPart.slice(0, 2).padEnd(2, '0');
  const guardDigit = Number(decimalPart.charAt(2) || '0');

  if (guardDigit >= 5) {
    const incremented = incrementIntegerString(`${wholePart}${cents}`);
    cents = incremented.slice(-2).padStart(2, '0');
    const nextWholePart = incremented.slice(0, -2);
    return sign * Number(`${nextWholePart || '0'}.${cents}`);
  }

  return sign * Number(`${wholePart}.${cents}`);
};

const scalePoints = (value?: number | null) => scaleMoney(value);

const OrderPaymentDialog = ({
  open,
  onOpenChange,
  title,
  orderBranchId,
  customerId,
  baseOrderTotal = 0,
  chargePreviewRows = [],
  loyaltyPreviewEligible = false,
  loyaltyPreviewPoints = 0,
  totalAmount = 0,
  totalPaid = 0,
  defaultPaymentAmount = 0,
  submitLabel,
  onSubmit,
  submitting = false,
  submitDisabled = false,
}: OrderPaymentDialogProps) => {
  const dispatch = useAppDispatch();
  const customerEntity: ICustomer = useAppSelector(state => state.customer.entity);
  const onAccountSettings = useAppSelector(state => state.onAccountSettings.entity);
  const onAccountSettingsLoading = useAppSelector(state => state.onAccountSettings.loading);
  const loyaltyExchange: ILoyaltyExChange = useAppSelector(state => state.loyaltyExchange.entity);
  const paymentMethodSettings = useAppSelector(state => state.paymentMethodSetting.entities);
  const paymentMethodSettingsLoading = useAppSelector(state => state.paymentMethodSetting.loading);

  const [paymentAmount, setPaymentAmount] = useState<number>(Math.max(0, defaultPaymentAmount));
  const [paymentTipAmount, setPaymentTipAmount] = useState<number>(0);
  const [paymentTransactionMethod, setPaymentTransactionMethod] = useState<string>('');
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
  const [loyaltyRemainderMethod, setLoyaltyRemainderMethod] = useState<string>('');

  const normalizedBaseOrderTotal = scaleMoney(baseOrderTotal);
  const normalizedTotalAmount = scaleMoney(totalAmount);
  const normalizedTotalPaid = scaleMoney(totalPaid);
  const remaining = scaleMoney(Math.max(0, normalizedTotalAmount - normalizedTotalPaid));
  const visibleChargeRows = chargePreviewRows.filter(charge => (charge.amount ?? 0) > 0);
  const paymentCustomer = customerEntity?.id && customerEntity.id === customerId ? customerEntity : null;

  const paymentMethodOptions = useMemo(
    () =>
      sortPaymentMethodSettings(paymentMethodSettings)
        .filter(setting => setting.show)
        .map(setting => ({
          label: setting.name || formatTransactionMethodLabel(setting.transactionMethod),
          value: setting.transactionMethod || '',
          setting,
        }))
        .filter(option => Boolean(option.value)),
    [paymentMethodSettings]
  );
  const hasVisiblePaymentMethods = paymentMethodOptions.length > 0;
  const selectedPaymentMethod = paymentMethodOptions.find(method => method.value === paymentTransactionMethod);
  const isLoyaltyPayment = (selectedPaymentMethod?.setting?.name || '').trim().toLowerCase() === 'loyalty';
  const pointToCashExchange = scalePoints(loyaltyExchange?.pointToCashExchange ?? 0);
  const availableLoyaltyPoints = scalePoints(Math.max(0, Number(paymentCustomer?.loyaltyPointsRemaining ?? 0)));
  const loyaltyCashCoverage = pointToCashExchange > 0
    ? scaleMoney(Math.min(remaining, scalePoints(Math.max(0, loyaltyPointsToRedeem)) / pointToCashExchange))
    : 0;
  const autoCalculatedRemainder = scaleMoney(Math.max(0, remaining - loyaltyCashCoverage));
  const effectivePaymentAmount = scaleMoney(paymentAmount);
  const totalCovered = scaleMoney(Math.min(remaining, effectivePaymentAmount + loyaltyCashCoverage));
  const uncoveredAmount = scaleMoney(Math.max(0, remaining - totalCovered));
  const activeNonLoyaltyMethod = isLoyaltyPayment ? loyaltyRemainderMethod : paymentTransactionMethod;
  const isOnAccountPayment = activeNonLoyaltyMethod === TransactionMethodEnum.onAccount;
  const shouldShowLoyaltyPreview = loyaltyPreviewEligible && Boolean(customerId) && !isLoyaltyPayment;

  const onAccountValidation = getOnAccountPaymentValidation({
    customer: paymentCustomer,
    orderBranchId,
    paymentAmount: effectivePaymentAmount,
    onAccountBalanceType: onAccountSettings?.onAccountBalanceType,
  });

  const onAccountDataLoading =
    isOnAccountPayment && (onAccountSettingsLoading || (Boolean(customerId) && !paymentCustomer));
  const onAccountValidationMessage = onAccountDataLoading ? 'Loading account details...' : onAccountValidation.validationMessage;
  const canProceedWithOnAccountPayment = !isOnAccountPayment || (!onAccountDataLoading && onAccountValidation.canProceed);

  const formatCurrencyAmount = (value?: number | null) => {
    const numericValue = scaleMoney(value);

    if (!Number.isFinite(numericValue)) {
      return '$0.00';
    }

    const normalizedValue = Object.is(numericValue, -0) ? 0 : numericValue;
    const sign = normalizedValue < 0 ? '-' : '';
    const absoluteString = Math.abs(normalizedValue).toString();

    if (absoluteString.includes('e')) {
      return `${sign}$${Math.abs(normalizedValue).toFixed(2)}`;
    }

    return `${sign}$${Math.abs(normalizedValue).toFixed(2)}`;
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    dispatch(getOnAccountSettings());
    dispatch(getLoyaltyExchange());
    if (customerId) {
      dispatch(getCustomerEntity(customerId));
    }
    if (!paymentMethodSettings.length) {
      dispatch(getPaymentMethodSettings());
    }
  }, [customerId, dispatch, open, paymentMethodSettings.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPaymentAmount(scaleMoney(Math.max(0, Math.min(Number(defaultPaymentAmount ?? 0), remaining))));
    setPaymentTipAmount(0);
    setLoyaltyPointsToRedeem(0);
  }, [defaultPaymentAmount, open, remaining]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!hasVisiblePaymentMethods) {
      setPaymentTransactionMethod('');
      return;
    }

    const hasCurrentSelection = paymentMethodOptions.some(method => method.value === paymentTransactionMethod);
    if (!hasCurrentSelection) {
      setPaymentTransactionMethod(paymentMethodOptions[0].value);
    }
  }, [hasVisiblePaymentMethods, open, paymentMethodOptions, paymentTransactionMethod]);

  useEffect(() => {
    if (!open || !isLoyaltyPayment) {
      return;
    }
    const nonLoyaltyOptions = paymentMethodOptions.filter(
      method => (method.setting?.name || '').trim().toLowerCase() !== 'loyalty'
    );
    if (!nonLoyaltyOptions.length) {
      setLoyaltyRemainderMethod('');
      return;
    }
    const hasCurrentSelection = nonLoyaltyOptions.some(method => method.value === loyaltyRemainderMethod);
    if (!hasCurrentSelection) {
      setLoyaltyRemainderMethod(nonLoyaltyOptions[0].value);
    }
  }, [isLoyaltyPayment, loyaltyRemainderMethod, open, paymentMethodOptions]);

  useEffect(() => {
    if (!open || !isLoyaltyPayment) {
      return;
    }
    setPaymentAmount(autoCalculatedRemainder);
  }, [autoCalculatedRemainder, isLoyaltyPayment, open]);

  const handleSubmit = async () => {
    if (isOnAccountPayment) {
      if (onAccountDataLoading) {
        toast.error('Loading account details...');
        return;
      }

      if (!onAccountValidation.canProceed) {
        toast.error(onAccountValidation.validationMessage || 'Unable to continue with on account payment.');
        return;
      }
    }

    await onSubmit({
      amount: effectivePaymentAmount,
      tipAmount: scaleMoney(paymentTipAmount),
      loyaltyPointsToRedeem: isLoyaltyPayment ? loyaltyPointsToRedeem : 0,
      transactionMethod: isLoyaltyPayment ? (effectivePaymentAmount > 0 ? loyaltyRemainderMethod : 'loyalty') : paymentTransactionMethod,
    });
  };

  const nonLoyaltyPaymentOptions = paymentMethodOptions.filter(
    method => (method.setting?.name || '').trim().toLowerCase() !== 'loyalty'
  );

  return (
    <Dialog open={open} onOpenChange={openState => !submitting && onOpenChange(openState)}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <div className="text-sm font-medium">Payment Method</div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-2">
                {paymentMethodSettingsLoading && !hasVisiblePaymentMethods ? (
                  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading payment methods...
                  </div>
                ) : !hasVisiblePaymentMethods ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No visible payment methods are configured.
                  </div>
                ) : (
                  paymentMethodOptions.map(method => (
                    <button
                      key={method.value}
                      type="button"
                      className={cn(
                        'w-full rounded-md border px-3 py-3 text-left text-sm transition-colors',
                        paymentTransactionMethod === method.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-muted'
                      )}
                      onClick={() => setPaymentTransactionMethod(method.value)}
                      disabled={submitting}
                    >
                      {method.label}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Base Total:</span>
                  <span className="font-semibold">{formatCurrencyAmount(normalizedBaseOrderTotal)}</span>
                </div>
                {visibleChargeRows.map(charge => (
                  <div key={charge.key} className="flex justify-between mb-1">
                    <span className="text-muted-foreground">{charge.label}:</span>
                    <span className="font-semibold">{formatCurrencyAmount(charge.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Final Total:</span>
                  <span className="font-semibold">{formatCurrencyAmount(normalizedTotalAmount)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-semibold">{formatCurrencyAmount(normalizedTotalPaid)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Remaining:</span>
                  <span className="font-bold text-lg">{formatCurrencyAmount(remaining)}</span>
                </div>
                {isLoyaltyPayment ? (
                  <>
                    <div className="mt-3 flex justify-between gap-3 rounded-md bg-amber-50 px-3 py-2 text-amber-800">
                      <span>Loyalty covers</span>
                      <span className="font-semibold">{formatCurrencyAmount(loyaltyCashCoverage)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-slate-700">
                      <span>Still unpaid</span>
                      <span className="font-semibold">{formatCurrencyAmount(uncoveredAmount)}</span>
                    </div>
                  </>
                ) : null}
                {shouldShowLoyaltyPreview ? (
                  <div className="mt-3 flex justify-between gap-3 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                    <span>This customer will earn</span>
                    <span className="font-semibold">{scalePoints(loyaltyPreviewPoints ?? 0).toFixed(2)} points</span>
                  </div>
                ) : null}
              </div>
              {isLoyaltyPayment && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm space-y-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Available loyalty points</span>
                    <span className="font-semibold">{availableLoyaltyPoints.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Exchange rate</span>
                    <span className="font-semibold">
                      {pointToCashExchange > 0 ? `${pointToCashExchange.toFixed(2)} points = $1.00` : 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">How many points to redeem</label>
                    <Input
                      type="number"
                      value={loyaltyPointsToRedeem}
                      onChange={e => {
                        const nextValue = scalePoints(Math.max(0, Number(e.target.value)));
                        const maxByBalance = availableLoyaltyPoints;
                        const maxByBill = pointToCashExchange > 0 ? scalePoints(remaining * pointToCashExchange) : 0;
                        setLoyaltyPointsToRedeem(scalePoints(Math.min(nextValue, maxByBalance, maxByBill || nextValue)));
                      }}
                      min={0}
                      step={0.01}
                      max={availableLoyaltyPoints}
                      className="h-9"
                      disabled={submitting || pointToCashExchange <= 0}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">{isLoyaltyPayment ? 'Cash / remainder amount' : 'Payment Amount'}</label>
                <Input
                  type="number"
                  value={effectivePaymentAmount}
                  onChange={e => {
                    const nextValue = scaleMoney(Math.max(0, Number(e.target.value)));
                    const maxCashAmount = scaleMoney(Math.max(0, remaining - loyaltyCashCoverage));
                    setPaymentAmount(scaleMoney(Math.min(maxCashAmount, nextValue)));
                  }}
                  min={0}
                  step={0.01}
                  max={scaleMoney(Math.max(0, remaining - loyaltyCashCoverage))}
                  className="h-9"
                  disabled={submitting}
                />
              </div>
              {isLoyaltyPayment && effectivePaymentAmount > 0 && nonLoyaltyPaymentOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Remainder payment method</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {nonLoyaltyPaymentOptions.map(method => (
                      <button
                        key={method.value}
                        type="button"
                        className={cn(
                          'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                          loyaltyRemainderMethod === method.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        )}
                        onClick={() => setLoyaltyRemainderMethod(method.value)}
                        disabled={submitting}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Tip Amount (Optional)</label>
                <Input
                  type="number"
                  value={paymentTipAmount}
                  onChange={e => setPaymentTipAmount(scaleMoney(Math.max(0, Number(e.target.value))))}
                  min={0}
                  step={0.01}
                  className="h-9"
                  disabled={submitting}
                />
              </div>
              {isOnAccountPayment && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm space-y-2">
                  <div className="font-medium text-amber-950">On Account Validation</div>
                  {onAccountDataLoading ? (
                    <div className="text-xs text-amber-800">Loading account details...</div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Account Balance</span>
                        <span className="font-semibold">{formatCurrencyAmount(onAccountValidation.accountBalance)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Account Limit</span>
                        <span className="font-semibold">{formatCurrencyAmount(onAccountValidation.accountLimit)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Account Remaining</span>
                        <span
                          className={`font-semibold ${onAccountValidation.accountRemaining >= 0 ? 'text-emerald-700' : 'text-destructive'}`}
                        >
                          {formatCurrencyAmount(onAccountValidation.accountRemaining)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-amber-200 pt-2">
                        <span className="font-medium">Balance After Payment</span>
                        <span
                          className={`font-semibold ${onAccountValidation.canProceed ? 'text-emerald-700' : 'text-destructive'}`}
                        >
                          {formatCurrencyAmount(onAccountValidation.accountBalanceAfterPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">Remaining After Payment</span>
                        <span
                          className={`font-semibold ${onAccountValidation.accountRemainingAfterPayment >= 0 ? 'text-emerald-700' : 'text-destructive'}`}
                        >
                          {formatCurrencyAmount(onAccountValidation.accountRemainingAfterPayment)}
                        </span>
                      </div>
                      {onAccountValidationMessage && (
                        <div className="text-xs font-medium text-destructive">{onAccountValidationMessage}</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
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
              submitDisabled ||
              totalCovered <= 0 ||
              (isLoyaltyPayment && uncoveredAmount > 0.0001) ||
              !canProceedWithOnAccountPayment ||
              (!isLoyaltyPayment && !paymentTransactionMethod) ||
              (isLoyaltyPayment && effectivePaymentAmount > 0 && !loyaltyRemainderMethod)
            }
            className="h-8 text-xs"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPaymentDialog;
