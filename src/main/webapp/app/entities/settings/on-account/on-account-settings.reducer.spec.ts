import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import reducer, { changeEntityField, getOnAccountSettings, reset, updateOnAccountSettings } from './on-account-settings.reducer';
import { OnAccountBalanceType } from 'app/shared/model/on-account-settings.model';

describe('On-account settings reducer tests', () => {
  const initialState = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: {
      onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
      onAccountDebitLimit: 0,
      branchOnAccountDebits: {},
      warningThreshold: 0,
      criticalThreshold: 0,
    },
    updating: false,
    totalItems: 0,
    updateSuccess: false,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' })).toMatchObject(initialState);
  });

  it('should update a setting field', () => {
    const state = reducer(undefined, changeEntityField({ name: 'warningThreshold', value: 25 }));
    expect(state.entity.warningThreshold).toBe(25);
  });

  it('should normalize fetched settings with defaults', () => {
    const payload = {
      data: {
        onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
        warningThreshold: 15,
      },
    };

    const state = reducer(undefined, { type: getOnAccountSettings.fulfilled.type, payload });
    expect(state.entity.onAccountBalanceType).toBe(OnAccountBalanceType.BY_BUSINESS);
    expect(state.entity.warningThreshold).toBe(15);
    expect(state.entity.criticalThreshold).toBe(0);
    expect(state.entity.onAccountDebitLimit).toBe(0);
    expect(state.entity.branchOnAccountDebits).toEqual({});
  });

  it('should reset state', () => {
    const state = reducer({ ...initialState, loading: true, updating: true }, reset());
    expect(state).toMatchObject(initialState);
  });

  describe('Actions', () => {
    let store;
    const resolvedObject = { data: { onAccountBalanceType: OnAccountBalanceType.BY_BRANCH } };

    beforeEach(() => {
      const mockStore = configureStore([thunk]);
      store = mockStore({});
      axios.get = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.put = sinon.stub().returns(Promise.resolve(resolvedObject));
    });

    it('dispatches fetch and update actions against the by-key endpoint', async () => {
      await store.dispatch(getOnAccountSettings());
      await store.dispatch(
        updateOnAccountSettings({
          onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
          warningThreshold: 10,
          criticalThreshold: 20,
        })
      );

      expect((axios.get as any).calledWith('api/settings/by-key?key=ON_ACCOUNT_DEBIT')).toBe(true);
      expect((axios.put as any).calledWith('api/settings/by-key?key=ON_ACCOUNT_DEBIT')).toBe(true);
    });
  });
});
