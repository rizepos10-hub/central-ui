import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IUser, defaultValue } from 'app/shared/model/user.model';

const initialState: EntityState<IUser> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = '/api/users/branch';
const apiSearchUrl = 'api/_search/users';

// Actions

export const searchEntities = createAsyncThunk('branch-pos-user/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IUser[]>(requestUrl);
});

export const getEntities :any = createAsyncThunk('branch-pos-user/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = '/api/users/branch';

  console.log('Fetching user entities with parameters:', { page, size, sort, requestUrl });

  const response = await axios.get<IUser[]>(requestUrl);

    console.log('Received response data:', response);

  return response;
});

export const getEntity = createAsyncThunk(
  'branch-pos-user/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IUser>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);





export const assignRole = createAsyncThunk(
  'branch-pos-user/assign_role',
  async ({ id, selectedRoles }: { id: string; selectedRoles: any[] }, ) => {
    const rolesData = selectedRoles.map(roleId => ({ id: roleId }));
    console.log(rolesData, '12roles12')
    console.log(id, '12id12')

    const result = await axios.put<IUser>(`${apiUrl}/${id}/roles`, selectedRoles);
    console.log(result, '12result12')
    return result.data;
  },
  { serializeError: serializeAxiosError }
);





export const createEntity = createAsyncThunk(
  'branch-pos-user/create_entity',
  async (entity: IUser, thunkAPI) => {
    const result = await axios.post<IUser>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'branch-pos-user/update_entity',
  async (entity: IUser, thunkAPI) => {
    console.log(entity.id, 'moliso')

    const result = await axios.put<IUser>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'branch-pos-user/partial_update_entity',
  async (entity: IUser, thunkAPI) => {
    const result = await axios.patch<IUser>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'branch-pos-user/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IUser>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const UserSlice = createEntitySlice({
  name: 'user',
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

      .addMatcher(isFulfilled(getEntities, searchEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = UserSlice.actions;

// Reducer
export default UserSlice.reducer;
