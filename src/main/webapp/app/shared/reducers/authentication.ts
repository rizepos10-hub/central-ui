import axios, { AxiosResponse } from 'axios';
import { Storage } from 'react-jhipster';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { serializeAxiosError } from './reducer.utils';

import { AppThunk } from 'app/config/store';
import { setLocale } from 'app/shared/reducers/locale';

export const AUTH_TOKEN_KEY = 'jhi-authenticationToken';
export const REFRESH_TOKEN_KEY = "cloudLinks-refreshToken"
export const TENANT_KEY = 'TENANT';
export const initialState = {
  loading: false,
  isAuthenticated: false,
  loginSuccess: false,
  loginError: false, // Errors returned from server side
  showModalLogin: false,
  account: {} as any,
  refreshToken: null as string | null,
  tokenExpiration: null,
  errorMessage: null as unknown as string, // Errors returned from server side
  redirectMessage: null as unknown as string,
  sessionHasBeenFetched: false,
  logoutUrl: null as unknown as string,
};

export type AuthenticationState = Readonly<typeof initialState>;

// Actions

export const getSession = (): AppThunk => async (dispatch, getState) => {
  await dispatch(getAccount());

  const { account } = getState().authentication;
  if (account && account.langKey) {
    const langKey = Storage.session.get('locale', account.langKey);
    await dispatch(setLocale(langKey));
  }
};

export const getAccount = createAsyncThunk('authentication/get_account', async () => axios.get<any>('api/account'), {
  serializeError: serializeAxiosError,
});

interface IAuthParams {
  username: string;
  password: string;
  tenant: string;
  rememberMe?: boolean;
}

export const authenticate = createAsyncThunk(
  'authentication/login',
  async (auth: IAuthParams) => {
    const data = {
      username: auth.username,
      password: auth.password,
      rememberMe: auth.rememberMe,
    };
    return axios.post(SERVER_ADMIN_API_URL + `/api/login/${auth.tenant}/central-app`, data);
  },
  {
    serializeError: serializeAxiosError,
  }
);

export const login: (username: string, password: string, tenant: string, rememberMe?: boolean) => AppThunk =
  (username, password, tenant: string, rememberMe = false) =>
  async dispatch => {
    const result = await dispatch(authenticate({ username, password, tenant, rememberMe }));
    const response = result.payload as AxiosResponse;
    const bearerToken = response?.data?.access_token;
    const refreshToken = response?.data?.refresh_token;
    if (bearerToken && refreshToken) {
      // Storage.session.set(TENANT_KEY, tenant);
      // if (rememberMe) {
        Storage.local.set(AUTH_TOKEN_KEY, bearerToken);
        Storage.local.set(REFRESH_TOKEN_KEY, refreshToken);
        Storage.local.set(TENANT_KEY, tenant);
      // } else {
      //   Storage.session.set(AUTH_TOKEN_KEY, bearerToken);
      //   Storage.session.set(REFRESH_TOKEN_KEY, refreshToken);
      // }
    }
    dispatch(getSession());
  };

export const clearAuthToken = () => {
  if (Storage.local.get(AUTH_TOKEN_KEY)) {
    Storage.local.remove(AUTH_TOKEN_KEY);
  }
  if (Storage.session.get(TENANT_KEY)) {
    Storage.session.remove(TENANT_KEY);
  }
  if (Storage.session.get(AUTH_TOKEN_KEY)) {
    Storage.session.remove(AUTH_TOKEN_KEY);
  }
  if (Storage.local.get(REFRESH_TOKEN_KEY)) {
    Storage.local.remove(REFRESH_TOKEN_KEY);
  }
  if (Storage.session.get(REFRESH_TOKEN_KEY)) {
    Storage.session.remove(REFRESH_TOKEN_KEY);
  }
};

export const clearAccessToken = () => {
  if (Storage.local.get(AUTH_TOKEN_KEY)) {
    Storage.local.remove(AUTH_TOKEN_KEY);
  }
  if (Storage.session.get(AUTH_TOKEN_KEY)) {
    Storage.session.remove(AUTH_TOKEN_KEY);
  }

};

export const logout: () => AppThunk = () => dispatch => {
  clearAuthToken();
  dispatch(logoutSession());
};

export const clearAuthentication = messageKey => dispatch => {
  clearAuthToken();
  dispatch(authError(messageKey));
  dispatch(clearAuth());
};

export const AuthenticationSlice = createSlice({
  name: 'authentication',
  initialState: initialState as AuthenticationState,
  reducers: {
    logoutSession() {
      return {
        ...initialState,
        showModalLogin: true,
      };
    },
    authError(state, action) {
      return {
        ...state,
        showModalLogin: true,
        redirectMessage: action.payload,
      };
    },
    clearAuth(state) {
      return {
        ...state,
        loading: false,
        showModalLogin: true,
        isAuthenticated: false,
      };
    },
  },
  extraReducers(builder) {
    builder
      .addCase(authenticate.rejected, (state, action) => ({
        ...initialState,
        errorMessage: action.error.message,
        showModalLogin: true,
        loginError: true,
      }))
      .addCase(authenticate.fulfilled, state => ({
        ...state,
        loading: false,
        loginError: false,
        showModalLogin: false,
        loginSuccess: true,
      }))
      .addCase(getAccount.rejected, (state, action) => ({
        ...state,
        loading: false,
        isAuthenticated: false,
        sessionHasBeenFetched: true,
        showModalLogin: true,
        errorMessage: action.error.message,
      }))
      .addCase(getAccount.fulfilled, (state, action) => {
        const isAuthenticated = action.payload && action.payload.data && action.payload.data.activated;
        return {
          ...state,
          isAuthenticated,
          loading: false,
          sessionHasBeenFetched: true,
          account: action.payload.data,
        };
      })
      .addCase(authenticate.pending, state => {
        state.loading = true;
      })
      .addCase(getAccount.pending, state => {
        state.loading = true;
      });
  },
});

export const { logoutSession, authError, clearAuth } = AuthenticationSlice.actions;

// Reducer
export default AuthenticationSlice.reducer;
