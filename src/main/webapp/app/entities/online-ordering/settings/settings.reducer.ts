import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { ChangeFieldPayload, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IUiSettings, defaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';

const initialState: EntityState<IUiSettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/online-ordering/settings/ui-settings';

// Actions


export const getEntity = createAsyncThunk(
  'online-ordering-settings/fetch_entity',
  async () => {
    const requestUrl = `${apiUrl}`;
    return axios.get<IUiSettings>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);


export const updateEntity = createAsyncThunk(
  'online-ordering-settings/update_entity',
  async (settings: IUiSettings, thunkAPI) => {
    return await axios.put<IUiSettings>(`${apiUrl}`, { ...settings, key: 'ONLINE_ORDERING_UI' });
  },
  { serializeError: serializeAxiosError }
);

export const flushStorefrontCache = createAsyncThunk(
  'online-ordering-settings/flush_storefront_cache',
  async () => {
    await axios.post('api/online-ordering/settings/storefront-cache/flush');
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{
  name: string
  value: any
}>('online-ordering-settings/change-entity-field')

export const changeLayoutField = createAction<ChangeFieldPayload<IUiSettings["homePageSetting"]>>('online-ordering-settings/change-layout-field');


// slice

export const UiSettingsSlice = createEntitySlice({
  name: 'UiSettings',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload
        const path = name.split('.') // e.g. ['layouts', 'selectedLayout']
        let current: any = state.entity

        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) current[path[i]] = {}
          current = current[path[i]]
        }

        current[path[path.length - 1]] = value
      })
      .addCase(changeLayoutField, (state, action) => {
        const { name, value } = action.payload;
        state.entity["homePageSetting"][name] = value;
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = {
          ...defaultValue,
          ...action.payload.data,
        };
        if (action.payload.data.homePageSetting === null) {
          state.entity.homePageSetting = defaultValue.homePageSetting;
        }
      })
      .addMatcher(isFulfilled(updateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = {
          ...defaultValue,
          ...action.payload.data,
        };
      })
      .addMatcher(isPending(getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      })
      .addMatcher(isPending(flushStorefrontCache), state => {
        state.errorMessage = null;
        state.updating = true;
      })
      .addMatcher(isFulfilled(flushStorefrontCache), state => {
        state.updating = false;
        state.updateSuccess = true;
      })
      .addMatcher(isRejected(flushStorefrontCache), (state, action) => {
        state.updating = false;
        state.errorMessage = action.error.message ?? 'Failed to flush storefront cache';
      });
  },
});

export const { reset } = UiSettingsSlice.actions;

// Reducer
export default UiSettingsSlice.reducer;
