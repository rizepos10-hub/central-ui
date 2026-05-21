import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { SettingKey } from 'app/shared/model/ENUMS/settings-keys.model';
import {
  defaultValue,
  IPurchaseOrderQuantitySuggestionSettings,
  PurchaseOrderSalesHistoryWindow,
  PurchaseOrderSuggestedQuantitySource,
} from 'app/shared/model/purchase-order-quantity-suggestion-settings.model';

const initialState: EntityState<IPurchaseOrderQuantitySuggestionSettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/settings';

const extractSettings = (payload?: any): IPurchaseOrderQuantitySuggestionSettings | undefined => {
  if (!payload) {
    return undefined;
  }

  if (Array.isArray(payload)) {
    return extractSettings(payload[0]);
  }

  if (payload.value && typeof payload.value === 'object') {
    return payload.value as IPurchaseOrderQuantitySuggestionSettings;
  }

  return payload as IPurchaseOrderQuantitySuggestionSettings;
};

const normalizeSettings = (
  settings?: IPurchaseOrderQuantitySuggestionSettings
): IPurchaseOrderQuantitySuggestionSettings => ({
  ...defaultValue,
  ...(settings || {}),
  purchaseOrderSuggestedQuantitySource:
    settings?.purchaseOrderSuggestedQuantitySource ?? PurchaseOrderSuggestedQuantitySource.RESTOCK,
  purchaseOrderSalesHistoryWindow:
    settings?.purchaseOrderSalesHistoryWindow ?? PurchaseOrderSalesHistoryWindow.LAST_30_DAYS,
});

const buildSettingsPayload = (settings: IPurchaseOrderQuantitySuggestionSettings) => ({
  key: SettingKey.PURCHASE_ORDER_QUANTITY_SUGGESTION,
  value: {
    key: SettingKey.PURCHASE_ORDER_QUANTITY_SUGGESTION,
    purchaseOrderSuggestedQuantitySource:
      settings?.purchaseOrderSuggestedQuantitySource ?? PurchaseOrderSuggestedQuantitySource.RESTOCK,
    purchaseOrderSalesHistoryWindow:
      settings?.purchaseOrderSalesHistoryWindow ?? PurchaseOrderSalesHistoryWindow.LAST_30_DAYS,
  },
});

export const getInventoryPurchaseOrderSettings = createAsyncThunk(
  'inventory-purchase-order-settings/fetch_entity',
  async () =>
    axios.get<IPurchaseOrderQuantitySuggestionSettings>(
      `${apiUrl}/by-key?key=${SettingKey.PURCHASE_ORDER_QUANTITY_SUGGESTION}`
    ),
  { serializeError: serializeAxiosError }
);

export const updateInventoryPurchaseOrderSettings = createAsyncThunk(
  'inventory-purchase-order-settings/update_entity',
  async (entity: IPurchaseOrderQuantitySuggestionSettings) =>
    axios.put<IPurchaseOrderQuantitySuggestionSettings>(
      `${apiUrl}/by-key?key=${SettingKey.PURCHASE_ORDER_QUANTITY_SUGGESTION}`,
      cleanEntity(buildSettingsPayload(entity))
    ),
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{
  name: keyof IPurchaseOrderQuantitySuggestionSettings;
  value: IPurchaseOrderQuantitySuggestionSettings[keyof IPurchaseOrderQuantitySuggestionSettings];
}>('inventory-purchase-order-settings/change-entity-field');

export const InventoryPurchaseOrderSettingsSlice = createEntitySlice({
  name: 'inventoryPurchaseOrderSettings',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        state.entity = {
          ...state.entity,
          [action.payload.name]: action.payload.value,
        };
      })
      .addCase(getInventoryPurchaseOrderSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = normalizeSettings(extractSettings(action.payload.data));
      })
      .addMatcher(isFulfilled(updateInventoryPurchaseOrderSettings), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = normalizeSettings(extractSettings(action.payload.data));
      })
      .addMatcher(isPending(getInventoryPurchaseOrderSettings), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateInventoryPurchaseOrderSettings), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = InventoryPurchaseOrderSettingsSlice.actions;
export default InventoryPurchaseOrderSettingsSlice.reducer;
