import React, { Dispatch, SetStateAction } from 'react';
import VariantBranchPrice from 'app/shared/components/item/variant-branch-price';
import { IBranch } from 'app/shared/model/branch.model';
import { IBranchVariantDetails, IScheduledBranchPrice } from 'app/shared/model/ITEM/retail/variable-item.model';

interface VariantBranchPricesTabProps {
  variant: any;
  variantIndex: number;
  branchList: IBranch[];
  branchVariantDetails?: IBranchVariantDetails;
  itemVariantType: 'RETAIL' | 'RESTAURANT' | 'VIRTUAL_GIFTCARD';
  handleBranchPriceChange: (variantIndex: number, branchId: string, field: string, value: number | null) => void;
  handleHideItemPerBranch: (branchId: string, variantIndex: number, field: 'hideItem' | 'hideOnline') => void;
  handleSaveScheduledPrices: (variantIndex: number, branchId: string, prices: IScheduledBranchPrice[]) => void;
  setItem: Dispatch<SetStateAction<any>>;
}

export const VariantBranchPricesTab = ({
  variant,
  variantIndex,
  branchList,
  branchVariantDetails,
  itemVariantType,
  handleBranchPriceChange,
  handleHideItemPerBranch,
  handleSaveScheduledPrices,
  setItem,
}: VariantBranchPricesTabProps) => {
  return (
    <div className="w-full">
    <VariantBranchPrice
      branchVariantDetails={branchVariantDetails}
      branchList={branchList}
      handleBranchPriceChange={handleBranchPriceChange}
      variantIndex={variantIndex}
      itemVariantType={itemVariantType}
      handleHideItemPerBranch={handleHideItemPerBranch}
      handleSaveScheduledPrices={handleSaveScheduledPrices}
      variant={variant}
      setItem={setItem}
    />
    </div>
  );
};

export default VariantBranchPricesTab;
