import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ILandingPageSettings, landingPageSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { createUiSettingsSectionReducer } from './section.reducer';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

const apiUrl = 'api/online-ordering/settings/ui-settings/landing-pages';

const section = createUiSettingsSectionReducer<ILandingPageSettings>(
  'online-ordering-landing-page-settings',
  apiUrl,
  landingPageSettingsDefaultValue
);

export const flushStorefrontCache = createAsyncThunk(
  'online-ordering-landing-page-settings/flush_storefront_cache',
  async () => {
    await axios.post('api/online-ordering/settings/ui-settings/landing-pages/flush-storefront-cache');
  },
  { serializeError: serializeAxiosError }
);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;

const reducer = (state: ReturnType<typeof section.reducer> | undefined, action: any) => {
  const baseState = section.reducer(state, action);

  if (action.type === flushStorefrontCache.pending.type) {
    return { ...baseState, updating: true, errorMessage: null };
  }
  if (action.type === flushStorefrontCache.fulfilled.type) {
    return { ...baseState, updating: false, updateSuccess: true };
  }
  if (action.type === flushStorefrontCache.rejected.type) {
    return { ...baseState, updating: false, errorMessage: action.error.message ?? 'Failed to flush storefront cache' };
  }

  return baseState;
};

export default reducer;
