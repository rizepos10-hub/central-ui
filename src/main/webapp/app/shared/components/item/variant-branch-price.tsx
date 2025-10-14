import React, { useEffect, useState } from 'react';
import { IBranchVariantDetails, IPricingPointBranchPrice, IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { IRegularItemVariant } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import { translate, Translate } from 'react-jhipster';
import { IBranch } from 'app/shared/model/branch.model';
import PricingPointModal from './pricing-point-modal';
import { getEntities as getPricingPoints } from 'app/entities/settings/pricing-point/pricing-point.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IPricingPoint } from 'app/shared/model/PRICING-POINT/pricing-point';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface BranchPriceComponentProps<T extends IVariableItemVariant | IRegularItemVariant> {
  variantIndex: number;
  branchVariantDetails: IBranchVariantDetails;
  branchList: IBranch[];
  handleBranchPriceChange: (variantIndex: number, branchId: string, field: string, value: number) => void;
  itemVariantType: 'RETAIL' | 'RESTAURANT' | 'VIRTUAL_GIFTCARD';
  handleSavePricingPoint?: (
    variantIndex: number,
    branchId: string,
    pricingPoint: IPricingPoint,
    price: number
  ) => void;
  handleHideItemPerBranch?: (
    branchId: string,
    variantIndex: number,
    field: 'hideItem' | 'hideOnline'
  ) => void;
  variant: T;
  setItem: React.Dispatch<React.SetStateAction<any>>;
}

const VariantBranchPrice = <T extends IVariableItemVariant | IRegularItemVariant>({
  variantIndex,
  branchList,
  handleBranchPriceChange,
  branchVariantDetails,
  itemVariantType,
  handleSavePricingPoint,
  handleHideItemPerBranch,
  variant,
  setItem,
}: BranchPriceComponentProps<T>) => {
  const dispatch = useAppDispatch();

  const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);

  const [pricesModal, setPricesModal] = useState({
    show: false,
    branchId: '',
  });

  const handleShowPricesModal = (branchId?: string) => {
    setPricesModal(prev => ({
      ...prev,
      show: !prev.show,
      branchId,
    }));
  };

  useEffect(() => {
    dispatch(
      getPricingPoints({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

  const getFilteredPricingPoints = (branchId) => {
    if (!branchId) return [];
    return pricingPoints.filter(pp =>
      pp.applicableBranches?.some(b => b.id === branchId)
    );
  }

  return (
    <div className="space-y-4 mt-3">
      {pricesModal.show && (
        <PricingPointModal
          toggle={handleShowPricesModal}
          isOpen={pricesModal.show}
          pricingPoints={getFilteredPricingPoints(pricesModal.branchId)}
          branchId={pricesModal.branchId}
          variant={variant}
          setItem={setItem}
        />
      )}
      <Label className="text-base font-semibold">
        <Translate contentKey="items.update.branchPrices">Branch Prices</Translate>
      </Label>
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs h-8 font-semibold p-2">
                <Translate contentKey="items.update.branch">Branch</Translate>
              </TableHead>
              <TableHead className="text-xs h-8 font-semibold p-2">
                <Translate contentKey="items.update.price">Price</Translate>
              </TableHead>
              <TableHead className="text-xs h-8 font-semibold p-2">
                <Translate contentKey="items.update.salePrice">Sale Price</Translate>
              </TableHead>
              <TableHead className="text-xs h-8 font-semibold p-2">
                <Translate contentKey="items.update.pricingPoints">Pricing Points</Translate>
              </TableHead>
              <TableHead className="text-xs h-8 font-semibold p-2">
                <Translate contentKey="items.update.hideItem">Hide Item POS</Translate>
              </TableHead>
              <TableHead className="text-xs h-8 font-semibold p-2">
                <Translate contentKey="items.update.hideOnline">Hide Item Online</Translate>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchList.map(branch => (
              <TableRow key={branch.id}>
                <TableCell className="text-xs p-2">{branch.name}</TableCell>
                <TableCell className="text-xs p-2">
                  <Input
                    type="number"
                    name={`branchPrice_${branch.id}`}
                    placeholder={translate('items.update.placeholders.itemBranchPrice', {
                      branchName: branch.name,
                    })}
                    onWheel={e => {
                      if (e.target instanceof HTMLInputElement) e.target.blur();
                    }}
                    step={0.01}
                    min={0}
                    value={branchVariantDetails?.[branch.id]?.price || ''}
                    onChange={e => handleBranchPriceChange(variantIndex, branch.id, 'price', parseFloat(e.target.value) || null)}
                    className="h-7 text-xs w-28"
                  />
                </TableCell>
                <TableCell className="text-xs p-2">
                  <Input
                    type="number"
                    name={`branchSalePrice_${branch.id}`}
                    placeholder={translate('items.update.placeholders.itemBranchSalePrice', {
                      branchName: branch.name,
                    })}
                    onWheel={e => {
                      if (e.target instanceof HTMLInputElement) e.target.blur();
                    }}
                    min={0}
                    step={0.01}
                    value={branchVariantDetails?.[branch.id]?.salePrice || ''}
                    onChange={e =>
                      handleBranchPriceChange(variantIndex, branch.id, 'salePrice', parseFloat(e.target.value) || null)
                    }
                    className="h-7 text-xs w-28"
                  />
                </TableCell>
                <TableCell className="text-xs p-2">
                  {
                    getFilteredPricingPoints(branch.id).length > 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleShowPricesModal(branch.id);
                        }}
                      >
                        Pricing Points
                      </Button>
                    ) : (
                      <></>
                    )
                  }

                </TableCell>
                <TableCell className="text-xs p-2">
                  <Checkbox
                    name={`hideItem_${branch.id}`}
                    onCheckedChange={() => handleHideItemPerBranch?.(branch.id, variantIndex, 'hideItem')}
                    checked={branchVariantDetails?.[branch.id]?.hideItem}
                  />
                </TableCell>
                <TableCell className="text-xs p-2">
                  <Checkbox
                    name={`hideOnline_${branch.id}`}
                    onCheckedChange={() => handleHideItemPerBranch?.(branch.id, variantIndex, 'hideOnline')}
                    checked={branchVariantDetails?.[branch.id]?.hideOnline}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VariantBranchPrice;
