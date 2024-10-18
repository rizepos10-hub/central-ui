import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError, ChangeFieldPayload } from 'app/shared/reducers/reducer.utils';
import { ICustomDefinitionValue, defaultValue } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';

const initialState: EntityState<ICustomDefinitionValue> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/custom-field-values';

// Actions

export const getEntities = createAsyncThunk('custom-field-values/fetch_entity_list', async ({ page, size, sort, entityId, entityType }: IQueryParams) => {
  console.log(entityId)
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&${entityId ? `entityId=${entityId}&` : ''}${entityType ? `entityType=${entityType}` : ''}` : '?'}&cacheBuster=${new Date().getTime()}`;
  return axios.get<ICustomDefinitionValue[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'custom-field-values/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ICustomDefinitionValue>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'custom-field-values/create_entity',
  async (entity: ICustomDefinitionValue, thunkAPI) => {
    const result = await axios.post<ICustomDefinitionValue>(apiUrl, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'custom-field-values/update_entity',
  async (entity: ICustomDefinitionValue, thunkAPI) => {
    const result = await axios.put<ICustomDefinitionValue>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'custom-field-values/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ICustomDefinitionValue>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<ICustomDefinitionValue>>('custom-field-values/change-entity-field');

// slice

export const CustomDefinitionValuesSlice = createEntitySlice({
  name: 'custom-field-values',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        // @ts-expect-error -- special case
        if (name === '') {
          console.log(value)
          state.entity = value;
        } else {
          state.entity[name] = value;
        }
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

export const { reset } = CustomDefinitionValuesSlice.actions;

// Reducer
export default CustomDefinitionValuesSlice.reducer;
