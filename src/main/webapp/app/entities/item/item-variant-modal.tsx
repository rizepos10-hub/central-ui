import React, { useState } from 'react';
import { Button, Form, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { Translate, ValidatedField } from 'react-jhipster';
import { useAppSelector } from 'app/config/store';
import { useForm } from 'react-hook-form';
import { IDiscount } from 'app/shared/model/discount.model';
import Select from 'react-select';

interface IVariantProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (name: string, price: number, discount: IDiscount) => void;
}
const ItemVariantModal = (props: IVariantProps) => {
  const discounts = useAppSelector(state => state.discount.entities)?.map(discount => ({
    label: discount.type + ' ' + discount.value,
    value: discount.id,
  }));
  console.log(discounts, 'discount');

  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const handleDiscountsChange = selectedOptions => {
    const selectedValues = selectedOptions.map(option => option.value);
    setSelectedDiscounts(selectedValues);
  };
  const variant = ({ name, price, discount }) => {
    props.handleSave(name, price, discount);
  };

  const {
    handleSubmit,
    register,
    formState: { errors, touchedFields },
  } = useForm({ mode: 'onTouched' });

  const handleVariantSave = e => {
    console.log('handle submit');

    selectedDiscounts.map(discount => ({ id: discount }));
    console.log(selectedDiscounts);
    e.discounts = selectedDiscounts;
    console.log(e.discounts);
    handleSubmit(variant)(e);
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" autoFocus={false}>
        <Form onSubmit={handleVariantSave}>
          <ModalHeader id="variant-title" data-cy="variantTitle" toggle={props.handleClose}>
            <label>Variant</label>
          </ModalHeader>
          <ModalBody>
            <Row>
              <Translate contentKey="tempApp.item.variant.name"></Translate>
              <ValidatedField
                name="name"
                placeholder="enter variant name"
                data-cy="name"
                validate={{ required: 'name cannot be empty!' }}
                register={register}
                error={errors.name}
                isTouched={touchedFields.name}
              ></ValidatedField>
              <Translate contentKey="tempApp.item.variant.price"></Translate>
              <ValidatedField
                name="price"
                type="number"
                placeholder="enter variant price"
                data-cy="price"
                validate={{ required: 'price cannot be empty!' }}
                register={register}
                error={errors.price}
                isTouched={touchedFields.price}
              ></ValidatedField>
              {/*<Translate contentKey="tempApp.item.variant.discount"></Translate>*/}
              {/*<ValidatedField*/}
              {/*  name="discount"*/}
              {/*  type="select"*/}
              {/*  data-cy="discount"*/}
              {/*  register={register}*/}
              {/*  error={errors.discount}*/}
              {/*  isTouched={touchedFields.discount}*/}
              {/*>*/}
              {/*  <option value="" key="0" />*/}
              {/*  {discounts*/}
              {/*    ? discounts.map(otherEntity => (*/}
              {/*      <option value={otherEntity.id} key={otherEntity.id}>*/}
              {/*        { otherEntity.type + " " +otherEntity.value}*/}
              {/*      </option>*/}

              {/*    ))*/}
              {/*    : null}*/}
              {/*</ValidatedField>*/}
              <div className="mb-3">
                <Translate contentKey="tempApp.item.variant.discount">Discount</Translate>
                <Select isMulti={true} defaultValue={[]} onChange={handleDiscountsChange} options={discounts} />
              </div>
            </Row>
            <ModalFooter>
              <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
                <Translate contentKey="entity.action.cancel">Cancel</Translate>
              </Button>{' '}
              <Button color="primary" type="submit" data-cy="submit">
                Save Variant
              </Button>
            </ModalFooter>
          </ModalBody>
        </Form>
      </Modal>
    </>
  );
};

export default ItemVariantModal;
