import axios from 'axios';
import { Storage } from 'react-jhipster';
import { clearAccessToken } from 'app/shared/reducers/authentication';
import { buildAuthTokenKey, buildRefreshTokenKey, getActiveTenant } from 'app/shared/util/tenant-utils';
import { runtimeConfig } from 'app/config/runtime-config';

const TIMEOUT = 1 * 60 * 1000;
const APP_ID = runtimeConfig.APP_ID;
const API_BASE_URL = runtimeConfig.SERVER_API_URL || runtimeConfig.SERVER_DOMAIN;

axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = runtimeConfig.SERVER_API_URL;

const CENTRAL_APP_LOGIN_PATH_PATTERN = new RegExp(`^/api/login/[^/]+/${APP_ID}/?$`);

const isCentralAppLoginRequest = (url?: string) => {
  if (!url) {
    return false;
  }

  try {
    const resolvedUrl = new URL(url, API_BASE_URL);
    return CENTRAL_APP_LOGIN_PATH_PATTERN.test(resolvedUrl.pathname);
  } catch (error) {
    return CENTRAL_APP_LOGIN_PATH_PATTERN.test(url);
  }
};

const setupAxiosInterceptors = onUnauthenticated => {

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
            clientId: APP_ID,
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
        throw error
      }
    };

    const onRequestSuccess = config => {
      const authKey = buildAuthTokenKey();
      const token = Storage.local.get(authKey) || Storage.session.get(authKey);
        if (token && !isCentralAppLoginRequest(config.url)) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      };

    const onResponseSuccess = response => response;

    const onResponseError = async (err) => {
      const status = err.status || (err.response ? err.response.status : 0);
      if ( status === 401 && !err.config.url.endsWith("/refresh")  && !err.config.url.endsWith(`/${APP_ID}`)) {
        try {
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
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
