import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { SettingKey } from 'app/shared/model/ENUMS/settings-keys.model';
import {
  defaultValue,
  IOnAccountSettings,
  OnAccountBalanceType,
} from 'app/shared/model/on-account-settings.model';

const initialState: EntityState<IOnAccountSettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/settings';

const normalizeOnAccountSettings = (settings?: IOnAccountSettings): IOnAccountSettings => ({
  ...defaultValue,
  ...(settings || {}),
  onAccountBalanceType: settings?.onAccountBalanceType ?? OnAccountBalanceType.BY_BRANCH,
  onAccountDebitLimit: settings?.onAccountDebitLimit ?? 0,
  branchOnAccountDebits: settings?.branchOnAccountDebits ?? {},
  warningThreshold: settings?.warningThreshold ?? 0,
  criticalThreshold: settings?.criticalThreshold ?? 0,
});

const buildOnAccountSettingsPayload = (settings: IOnAccountSettings) => {
  return {
    onAccountBalanceType: settings?.onAccountBalanceType ?? OnAccountBalanceType.BY_BRANCH,
    warningThreshold: settings?.warningThreshold ?? 0,
    criticalThreshold: settings?.criticalThreshold ?? 0,
  };
};

export const getOnAccountSettings = createAsyncThunk(
  'on-account-settings/fetch_entity',
  async () => axios.get<IOnAccountSettings>(`${apiUrl}/by-key?key=${SettingKey.ON_ACCOUNT_DEBIT}`),
  { serializeError: serializeAxiosError }
);

export const updateOnAccountSettings = createAsyncThunk(
  'on-account-settings/update_entity',
  async (entity: IOnAccountSettings) => {
    return axios.put<IOnAccountSettings>(`${apiUrl}/by-key?key=${SettingKey.ON_ACCOUNT_DEBIT}`, cleanEntity(buildOnAccountSettingsPayload(entity)));
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: keyof IOnAccountSettings; value: IOnAccountSettings[keyof IOnAccountSettings] }>(
  'on-account-settings/change-entity-field'
);

export const OnAccountSettingsSlice = createEntitySlice({
  name: 'onAccountSettings',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        state.entity = {
          ...state.entity,
          [action.payload.name]: action.payload.value,
        };
      })
      .addCase(getOnAccountSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = normalizeOnAccountSettings(action.payload.data);
      })
      .addMatcher(isFulfilled(updateOnAccountSettings), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = normalizeOnAccountSettings(action.payload.data);
      })
      .addMatcher(isPending(getOnAccountSettings), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateOnAccountSettings), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = OnAccountSettingsSlice.actions;
export default OnAccountSettingsSlice.reducer;
