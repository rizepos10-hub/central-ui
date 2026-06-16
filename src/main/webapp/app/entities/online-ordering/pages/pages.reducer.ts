import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IOnlineOrderingPage, ISectionTypeDescriptor, defaultPageValue } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IPageTemplateDescriptor } from 'app/shared/model/ONLINE_ORDERING/page-template.model';
import { createFromTemplate, getTemplates } from './page-template.actions';

const initialState: EntityState<IOnlineOrderingPage> & {
  sectionTypes: ISectionTypeDescriptor[];
  templates: IPageTemplateDescriptor[];
} = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultPageValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  sectionTypes: [],
  templates: [],
};

const apiUrl = 'api/online-ordering/pages';

export const getEntities = createAsyncThunk('ooPage/fetch_list', async () => {
  return axios.get<IOnlineOrderingPage[]>(apiUrl);
});

export const getEntity = createAsyncThunk(
  'ooPage/fetch_entity',
  async (id: string) => axios.get<IOnlineOrderingPage>(`${apiUrl}/${id}`),
  { serializeError: serializeAxiosError }
);

export const getSectionTypes = createAsyncThunk('ooPage/fetch_section_types', async () => {
  return axios.get<ISectionTypeDescriptor[]>(`${apiUrl}/section-types`);
});

export { getTemplates, createFromTemplate } from './page-template.actions';

export const createEntity = createAsyncThunk(
  'ooPage/create_entity',
  async (entity: IOnlineOrderingPage, thunkAPI) => {
    const result = await axios.post<IOnlineOrderingPage>(apiUrl, entity);
    thunkAPI.dispatch(getEntities());
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'ooPage/update_entity',
  async (entity: IOnlineOrderingPage, thunkAPI) => {
    const result = await axios.put<IOnlineOrderingPage>(`${apiUrl}/${entity.id}`, entity);
    thunkAPI.dispatch(getEntity(entity.id));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const publishEntity = createAsyncThunk(
  'ooPage/publish_entity',
  async (id: string, thunkAPI) => {
    const result = await axios.post<IOnlineOrderingPage>(`${apiUrl}/${id}/publish`);
    thunkAPI.dispatch(getEntities());
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntity = createAsyncThunk(
  'ooPage/archive_entity',
  async (id: string, thunkAPI) => {
    await axios.post(`${apiUrl}/${id}/archive`);
    thunkAPI.dispatch(getEntities());
  },
  { serializeError: serializeAxiosError }
);

export const OnlineOrderingPageSlice = createEntitySlice({
  name: 'onlineOrderingPage',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntities.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.data;
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(getSectionTypes.fulfilled, (state, action) => {
        state.sectionTypes = action.payload.data;
      })
      .addCase(getTemplates.fulfilled, (state, action) => {
        state.templates = action.payload.data;
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, publishEntity, createFromTemplate), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity), state => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addMatcher(isPending(createEntity, updateEntity, publishEntity, archiveEntity, createFromTemplate), state => {
        state.updating = true;
        state.updateSuccess = false;
      });
  },
});

export const { reset } = OnlineOrderingPageSlice.actions;
export default OnlineOrderingPageSlice.reducer;
