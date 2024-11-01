import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { Label } from 'reactstrap'
import { useAppDispatch } from 'app/config/store'
import { addBalance } from './loyalty-card.reducer'
import { toast } from 'react-toastify'

const AddBalance = ({
    addBalanceDialog,
    setAddBalanceDialog
} : {
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

    const [addBalanceValue, setAddBalanceValue] = useState(0);


    const handleAddBalance = () => {
        dispatch(addBalance({
            entity: addBalanceDialog.entity,
            balance: addBalanceValue
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
                    value={addBalanceValue}
                    onChange={(e) => setAddBalanceValue(e.value)}
                />
                <Button color="primary" onClick={handleAddBalance}>
                    Add
                </Button>
            </div>
        </Dialog>
    )
}

export default AddBalance