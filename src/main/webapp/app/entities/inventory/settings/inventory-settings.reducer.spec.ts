import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import reducer, {
  changeEntityField,
  getInventoryPurchaseOrderSettings,
  reset,
  updateInventoryPurchaseOrderSettings,
} from './inventory-settings.reducer';
import {
  PurchaseOrderSalesHistoryWindow,
  PurchaseOrderSuggestedQuantitySource,
} from 'app/shared/model/purchase-order-quantity-suggestion-settings.model';

describe('Inventory purchase order settings reducer tests', () => {
  const initialState = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: {
      purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.RESTOCK,
      purchaseOrderSalesHistoryWindow: PurchaseOrderSalesHistoryWindow.LAST_30_DAYS,
    },
    updating: false,
    totalItems: 0,
    updateSuccess: false,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' })).toMatchObject(initialState);
  });

  it('should update a setting field', () => {
    const state = reducer(
      undefined,
      changeEntityField({
        name: 'purchaseOrderSuggestedQuantitySource',
        value: PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT,
      })
    );
    expect(state.entity.purchaseOrderSuggestedQuantitySource).toBe(PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT);
  });

  it('should normalize fetched settings with defaults', () => {
    const payload = {
      data: {
        purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT,
      },
    };

    const state = reducer(undefined, { type: getInventoryPurchaseOrderSettings.fulfilled.type, payload });
    expect(state.entity.purchaseOrderSuggestedQuantitySource).toBe(PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT);
    expect(state.entity.purchaseOrderSalesHistoryWindow).toBe(PurchaseOrderSalesHistoryWindow.LAST_30_DAYS);
  });

  it('should normalize fetched wrapped settings from the by-key response', () => {
    const payload = {
      data: [
        {
          id: 'setting-1',
          key: 'PURCHASE_ORDER_QUANTITY_SUGGESTION',
          value: {
            purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT,
            purchaseOrderSalesHistoryWindow: PurchaseOrderSalesHistoryWindow.LAST_7_DAYS,
          },
        },
      ],
    };

    const state = reducer(undefined, { type: getInventoryPurchaseOrderSettings.fulfilled.type, payload });
    expect(state.entity.purchaseOrderSuggestedQuantitySource).toBe(PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT);
    expect(state.entity.purchaseOrderSalesHistoryWindow).toBe(PurchaseOrderSalesHistoryWindow.LAST_7_DAYS);
  });

  it('should reset state', () => {
    const state = reducer({ ...initialState, loading: true, updating: true }, reset());
    expect(state).toMatchObject(initialState);
  });

  describe('Actions', () => {
    let store;
    const resolvedObject = {
      data: [
        {
          id: 'setting-1',
          key: 'PURCHASE_ORDER_QUANTITY_SUGGESTION',
          value: {
            purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.RESTOCK,
            purchaseOrderSalesHistoryWindow: PurchaseOrderSalesHistoryWindow.LAST_30_DAYS,
          },
        },
      ],
    };

    beforeEach(() => {
      const mockStore = configureStore([thunk]);
      store = mockStore({});
      axios.get = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.put = sinon.stub().returns(Promise.resolve(resolvedObject));
    });

    it('dispatches fetch and update actions against the by-key endpoint', async () => {
      await store.dispatch(getInventoryPurchaseOrderSettings());
      await store.dispatch(
        updateInventoryPurchaseOrderSettings({
          purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT,
          purchaseOrderSalesHistoryWindow: PurchaseOrderSalesHistoryWindow.LAST_7_DAYS,
        })
      );

      expect((axios.get as any).calledWith('api/settings/by-key?key=PURCHASE_ORDER_QUANTITY_SUGGESTION')).toBe(true);
      expect((axios.put as any).calledWith('api/settings/by-key?key=PURCHASE_ORDER_QUANTITY_SUGGESTION')).toBe(true);
      expect((axios.put as any).firstCall.args[1]).toEqual({
        key: 'PURCHASE_ORDER_QUANTITY_SUGGESTION',
        value: {
          key: 'PURCHASE_ORDER_QUANTITY_SUGGESTION',
          purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.SALES_ORDER_COUNT,
          purchaseOrderSalesHistoryWindow: PurchaseOrderSalesHistoryWindow.LAST_7_DAYS,
        },
      });
    });
  });
});
