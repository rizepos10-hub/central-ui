import { IDiscount } from 'app/shared/model/discount.model';
import { DiscountType } from 'app/shared/model/ENUMS/discount-type.model';
import { IPricingPoint } from 'app/shared/model/PRICING-POINT/pricing-point';
import { IPricingPointBranchPrice } from 'app/shared/model/ITEM/retail/variable-item.model';

export const formatDiscountLabel = (discount?: IDiscount | null): string => {
  if (!discount?.type || discount.value == null) {
    return '-';
  }
  return discount.type === DiscountType.PERCENTAGE
    ? `${discount.value}%`
    : `${discount.value} ${discount.type}`;
};

export const hasPricingPointDiscount = (pp?: IPricingPoint | null): boolean =>
  !!(pp?.discount?.type && pp.discount.value != null);

export interface IPricingPointAssignmentSummary {
  priceCount: number;
  discountCount: number;
}

export const getPricingPointAssignmentSummary = (
  branchId: string,
  variant: { pricingPointBranchPrices?: IPricingPointBranchPrice[] },
  applicablePricingPoints: IPricingPoint[]
): IPricingPointAssignmentSummary => {
  const branchPrices = (variant?.pricingPointBranchPrices || []).filter(
    ppbp => ppbp.branch?.id === branchId
  );

  let priceCount = 0;

  for (const ppbp of branchPrices) {
    const ppId = ppbp.pricingPoint?.id;
    const fullPp = applicablePricingPoints.find(p => p.id === ppId) ?? ppbp.pricingPoint;
    if (!hasPricingPointDiscount(fullPp) && ppbp.price != null && !Number.isNaN(ppbp.price)) {
      priceCount++;
    }
  }

  const discountCount = applicablePricingPoints.filter(pp => hasPricingPointDiscount(pp)).length;

  return { priceCount, discountCount };
};
