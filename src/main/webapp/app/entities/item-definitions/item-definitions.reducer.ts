import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IItemDefinition, defaultValue } from 'app/shared/model/item-definitions.model';

const initialState: EntityState<IItemDefinition> = {
  loading: true,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/item-definitions';
const apiSearchUrl = 'api/_search/item-definitions';

// Actions

export const searchEntities = createAsyncThunk('item-definitions/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IItemDefinition[]>(requestUrl);
});

export const getEntityByType = createAsyncThunk('item_definitions/by_type', async ({  page, size, sort,type }: IQueryParams) => {
  const requestUrl = `api/item-definitions?type=${type}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  const response = await axios.get(requestUrl)

  return axios.get<IItemDefinition[]>(requestUrl);
});


export const getEntities = createAsyncThunk('item-definitions/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IItemDefinition[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'item-definitions/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IItemDefinition>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'item-definitions/create_entity',
  async (entity: IItemDefinition, thunkAPI) => {
    const result = await axios.post<IItemDefinition>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'item-definitions/update_entity',
  async (entity: IItemDefinition, thunkAPI) => {
    const result = await axios.put<IItemDefinition>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'item-definitions/partial_update_entity',
  async (entity: IItemDefinition, thunkAPI) => {
    const result = await axios.patch<IItemDefinition>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'item-definitions/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IItemDefinition>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const createDefinitionGroup = createAsyncThunk(
  'item-definitions/create_definition_group',
  async ({ group, id } :any, thunkAPI) => {
    const result = await axios.post<IItemDefinition>(`${apiUrl}/${id}/group`, group);
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const editDefinitionGroup = createAsyncThunk(
  'item-definitions/edit_definition_group',
  async ({ group, id } :any, thunkAPI) => {
    const result = await axios.put<IItemDefinition>(`${apiUrl}/${id}/group/`, group);
    return result;
  },
  { serializeError: serializeAxiosError }
);
export const deleteDefinitionGroup = createAsyncThunk(
  'item-definitions/delete_definition_group',
  async ({ groupId, id } :any, thunkAPI) => {
    const result = await axios.delete<IItemDefinition>(`${apiUrl}/${id}/group/${groupId}`);
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const createDefinitionGroupOption = createAsyncThunk(
  'item-definitions/create_definition_group_option',
  async ({ option, id, groupId } :any, thunkAPI) => {
    const result = await axios.post<IItemDefinition>(`${apiUrl}/${id}/group/${groupId}/option`, option);
    // thunkAPI.dispatch(getEntities({}));

    return result;
  },
  { serializeError: serializeAxiosError }
);

export const editDefinitionGroupOption = createAsyncThunk(
  'item-definitions/edit_definition_group_option',
  async ({ option, id, groupId } :any, thunkAPI) => {
    const result = await axios.put<IItemDefinition>(`${apiUrl}/${id}/group/${groupId}/option`, option);
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteDefinitionGroupOption = createAsyncThunk(
  'item-definitions/delete_definition_group_option',
  async ({ optionId, id, groupId } :any, thunkAPI) => {
    const result = await axios.delete<IItemDefinition>(`${apiUrl}/${id}/group/${groupId}/option/${optionId}`);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);


// slice

export const PizzaGroupSlice = createEntitySlice({
  name: 'item-definitions',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addMatcher(isFulfilled(getEntities, searchEntities,getEntityByType), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity,createDefinitionGroupOption,createDefinitionGroup,editDefinitionGroupOption), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities,getEntityByType), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity,createDefinitionGroupOption,createDefinitionGroup,editDefinitionGroupOption), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = PizzaGroupSlice.actions;

// Reducer
export default PizzaGroupSlice.reducer;
