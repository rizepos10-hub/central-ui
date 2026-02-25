export interface ITookanSettingValue {
  active?: boolean;
  apiKey?: string;
  webhookSharedSecret?: string;
  teamId?: number;
  autoAssignment?: boolean;
  notify?: boolean;
  geofence?: boolean;
  trackingLink?: boolean;
}

export interface ITookanSettingRequest {
  branchId?: string;
  value?: ITookanSettingValue;
}

export interface ITookanSettingResponse {
  branchId?: string;
  hasApiKey?: boolean;
  hasWebhookSecret?: boolean;
  value?: ITookanSettingValue;
}

export const defaultTookanSettingValue: Readonly<ITookanSettingValue> = {
  active: false,
  autoAssignment: false,
  notify: true,
  geofence: false,
  trackingLink: true,
};

export const defaultTookanSettingResponse: Readonly<ITookanSettingResponse> = {
  value: defaultTookanSettingValue,
  hasApiKey: false,
  hasWebhookSecret: false,
};
