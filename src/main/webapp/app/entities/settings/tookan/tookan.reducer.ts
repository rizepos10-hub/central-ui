import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import {
  defaultTookanSettingResponse,
  defaultTookanSettingValue,
  ITookanSettingRequest,
  ITookanSettingResponse,
  ITookanSettingValue,
  normalizeTookanSettingValue,
} from 'app/shared/model/tookan-setting.model';

export interface ITookanTeam {
  team_id?: number;
  team_name?: string;
  [key: string]: any;
}

export interface ITookanAgent {
  fleet_id?: number;
  name?: string;
  username?: string;
  team_id?: number;
  [key: string]: any;
}

type TookanState = EntityState<ITookanSettingResponse> & {
  teams: ITookanTeam[];
  agents: ITookanAgent[];
};

const initialState: TookanState = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultTookanSettingResponse,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  teams: [],
  agents: [],
};

const settingsApiUrl = 'api/settings/tookan';
const teamsApiUrl = 'api/tookan/teams';
const agentsApiUrl = 'api/tookan/agents';

const normalizeResponse = (response?: ITookanSettingResponse): ITookanSettingResponse => ({
  ...defaultTookanSettingResponse,
  ...(response || {}),
  value: normalizeTookanSettingValue(response?.value),
  hasApiKey: response?.hasApiKey ?? false,
  hasWebhookSecret: response?.hasWebhookSecret ?? false,
});

export const getTookanSetting = createAsyncThunk(
  'tookan/fetch_setting',
  async (branchId: string) => {
    return axios.get<ITookanSettingResponse>(`${settingsApiUrl}/${branchId}`);
  },
  { serializeError: serializeAxiosError }
);

export const updateTookanSetting = createAsyncThunk(
  'tookan/update_setting',
  async (request: ITookanSettingRequest, thunkAPI) => {
    const result = await axios.put<ITookanSettingResponse>(settingsApiUrl, request);
    if (request.branchId) {
      thunkAPI.dispatch(getTookanSetting(request.branchId));
    }
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const getTookanTeams = createAsyncThunk(
  'tookan/fetch_teams',
  async (branchId: string) => {
    return axios.get<ITookanTeam[]>(`${teamsApiUrl}/${branchId}`);
  },
  { serializeError: serializeAxiosError }
);

export const getTookanAgents = createAsyncThunk(
  'tookan/fetch_agents',
  async ({ branchId, teamId }: { branchId: string; teamId?: number | null }) => {
    const query = teamId != null ? `?teamId=${teamId}` : '';
    return axios.get<ITookanAgent[]>(`${agentsApiUrl}/${branchId}${query}`);
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: keyof ITookanSettingValue; value: any }>('tookan/change-entity-field');

export const TookanSettingSlice = createEntitySlice({
  name: 'tookanSetting',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        if (!state.entity.value) {
          state.entity.value = { ...defaultTookanSettingValue };
        }
        state.entity.value[action.payload.name] = action.payload.value;
      })
      .addCase(getTookanSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = normalizeResponse(action.payload.data);
      })
      .addCase(getTookanTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload.data || [];
      })
      .addCase(getTookanAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload.data || [];
      })
      .addMatcher(isFulfilled(updateTookanSetting), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = normalizeResponse(action.payload.data);
      })
      .addMatcher(isPending(getTookanSetting, getTookanTeams, getTookanAgents), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateTookanSetting), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = TookanSettingSlice.actions;
export default TookanSettingSlice.reducer;
