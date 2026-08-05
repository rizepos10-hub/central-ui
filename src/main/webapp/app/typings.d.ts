declare const VERSION: string;
declare const DEVELOPMENT: boolean;
declare const I18N_HASH: string;
declare const GOOGLE_MAPS_API_KEY: string;
declare const BUSINESS_ID: string;
declare const APP_ID: string;

declare module '*.json' {
  const value: any;
  export default value;
}
