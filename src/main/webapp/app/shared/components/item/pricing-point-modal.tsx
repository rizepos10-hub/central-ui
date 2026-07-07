import React from "react";
import { Translate } from "react-jhipster";
import { IPricingPoint } from "app/shared/model/PRICING-POINT/pricing-point";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDiscountLabel,
  hasPricingPointDiscount,
} from "app/shared/util/format-discount-label";

type ModalProps = {
  toggle: () => void;
  isOpen: boolean;
  pricingPoints: IPricingPoint[];
  branchId: string;
  variant: any
  setItem: React.Dispatch<React.SetStateAction<any>>;
};

const PricingPointModal = ({
  toggle,
  isOpen,
  pricingPoints,
  branchId,
  variant,
  setItem,
}: ModalProps) => {
  const stripDiscountOnlyBranchPrices = () => {
    setItem(prev => ({
      ...prev,
      variants: prev.variants.map(v => {
        if (v.id !== variant.id) {
          return v;
        }
        return {
          ...v,
          pricingPointBranchPrices: (v.pricingPointBranchPrices || []).filter(ppbp => {
            if (ppbp.branch?.id !== branchId) {
              return true;
            }
            const pp = pricingPoints.find(p => p.id === ppbp.pricingPoint?.id) ?? ppbp.pricingPoint;
            return !hasPricingPointDiscount(pp);
          }),
        };
      }),
    }));
  };

  const handleClose = () => {
    toggle();
  };

  const handlePriceChange = (pricingPoint: IPricingPoint, value: number | null) => {
    if (hasPricingPointDiscount(pricingPoint)) {
      return;
    }

    setItem(prev => ({
      ...prev,
      variants: prev.variants.map(v => {
        if (v.id === variant.id) {
          const existingIndex = (v.pricingPointBranchPrices || []).findIndex(
            ppbp =>
              ppbp.pricingPoint.id === pricingPoint.id &&
              ppbp.branch?.id === branchId
          );

          if (value === null) {
            return {
              ...v,
              pricingPointBranchPrices:
                existingIndex !== -1
                  ? v.pricingPointBranchPrices.filter((_, idx) => idx !== existingIndex)
                  : v.pricingPointBranchPrices,
            };
          }

          const updatedPricingPointBranchPrices =
            existingIndex !== -1
              ? v.pricingPointBranchPrices.map((ppbp, idx) =>
                idx === existingIndex
                  ? {
                    ...ppbp,
                    price: value,
                    branch: { id: branchId },
                  }
                  : ppbp
              )
              : [
                ...(v.pricingPointBranchPrices || []),
                {
                  branch: { id: branchId },
                  pricingPoint,
                  price: value,
                },
              ];

          return {
            ...v,
            pricingPointBranchPrices: updatedPricingPointBranchPrices,
          };
        }
        return v;
      }),
    }));
  };

  const handleSave = () => {
    stripDiscountOnlyBranchPrices();
    toggle();
  };

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Translate contentKey="items.update.pricingPoints">Pricing Points</Translate>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {pricingPoints.map(pricingPoint => {
            const isDiscountOnly = hasPricingPointDiscount(pricingPoint);
            const currentPrice = variant?.pricingPointBranchPrices?.find(
              ppbp => ppbp.pricingPoint.id === pricingPoint.id && ppbp.branch?.id === branchId
            )?.price;

            return (
              <div
                key={pricingPoint.id}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <Label htmlFor={`price-${pricingPoint.id}`} className="text-sm font-medium shrink-0">
                  {pricingPoint.name}
                </Label>
                {isDiscountOnly ? (
                  <div className="flex flex-col items-end gap-1 sm:max-w-[60%]">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {formatDiscountLabel(pricingPoint.discount)}
                    </span>
                    <span className="text-xs text-muted-foreground text-right">
                      <Translate contentKey="items.update.pricingPointDiscountOnly">
                        Branch price not used — discount applies to catalog price
                      </Translate>
                    </span>
                  </div>
                ) : (
                  <Input
                    id={`price-${pricingPoint.id}`}
                    type="number"
                    step="0.01"
                    className="w-32"
                    value={currentPrice ?? ''}
                    onChange={e => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      handlePriceChange(pricingPoint, value);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <Translate contentKey="entity.action.cancel">Cancel</Translate>
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PricingPointModal;
