import axios from 'axios';
import { Storage } from 'react-jhipster';
import { AUTH_TOKEN_KEY, clearAccessToken, REFRESH_TOKEN_KEY, TENANT_KEY } from 'app/shared/reducers/authentication';

const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = SERVER_API_URL;

const setupAxiosInterceptors = onUnauthenticated => {
  let refreshPromise = null;

  const refreshAccessToken = async () => {
      clearAccessToken();
      const localStorageToken = Storage.local.get(REFRESH_TOKEN_KEY) || null;
      const sessionStorageToken = Storage.session.get(REFRESH_TOKEN_KEY) || null;
      const tenantKey = Storage.local.get(TENANT_KEY) || Storage.session.get(TENANT_KEY);
      const refreshToken = localStorageToken || sessionStorageToken;

      if (refreshToken) {
        const requestBody = {
          refresh: refreshToken,
          realm: tenantKey,
          clientId: 'central-app',
        };

          const response = await axios.post(SERVER_ADMIN_API_URL + '/api/auth/refresh', requestBody);
           console.log('isRefreshing1 response', response)

          const newAccessToken = response?.data?.access_token;
          const newRefreshToken = response?.data?.refresh_token;

          if (newAccessToken) {
            if (localStorageToken) {
              Storage.local.set(AUTH_TOKEN_KEY, newAccessToken);
              Storage.local.set(REFRESH_TOKEN_KEY, newRefreshToken);
            } else {
              Storage.session.set(AUTH_TOKEN_KEY, newAccessToken);
              Storage.session.set(REFRESH_TOKEN_KEY, newRefreshToken);
            }
            return newAccessToken;
      }

    }
    return null;
  };

  const onRequestSuccess = config => {
    const token = Storage.local.get('jhi-authenticationToken') || Storage.session.get('jhi-authenticationToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };

  const onResponseSuccess = response => response;

  const onResponseError = async err => {
    const status = err.status || (err.response ? err.response.status : 0);
    if ((status === 403 || status === 401) && !refreshPromise) {
      refreshPromise = refreshAccessToken();
      if (refreshPromise) {
        try {
          const newAccessToken = await refreshPromise;
          if (newAccessToken) {
            err.config.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(err.config);
          } else {
            onUnauthenticated();
          }
        } finally {
          refreshPromise = null;
        }
      }
    }
    return Promise.reject(err);
  };

  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use(onResponseSuccess, onResponseError);
};

export default setupAxiosInterceptors;
