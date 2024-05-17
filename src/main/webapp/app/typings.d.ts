declare const VERSION: string;
declare const SERVER_API_URL: string;
declare const SERVER_ADMIN_API_URL: string;
declare const SERVER_DOMAIN: string;
declare const DEVELOPMENT: string;
declare const I18N_HASH: string;
declare const GOOGLE_MAPS_API_KEY: string;

declare module '*.json' {
  const value: any;
  export default value;
}
