export interface CompanyWebRuntimeEnv {
  SERVER_API_URL: string;
  SERVER_ADMIN_API_URL: string;
  SERVER_DOMAIN: string;
  GOOGLE_MAPS_API_KEY: string;
  APP_ID: string;
  ONLINE_ORDERING_EDITOR_URL: string;
  ONLINE_ORDERING_EDITOR_ORIGINS: string;
}

declare global {
  interface Window {
    __ENV__?: Partial<CompanyWebRuntimeEnv>;
  }
}

const localDefaults: CompanyWebRuntimeEnv = {
  SERVER_API_URL: '',
  SERVER_ADMIN_API_URL: '/admin-api',
  SERVER_DOMAIN: 'https://pos-central.rize-pos.com',
  GOOGLE_MAPS_API_KEY: '',
  APP_ID: 'central-app',
  ONLINE_ORDERING_EDITOR_URL: '',
  ONLINE_ORDERING_EDITOR_ORIGINS: '',
};

export function getRuntimeEnv(): CompanyWebRuntimeEnv {
  return { ...localDefaults, ...window.__ENV__ };
}

export const runtimeConfig: CompanyWebRuntimeEnv = new Proxy({} as CompanyWebRuntimeEnv, {
  get(_target, prop: keyof CompanyWebRuntimeEnv) {
    return getRuntimeEnv()[prop];
  },
});
