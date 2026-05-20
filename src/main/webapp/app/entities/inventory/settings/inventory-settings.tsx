import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  IPurchaseOrderQuantitySuggestionSettings,
  PurchaseOrderSalesHistoryWindow,
  PurchaseOrderSuggestedQuantitySource,
} from 'app/shared/model/purchase-order-quantity-suggestion-settings.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  changeEntityField,
  getInventoryPurchaseOrderSettings,
  updateInventoryPurchaseOrderSettings,
} from './inventory-settings.reducer';

const InventorySettingsPage = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.inventoryPurchaseOrderSettings.entity);
  const loading = useAppSelector(state => state.inventoryPurchaseOrderSettings.loading);
  const updating = useAppSelector(state => state.inventoryPurchaseOrderSettings.updating);
  const updateSuccess = useAppSelector(state => state.inventoryPurchaseOrderSettings.updateSuccess);

  useEffect(() => {
    dispatch(getInventoryPurchaseOrderSettings());
  }, [dispatch]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success('Inventory settings saved.');
    }
  }, [updateSuccess]);

  const handleFieldChange = (
    name: keyof IPurchaseOrderQuantitySuggestionSettings,
    value: IPurchaseOrderQuantitySuggestionSettings[keyof IPurchaseOrderQuantitySuggestionSettings]
  ) => {
    dispatch(changeEntityField({ name, value }));
  };

  const onSave = async () => {
    try {
      await dispatch(updateInventoryPurchaseOrderSettings(settings)).unwrap();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save inventory settings.';
      toast.error(message);
    }
  };

  return (
    <PageWrapper className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Inventory Settings</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 text-xs">
            <Link to="/inventory/warehouse">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Link>
          </Button>
          <Button type="button" className="h-8 text-xs" disabled={updating} onClick={onSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase Order Quantity Suggestion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-xs">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Suggested Quantity Source</Label>
            <RadioGroup
              value={settings?.purchaseOrderSuggestedQuantitySource || PurchaseOrderSuggestedQuantitySource.RESTOCK}
              onValueChange={value =>
                handleFieldChange('purchaseOrderSuggestedQuantitySource', value as PurchaseOrderSuggestedQuantitySource)
              }
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PurchaseOrderSuggestedQuantitySource.RESTOCK} id="purchase-order-source-restock" />
                <Label htmlFor="purchase-order-source-restock" className="cursor-pointer text-xs">
                  Restock
                </Label>
              </div>
              <p className="pl-6 text-[11px] text-muted-foreground">
                Use stock shortfall versus minimum stock and the purchasing MOQ.
              </p>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT}
                  id="purchase-order-source-sales-order-count"
                />
                <Label htmlFor="purchase-order-source-sales-order-count" className="cursor-pointer text-xs">
                  Sales Order Count
                </Label>
              </div>
              <p className="pl-6 text-[11px] text-muted-foreground">
                Use the count of distinct closed or paid orders containing the variant in the selected window.
              </p>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Sales History Window</Label>
            <RadioGroup
              value={settings?.purchaseOrderSalesHistoryWindow || PurchaseOrderSalesHistoryWindow.LAST_30_DAYS}
              onValueChange={value =>
                handleFieldChange('purchaseOrderSalesHistoryWindow', value as PurchaseOrderSalesHistoryWindow)
              }
              className="flex flex-col gap-2 md:flex-row md:gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PurchaseOrderSalesHistoryWindow.LAST_7_DAYS} id="purchase-order-window-7-days" />
                <Label htmlFor="purchase-order-window-7-days" className="cursor-pointer text-xs">
                  Last 7 Days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PurchaseOrderSalesHistoryWindow.LAST_30_DAYS} id="purchase-order-window-30-days" />
                <Label htmlFor="purchase-order-window-30-days" className="cursor-pointer text-xs">
                  Last 30 Days
                </Label>
              </div>
            </RadioGroup>
          </div>

          {loading ? <p className="text-[11px] text-muted-foreground">Loading inventory settings...</p> : null}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default InventorySettingsPage;
