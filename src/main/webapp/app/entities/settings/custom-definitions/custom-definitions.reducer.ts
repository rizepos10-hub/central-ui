import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError, ChangeFieldPayload } from 'app/shared/reducers/reducer.utils';
import { ICustomDefinition, defaultValue } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition.model';

const initialState: EntityState<ICustomDefinition> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/custom-definitions';

// Actions

export const getEntities = createAsyncThunk('custom-definitions/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ICustomDefinition[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'custom-definitions/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ICustomDefinition>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'custom-definitions/create_entity',
  async (entity: ICustomDefinition, thunkAPI) => {
    const result = await axios.post<ICustomDefinition>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'custom-definitions/update_entity',
  async (entity: ICustomDefinition, thunkAPI) => {
    const result = await axios.put<ICustomDefinition>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'custom-definitions/delete_entity',
  async ({id, deleteRelated}: { id: string | number, deleteRelated: boolean }, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}?deleteRelated=${deleteRelated}`;
    const result = await axios.delete<ICustomDefinition>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<ICustomDefinition>>('custom-definitions/change-entity-field');

// slice

export const CustomDefinitionsSlice = createEntitySlice({
  name: 'custom-definitions',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isPending(getEntities, getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
  },
});

export const { reset } = CustomDefinitionsSlice.actions;

// Reducer
export default CustomDefinitionsSlice.reducer;
