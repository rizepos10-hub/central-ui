import React, {useEffect, useState} from 'react';
import {
  Button,
  Col,
  Form,
  FormGroup,
  FormText,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row, Table
} from 'reactstrap';
import {translate, Translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import {useAppDispatch, useAppSelector} from 'app/config/store';
import { useForm } from 'react-hook-form';
import { IDiscount } from 'app/shared/model/discount.model';
import Select from 'react-select';
import {uploadImage} from "app/entities/attachment/attachment.reducer";
import {useParams} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrashAlt} from "@fortawesome/free-solid-svg-icons";
import { getEntities as getBranches } from '../branch/branch.reducer';
import {  getEntities as getItems } from './item.reducer';

interface IVariantProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (name: string, price: number, discount: any, attachments: any, branchPrices: any) => void;
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

  const defaultAttachments = editingVariant?.attachments

  const discounts = useAppSelector(state => state.discount.entities);
  console.log(discounts, 'discount1');

  const branchList = useAppSelector(state => state.branch.entities);

  const itemList = useAppSelector(state => state.item.entities);



  const [branchPrices, setBranchPrices] = useState({});

  const isNew = props.editingVariantId === null;
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [name, setName] = useState(editingVariant?.name || '');
  const [price, setPrice] = useState(editingVariant?.price || '');

  const [selectedImage, setSelectedImage] = useState(null);
  const [variantImage, setVariantImage] = useState(null)

  const [attachments, setAttachments] = useState([]);
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

    props.handleSave(name, parseFloat(price), selectedDiscountObjects, variantImage, branchPrices);
  };


  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, touchedFields },
  } = useForm({ mode: 'onTouched' });

  const handleVariantSave = async () => {
    if(!name || !price){
      return
    }
    try {
      const selectedDiscountObjects = selectedDiscounts?.map((item) => ({
        id: item.id,
        type: item.type,
        value: item.value,
      }));

      let attachmentsToSend = [];

      if (selectedImage) {
        const imageInfo = await handleImageUpload();
        attachmentsToSend.push(imageInfo);
      }

      if (attachments.length > 0) {
        attachmentsToSend = attachmentsToSend.concat(attachments);
      }
      console.log(attachmentsToSend, 'attachmentsToSend')
      const formattedBranchPrices = {};
      Object.keys(branchPrices).forEach(branchId => {
        formattedBranchPrices[branchId] = { price: parseFloat(branchPrices[branchId]) };
      });
      console.log(formattedBranchPrices, 'formattedBranchPrices')

      if (props.editingVariantId === null) {
        props.handleSave(name, parseFloat(price), selectedDiscountObjects, attachmentsToSend, formattedBranchPrices);
        resetForm();
        setSelectedDiscounts([]);
      } else {
        const editedVariant = {
          ...props.variants.find((variant) => variant.id === props.editingVariantId),
          name: name,
          price: price,
          discounts: selectedDiscountObjects,
          attachments: attachmentsToSend,
          branchVariantDetails: formattedBranchPrices
        };
        props.handleEditExistingVariant(editedVariant);
      }

      props.handleClose();
    } catch (error) {
      console.error('Error handling variant save:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setSelectedDiscounts([]);
    setSelectedImage(null);
    setBranchPrices({})
    setAttachments([])
  };


  useEffect(() => {
    if (editingVariant) {
      console.log(editingVariant, 'editingVariant')
      setName(editingVariant.name || '');
      setPrice(editingVariant.price || '');

      const formattedBranchPrices = {};
      if (editingVariant.branchVariantDetails) {
        Object.keys(editingVariant.branchVariantDetails).forEach((branchId) => {
          formattedBranchPrices[branchId] = editingVariant.branchVariantDetails[branchId].price;
        });
      }
      setBranchPrices(formattedBranchPrices);

      const defaultDiscounts = editingVariant?.discounts?.map(discount => ({
        id: discount.id,
        type: discount.type,
        value: discount.value
      })) || [];

      setAttachments(defaultAttachments)
      setSelectedDiscounts(defaultDiscounts);
    }


    return () => {
      resetForm();

    }

  }, [editingVariant]);


  useEffect(() => {

    dispatch(getBranches({}))
    dispatch(getItems({}))

  }, [])

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

  const removeAttachment = (attachmentId) => {
    setAttachments((prevAttachments) =>
      prevAttachments.filter((attachment) => attachment && attachment.id !== attachmentId)
    );
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

  console.log(editingVariant, 'editingVariant?')
  console.log(isNew, 'isnew?')


  console.log(defaultAttachments, 'defaultAttachments')

  const handleBranchPriceChange = (branchId, price) => {
    setBranchPrices((prevPrices) => ({
      ...prevPrices,
      [branchId]: price,
    }));
  };

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
                required
                onChange={(e) => setName(e.target.value)}
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
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
                {attachments?.map((attachment) => attachment && (
                  <div key={attachment.id} style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
                    {/* ... (attachment rendering code) */}
                    <img
                      src={attachment.url}
                      alt="Selected Image"
                      className="img-fluid m-lg-1"
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '50%',
                        padding: '2px',
                        cursor: 'pointer',
                      }}
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </div>
                  </div>
                ))}
                {selectedImage && (
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected Image"
                    className="img-fluid m-lg-1"
                    style={{
                      maxWidth: '100px',
                      maxHeight: '100px',
                    }}
                  />
                )}
              </div>
              <div className="mb-3">
                <Translate contentKey="tempApp.item.variant.discount">Discount</Translate>

                <Select
                  isMulti={true}
                  defaultValue={defaultDiscouts}
                  onChange={handleDiscountsChange}
                  options={formattedDiscountOptions}
                />
              </div>
              <FormGroup>
                <h4>Prices</h4>
                <div>
                  <label className="font-semibold">Original Price</label>
                  <ValidatedField
                    type="number"
                    placeholder="enter variant price"
                    name="price"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    validate={{
                      required: { value: true, message: translate('entity.validation.required') },
                    }}
                  />
                  {/* <FormText color="danger">{'originalPriceError'}</FormText> */}
                </div>
                <Table>
                  <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Price</th>
                  </tr>
                  </thead>
                  <tbody>
                  {branchList.map((branch) => (
                    <tr key={branch.id}>
                      <td>{branch.name}</td>
                      <td>
                        <ValidatedField
                          type="number"
                          name={`branchPrice_${branch.id}`}
                          placeholder={`Enter price for ${branch.name}`}
                          value={branchPrices[branch.id] || ''}
                          onChange={(e) => handleBranchPriceChange(branch.id, e.target.value)}
                          validate={{
                            required: { value: true, message: translate('entity.validation.required') },
                          }}
                        />
                        <FormText color="danger">{errors[`branchPrice_${branch.id}`]?.message}</FormText>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </Table>
              </FormGroup>


            </Row>
            <ModalFooter>
              <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
                <Translate contentKey="entity.action.cancel">Cancel</Translate>
              </Button>{' '}
              <Button color="primary" type="submit"  data-cy="submit">
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
