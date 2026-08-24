export interface ISenitronSetting {
  enabled?: boolean | null;
  clientCode?: string | null;
  storeCode?: string | null;
  apiKeyConfigured?: boolean;
  connectionVersion?: string | null;
}

export interface ISenitronSettingRequest {
  enabled?: boolean | null;
  clientCode?: string | null;
  storeCode?: string | null;
  /** Write-only; omit or blank to keep the stored key. */
  apiKey?: string | null;
}

export const defaultSenitronSetting: ISenitronSetting = {
  enabled: false,
  clientCode: '',
  storeCode: '',
  apiKeyConfigured: false,
  connectionVersion: null,
};

export const normalizeSenitronSetting = (setting?: ISenitronSetting | null): ISenitronSetting => ({
  ...defaultSenitronSetting,
  ...(setting || {}),
  enabled: setting?.enabled ?? false,
  clientCode: setting?.clientCode ?? '',
  storeCode: setting?.storeCode ?? '',
  apiKeyConfigured: setting?.apiKeyConfigured ?? false,
});
