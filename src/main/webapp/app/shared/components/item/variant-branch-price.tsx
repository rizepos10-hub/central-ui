import React, { useEffect, useState } from 'react';
import {
  IBranchVariantDetails,
  IPricingPointBranchPrice,
  IScheduledBranchPrice,
  IVariableItemVariant,
} from 'app/shared/model/ITEM/retail/variable-item.model';
import { IRegularItemVariant } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import { translate, Translate } from 'react-jhipster';
import { IBranch } from 'app/shared/model/branch.model';
import PricingPointModal from './pricing-point-modal';
import ScheduledBranchPricesModal from './scheduled-branch-prices-dialog';
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
  handleSaveScheduledPrices?: (
    variantIndex: number,
    branchId: string,
    scheduledPrices: IScheduledBranchPrice[]
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
  handleSaveScheduledPrices,
  variant,
  setItem,
}: BranchPriceComponentProps<T>) => {
  const dispatch = useAppDispatch();

  const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);

  const [pricesModal, setPricesModal] = useState({
    show: false,
    branchId: '',
  });
  const [scheduledPricesModal, setScheduledPricesModal] = useState({
    show: false,
    branchId: '',
    branchName: '',
  });

  const handleShowPricesModal = (branchId?: string) => {
    setPricesModal(prev => ({
      ...prev,
      show: !prev.show,
      branchId,
    }));
  };

  const handleScheduledPricesModal = (branchId?: string, branchName?: string) => {
    setScheduledPricesModal(prev => ({
      show: !prev.show,
      branchId: branchId || '',
      branchName: branchName || '',
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
      {scheduledPricesModal.show && (
        <ScheduledBranchPricesModal
          isOpen={scheduledPricesModal.show}
          branchId={scheduledPricesModal.branchId}
          branchName={scheduledPricesModal.branchName}
          scheduledPrices={branchVariantDetails?.[scheduledPricesModal.branchId]?.scheduledPrices || []}
          onClose={() => handleScheduledPricesModal()}
          onSave={scheduledPrices =>
            handleSaveScheduledPrices?.(variantIndex, scheduledPricesModal.branchId, scheduledPrices)
          }
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
              {(itemVariantType === 'RETAIL' || itemVariantType === 'RESTAURANT') && (
                <TableHead className="text-xs h-8 font-semibold p-2">
                  Scheduled Prices
                </TableHead>
              )}
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
                    onChange={e => handleBranchPriceChange(variantIndex, branch.id, 'price', parseFloat(e.target.value) ?? null)}
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
                      handleBranchPriceChange(variantIndex, branch.id, 'salePrice', parseFloat(e.target.value) ?? null)
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
                {(itemVariantType === 'RETAIL' || itemVariantType === 'RESTAURANT') && (
                  <TableCell className="text-xs p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleScheduledPricesModal(branch.id, branch.name);
                      }}
                    >
                      Scheduled Prices
                      {(branchVariantDetails?.[branch.id]?.scheduledPrices?.length || 0) > 0 ? (
                        <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {branchVariantDetails?.[branch.id]?.scheduledPrices?.length}
                        </span>
                      ) : null}
                    </Button>
                  </TableCell>
                )}
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
