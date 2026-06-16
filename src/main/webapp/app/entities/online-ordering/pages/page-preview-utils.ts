import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { PageStatus } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';

export const LOCAL_STOREFRONT_URL = 'http://localhost:3000';

export function normalizeStorefrontUrl(domain?: string): string | null {
  if (!domain?.trim()) {
    return null;
  }
  const normalized = domain.startsWith('http') ? domain : `https://${domain}`;
  return normalized.replace(/\/$/, '');
}

export function isPageActiveLanding(page: IOnlineOrderingPage, uiSettings: IUiSettings): boolean {
  return Boolean(page.id && (uiSettings.defaultPageId === page.id || uiSettings.defaultPageSlug === page.slug));
}

export function canOpenLivePreview(page: IOnlineOrderingPage, uiSettings: IUiSettings): boolean {
  return (
    page.status === PageStatus.PUBLISHED &&
    isPageActiveLanding(page, uiSettings) &&
    Boolean(normalizeStorefrontUrl(uiSettings.domain))
  );
}

export function getLivePreviewUrl(uiSettings: IUiSettings): string | null {
  return normalizeStorefrontUrl(uiSettings.domain);
}
