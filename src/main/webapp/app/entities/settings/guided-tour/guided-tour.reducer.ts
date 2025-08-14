import axios from 'axios';
import { createAsyncThunk, createSlice, isPending, isRejected } from '@reduxjs/toolkit';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

const initialState = {
  loading: false,
  errorMessage: null,
  setupCompleted: false,
  updating: false,
  updateSuccess: false,
};

export type GuidedTourState = Readonly<typeof initialState>;

const apiUrl = 'api/business/setup-completed';

// Actions
export const getSetupStatus = createAsyncThunk(
  'guidedTour/fetch_status',
  async () => {
    return axios.get<boolean>(apiUrl);
  },
  { serializeError: serializeAxiosError }
);

export const updateSetupStatus = createAsyncThunk(
  'guidedTour/update_status',
  async (completed: boolean) => {
    return axios.post<boolean>(`${apiUrl}?completed=${completed}`, {});
  },
  { serializeError: serializeAxiosError }
);

// Slice
export const GuidedTourSlice = createSlice({
  name: 'guidedTour',
  initialState: initialState as GuidedTourState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getSetupStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.setupCompleted = action.payload.data;
      })
      .addCase(updateSetupStatus.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.setupCompleted = action.payload.data;
      })
      .addMatcher(isPending(getSetupStatus), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateSetupStatus), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      })
      .addMatcher(isRejected(getSetupStatus, updateSetupStatus), (state, action) => {
        state.loading = false;
        state.updating = false;
        state.updateSuccess = false;
        state.errorMessage = action.error.message;
      });
  },
});

export const { reset } = GuidedTourSlice.actions;

export default GuidedTourSlice.reducer; 