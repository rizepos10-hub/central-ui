import axios from 'axios';
import { createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IUser, defaultValue, RolePermissions, IUserWithBranches } from "app/shared/model/user.model";

interface EntityStateWithRoles<T> extends EntityState<T> {
  roles: RolePermissions;
}

const initialState: EntityStateWithRoles<IUser> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  roles: {
    groups: [],
    authorities: [],
  },
};

const apiUrl = 'api/users';
const apiSearchUrl = 'api/_search/users';

// Actions

export const searchEntities = createAsyncThunk('back-office-user/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IUser[]>(requestUrl);
});

export const getEntities = createAsyncThunk('back-office-user/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IUser[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'back-office-user/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IUserWithBranches>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);


export const getRoles = createAsyncThunk(
  'back-office-user/fetch_assigned_roles', // Corrected action name
  async (id: string | number) => {

    const requestUrl = `${apiUrl}/${id}/roles`;
    const response = await axios.get<IUser>(requestUrl);
    return response
  },
  { serializeError: serializeAxiosError }
);

export const assignRole = createAsyncThunk(
  'back-office-user/assign_role',
  async ({ id , selectedRoles }: { id: string; selectedRoles: any[] }, ) => {
    if(id){
      const result = await axios.put<IUser>(`${apiUrl}/${id}/roles`, selectedRoles);
      return result.data;
    }

  },
  { serializeError: serializeAxiosError }
);





export const createEntityAndAssignRole = createAsyncThunk(
  'back-office-user/create_entity',
  async ({ entity, roles } : any, thunkAPI) => {
    const result = await axios.post<any>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    if (result.data.id) {
      await thunkAPI.dispatch(assignRole({ id: result.data.id, selectedRoles: roles }));
    }
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'back-office-user/update_entity',
  async (entity: IUserWithBranches, thunkAPI) => {
    const result = await axios.put<IUserWithBranches>(`${apiUrl}/${entity.user.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'back-office-user/partial_update_entity',
  async (entity: IUser, thunkAPI) => {
    const result = await axios.patch<IUser>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'back-office-user/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IUser>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateRoles(state, action) {
      state.roles["groups"] = action.payload;
    },
    reset() {
      return initialState
    }
  },
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
      .addCase(getRoles.fulfilled, (state, action :any) => {
        state.roles = action.payload.data;
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
      .addMatcher(isFulfilled(createEntityAndAssignRole, updateEntity, partialUpdateEntity), (state, action) => {
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
      .addMatcher(isPending(createEntityAndAssignRole, updateEntity, partialUpdateEntity, deleteEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset,updateRoles } = UserSlice.actions;

// Reducer
export default UserSlice.reducer;
