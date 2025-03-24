  import axios from 'axios';
  import { Storage } from 'react-jhipster';
  import { AUTH_TOKEN_KEY, clearAccessToken, REFRESH_TOKEN_KEY, TENANT_KEY } from 'app/shared/reducers/authentication';

  const TIMEOUT = 1 * 60 * 1000;
  axios.defaults.timeout = TIMEOUT;
  axios.defaults.baseURL = SERVER_API_URL;

  const setupAxiosInterceptors = onUnauthenticated => {

    const refreshAccessToken = async () => {
      try {
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
      } catch (error) {
        console.error('error refreshing token: ', error)
        onUnauthenticated();
        throw error
      }
    };

    const onRequestSuccess = config => {
      const token = Storage.local.get('jhi-authenticationToken') || Storage.session.get('jhi-authenticationToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    const onResponseSuccess = response => response;

    const onResponseError = async (err) => {
      const status = err.status || (err.response ? err.response.status : 0);
      console.log(status)
      if ( status === 401 && !err.config.url.endsWith("/refresh")  && !err.config.url.endsWith("/central-app")) {
        console.log(status)
        try {
          const newAccessToken = await refreshAccessToken();
          console.log(status)
          if (newAccessToken) {
            err.config.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(err.config);
          } else {
            onUnauthenticated();
          }
        } catch (error) {
          console.log(status)
          onUnauthenticated();
        }
      }

      return Promise.reject(err);
    };

    axios.interceptors.request.use(onRequestSuccess);
    axios.interceptors.response.use(onResponseSuccess, onResponseError);
  };

  export default setupAxiosInterceptors;
