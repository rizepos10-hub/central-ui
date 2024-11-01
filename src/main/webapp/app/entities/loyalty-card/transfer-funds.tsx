import React, { useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, transferFundsFromCard } from './loyalty-card.reducer';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toast } from 'react-toastify';

const TransferFunds = ({
    transferDialogVisibile,
    setTransferDialogVisible
}: {
    transferDialogVisibile: boolean;
    setTransferDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const dispatch = useAppDispatch();
    const [transferFunds, setTransferFunds] = useState({
        fromCard: '',
        toCard: '',
        amount: 0,
        comment: ''
    });

    const loyaltyCardList = useAppSelector(state => state.loyaltycard.entities);

    useEffect(() => {
        dispatch(getEntities({
            page: 0,
            size: 1000,
            sort: 'id,asc',
        }))
    }, [])

    const handleTransferFunds = () => {
        dispatch(transferFundsFromCard(transferFunds)).then(res => {
            toast.success('Funds Transferred Successfully!')
            setTransferDialogVisible(false)
        }).catch(err => {
            toast.error('Error Transferring Funds!')
            console.log(err)
        })
    }

    return (
        <Dialog
            header="Transfer Funds"
            visible={transferDialogVisibile}
            className={"w-50"}
            onHide={() => setTransferDialogVisible(false)}
        >
            <div>
                <div className='d-flex flex-column gap-2'>
                    <label className='fw-bold'>From Card</label>
                    <Dropdown
                        options={loyaltyCardList}
                        value={transferFunds.fromCard}
                        onChange={(e) => setTransferFunds(prev => ({ ...prev, fromCard: e.value }))}
                        placeholder="Select a Card"
                        showClear
                        optionValue={'id'}
                        optionLabel={'referenceNumber'}
                    />
                </div>
                <div className='d-flex flex-column gap-2'>
                    <label className='fw-bold'>To Card</label>
                    <Dropdown
                        options={loyaltyCardList}
                        value={transferFunds.toCard}
                        onChange={(e) => setTransferFunds(prev => ({ ...prev, toCard: e.value }))}
                        placeholder="Select a Card"
                        showClear
                        optionValue={'id'}
                        optionLabel={'referenceNumber'}
                    />
                </div>
                <div className='d-flex flex-column gap-2'>
                    <label className='fw-bold'>Amount</label>
                    <InputNumber
                        value={transferFunds.amount}
                        onChange={(e) => setTransferFunds(prev => ({ ...prev, amount: e.value }))}
                    />
                </div>
                <div className='d-flex flex-column gap-2'>
                    <label className='fw-bold'>Comment</label>
                    <InputText
                        value={transferFunds.comment}
                        onChange={(e) => setTransferFunds(prev => ({ ...prev, comment: e.target.value }))}
                    />
                </div>

                <Button color="primary" onClick={handleTransferFunds} className='mt-3'>
                    Transfer
                </Button>
            </div>
        </Dialog>

    )
}

export default TransferFunds