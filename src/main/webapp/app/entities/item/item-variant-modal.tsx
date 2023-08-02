import React, {useEffect, useState} from 'react';
import {Button, Col, Form, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from 'reactstrap';
import { Translate, ValidatedField } from 'react-jhipster';
import {useAppDispatch, useAppSelector} from 'app/config/store';
import { useForm } from 'react-hook-form';
import { IDiscount } from 'app/shared/model/discount.model';
import Select from 'react-select';
import {uploadImage} from "app/entities/attachment/attachment.reducer";

interface IVariantProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (name: string, price: number, discount: any, attachments: any) => void;
  onVariantImageUpload: any;
}
const ItemVariantModal = (props: IVariantProps) => {
  const dispatch = useAppDispatch();

  const discounts = useAppSelector(state => state.discount.entities);
  console.log(discounts, 'discount1');

  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [variantImage, setVariantImage] = useState(null)

  const  handleDiscountsChange = selectedOptions => {
    console.log(selectedOptions, 'news')
    const selectedValues = selectedOptions.map((option) => ({
      id: option.id,
      type: option.type,
      value: option.value
    }));

    setSelectedDiscounts(selectedValues);
  };
  const variant = ({ name, price }) => {
    const selectedDiscountObjects = selectedDiscounts.map((item) => ({ id: item.id, type: item.type, value: item.value}));
    console.log(variantImage, 'variantImage');
    props.handleSave(name, parseFloat(price), selectedDiscountObjects, variantImage);
  };

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, touchedFields },
  } = useForm({ mode: 'onTouched' });

  const handleVariantSave = async (formData) => {
    console.log('here1');

    try {
      console.log('here2');
      const imageInfo = await handleImageUpload();
      const selectedDiscountObjects = selectedDiscounts.map((item) => ({
        id: item.id,
        type: item.type,
        value: item.value
      }));
      const attachments = imageInfo ? [imageInfo] : [];
      console.log(imageInfo, 'imageInfo');
      console.log(attachments, 'attachments');
      props.handleSave(formData.name, parseFloat(formData.price), selectedDiscountObjects, attachments);
      console.log('here3');
      reset({ name: '', price: '' });
      props.handleClose();
      console.log('here4');

    } catch (error) {
      console.error('Error handling variant save:', error);
    }
  };


  useEffect(() => {

    console.log(variantImage, 'vrrr');
  }, [variantImage]);


  const handleImageUpload = async () => {
    if (!selectedImage) {
      console.error('No image selected.');
      return null;
    }
    const formData = new FormData();
    formData.append('file', selectedImage);
    try {
      const response: any = await dispatch(uploadImage(formData));
      const imageUrl = response?.payload?.url;
      const imageInfo = {
        id: response?.payload?.id,
        name: response?.payload?.name,
        path: response?.payload?.path,
        size: response?.payload?.size,
        type: response?.payload?.type,
        createdAt: response?.payload?.createdAt,
        updatedAt: response?.payload?.updatedAt,
        url: imageUrl,
      };
      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };


  const handleFileChange = (event) => {
    setSelectedImage(event.target.files[0]);
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" autoFocus={false}>
        <Form onSubmit={handleSubmit(handleVariantSave)}>
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
              <Row className="flex flex-column">
                <Col xs="12" sm="6" className="mb-3">
                  <div className="custom-file">
                    <label htmlFor="image" className="custom-file-upload">
                      Choose Image
                    </label>
                    <input type="file" name="image" id="image" onChange={handleFileChange} />

                  </div>
                </Col>
              </Row>
              <div className="mb-3">
                <Translate contentKey="tempApp.item.variant.discount">Discount</Translate>
                <Select isMulti={true} defaultValue={[]} onChange={handleDiscountsChange}
            options={discounts.map((discount) => ({label: `${discount.type} ${discount.value}`, id: discount.id, type: discount.type, value: discount.value  }) )} />
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
