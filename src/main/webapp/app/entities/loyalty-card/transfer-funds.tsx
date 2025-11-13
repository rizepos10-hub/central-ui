import React, { useState } from 'react';
import { useAppDispatch } from 'app/config/store';
import { searchEntities, transferFundsFromCard } from './loyalty-card.reducer';
import AsyncSelect from 'react-select/async';
import { toast } from 'react-toastify';
import { FilterMatchMode } from 'primereact/api';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TransferFunds = ({ transferDialogVisibile, onCloseHandle }) => {
  const dispatch = useAppDispatch();
  const [transferFunds, setTransferFunds] = useState({
    fromCard: null,
    toCard: null,
    amount: 0,
    comment: '',
  });

  const loadOptions = (inputValue, callback) => {
    const query = {
      first: 0,
      rows: 10,
      page: 0,
      sortField: null,
      sortOrder: null,
      query: '',
      filters: {
        referenceNumber: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);

    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    ).then(response => {
      // Use the data from the response
      const res = response.payload as any;
      const data = res?.data;

      const options = data.map(card => ({
        value: card.referenceNumber,
        label: card.referenceNumber,
        card,
      }));
      callback(options);
    });
  };

  const handleTransferFunds = () => {
    const transferData = {
      fromCard: transferFunds.fromCard.value,
      toCard: transferFunds.toCard.value,
      amount: transferFunds.amount,
      comment: transferFunds.comment,
    };

    dispatch(transferFundsFromCard(transferData))
      .then(() => {
        toast.success('Funds Transferred Successfully!');
        onCloseHandle();
      })
      .catch(err => {
        toast.error('Error Transferring Funds!');
        console.error(err);
      });
  };

  return (
    <Dialog
      open={transferDialogVisibile}
      onOpenChange={open => {
        if (!open) {
          onCloseHandle();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Transfer Funds</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="fromCard" className="text-xs font-semibold">
              From Card
            </Label>
            <AsyncSelect
              id="fromCard"
              cacheOptions
              loadOptions={loadOptions}
              defaultOptions
              value={transferFunds.fromCard}
              onChange={option => setTransferFunds(prev => ({ ...prev, fromCard: option }))}
              placeholder="Select a Card"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="toCard" className="text-xs font-semibold">
              To Card
            </Label>
            <AsyncSelect
              id="toCard"
              cacheOptions
              loadOptions={loadOptions}
              defaultOptions
              value={transferFunds.toCard}
              onChange={option => setTransferFunds(prev => ({ ...prev, toCard: option }))}
              placeholder="Select a Card"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="amount" className="text-xs font-semibold">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              className="h-7 text-xs"
              value={transferFunds.amount ?? ''}
              onChange={e => setTransferFunds(prev => ({ ...prev, amount: parseFloat(e.target.value) ?? 0 }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="comment" className="text-xs font-semibold">
              Comment
            </Label>
            <Input
              id="comment"
              className="h-7 text-xs"
              value={transferFunds.comment}
              onChange={e => setTransferFunds(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button className="h-8 text-xs" onClick={handleTransferFunds}>
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferFunds;
