import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import reducer, {
  changeEntityField,
  getTookanAgents,
  getTookanSetting,
  getTookanTeams,
  reset,
  updateTookanSetting,
} from './tookan.reducer';
import { defaultTookanSettingValue, normalizeTookanSettingValue } from 'app/shared/model/tookan-setting.model';

describe('Tookan settings reducer tests', () => {
  const initialState = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: {
      value: defaultTookanSettingValue,
      hasApiKey: false,
      hasWebhookSecret: false,
    },
    updating: false,
    totalItems: 0,
    updateSuccess: false,
    teams: [],
    agents: [],
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' })).toMatchObject(initialState);
  });

  it('should update nested setting field', () => {
    const state = reducer(undefined, changeEntityField({ name: 'active', value: true }));
    expect(state.entity.value.active).toBe(true);
  });

  it('should normalize fetched settings with defaults', () => {
    const payload = {
      data: {
        branchId: 'branch-1',
        hasApiKey: true,
        hasWebhookSecret: false,
        value: { active: true },
      },
    };

    const state = reducer(undefined, { type: getTookanSetting.fulfilled.type, payload });
    expect(state.entity.branchId).toBe('branch-1');
    expect(state.entity.value.active).toBe(true);
    expect(state.entity.value.notify).toBe(true);
    expect(state.entity.value.deliveryConfiguration.zoneChargeRules).toEqual([]);
    expect(state.entity.hasApiKey).toBe(true);
  });

  it('should preserve zone charge rules when normalizing settings', () => {
    const normalized = normalizeTookanSettingValue({
      deliveryConfiguration: {
        zoneChargeRules: [{ zoneId: 'zone-1', charge: 12 }],
      },
    });

    expect(normalized.deliveryConfiguration.zoneChargeRules).toEqual([{ zoneId: 'zone-1', charge: 12 }]);
    expect(normalized.deliveryConfiguration.definedChargeRules).toEqual([]);
  });

  it('should set teams and agents on successful fetch', () => {
    const teamsState = reducer(undefined, {
      type: getTookanTeams.fulfilled.type,
      payload: { data: [{ team_id: 1, team_name: 'Team 1' }] },
    });
    expect(teamsState.teams).toHaveLength(1);

    const agentsState = reducer(undefined, {
      type: getTookanAgents.fulfilled.type,
      payload: { data: [{ fleet_id: 2, name: 'Driver 1' }] },
    });
    expect(agentsState.agents).toHaveLength(1);
  });

  it('should reset state', () => {
    const state = reducer({ ...initialState, loading: true, updating: true }, reset());
    expect(state).toMatchObject(initialState);
  });

  describe('Actions', () => {
    let store;
    const resolvedObject = { data: { value: {} } };

    beforeEach(() => {
      const mockStore = configureStore([thunk]);
      store = mockStore({});
      axios.get = sinon.stub().returns(Promise.resolve(resolvedObject));
      axios.put = sinon.stub().returns(Promise.resolve(resolvedObject));
    });

    it('dispatches update action and refreshes branch settings', async () => {
      await store.dispatch(
        updateTookanSetting({
          branchId: 'branch-1',
          value: { active: true },
        })
      );

      expect((axios.put as any).calledOnce).toBe(true);
      expect((axios.get as any).calledWith('api/settings/tookan/branch-1')).toBe(true);
    });
  });
});
