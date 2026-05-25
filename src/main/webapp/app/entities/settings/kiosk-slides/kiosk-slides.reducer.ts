import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import {
  defaultKioskSlidesSettingResponse,
  defaultKioskSlidesSettingValue,
  IKioskSlide,
  IKioskSlidesSettingRequest,
  IKioskSlidesSettingResponse,
  IKioskSlidesSettingValue,
  normalizeKioskSlidesSettingValue,
} from 'app/shared/model/kiosk-slides-setting.model';

type KioskSlidesState = EntityState<IKioskSlidesSettingResponse>;

const initialState: KioskSlidesState = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultKioskSlidesSettingResponse,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const settingsApiUrl = 'api/settings/kiosk-slides';

export const getKioskSlidesSetting = createAsyncThunk(
  'kioskSlides/fetch_setting',
  async (branchId: string) => axios.get<IKioskSlidesSettingResponse>(`${settingsApiUrl}/${branchId}`),
  { serializeError: serializeAxiosError }
);

export const updateKioskSlidesSetting = createAsyncThunk(
  'kioskSlides/update_setting',
  async (request: IKioskSlidesSettingRequest, thunkAPI) => {
    const result = await axios.put<IKioskSlidesSettingResponse>(settingsApiUrl, request);
    if (request.branchId) {
      thunkAPI.dispatch(getKioskSlidesSetting(request.branchId));
    }
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const setSlides = createAction<IKioskSlide[]>('kioskSlides/set-slides');

export const KioskSlidesSettingSlice = createEntitySlice({
  name: 'kioskSlidesSetting',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(setSlides, (state, action) => {
        if (!state.entity.value) {
          state.entity.value = { ...defaultKioskSlidesSettingValue };
        }
        state.entity.value.slides = action.payload;
      })
      .addCase(getKioskSlidesSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = {
          ...defaultKioskSlidesSettingResponse,
          ...action.payload.data,
          value: normalizeKioskSlidesSettingValue(action.payload.data?.value),
        };
      })
      .addMatcher(isFulfilled(updateKioskSlidesSetting), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {
          ...defaultKioskSlidesSettingResponse,
          ...action.payload.data,
          value: normalizeKioskSlidesSettingValue(action.payload.data?.value),
        };
      })
      .addMatcher(isPending(getKioskSlidesSetting), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateKioskSlidesSetting), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = KioskSlidesSettingSlice.actions;
export default KioskSlidesSettingSlice.reducer;
