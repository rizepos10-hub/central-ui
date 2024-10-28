import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { IStockQuantity, defaultValue} from "app/shared/model/STOCK/stock-quantity.model";
import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';

const initialState: EntityState<IStockQuantity> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/inventory/minimum-stock-quantity';
const apiSearchUrl = 'api/inventory/_search/minimum-stock-quantity';

const patchUrl = '/api/inventory/minimum-stock-quantity'

// Actions

export const searchEntities = createAsyncThunk('stock-quantity/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
    const requestUrl = `${apiSearchUrl}${ sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}${query ? query : ''}`;
    return axios.get<IStockQuantity[]>(requestUrl);
  });
  
  export const getEntities = createAsyncThunk('stock-quantity/fetch_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
    const requestUrl = `${apiUrl}${ sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}${query ? query : ''}cacheBuster=${new Date().getTime()}`;
    return axios.get<IStockQuantity[]>(requestUrl);
  });
  
  export const getEntity = createAsyncThunk(
    'stock-quantity/fetch_entity',
    async (id: string | number) => {
      const requestUrl = `${apiUrl}/${id}`;
      return axios.get<IStockQuantity>(requestUrl);
    },
    { serializeError: serializeAxiosError }
  );
  export const partialUpdateEntity = createAsyncThunk(
    'minimum-stock-quantity/partial_update_entity',
    async (entity: IStockQuantity[], thunkAPI) => {
      return await axios.patch<IStockQuantity>(patchUrl, entity);
  
    },
    { serializeError: serializeAxiosError }
  );
  
  export const getStockQuantitiesForVariant = createAsyncThunk(
    'minimum-stock-quantity/fetch_variant_stock_quantities',
    async (query :string ) => {
      const requestUrl = `${apiUrl}?${query ? query : ''}`;
      return axios.get<IStockQuantity[]>(requestUrl);
    },
    { serializeError: serializeAxiosError }
  );
  
  
  
  
  
  
  
  
  // slice
  
  export const MinimumStockLevelSlice = createEntitySlice({
    name: 'minimum-stock-level',
    initialState,
    extraReducers(builder) {
      builder
        .addCase(getEntity.fulfilled, (state, action) => {
          state.loading = false;
          state.entity = action.payload.data;
        })
        .addMatcher(isFulfilled(getEntities, searchEntities, getStockQuantitiesForVariant), (state, action) => {
          const { data, headers } = action.payload;
  
          return {
            ...state,
            loading: false,
            entities: data,
            totalItems: parseInt(headers['x-total-count'], 10),
          };
        })
        .addMatcher(isPending(getEntities, getEntity, searchEntities, getStockQuantitiesForVariant), state => {
          state.errorMessage = null;
          state.updateSuccess = false;
          state.loading = true;
        })
        .addMatcher(isPending(partialUpdateEntity), state => {
          state.updating = true;
          state.updateSuccess = false;
          state.errorMessage = null
        })
        .addMatcher(isFulfilled(partialUpdateEntity), state => {
          state.updateSuccess = true;
          state.updating = false;
        })
    },
  });
  
  export const { reset } = MinimumStockLevelSlice.actions;
  
  // Reducer
  export default MinimumStockLevelSlice.reducer;
  