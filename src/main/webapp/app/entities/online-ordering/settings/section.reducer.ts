import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';
import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';

export function createUiSettingsSectionReducer<T extends object>(sliceName: string, apiUrl: string, defaultValue: T) {
  const initialState: EntityState<T> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    totalItems: 0,
    updateSuccess: false,
  };

  const getEntity = createAsyncThunk(`${sliceName}/fetch_entity`, async () => axios.get<T>(apiUrl), {
    serializeError: serializeAxiosError,
  });

  const updateEntity = createAsyncThunk(`${sliceName}/update_entity`, async (entity: T) => axios.put<T>(apiUrl, entity), {
    serializeError: serializeAxiosError,
  });

  const changeEntityField = createAction<{ name: string; value: any }>(`${sliceName}/change-entity-field`);

  const slice = createEntitySlice({
    name: sliceName,
    initialState,
    extraReducers(builder) {
      builder
        .addCase(changeEntityField, (state, action) => {
          const { name, value } = action.payload;
          const path = name.split('.');
          let current: any = state.entity;

          for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
          }

          current[path[path.length - 1]] = value;
        })
        .addCase(getEntity.fulfilled, (state, action) => {
          state.loading = false;
          state.entity = {
            ...defaultValue,
            ...action.payload.data,
          };
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
        });
    },
  });

  return {
    reducer: slice.reducer,
    actions: slice.actions,
    getEntity,
    updateEntity,
    changeEntityField,
  };
}
