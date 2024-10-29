import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { translate, Translate } from 'react-jhipster';
import { IStockQuantity } from 'app/shared/model/STOCK/stock-quantity.model';
import { InputNumber } from 'primereact/inputnumber';
import {  } from 'react-jhipster';

interface IMinimumStockLevelProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (stockQuantities: IStockQuantity[]) => void;
  minimumStockLevel: IStockQuantity[] | null;
}

const MinimumStockLevelModal = (props: IMinimumStockLevelProps) => {
  const [updatedStockQuantities, setUpdatedStockQuantities] = useState<IStockQuantity[]>([]);
  useEffect(() => {
    if (props?.minimumStockLevel) {
      setUpdatedStockQuantities(props?.minimumStockLevel);
    }
  }, [props?.minimumStockLevel]);

  // Handle minimum stock level change for each item
  const handleMinimumStockLevelChange = (index, value) => {
    const updatedQuantities = [...updatedStockQuantities];
    updatedQuantities[index] = {
      ...updatedQuantities[index],
      minimumStockLevel: value,
    };
    setUpdatedStockQuantities(updatedQuantities);
  };

  const handleSaveMinimumStockLevel = () => {
    props.handleSave(updatedStockQuantities);
    props.handleClose();
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" size="xl" autoFocus={false}>
        <ModalBody>
          <div className="col md-6">
            <h2>
              <Translate contentKey="items.update.minimumStockLevel.title"></Translate>
            </h2>
            <h4>
              <Translate contentKey="items.update.minimumStockLevel.search"></Translate>
            </h4>
            
            {updatedStockQuantities.map((stock, index) => (
              <div key={stock.id} className="mb-3">
                <p>Location: {stock?.location?.name}</p>

                <InputNumber
                  name="minimumStockLevel"
                  id="minimumStockLevel"
                  required={true}
                  min={0}
                  maxFractionDigits={2}
                  inputClassName={'w-1'}
                  placeholder={translate('items.update.placeholders.minimumStockLevelPlaceHolder')}
                  value={stock?.minimumStockLevel ?? null}
                  onChange={(e) => handleMinimumStockLevelChange(index, e.value)}
                />
              </div>
            ))}

          </div>

          <ModalFooter>
            <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>{' '}
            <Button color="primary" onClick={handleSaveMinimumStockLevel}>
              <Translate contentKey={'items.update.minimumStockLevel.save'}>Save</Translate>
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </>
  );
};

export default MinimumStockLevelModal;
