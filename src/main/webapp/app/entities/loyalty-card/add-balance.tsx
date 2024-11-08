import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { Label } from 'reactstrap'
import { useAppDispatch } from 'app/config/store'
import { addBalance } from './loyalty-card.reducer'
import { toast } from 'react-toastify'
import Select from 'react-select'
import { ILoyaltyCardBalance, PaymentType } from 'app/shared/model/loyalty-card.model'

const AddBalance = ({
    addBalanceDialog,
    setAddBalanceDialog
}: {
    addBalanceDialog: {
        entity: any;
        visible: boolean;
    };
    setAddBalanceDialog: React.Dispatch<React.SetStateAction<{
        entity: any;
        visible: boolean;
    }>>;
}) => {
    const dispatch = useAppDispatch();

    const [balanceEntity, setBalanceEntity] = useState<ILoyaltyCardBalance>({
        amount: 0,
        paymentType: PaymentType.CASH
    });


    const handleAddBalance = () => {
        dispatch(addBalance({
            entity: balanceEntity,
            refNumber: addBalanceDialog.entity.referenceNumber
        })).then(res => {
            toast.success('Balance Added Successfully!')
            setAddBalanceDialog({
                entity: null,
                visible: false
            });
        }).catch(err => {
            toast.error('Error Adding Balance!')
        })
    }

    return (
        <Dialog
            header="Add Balance"
            visible={addBalanceDialog.visible}
            onHide={() => setAddBalanceDialog({
                entity: null,
                visible: false
            })}
        >
            <div className='d-flex flex-column gap-2'>
                <InputNumber
                    value={balanceEntity.amount}
                    onChange={(e) => setBalanceEntity(prev => ({ ...prev, amount: e.value }))}
                />
                <Select
                    options={Object.values(PaymentType).map(type => ({ label: type, value: type }))}
                    onChange={(e) => setBalanceEntity(prev => ({ ...prev, paymentType: e.value }))}
                    value={{ label: balanceEntity.paymentType, value: balanceEntity.paymentType }}
                />
                <Button color="primary" onClick={handleAddBalance}>
                    Add
                </Button>
            </div>
        </Dialog>
    )
}

export default AddBalance