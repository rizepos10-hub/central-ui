import React, { useEffect, useState } from "react";
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { translate, Translate } from "react-jhipster";
import { partialUpdateEntity } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type modalProps = {
  toggle: () => void,
  isOpen: boolean,
  stockQuantity: IStockQuantity,
  onSaved?: (updatedEntity: IStockQuantity) => void,
}

const StockQuantityModal = ({ toggle, isOpen, stockQuantity, onSaved }: modalProps) => {
  const dispatch = useAppDispatch();
  const updating = useAppSelector(state => state.stockQuantity.updating);

  const [modifiedStockQuantity, setModifiedStockQuantity] = useState<number | ''>('');
  const [modifiedCost, setModifiedCost] = useState<number | ''>('');

  const handleClose = () => {
    toggle();
    setModifiedStockQuantity('');
    setModifiedCost('');
  };

  useEffect(() => {
    setModifiedCost(stockQuantity?.unitCost ?? '');
    setModifiedStockQuantity(stockQuantity?.quantity ?? '');
  }, [stockQuantity?.id, stockQuantity?.unitCost, stockQuantity?.quantity]);

  const handleSave = () => {
    const entity = {
      ...stockQuantity,
      quantity: modifiedStockQuantity === '' ? 0 : Number(modifiedStockQuantity),
      unitCost: modifiedCost === '' ? 0 : Number(modifiedCost),
    };

    dispatch(partialUpdateEntity(entity)).then(() => {
      onSaved?.(entity);
      toggle();
      setModifiedStockQuantity('');
      setModifiedCost('');
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quantity Config</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{translate("common.location")}</div>
            <div className="text-sm">{stockQuantity?.location?.name || '-'}</div>
          </div>

          <div className="space-y-2">
            <label htmlFor="adjusted" className="text-xs font-medium">
              {translate("tempApp.stockConfig.adjustedQuantity")}
            </label>
            <Input
              id="adjusted"
              type="number"
              step="0.01"
              value={modifiedStockQuantity}
              onChange={e => setModifiedStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cost" className="text-xs font-medium">
              {translate("tempApp.stockConfig.cost")}
            </label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={modifiedCost}
              onChange={e => setModifiedCost(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updating}>
            <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
          </Button>
          <Button onClick={handleSave} disabled={updating}>
            <Translate contentKey={'entity.action.save'}>Save</Translate>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockQuantityModal;
