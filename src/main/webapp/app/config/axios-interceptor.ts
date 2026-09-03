import axios from 'axios';
import { Storage } from 'react-jhipster';
import { clearAccessToken } from 'app/shared/reducers/authentication';
import { buildAuthTokenKey, buildRefreshTokenKey, getActiveTenant } from 'app/shared/util/tenant-utils';
import { runtimeConfig } from 'app/config/runtime-config';
import { isRequestCancellation } from 'app/config/request-utils';

const TIMEOUT = 1 * 60 * 1000;
const APP_ID = () => runtimeConfig.APP_ID;
const LATEST_REQUEST_KEY_HEADER = 'X-Latest-Request-Key';
const LATEST_REQUEST_SEQUENCE_HEADER = 'X-Latest-Request-Sequence';

type LatestRequestEntry = {
  identity: string;
  controller: AbortController;
  sequence: number;
  removeCallerAbortListener: () => void;
};

const pendingLatestRequests = new Map<string, LatestRequestEntry>();
const latestRequestSequences = new Map<string, number>();
const requestMetadata = new WeakMap<object, LatestRequestEntry>();

const createClientInstanceId = () => {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch (error) {
    // Use the fallback below when randomUUID is unavailable.
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const clientInstanceId = createClientInstanceId();

const hashRequestIdentity = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return Math.floor(hash).toString(36);
};

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

const appendRequestParam = (url: URL, key: string, value: any) => {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(item => appendRequestParam(url, key, item));
    return;
  }

  if (value instanceof Date) {
    url.searchParams.append(key, value.toISOString());
    return;
  }

  url.searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
};

const resolveRequestUrl = config => {
  const baseUrl = axios.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  const requestUrl = new URL(config.url || '', baseUrl);

  if (config.params instanceof URLSearchParams) {
    config.params.forEach((value, key) => requestUrl.searchParams.append(key, value));
  } else if (config.params) {
    Object.keys(config.params)
      .sort()
      .forEach(key => appendRequestParam(requestUrl, key, config.params[key]));
  }

  // JHipster list requests use this value to bypass HTTP caching. It must not
  // make every otherwise-identical request look like a different request.
  requestUrl.searchParams.delete('cacheBuster');
  requestUrl.searchParams.sort();

  return `${requestUrl.pathname}${requestUrl.search}`;
};

const isLatestWinsRequest = config => {
  const method = (config.method || 'get').toUpperCase();
  const path = resolveRequestPath(config.url);

  if (isCentralAppLoginRequest(config.url) || isAuthRefreshRequest(config.url)) {
    return false;
  }

  if (['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  if (method !== 'POST') {
    return false;
  }

  return /\/(?:_search|search|calculate|totals|price|preview|filtered|by-ids|mark-as-read)(?:\/|$)/.test(path);
};

const bridgeAbortSignal = (source: AbortSignal | undefined, target: AbortController) => {
  if (!source) {
    return () => undefined;
  }

  const abort = () => target.abort();
  source.addEventListener('abort', abort, { once: true });

  if (source.aborted) {
    target.abort();
  }

  return () => source.removeEventListener('abort', abort);
};

const cleanupLatestRequest = config => {
  if (!config || typeof config !== 'object') {
    return;
  }

  const entry = requestMetadata.get(config);
  if (!entry) {
    return;
  }

  entry.removeCallerAbortListener();
  if (pendingLatestRequests.get(entry.identity) === entry) {
    pendingLatestRequests.delete(entry.identity);
  }
  requestMetadata.delete(config);
};

const createSupersededRequestError = config => {
  const error: any = new Error('Request superseded by a newer request');
  error.name = 'AbortError';
  error.code = 'ERR_CANCELED';
  error.isAxiosError = true;
  error.config = config;
  return error;
};

const prepareLatestRequest = config => {
  if (!isLatestWinsRequest(config)) {
    return;
  }

  const method = (config.method || 'get').toUpperCase();
  const tenant = getActiveTenant() || 'unknown-tenant';
  const identity = `${tenant}:${method}:${resolveRequestUrl(config)}`;
  const previous = pendingLatestRequests.get(identity);
  previous?.controller.abort();

  const controller = new AbortController();
  const sequence = (latestRequestSequences.get(identity) || 0) + 1;
  latestRequestSequences.set(identity, sequence);
  const entry: LatestRequestEntry = {
    identity,
    controller,
    sequence,
    removeCallerAbortListener: bridgeAbortSignal(config.signal, controller),
  };

  pendingLatestRequests.set(identity, entry);
  requestMetadata.set(config, entry);
  config.signal = controller.signal;
  config.headers = config.headers || {};
  config.headers[LATEST_REQUEST_KEY_HEADER] = `${clientInstanceId}:${hashRequestIdentity(identity)}`;
  config.headers[LATEST_REQUEST_SEQUENCE_HEADER] = String(sequence);
};

const isLatestRequestStale = config => {
  const entry = config && typeof config === 'object' ? requestMetadata.get(config) : undefined;
  return Boolean(entry && (entry.controller.signal.aborted || pendingLatestRequests.get(entry.identity) !== entry));
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
    prepareLatestRequest(config);
    return config;
  };

  const onResponseSuccess = response => {
    if (isLatestRequestStale(response.config)) {
      const config = response.config;
      cleanupLatestRequest(config);
      return Promise.reject(createSupersededRequestError(config));
    }

    cleanupLatestRequest(response.config);
    return response;
  };

  const onResponseError = async err => {
    if (isLatestRequestStale(err.config)) {
      cleanupLatestRequest(err.config);
      return Promise.reject(createSupersededRequestError(err.config));
    }

    if (isRequestCancellation(err)) {
      cleanupLatestRequest(err.config);
      return Promise.reject(err);
    }

    const status = err.status || (err.response ? err.response.status : 0);
    const requestUrl = err.config?.url;

    // Never try to refresh on login or refresh endpoints themselves.
    if (status === 401 && !isAuthRefreshRequest(requestUrl) && !isCentralAppLoginRequest(requestUrl)) {
      try {
        const newAccessToken = await getRefreshedAccessToken();
        if (newAccessToken) {
          if (isLatestRequestStale(err.config)) {
            cleanupLatestRequest(err.config);
            return Promise.reject(createSupersededRequestError(err.config));
          }

          cleanupLatestRequest(err.config);
          err.config.headers = err.config.headers || {};
          err.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(err.config);
        } else {
          cleanupLatestRequest(err.config);
          onUnauthenticated();
        }
      } catch (error) {
        cleanupLatestRequest(err.config);
        onUnauthenticated();
      }
    }

    cleanupLatestRequest(err.config);
    return Promise.reject(err);
  };

  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use(onResponseSuccess, onResponseError);
};

export default setupAxiosInterceptors;
