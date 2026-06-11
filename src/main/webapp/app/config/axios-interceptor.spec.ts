import axios from 'axios';
import sinon from 'sinon';
import { Storage } from 'react-jhipster';

import { buildAuthTokenKey } from 'app/shared/util/tenant-utils';

describe('Axios Interceptor', () => {
  describe('setupAxiosInterceptors', () => {
    const client = axios;
    const onUnauthenticated = sinon.spy();
    const authKey = buildAuthTokenKey();
    let setupAxiosInterceptors;

    beforeAll(async () => {
      (globalThis as typeof globalThis & { SERVER_API_URL: string }).SERVER_API_URL = 'https://rize-pos.com/central-app';
      setupAxiosInterceptors = (await import('./axios-interceptor')).default;
      setupAxiosInterceptors(onUnauthenticated);
    });

    beforeEach(() => {
      onUnauthenticated.resetHistory();
      Storage.local.remove(authKey);
      Storage.session.remove(authKey);
    });

    it('onRequestSuccess is called on fulfilled request', () => {
      expect((client.interceptors.request as any).handlers[0].fulfilled({ data: 'foo', url: '/test' })).toMatchObject({
        data: 'foo',
      });
    });

    it('adds Authorization for non-login requests when a token exists', () => {
      Storage.local.set(authKey, 'test-token');

      const config = (client.interceptors.request as any).handlers[0].fulfilled({
        headers: {},
        url: '/api/account',
      });

      expect(config.headers.Authorization).toBe('Bearer test-token');
    });

    it('does not add Authorization for relative central-app login requests', () => {
      Storage.local.set(authKey, 'test-token');

      const config = (client.interceptors.request as any).handlers[0].fulfilled({
        headers: {},
        url: '/api/login/business_1010/central-app',
      });

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('does not add Authorization for absolute central-app login requests', () => {
      Storage.local.set(authKey, 'test-token');

      const config = (client.interceptors.request as any).handlers[0].fulfilled({
        headers: {},
        url: 'https://pos-admin.rize-pos.com/api/login/business_1010/central-app',
      });

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('onResponseSuccess is called on fulfilled response', () => {
      expect((client.interceptors.response as any).handlers[0].fulfilled({ data: 'foo' })).toEqual({ data: 'foo' });
    });

    it('onResponseError rejects non-401 responses without unauthenticating', () => {
      const rejectError = {
        response: {
          statusText: 'NotFound',
          status: 403,
          data: { message: 'Page not found' },
        },
      };
      expect((client.interceptors.response as any).handlers[0].rejected(rejectError)).rejects.toEqual(rejectError);
      expect(onUnauthenticated.called).toBe(false);
    });
  });
});
