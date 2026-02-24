import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './payment-method-setting.reducer';
import { IPaymentMethodSetting } from 'app/shared/model/payment-method-setting.model';
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Select from 'react-select';

export const PaymentMethodSettingUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const paymentMethodSettingEntity: IPaymentMethodSetting = useAppSelector(state => state.paymentMethodSetting.entity);
  const loading = useAppSelector(state => state.paymentMethodSetting.loading);
  const updating = useAppSelector(state => state.paymentMethodSetting.updating);
  
  const [showNameWarning, setShowNameWarning] = useState(false);
  const [originalName, setOriginalName] = useState<string>('');
  const [pendingSave, setPendingSave] = useState<{ createNew: boolean } | null>(null);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    } else {
      dispatch(reset());
      // Set default transaction method to custom for new entries
      dispatch(changeEntityField({ name: 'transactionMethod', value: TransactionMethodEnum.custom }));
    }
  }, []);

  useEffect(() => {
    if (paymentMethodSettingEntity.name) {
      setOriginalName(paymentMethodSettingEntity.name);
    }
  }, [paymentMethodSettingEntity.name]);

  const saveEntity = (e: React.FormEvent, createNew = false) => {
    e.preventDefault();

    // Check if name has changed and this is an update (not new)
    if (!isNew && paymentMethodSettingEntity.name !== originalName) {
      setPendingSave({ createNew });
      setShowNameWarning(true);
      return;
    }

    performSave(createNew);
  };

  const performSave = (createNew: boolean) => {
    if (isNew) {
      // Only allow creating custom payment methods
      if (paymentMethodSettingEntity.transactionMethod !== TransactionMethodEnum.custom) {
        // This shouldn't happen in UI, but add safety check
        return;
      }
      dispatch(createEntity(paymentMethodSettingEntity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/payment-method-setting/${newId}/edit`);
          }
        }
      });
    } else {
      dispatch(updateEntity(paymentMethodSettingEntity)).then(() => {
        if (createNew) {
          navigate(`/payment-method-setting/new`);
        } else {
          navigate(`/payment-method-setting`);
        }
      });
    }
  };

  const handleConfirmNameChange = () => {
    setShowNameWarning(false);
    if (pendingSave) {
      performSave(pendingSave.createNew);
      setPendingSave(null);
    }
  };

  const handleCancelNameChange = () => {
    setShowNameWarning(false);
    setPendingSave(null);
    // Restore original name
    dispatch(changeEntityField({ name: 'name', value: originalName }));
  };

  const formatTransactionMethod = (method: string) => {
    if (!method) return '';
    return method
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  // Options for transaction method (only show custom for new entries)
  const transactionMethodOptions = isNew
    ? [{ label: formatTransactionMethod(TransactionMethodEnum.custom), value: TransactionMethodEnum.custom }]
    : [{ label: formatTransactionMethod(paymentMethodSettingEntity.transactionMethod as string), value: paymentMethodSettingEntity.transactionMethod }];

  const isCustomMethod = paymentMethodSettingEntity.transactionMethod === TransactionMethodEnum.custom;

  return (
    <PageWrapper>
      <h2 className="text-xl font-bold">
        {isNew ? "Create New Payment Method Setting" : "Edit Payment Method Setting"}
      </h2>

      <div className="bg-white p-6 rounded-md border">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="space-y-6" onSubmit={saveEntity}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transaction-method" className="text-xs">
                  Transaction Method
                </Label>
                <Select
                  id="transaction-method"
                  value={transactionMethodOptions.find(
                    opt => opt.value === paymentMethodSettingEntity.transactionMethod
                  )}
                  onChange={(option) => {
                    if (isNew) {
                      dispatch(changeEntityField({ name: 'transactionMethod', value: option?.value }));
                    }
                  }}
                  options={transactionMethodOptions}
                  placeholder="Select Transaction Method"
                  isDisabled={!isNew} // Read-only for existing entries
                  isClearable={false}
                />
                {!isNew && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Transaction method cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={paymentMethodSettingEntity.name || ''}
                  onChange={(e) => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                  required
                  className="h-9 text-xs"
                  placeholder="Enter payment method name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="show" className="text-xs">
                  Show
                </Label>
                <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="show"
                    checked={paymentMethodSettingEntity.show || false}
                    onChange={(e) => dispatch(changeEntityField({ name: 'show', value: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span className="text-xs">
                    Show this payment method to end users
                  </span>
                </label>
              </div>
            </div>

            {!isNew && !isCustomMethod && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> This payment method cannot be deleted. Only the name and visibility can be edited.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-8 text-xs"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                size="sm"
                onClick={(e) => saveEntity(e, false)}
                type="submit"
                disabled={updating}
                className="h-8 text-xs"
              >
                <Save className="h-4 w-4" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              {isNew && (
                <Button
                  size="sm"
                  onClick={(e) => saveEntity(e, true)}
                  type="button"
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Name Change Warning Dialog */}
      <AlertDialog open={showNameWarning} onOpenChange={setShowNameWarning}>
        <AlertDialogContent className="text-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Warning: Changing Payment Method Name
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs mt-2">
              Changing the name of this payment method will affect its record in reports. Transactions previously recorded under the old name will appear as a separate entry from transactions recorded under the new name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNameChange} className="h-8 text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmNameChange}
              className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700"
            >
              Continue with Name Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default PaymentMethodSettingUpdate;
