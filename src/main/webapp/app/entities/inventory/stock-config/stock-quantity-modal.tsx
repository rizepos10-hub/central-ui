import {Button, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import React, {useState} from "react";
import {InputTextarea} from "primereact/inputtextarea";
import {IStockQuantity} from "app/shared/model/STOCK/stock-quantity.model";
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";
import { translate, Translate } from "react-jhipster";
import {partialUpdateEntity} from "app/entities/inventory/stock-config/stock-quantity.reducer";
import {useAppDispatch} from "app/config/store";

type modalProps = {
  toggle: any,
  isOpen: boolean,
  stockQuantity: IStockQuantity
}

const StockQuantityModal = ({toggle, isOpen, stockQuantity} :modalProps) => {
  const dispatch = useAppDispatch();

  const [modifiedStockQuantity, setModifiedStockQuantity] = useState<number>(0);

  const handleQuantityChange = (e) => {
    setModifiedStockQuantity(() => e.value)
  };

  const handleClose = () => {
    toggle();
    setModifiedStockQuantity(0)

  }

  const handleSave = () => {
    const entity = {
      ...stockQuantity,
      quantity: modifiedStockQuantity
    }
    dispatch(partialUpdateEntity(entity));
    toggle();
    setModifiedStockQuantity(0);
  };

  return (
    <Modal size="l" isOpen={isOpen} toggle={toggle}  backdrop="static">
      <ModalHeader toggle={toggle}>
        Quantity Config
      </ModalHeader>
      <FormGroup>

      <ModalBody>

          {/* <div className={"d-flex flex-column mt-2 "}> */}
          {/*   <strong> */}
          {/*     <Label for="item">Item</Label> */}
          {/*   </strong> */}
          {/*   <p id="item"> */}
          {/*     {stockQuantity?.itemName} */}
          {/*   </p> */}
          {/* </div> */}

          <div className={"d-flex flex-column mt-2 "}>
            <strong>
              <Label for="location">
                {translate("common.location")}
              </Label>
            </strong>
            <p id="location">
              {stockQuantity?.location?.name}
            </p>
          </div>

          <div className={"d-flex flex-column mt-2"}>
            <strong>
              <Label for="quantity">
                {translate("common.quantity")}
              </Label>
            </strong>
            <p id="Quantity">
              {stockQuantity?.quantity + modifiedStockQuantity}
            </p>

          </div>
        <div className={"d-flex gap-3 mt-2"}>
          <strong>
            <Label for="adjusted">
              {translate("tempApp.stockConfig.adjustedQuantity")}
            </Label>
          </strong>
        <InputNumber
          value={modifiedStockQuantity}
          id="adjusted"
          onChange={handleQuantityChange}
          showButtons buttonLayout="horizontal" style={{ width: '4rem' }} size={1}
          decrementButtonClassName="p-button-secondary" incrementButtonClassName="p-button-secondary"
          incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
        />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
        </Button>
        <Button color="primary" onClick={handleSave}>
          <Translate contentKey={'entity.action.save'}>Save</Translate>
        </Button>
      </ModalFooter>
      </FormGroup>

    </Modal>
  )
}

export default StockQuantityModal
