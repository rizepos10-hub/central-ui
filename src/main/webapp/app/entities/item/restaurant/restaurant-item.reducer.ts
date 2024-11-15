import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IItem, defaultValue } from 'app/shared/model/ITEM/item.model';

const initialState: EntityState<IItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items';
const summaryUrl = 'api/items/summary?type=RESTAURANT';

const apiSearchUrl = 'api/_search/items';

// Actions

export const searchEntities = createAsyncThunk('restaurant_items/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `api/_search/items/restaurant-pizza/by-name?query=${query}&page=${page}&size=${size}`;

  // Perform the API call
  return axios.get<IItem[]>(requestUrl);
});


export const searchEntitiesRestaurant = createAsyncThunk('restaurant_items/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}?query=${query}&page=${page}&size=${size}`;

  // Perform the API call
  return axios.get<IItem[]>(requestUrl);
});





export const getEntities = createAsyncThunk('restaurant_items/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?type=RESTAURANT&page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  const response = await axios.get<IItem[]>(requestUrl);
  console.log(response, 'responsin');
  return response;
});








// slice

export const RestaurantItemsSlice = createEntitySlice({
  name: 'restaurant-items',
  initialState,
  extraReducers(builder) {
    builder
      .addMatcher(isFulfilled(getEntities, searchEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isPending(getEntities, searchEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })

  },
});

export const { reset } = RestaurantItemsSlice.actions;

// Reducer
export default RestaurantItemsSlice.reducer;
