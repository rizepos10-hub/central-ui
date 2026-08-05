import axios from 'axios';
import { Storage } from 'react-jhipster';
import { clearAccessToken } from 'app/shared/reducers/authentication';
import { buildAuthTokenKey, buildRefreshTokenKey, getActiveTenant } from 'app/shared/util/tenant-utils';
import { runtimeConfig } from 'app/config/runtime-config';

const TIMEOUT = 1 * 60 * 1000;
const APP_ID = () => runtimeConfig.APP_ID;

axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = runtimeConfig.SERVER_API_URL;

const resolveRequestPath = (url?: string): string => {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, axios.defaults.baseURL || window.location.origin).pathname;
  } catch (error) {
    return url;
  }
};

const isCentralAppLoginRequest = (url?: string) =>
  new RegExp(`/api/login/[^/]+/${APP_ID()}/?$`).test(resolveRequestPath(url));

const isAuthRefreshRequest = (url?: string) => resolveRequestPath(url).endsWith('/api/auth/refresh');

const setupAxiosInterceptors = onUnauthenticated => {
  let refreshPromise: Promise<string | null> | null = null;

  const refreshAccessToken = async () => {
    try {
      clearAccessToken();
      const tenantKey = getActiveTenant();
      const refreshKey = buildRefreshTokenKey(tenantKey);
      const localStorageToken = Storage.local.get(refreshKey) || null;
      const sessionStorageToken = Storage.session.get(refreshKey) || null;
      const refreshToken = localStorageToken || sessionStorageToken;

      if (refreshToken) {
        const requestBody = {
          refresh: refreshToken,
          realm: tenantKey,
          clientId: APP_ID(),
        };

        const response = await axios.post(runtimeConfig.SERVER_ADMIN_API_URL + '/api/auth/refresh', requestBody);

        const newAccessToken = response?.data?.access_token;
        const newRefreshToken = response?.data?.refresh_token;

        if (newAccessToken) {
          const authKey = buildAuthTokenKey(tenantKey);
          if (localStorageToken) {
            Storage.local.set(authKey, newAccessToken);
            Storage.local.set(refreshKey, newRefreshToken);
          } else {
            Storage.session.set(authKey, newAccessToken);
            Storage.session.set(refreshKey, newRefreshToken);
          }
          return newAccessToken;
        }
      }
      return null;
    } catch (error) {
      onUnauthenticated();
      throw error;
    }
  };

  const getRefreshedAccessToken = () => {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  };

  const onRequestSuccess = config => {
    const authKey = buildAuthTokenKey();
    const token = Storage.local.get(authKey) || Storage.session.get(authKey);
    if (token && !isCentralAppLoginRequest(config.url) && !isAuthRefreshRequest(config.url)) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };

  const onResponseSuccess = response => response;

  const onResponseError = async err => {
    const status = err.status || (err.response ? err.response.status : 0);
    const requestUrl = err.config?.url;

    // Never try to refresh on login or refresh endpoints themselves.
    if (status === 401 && !isAuthRefreshRequest(requestUrl) && !isCentralAppLoginRequest(requestUrl)) {
      try {
        const newAccessToken = await getRefreshedAccessToken();
        if (newAccessToken) {
          err.config.headers = err.config.headers || {};
          err.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(err.config);
        } else {
          onUnauthenticated();
        }
      } catch (error) {
        onUnauthenticated();
      }
    }

    return Promise.reject(err);
  };

  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use(onResponseSuccess, onResponseError);
};

export default setupAxiosInterceptors;
