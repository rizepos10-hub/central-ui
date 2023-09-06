import { createAsyncThunk, createSlice, isFulfilled } from '@reduxjs/toolkit';

interface TenantState {
  tenant: string;
}

const initialState = {
  tenant: 'default', // Initial value
};

type TenantAction = { type: 'SET_TENANT'; payload: string };

export const tenantReducer = (state = initialState, action: TenantAction): TenantState => {
  console.log('payload : ' + action.payload);
  switch (action.type) {
    case 'SET_TENANT':
      return { ...state, tenant: action.payload };
    default:
      return state;
  }
};

export const setTenant = createAsyncThunk('tenant/set_tenant', async (entity: TenantState, thunkAPI) => {
  tenantReducer(getState(), { type: 'SET_TENANT', payload: entity.tenant });
  return entity.tenant;
});
export const getState = () => {
  return initialState;
};

export const getTenant = () => {
  console.log('getting the tenant');
  return initialState.tenant;
};

export const TenantSlice = createSlice({
  name: 'tenant',
  initialState: initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addMatcher(isFulfilled(setTenant), (state, action) => {
      state.tenant = action.payload;
    });
  },
});

export default TenantSlice.reducer;
