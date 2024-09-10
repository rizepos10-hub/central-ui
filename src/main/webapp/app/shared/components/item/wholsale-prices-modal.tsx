import {Button, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import React, {useEffect, useState} from "react";
import {InputNumber} from "primereact/inputnumber";
import {Translate, ValidatedField} from "react-jhipster";
import {IItemPriceNumber} from "app/shared/model/ITEM/retail/simple-item.model";

type modalProps = {
  toggle: any,
  isOpen: boolean,
  branchWholesalePrices: IItemPriceNumber,
  savePrices: any;
}

const WholesalePrices = ({toggle, isOpen, branchWholesalePrices,savePrices} :modalProps) => {

  const [wholeSalePrices, setWholesalePrices] = useState<IItemPriceNumber | null>(() => ({
    PRICE_1: branchWholesalePrices?.PRICE_1 || null,
    PRICE_2: branchWholesalePrices?.PRICE_2 || null,
    PRICE_3: branchWholesalePrices?.PRICE_3 || null,
    PRICE_4: branchWholesalePrices?.PRICE_4 || null,
    PRICE_5: branchWholesalePrices?.PRICE_5 || null
  }));

  console.log(branchWholesalePrices, 'branchWholesalePrices')

  const handleWholesalePriceChange = (priceKey, value) => {
    setWholesalePrices({
      ...wholeSalePrices,
      [priceKey]: value
    });
  };



  const handleClose = () => {
    toggle();
  }

  const handleSave = () => {
    toggle();
    savePrices(wholeSalePrices);
    setWholesalePrices(null)
  };

  return (
    <Modal size="l" isOpen={isOpen} toggle={toggle} >
      <ModalHeader toggle={toggle}>
        Wholesale Prices
      </ModalHeader>
      <FormGroup>

        <ModalBody>
          <div className={"d-flex flex-column gap-1"}>
          {Object.keys(wholeSalePrices).map((priceKey, index) => (
            <>
              <label className="font-semibold">{priceKey}</label>
              <InputNumber
                key={index}
                placeholder={`Enter price ${index + 1}`}
                name={`wholesale_price_${index + 1}`}
                min={0}
                maxFractionDigits={2}
                value={wholeSalePrices[priceKey] || null}
                onChange={(e) => handleWholesalePriceChange(priceKey, e.value)}

              />
            </>
          ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={handleClose}>
            <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
          </Button>
          <Button color="primary" onClick={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </FormGroup>

    </Modal>
  )
}

export default WholesalePrices
