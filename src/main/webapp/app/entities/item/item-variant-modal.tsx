import React, {useEffect, useState} from 'react';
import {Button, Col, Form, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from 'reactstrap';
import {Translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import {useAppDispatch, useAppSelector} from 'app/config/store';
import { useForm } from 'react-hook-form';
import { IDiscount } from 'app/shared/model/discount.model';
import Select from 'react-select';
import {uploadImage} from "app/entities/attachment/attachment.reducer";
import {useParams} from "react-router-dom";

interface IVariantProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (name: string, price: number, discount: any, attachments: any) => void;
  onVariantImageUpload: any;
  editingVariantId: any;
  variants: any;
  handleEditExistingVariant: any
}
const ItemVariantModal = (props: IVariantProps) => {
  const dispatch = useAppDispatch();
  const editingVariant = props.editingVariantId
    ? props.variants.find((variant) => variant.id === props.editingVariantId)
    : null;


  const discounts = useAppSelector(state => state.discount.entities);
  console.log(discounts, 'discount1');



  const isNew = props.editingVariantId === null;
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [name, setName] = useState(editingVariant?.name || '');
  const [price, setPrice] = useState(editingVariant?.price || '');

  const [selectedImage, setSelectedImage] = useState(null);
  const [variantImage, setVariantImage] = useState(null)

  const  handleDiscountsChange = selectedOptions => {
    console.log(selectedOptions, 'new discount')
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
      const selectedDiscountObjects = selectedDiscounts?.map((item) => ({
        id: item.id,
        type: item.type,
        value: item.value
      }));
      const attachments = imageInfo ? [imageInfo] : defaultAttachments;
      console.log(imageInfo, 'imageInfo');
      console.log(attachments, 'attachments');

      if (props.editingVariantId === null) {

        props.handleSave(name, parseFloat(price), selectedDiscountObjects, attachments);
        resetForm();
        setSelectedDiscounts([]);
      } else {
        const editedVariant = {


          ...props.variants.find((variant) => variant.id === props.editingVariantId),
          name: name,
          price: price,
          discounts: selectedDiscountObjects,
          attachments: attachments,
        };

        props.handleEditExistingVariant(editedVariant);
      }

      console.log('here3');

      props.handleClose();
      console.log('here4');

    } catch (error) {
      console.error('Error handling variant save:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setSelectedDiscounts([]);
    setSelectedImage(null);
  };


  useEffect(() => {
    if (editingVariant) {
      setName(editingVariant.name || '');
      setPrice(editingVariant.price || '');
      const defaultDiscounts = editingVariant?.discounts?.map(discount => ({
        id: discount.id,
        type: discount.type,
        value: discount.value
      })) || [];

      setSelectedDiscounts(defaultDiscounts);
    }

    return () => {
      resetForm();

    }

  }, [editingVariant]);


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



  const defaultDiscouts = editingVariant?.discounts?.map((discount) =>
    ({label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
      id: discount.id, type: discount.type, value: discount.value})) || []



  const formattedDiscountOptions = discounts?.map((discount) => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  }));

  let defaultAttachments = editingVariant?.attachments
  console.log(editingVariant, 'editingVariant?')
  console.log(isNew, 'isnew?')


  console.log(defaultAttachments, 'defaultAttachments')


  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" autoFocus={false}>
        <ValidatedForm onSubmit={handleVariantSave}>
          <ModalHeader id="variant-title" data-cy="variantTitle" toggle={props.handleClose}>
            <label>Variant</label>
          </ModalHeader>
          <ModalBody>
            <Row>
              <Translate contentKey="tempApp.item.variant.name"></Translate>
              <ValidatedField
                type="text"
                placeholder="enter variant name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <ValidatedField
                type="number"
                placeholder="enter variant price"
                name="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

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

                <Select
                  isMulti={true}
                  defaultValue={defaultDiscouts}
                  onChange={handleDiscountsChange}
                  options={formattedDiscountOptions}
                />
              </div>
            </Row>
            <ModalFooter>
              <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
                <Translate contentKey="entity.action.cancel">Cancel</Translate>
              </Button>{' '}
              <Button color="primary" type="button" onClick={handleVariantSave} data-cy="submit">
                Save Variant
              </Button>
            </ModalFooter>
          </ModalBody>
        </ValidatedForm>
      </Modal>
    </>
  );
};

export default ItemVariantModal;
