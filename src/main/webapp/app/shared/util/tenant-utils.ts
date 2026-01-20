export const DEFAULT_TENANT = 'default';

export function getTenantFromURL(): string | undefined {
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  if (pathSegments.length > 0) {
    return pathSegments[0];
  }
}

export function getActiveTenant(): string {
  return getTenantFromURL() || undefined;
}

export function buildAuthTokenKey(tenant?: string): string {
  return `${tenant ?? getActiveTenant()}_authenticationToken`;
}

export function buildRefreshTokenKey(tenant?: string): string {
  return `${tenant ?? getActiveTenant()}_refreshToken`;
}

