import { useCallback, Dispatch, SetStateAction } from 'react';
import { IScheduledBranchPrice } from 'app/shared/model/ITEM/retail/variable-item.model';

interface IItemWithVariants {
  variants?: Array<{
    branchVariantDetails?: Record<string, any>;
    [key: string]: any;
  }>;
}

/**
 * Shared hook that extracts the duplicated branch-price update logic from all item-update screens.
 * Works with any item that has `variants: Array<{ branchVariantDetails?: Record<string, any> }>`.
 */
export function useVariantBranchPrice<T extends IItemWithVariants>(
  setItem: Dispatch<SetStateAction<T>>
) {
  const handleBranchPriceChange = useCallback(
    (variantIndex: number, branchId: string, priceType: string, price: number | null) => {
      setItem((prev: T) => ({
        ...prev,
        variants: (prev.variants || []).map((v, i) =>
          i !== variantIndex
            ? v
            : {
                ...v,
                branchVariantDetails: {
                  ...v.branchVariantDetails,
                  [branchId]: {
                    ...v.branchVariantDetails?.[branchId],
                    branch: { id: branchId },
                    [priceType]: price,
                  },
                },
              }
        ),
      }));
    },
    [setItem]
  );

  const handleHideItemPerBranch = useCallback(
    (branchId: string, variantIndex: number, field: 'hideItem' | 'hideOnline') => {
      setItem((prev: T) => ({
        ...prev,
        variants: (prev.variants || []).map((v, i) =>
          i !== variantIndex
            ? v
            : {
                ...v,
                branchVariantDetails: {
                  ...v.branchVariantDetails,
                  [branchId]: {
                    ...v.branchVariantDetails?.[branchId],
                    [field]: !v.branchVariantDetails?.[branchId]?.[field],
                  },
                },
              }
        ),
      }));
    },
    [setItem]
  );

  const handleSaveScheduledPrices = useCallback(
    (variantIndex: number, branchId: string, scheduledPrices: IScheduledBranchPrice[]) => {
      setItem((prev: T) => ({
        ...prev,
        variants: (prev.variants || []).map((v, i) =>
          i !== variantIndex
            ? v
            : {
                ...v,
                branchVariantDetails: {
                  ...v.branchVariantDetails,
                  [branchId]: {
                    ...v.branchVariantDetails?.[branchId],
                    branch: { id: branchId },
                    scheduledPrices,
                  },
                },
              }
        ),
      }));
    },
    [setItem]
  );

  return { handleBranchPriceChange, handleHideItemPerBranch, handleSaveScheduledPrices };
}
