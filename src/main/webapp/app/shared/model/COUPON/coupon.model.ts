import { CouponType } from "./coupon-type.model";
import { UsageType } from "./usage-type.model";

export interface Coupon {
    id?: string;
    startDate?: string;
    endDate?: string;
    code?: string;
    name?: string;
    discountValue?: number;
    maxUsage?: number;
    usageCount?: number;
    excludeSaleItem?: boolean;
    applicableProducts?: string[];
    excludedProducts?: string[];
    applicableCategories?: string[];
    excludedCategories?: string[];
    couponType?: CouponType;
    includedEmail?: string[];
    excludedEmail?: string[];
    usageType?: UsageType;
  }