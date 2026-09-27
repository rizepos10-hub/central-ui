import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { translate, Translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IPaymentMethodSetting } from 'app/shared/model/payment-method-setting.model';
import { TransactionMethodEnum } from 'app/shared/model/service-charge.model';
import { toast } from 'react-toastify';
import { getAllEntities, makeCheckAvailable, updateEntity } from './payment-method-setting.reducer';
import { Pencil, Trash2, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { DraggableList } from 'app/shared/components/draggable-list/draggable-list';
import { assignSequentialPaymentMethodOrder, sortPaymentMethodSettings } from 'app/shared/util/payment-method-setting-utils';

export const PaymentMethodSetting = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const paymentMethodSettings: IPaymentMethodSetting[] = useAppSelector(state => state.paymentMethodSetting.entities);
  const loading = useAppSelector(state => state.paymentMethodSetting.loading);
  const [sortedSettings, setSortedSettings] = useState<IPaymentMethodSetting[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingShowIds, setSavingShowIds] = useState<string[]>([]);
  const [addingCheck, setAddingCheck] = useState(false);
  const checkAvailable = paymentMethodSettings.some(setting => setting.transactionMethod === TransactionMethodEnum.check);

  useEffect(() => {
    dispatch(getAllEntities());
  }, [dispatch]);

  useEffect(() => {
    setSortedSettings(sortPaymentMethodSettings(paymentMethodSettings));
  }, [paymentMethodSettings]);

  const handleSyncList = () => {
    dispatch(getAllEntities());
  };

  const handleCreate = () => {
    navigate('/payment-method-setting/new');
  };

  const formatTransactionMethod = (method: string) => {
    if (!method) return '-';
    return method
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const persistReorder = async (nextSettings: IPaymentMethodSetting[]) => {
    const reorderedSettings = assignSequentialPaymentMethodOrder(nextSettings);
    setSortedSettings(reorderedSettings);

    const changedSettings = reorderedSettings.filter((setting, index) => paymentMethodSettings.find(entity => entity.id === setting.id)?.order !== index);

    if (changedSettings.length === 0) {
      return;
    }

    setSavingOrder(true);
    try {
      await Promise.all(
        changedSettings.map(setting =>
          dispatch(updateEntity({ entity: setting, refreshList: false })).unwrap()
        )
      );
      dispatch(getAllEntities());
    } finally {
      setSavingOrder(false);
    }
  };

  const handleShowToggle = async (setting: IPaymentMethodSetting, checked: boolean) => {
    if (!setting.id || savingOrder) {
      return;
    }

    setSavingShowIds(prev => [...prev, setting.id]);
    const nextSetting = {
      ...setting,
      show: checked,
    };

    setSortedSettings(prev =>
      prev.map(row => (row.id === setting.id ? nextSetting : row))
    );

    try {
      await dispatch(updateEntity({ entity: nextSetting, refreshList: false })).unwrap();
      dispatch(getAllEntities());
    } catch (error) {
      setSortedSettings(prev =>
        prev.map(row => (row.id === setting.id ? setting : row))
      );
    } finally {
      setSavingShowIds(prev => prev.filter(id => id !== setting.id));
    }
  };

  const handleMakeCheckAvailable = async () => {
    setAddingCheck(true);
    try {
      await makeCheckAvailable();
      toast.success('Check added. Tick Show to offer it on registers.');
      dispatch(getAllEntities());
    } catch (error) {
      toast.error(error?.response?.data?.title || 'Could not make Check available.');
    } finally {
      setAddingCheck(false);
    }
  };

  const listHeader = useMemo(
    () => (
      <div className="flex items-center gap-2 pr-2 text-xs font-semibold text-muted-foreground">
        <div aria-hidden="true" className="flex w-4 flex-col gap-0.5" />
        <div aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
        <div className="grid flex-1 grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_90px_70px_40px_40px] items-center gap-3">
          <span>Transaction Method</span>
          <span>Name</span>
          <span className="text-center">Show</span>
          <span>Order</span>
          <span className="text-center">Edit</span>
          <span className="text-center">Delete</span>
        </div>
      </div>
    ),
    []
  );

  return (
    <PageWrapper>
      <div className="bg-muted/50 p-2 flex justify-between items-center">
        <h2 className="text-xl font-bold">
          <Translate contentKey="payment-method-setting.title">Payment Method Settings</Translate>
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSyncList}
            disabled={loading || savingOrder}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {translate('common.refreshList')}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleCreate}
            disabled={savingOrder}
          >
            <Plus className="h-4 w-4 mr-1" />
            {translate('common.createNew')}
          </Button>
        </div>
      </div>

      {!loading && paymentMethodSettings.length > 0 && !checkAvailable ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Check is not available yet. Add it once the updated branch apps are deployed. It stays hidden on registers until you tick Show.
          </span>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => void handleMakeCheckAvailable()} disabled={addingCheck || savingOrder}>
            {addingCheck ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Make Check available
          </Button>
        </div>
      ) : null}

      <div className="mt-3">
        {loading ? (
          <div className="border rounded-md py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : sortedSettings.length === 0 ? (
          <div className="border rounded-md py-8 text-center text-xs">
            No payment method settings found
          </div>
        ) : (
          <DraggableList
            value={sortedSettings}
            onChange={event => {
              void persistReorder(event.value);
            }}
            dataKey="id"
            dragdrop
            showArrows
            disabled={savingOrder}
            header={
              <div className="space-y-2">
                {listHeader}
                {savingOrder ? (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving order...
                  </div>
                ) : null}
              </div>
            }
            itemTemplate={setting => {
              const editUrl = `/payment-method-setting/${setting.id}/edit`;
              const deleteUrl = `/payment-method-setting/${setting.id}/delete`;
              const isCustomMethod = setting.transactionMethod === TransactionMethodEnum.custom;
              const isSavingShow = !!setting.id && savingShowIds.includes(setting.id);

              return (
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_90px_70px_40px_40px] items-center gap-3 pr-2 text-xs">
                  <span className="truncate">{formatTransactionMethod(setting.transactionMethod)}</span>
                  <Link className="truncate hover:underline" to={editUrl} onClick={e => e.stopPropagation()}>
                    {setting.name || '-'}
                  </Link>
                  <div
                    className="flex justify-center"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={!!setting.show}
                      disabled={savingOrder || isSavingShow}
                      onCheckedChange={checked => {
                        void handleShowToggle(setting, checked === true);
                      }}
                      aria-label={`Toggle visibility for ${setting.name || formatTransactionMethod(setting.transactionMethod)}`}
                    />
                  </div>
                  <span>{setting.order ?? '-'}</span>
                  <span className="flex justify-center">
                    <Link to={editUrl} onClick={e => e.stopPropagation()}>
                      <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Link>
                  </span>
                  <span className="flex justify-center">
                    {isCustomMethod ? (
                      <Link to={deleteUrl} onClick={e => e.stopPropagation()}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </span>
                </div>
              );
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
};

export default PaymentMethodSetting;
