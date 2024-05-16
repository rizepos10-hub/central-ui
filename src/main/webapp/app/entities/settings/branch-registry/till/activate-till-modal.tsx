import { Button, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import React, { useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Translate } from 'react-jhipster';
import { useAppDispatch } from 'app/config/store';
import { createEntity } from 'app/entities/settings/branch-registry/till/till.reducer';

type modalProps = {
  toggle: () => void;
  isOpen: boolean;
  registryId: string;
};

const ActivateTillModal = ({ toggle, isOpen, registryId }: modalProps) => {
  const dispatch = useAppDispatch();
  const [openAmount, setOpenAmount] = useState<number | null>(null);


  const handleAmountChange = e => {
    setOpenAmount(() => e.value);
  };

  const handleClose = () => {
    toggle();
    setOpenAmount(null);
  };

  const handleSave = () => {
    const registry = { id: registryId };
    const entity = {
      openAmount,
      registry,
    };

    dispatch(createEntity(entity));
    handleClose();
  };

  return (
    <Modal size="l" isOpen={isOpen} toggle={toggle} backdrop="static">
      <ModalHeader toggle={toggle}>Activate Registry</ModalHeader>
      <FormGroup>
        <ModalBody>
          <div className={'d-flex  gap-3 mt-2'}>
            <strong>
              <Label className={'mt-2'} for="openAmount">
                Open Amount
              </Label>
            </strong>
            <InputNumber value={openAmount} id="openAmount" onChange={handleAmountChange} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={handleClose}>
            <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
          </Button>
          <Button color="primary" onClick={handleSave}>
            Activate Till
          </Button>
        </ModalFooter>
      </FormGroup>
    </Modal>
  );
};

export default ActivateTillModal;
