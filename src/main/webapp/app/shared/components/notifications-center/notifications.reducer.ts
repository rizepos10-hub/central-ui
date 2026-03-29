import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { IQueryParams, createEntitySlice, EntityState } from 'app/shared/reducers/reducer.utils';
import { INotification, defaultValue } from 'app/shared/model/notification.model';

export const NOTIFICATION_PAGE_SIZE = 25;

export type NotificationFetchParams = IQueryParams & {
  /** When true, append results to existing entities (infinite scroll). */
  append?: boolean;
};

type NotificationState = EntityState<INotification> & {
  loadingMore: boolean;
  /** After a failed "load more", auto scroll-fetch stops until user retries successfully. */
  loadMoreFailed: boolean;
};

const baseInitial: NotificationState = {
  loading: false,
  loadingMore: false,
  loadMoreFailed: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const initialState: NotificationState = { ...baseInitial };

const apiUrl = 'api/notifications/in-app';

function buildListUrl(page: number, size: number, sort?: string) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (sort) {
    params.set('sort', sort);
  }
  params.set('cacheBuster', String(Date.now()));
  return `${apiUrl}?${params.toString()}`;
}

export const getEntities = createAsyncThunk(
  'notification/fetch_entity_list',
  async ({ page, size, sort }: NotificationFetchParams) => {
    const p = page ?? 0;
    const s = size ?? NOTIFICATION_PAGE_SIZE;
    const requestUrl = buildListUrl(p, s, sort);
    return axios.get<INotification[]>(requestUrl);
  }
);

export const changeEntityField = createAction<{ name: string; value: any }>('notification/change-entity-field');

export const NotificationSlice = createEntitySlice({
  name: 'notification',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(getEntities.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        if (action.meta.arg?.append) {
          state.loadMoreFailed = true;
        }
      })
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;
        const append = Boolean(action.meta.arg?.append);
        const totalRaw = headers['x-total-count'];
        const totalItems = totalRaw != null ? parseInt(String(totalRaw), 10) : state.totalItems ?? 0;

        if (append) {
          const existingIds = new Set(state.entities.map(e => e.id).filter(Boolean));
          const merged = [...state.entities];
          for (const row of data) {
            if (row.id != null && existingIds.has(row.id)) {
              continue;
            }
            if (row.id != null) {
              existingIds.add(row.id);
            }
            merged.push(row);
          }
          return {
            ...state,
            loading: false,
            loadingMore: false,
            loadMoreFailed: false,
            entities: merged,
            totalItems: Number.isFinite(totalItems) ? totalItems : merged.length,
          };
        }

        return {
          ...state,
          loading: false,
          loadingMore: false,
          loadMoreFailed: false,
          entities: data,
          totalItems: Number.isFinite(totalItems) ? totalItems : data.length,
        };
      })
      .addMatcher(isPending(getEntities), (state, action) => {
        state.errorMessage = null;
        state.updateSuccess = false;
        if (action.meta.arg?.append) {
          state.loadingMore = true;
          state.loadMoreFailed = false;
        } else {
          state.loading = true;
          state.loadMoreFailed = false;
        }
      });
  },
});

export const { reset } = NotificationSlice.actions;

export default NotificationSlice.reducer;
