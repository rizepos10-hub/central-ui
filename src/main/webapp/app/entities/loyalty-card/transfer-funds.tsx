import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { useAppDispatch } from 'app/config/store';
import { searchEntities, transferFundsFromCard } from './loyalty-card.reducer';
import AsyncSelect from 'react-select/async';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toast } from 'react-toastify';
import { FilterMatchMode } from 'primereact/api';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

const TransferFunds = ({ transferDialogVisibile, setTransferDialogVisible }) => {
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
                setTransferDialogVisible(false);
            })
            .catch(err => {
                toast.error('Error Transferring Funds!');
                console.error(err);
            });
    };

    return (
        <Dialog
            header="Transfer Funds"
            visible={transferDialogVisibile}
            className={'w-50'}
            onHide={() => setTransferDialogVisible(false)}
        >
            <div>
                <div className="d-flex flex-column gap-2">
                    <label className="fw-bold">From Card</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions
                        value={transferFunds.fromCard}
                        onChange={option => setTransferFunds(prev => ({ ...prev, fromCard: option }))}
                        placeholder="Select a Card"
                    />
                </div>
                <div className="d-flex flex-column gap-2">
                    <label className="fw-bold">To Card</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions
                        value={transferFunds.toCard}
                        onChange={option => setTransferFunds(prev => ({ ...prev, toCard: option }))}
                        placeholder="Select a Card"
                    />
                </div>
                <div className="d-flex flex-column gap-2">
                    <label className="fw-bold">Amount</label>
                    <InputNumber
                        value={transferFunds.amount}
                        onChange={e => setTransferFunds(prev => ({ ...prev, amount: e.value }))}
                    />
                </div>
                <div className="d-flex flex-column gap-2">
                    <label className="fw-bold">Comment</label>
                    <InputText
                        value={transferFunds.comment}
                        onChange={e => setTransferFunds(prev => ({ ...prev, comment: e.target.value }))}
                    />
                </div>

                <Button label="Transfer" onClick={handleTransferFunds} className="mt-3" />
            </div>
        </Dialog>
    );
};

export default TransferFunds;
