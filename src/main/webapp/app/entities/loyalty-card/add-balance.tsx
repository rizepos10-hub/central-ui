import React, { useState } from 'react';
import { useAppDispatch } from 'app/config/store';
import { addBalance } from './loyalty-card.reducer';
import { toast } from 'react-toastify';
import Select from 'app/shared/components/select/select';
import { ILoyaltyCardBalance, PaymentType } from 'app/shared/model/loyalty-card.model';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddBalance = ({
  addBalanceDialog,
  setAddBalanceDialog,
}: {
  addBalanceDialog: {
    entity: any;
    visible: boolean;
  };
  setAddBalanceDialog: React.Dispatch<
    React.SetStateAction<{
      entity: any;
      visible: boolean;
    }>
  >;
}) => {
  const dispatch = useAppDispatch();

  const [balanceEntity, setBalanceEntity] = useState<ILoyaltyCardBalance>({
    amount: 0,
    paymentType: PaymentType.CASH,
  });

  const handleAddBalance = () => {
    dispatch(
      addBalance({
        entity: balanceEntity,
        refNumber: addBalanceDialog.entity.referenceNumber,
      })
    )
      .then(res => {
        toast.success('Balance Added Successfully!');
        setAddBalanceDialog({
          entity: null,
          visible: false,
        });
      })
      .catch(err => {
        toast.error('Error Adding Balance!');
      });
  };

  return (
    <Dialog
      open={addBalanceDialog.visible}
      onOpenChange={open => {
        if (!open) {
          setAddBalanceDialog({
            entity: null,
            visible: false,
          });
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Balance</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="amount" className="text-xs">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              className="h-7 text-xs"
              value={balanceEntity.amount ?? ''}
              onChange={e => setBalanceEntity(prev => ({ ...prev, amount: parseFloat(e.target.value) ?? 0 }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="paymentType" className="text-xs">
              Payment Type
            </Label>
            <Select
              id="paymentType"
              options={Object.values(PaymentType).map(type => ({ label: type, value: type }))}
              onChange={e => setBalanceEntity(prev => ({ ...prev, paymentType: e.value }))}
              value={{ label: balanceEntity.paymentType, value: balanceEntity.paymentType }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button className="h-8 text-xs" onClick={handleAddBalance}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBalance;