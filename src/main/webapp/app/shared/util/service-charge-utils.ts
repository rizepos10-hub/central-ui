import { ServiceChargeKey } from 'app/shared/model/service-charge.model';

export const formatServiceChargeKey = (
  key?: ServiceChargeKey | null,
  fallback = 'Service Charge'
): string => {
  switch (key) {
    case ServiceChargeKey.SHIPPING_FEE:
      return 'Shipping Fee';
    case ServiceChargeKey.PLATFORM_FEE:
      return 'Platform Fee';
    case ServiceChargeKey.WRAPPING_FEE:
      return 'Wrapping Fee';
    case ServiceChargeKey.GRATUITY:
      return 'Gratuity';
    case ServiceChargeKey.OTHER:
      return 'Other';
    default:
      return key || fallback;
  }
};
