import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Col,
  DropdownToggle,
  Form,
  FormGroup,
  FormText,
  Label,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { translate, Translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { useForm } from 'react-hook-form';
import { IDiscount } from 'app/shared/model/discount.model';
import Select from 'react-select';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { getItemsForRecipe, getEntities } from './item.reducer';
import { InputText } from 'primereact/inputtext';

interface IVariantProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (name: string, price: number, discount: any, attachments: any, branchPrices: any, ingredients: any) => void;
  onVariantImageUpload: any;
  editingVariantId: any;
  variants: any;
  handleEditExistingVariant: any;
  addonsOptions: any;
  itemId: string;
}

const ItemVariantModal = (props: IVariantProps) => {
  const dispatch = useAppDispatch();
  const editingVariant = props.editingVariantId ? props.variants.find(variant => variant.id === props.editingVariantId) : null;

  const defaultAttachments = editingVariant?.attachments;

  const discounts = useAppSelector(state => state.discount.entities);
  console.log(discounts, 'discount1');

  const branchList = useAppSelector(state => state.branch.entities);

  const itemList = useAppSelector(state => state.item.entities);

  console.log(itemList, 'itemlo');

  const [branchPrices, setBranchPrices] = useState({});
  const [selectedItemVariants, setSelectedItemVariants] = useState([]);
  const [selectedItemWithVariants, setSelectedItemWithVariants] = useState(null);

  const [selectedVariants, setSelectedVariants] = useState({});

  const isNew = props.editingVariantId === null;

  const itemId = props.itemId;
  const variantId = props.editingVariantId;

  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [name, setName] = useState(editingVariant?.name || '');
  const [price, setPrice] = useState(editingVariant?.price || '');
  const [selectedVariantAddons, setSelectedVariantAddons] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [variantImage, setVariantImage] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const [selectedItemsForRecipe, setSelectedItemsForRecipe] = useState([]);

  const [variantItems, setVariantItems] = useState([]);

  const [recipeDetails, setRecipeDetails] = useState({});

  const [ingredients, setIngredients] = useState([]);

  const [attachments, setAttachments] = useState([]);

  const handleDiscountsChange = selectedOptions => {
    console.log(selectedOptions, 'new discount');
    const selectedValues = selectedOptions.map(option => ({
      id: option.id,
      type: option.type,
      value: option.value,
    }));

    setSelectedDiscounts(selectedValues);
  };
  const handleVariantSelection = (itemId, variant, isSelected) => {
    setSelectedVariants(prevVariants => {
      const updatedVariants = { ...prevVariants };
      if (isSelected) {
        updatedVariants[itemId] = [...(updatedVariants[itemId] || []), variant];
      } else {
        updatedVariants[itemId] = (updatedVariants[itemId] || []).filter(v => v.id !== variant.id);
      }
      return updatedVariants;
    });

    if (isSelected) {
      setSelectedItems(prevItems => {
        if (!prevItems.some(selectedItem => selectedItem.id === itemId)) {
          return [...prevItems, itemList.find(item => item.id === itemId)];
        }
        return prevItems;
      });
    } else {
      if (!selectedVariants[itemId] || selectedVariants[itemId].length === 0) {
        setSelectedItems(prevItems => prevItems.filter(item => item.id !== itemId));
      }
    }
  };
  const handleQuantityChange = (itemId, quantity) => {
    setRecipeDetails(prevDetails => ({
      ...prevDetails,
      [itemId]: {
        ...prevDetails[itemId],
        quantity: parseInt(quantity) || 0,
      },
    }));

    setIngredients(prevIngredients => {
      return prevIngredients.map(ingredient => {
        if (ingredient.item.id === itemId) {
          return {
            ...ingredient,
            amount: parseInt(quantity) || 0,
          };
        }
        return ingredient;
      });
    });
  };

  console.log(recipeDetails, 'recipeDetails');

  // const handleAddonChange = (itemId, selectedAddons) => {
  //   setRecipeDetails((prevDetails) => ({
  //     ...prevDetails,
  //     [itemId]: {
  //       ...prevDetails[itemId],
  //       selectedAddons: selectedAddons,
  //     },
  //   }));
  // };

  const handleRecipeAddItem = () => {
    if (selectedItems.length > 0) {
      setSelectedItemsForRecipe(prevItems => [...prevItems, ...selectedItems]);
    }
    setModalOpen(false);
    setSelectedItems([]);
  };
  const allItemsPresent = () => {
    return false;
    // return editingVariant.every((item) => variantItems.some((menuItem) => menuItem.id === item.id && menuItem.id !== null));
  };

  const groupedMenuItems = itemList.reduce((groups, item) => {
    const termName = item.terms[0]?.name || 'Uncategorized';
    if (!groups[termName]) {
      groups[termName] = [];
    }
    groups[termName].push(item);
    return groups;
  }, {});

  const variant = ({ name, price }) => {
    const selectedDiscountObjects = selectedDiscounts.map(item => ({
      id: item.id,
      type: item.type,
      value: item.value,
    }));
    console.log(variantImage, 'variantImage');

    props.handleSave(name, parseFloat(price), selectedDiscountObjects, variantImage, branchPrices, ingredients);
  };

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, touchedFields },
  } = useForm({ mode: 'onTouched' });
  console.log(ingredients, 'ingredients');
  const handleVariantSave = async () => {
    if (!name || !price) {
      return;
    }
    try {
      const selectedDiscountObjects = selectedDiscounts?.map(item => ({
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
      const updatedData = ingredients.map(itemData => {
        const quantity = recipeDetails[itemData.itemId]?.quantity || 0;
        const addons = recipeDetails[itemData.itemId]?.selectedAddons || [];

        return {
          ...itemData,
          quantity,
          addons,
        };
      });
      setIngredients(updatedData);
      console.log(attachmentsToSend, 'attachmentsToSend');
      const formattedBranchPrices = {};
      Object.keys(branchPrices).forEach(branchId => {
        formattedBranchPrices[branchId] = { price: parseFloat(branchPrices[branchId]) };
      });
      console.log(formattedBranchPrices, 'formattedBranchPrices');

      if (props.editingVariantId === null) {
        console.log(ingredients, 'ingredients');
        props.handleSave(name, parseFloat(price), selectedDiscountObjects, attachmentsToSend, formattedBranchPrices, ingredients);
        resetForm();
        setSelectedDiscounts([]);
      } else {
        const editedVariant = {
          ...props.variants.find(variant => variant.id === props.editingVariantId),
          name: name,
          price: price,
          discounts: selectedDiscountObjects,
          attachments: attachmentsToSend,
          branchVariantDetails: formattedBranchPrices,
          ingredients,
        };
        props.handleEditExistingVariant(editedVariant);
      }

      props.handleClose();
    } catch (error) {
      console.error('Error handling variant save:', error);
    }
  };

  const handleAddonChange = selectedAddon => {
    setSelectedVariantAddons(selectedAddon.map(addon => ({ id: addon.value })));
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setSelectedDiscounts([]);
    setSelectedImage(null);
    setBranchPrices({});
    setAttachments([]);
  };

  const handleAddItem = () => {
    if (selectedItems.length > 0) {
      const newIngredientsData = selectedItems.map(selectedItem => {
        const selectedVariant =
          selectedVariants[selectedItem.id] && selectedVariants[selectedItem.id].length > 0 ? selectedVariants[selectedItem.id][0] : null;

        // Create the base ingredient object
        const ingredient = {
          item: {
            id: selectedItem.id,
          },
          variantId: selectedVariant ? selectedVariant.id : null,
          amount: 0,
          addons: [],
        };

        return ingredient;
      });

      setIngredients(prevData => [...prevData, ...newIngredientsData]);
      setSelectedItems([]); // Clear selected items after adding them to state
      setVariantItems(prevItems => [...prevItems, ...selectedItems]);
    }
    setModalOpen(false);
  };

  const toggleModal = () => {
    setModalOpen(!isModalOpen);
    setActiveTerm(null);
  };

  useEffect(() => {
    if (editingVariant) {
      console.log(editingVariant, 'editingVariant');
      setName(editingVariant.name || '');
      setPrice(editingVariant.price || '');

      console.log(editingVariant.ingredients, 'ba');
      setSelectedVariantAddons(editingVariant.addons);

      const formattedBranchPrices = {};
      if (editingVariant.branchVariantDetails) {
        Object.keys(editingVariant.branchVariantDetails).forEach(branchId => {
          formattedBranchPrices[branchId] = editingVariant.branchVariantDetails[branchId].price;
        });
      }
      setBranchPrices(formattedBranchPrices);

      const defaultDiscounts =
        editingVariant?.discounts?.map(discount => ({
          id: discount.id,
          type: discount.type,
          value: discount.value,
        })) || [];

      setAttachments(defaultAttachments);
      setSelectedDiscounts(defaultDiscounts);
    }

    return () => {
      resetForm();
    };
  }, [editingVariant, selectedItemsForRecipe]);

  useEffect(() => {
    dispatch(getItemsForRecipe({ itemId, variantId }));
    dispatch(getBranches({}));
  }, [props.editingVariantId]);

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

  const handleItemClick = item => {
    setSelectedItemWithVariants(item);
  };

  const handleFileChange = event => {
    setSelectedImage(event.target.files[0]);
  };

  const removeAttachment = attachmentId => {
    setAttachments(prevAttachments => prevAttachments.filter(attachment => attachment && attachment.id !== attachmentId));
  };

  const defaultDiscouts =
    editingVariant?.discounts?.map(discount => ({
      label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
      id: discount.id,
      type: discount.type,
      value: discount.value,
    })) || [];

  const formattedDiscountOptions = discounts?.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value,
  }));
  const AddonDropdown = ({ addons, selectedAddons, onAddAddon, onIncrement, onDecrement }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    console.log(selectedAddons, 'selectedAddons');
    const filteredAddons = addons?.filter(addon => !selectedAddons.some(selectedAddon => selectedAddon.id === addon.id));
    const toggle = () => setDropdownOpen(!dropdownOpen);
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle caret>Add Addons</DropdownToggle>
        <DropdownMenu>
          {filteredAddons?.map(addon => (
            <DropdownItem key={addon.id} onClick={() => onAddAddon(addon)}>
              {addon.name}
            </DropdownItem>
          ))}
        </DropdownMenu>
        <div>
          {selectedAddons.map(selectedAddon => (
            <div key={selectedAddon.id} className="mt-2">
              <span style={{ width: '130px', display: 'inline-block' }}>{selectedAddon.name}:</span>
              <Button
                className="decrement-button"
                onClick={() => onDecrement(selectedAddon)}
                style={{ display: 'inline-block', marginRight: '10px' }}
              >
                -
              </Button>
              <span className="p-3" style={{ display: 'inline-block' }}>
                {selectedAddon.amount || 0}
              </span>
              <Button
                className="increment-button"
                onClick={() => onIncrement(selectedAddon)}
                style={{ display: 'inline-block', marginLeft: '10px' }}
              >
                +
              </Button>
            </div>
          ))}
        </div>
      </Dropdown>
    );
  };
  const handleAddAddon = (itemId, addon) => {
    setRecipeDetails(prevDetails => ({
      ...prevDetails,
      [itemId]: {
        ...prevDetails[itemId],
        selectedAddons: [...(prevDetails[itemId]?.selectedAddons || []), { id: addon.id, name: addon.name, amount: 0 }],
      },
    }));
  };
  const handleAddonAmountChange = (itemId, addonId, action) => {
    setRecipeDetails(prevDetails => {
      const updatedSelectedAddons = [...(prevDetails[itemId]?.selectedAddons || [])];
      const addonIndex = updatedSelectedAddons.findIndex(addon => addon.id === addonId);

      if (addonIndex !== -1) {
        if (action === 'increment') {
          updatedSelectedAddons[addonIndex].amount++;
        } else if (action === 'decrement') {
          updatedSelectedAddons[addonIndex].amount = Math.max(0, updatedSelectedAddons[addonIndex].amount - 1);
        }

        // Update the ingredients state with the updated addons and their amounts
        setIngredients(prevIngredients => {
          return prevIngredients.map(ingredient => {
            if (ingredient.item.id === itemId) {
              const updatedAddons = ingredient.addons || [];
              const existingAddonIndex = updatedAddons.findIndex(addon => addon.addon.id === addonId);

              if (existingAddonIndex !== -1) {
                // If the addon already exists, update its amount
                updatedAddons[existingAddonIndex].amount = updatedSelectedAddons[addonIndex].amount;
              } else {
                // If the addon doesn't exist, add it with the updated amount
                updatedAddons.push({
                  addon: {
                    id: addonId,
                  },
                  amount: updatedSelectedAddons[addonIndex].amount,
                });
              }

              return {
                ...ingredient,
                addons: updatedAddons,
              };
            }
            return ingredient;
          });
        });
      }

      return {
        ...prevDetails,
        [itemId]: {
          ...prevDetails[itemId],
          selectedAddons: updatedSelectedAddons,
        },
      };
    });
  };

  useEffect(() => {
    // Declare an empty object for selectedVariants outside of the map function
    const selectedVariants = {};

    const mappedData = editingVariant?.ingredients?.map(itemData => {
      const { item, variantId, amount, addons } = itemData;
      const id = item.id;

      const name = item.name;
      const itemVariants = item.variants || [];

      // Populate selectedVariants based on id
      selectedVariants[id] = selectedVariants[id] || [];

      // Create a structure that matches your original structure
      const quantity = recipeDetails[id]?.quantity || 0;
      const selectedAddons = recipeDetails[id]?.selectedAddons || [];

      return {
        id,
        name,
        itemVariants,
        variantId,
        selectedVariants: selectedVariants[id],
        quantity,
        selectedAddons,
      };
    });

    setVariantItems(mappedData ? mappedData : []);
  }, []);

  console.log(variantItems, 'helloss');

  console.log(editingVariant, 'editingVariant?');
  console.log(isNew, 'isnew?');

  console.log(defaultAttachments, 'defaultAttachments');

  const handleBranchPriceChange = (branchId, price) => {
    setBranchPrices(prevPrices => ({
      ...prevPrices,
      [branchId]: price,
    }));
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" size="xl" autoFocus={false}>
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
                onChange={e => setName(e.target.value)}
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
                {attachments?.map(
                  attachment =>
                    attachment && (
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
                    )
                )}
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
                <Translate contentKey="tempApp.item.addons"></Translate>
                <Select isMulti={true} defaultValue={selectedVariantAddons} onChange={handleAddonChange} options={props.addonsOptions} />
              </div>

              <div className="mb-3">
                <Translate contentKey="tempApp.item.variant.discount">Discount</Translate>

                <Select isMulti={true} defaultValue={defaultDiscouts} onChange={handleDiscountsChange} options={formattedDiscountOptions} />
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
                    onChange={e => setPrice(e.target.value)}
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
                    {branchList.map(branch => (
                      <tr key={branch.id}>
                        <td>{branch.name}</td>
                        <td>
                          <ValidatedField
                            type="number"
                            name={`branchPrice_${branch.id}`}
                            placeholder={`Enter price for ${branch.name}`}
                            value={branchPrices[branch.id] || ''}
                            onChange={e => handleBranchPriceChange(branch.id, e.target.value)}
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
              <FormGroup>
                <h3>Recipe</h3>
                <div className="d-flex justify-content-end mr-4">
                  <Button color="primary" onClick={toggleModal} disabled={allItemsPresent()}>
                    Add Item
                  </Button>
                </div>
                <Table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Item Variants</th>
                      <th>Quantity</th>
                      <th>Addons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantItems?.map(selectedItem => (
                      <tr key={selectedItem.id}>
                        <td>{selectedItem.name}</td>
                        <td>
                          {selectedVariants[selectedItem.id] && selectedVariants[selectedItem.id].length > 0 ? (
                            <ul>
                              {selectedVariants[selectedItem.id].map(variant => (
                                <li key={variant.id}>{variant.name}</li>
                              ))}
                            </ul>
                          ) : (
                            'No variants selected'
                          )}
                        </td>
                        <td>
                          <InputText
                            type="number"
                            name={`quantity_${selectedItem.id}`}
                            placeholder={`Enter quantity for ${selectedItem.name}`}
                            value={recipeDetails[selectedItem.id]?.quantity || ''}
                            onChange={e => handleQuantityChange(selectedItem.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <div className="addon-select-wrapper">
                            <AddonDropdown
                              addons={selectedItem.addons}
                              selectedAddons={recipeDetails[selectedItem.id]?.selectedAddons || []}
                              onAddAddon={addon => handleAddAddon(selectedItem.id, { id: addon.id, name: addon.name })}
                              onIncrement={selectedAddon => handleAddonAmountChange(selectedItem.id, selectedAddon.id, 'increment')}
                              onDecrement={selectedAddon => handleAddonAmountChange(selectedItem.id, selectedAddon.id, 'decrement')}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </FormGroup>
            </Row>

            <Modal isOpen={isModalOpen} toggle={toggleModal} className="modal- modal-lg">
              <ModalHeader toggle={toggleModal}>Add New Item</ModalHeader>
              <ModalBody>
                <Row>
                  <Col md="3">
                    <ListGroup>
                      {Object.keys(groupedMenuItems).map(termName => (
                        <ListGroupItem
                          key={termName}
                          tag="button"
                          action
                          onClick={() => setActiveTerm(termName)}
                          active={termName === activeTerm}
                        >
                          {termName}
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  </Col>
                  <Col md="9">
                    {activeTerm ? (
                      <>
                        <h3>{activeTerm}</h3>
                        <Row className="justify-content-center mt-4">
                          {groupedMenuItems[activeTerm].map(item => (
                            <Col key={item.id} sm="6" md="4" lg="4" className="mb-4">
                              <div
                                style={{
                                  cursor: 'pointer',
                                  border: selectedItems?.some(selectedItem => selectedItem.id === item.id)
                                    ? '2px solid #007bff'
                                    : '2px solid #dee2e6',
                                }}
                                onClick={() => {
                                  if (selectedItems?.some(selectedItem => selectedItem.id === item.id)) {
                                    setSelectedItems(prevItems => prevItems?.filter(i => i.id !== item.id));
                                    setSelectedVariants(prevVariants => ({ ...prevVariants, [item.id]: [] }));
                                  } else {
                                    setSelectedItems(prevItems => [...prevItems, item]);
                                  }
                                }}
                                className={`${selectedItems?.some(selectedItem => selectedItem.id === item.id) ? 'border-primary' : ''}`}
                              >
                                <Card
                                  style={{
                                    background: `url(${item.attachments[0].url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }}
                                  className={`border-4 shadow-sm h-100`}
                                >
                                  <CardBody>
                                    <div
                                      className="overlay"
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      onClick={() => handleItemClick(item)}
                                    >
                                      <h5 style={{ color: '#fff' }}>{item.name}</h5>
                                    </div>
                                  </CardBody>
                                </Card>
                              </div>
                              <div className="mt-2">
                                <h6>Variants:</h6>
                                {item.variants.map(variant => (
                                  <div key={variant.id} className="form-check">
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      id={`variant-${variant.id}`}
                                      name={`variant-${item.id}`} // Use the same name for all variant radios within the same item
                                      checked={selectedVariants[item.id]?.some(v => v.id === variant.id)}
                                      onChange={e => handleVariantSelection(item.id, variant, e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor={`variant-${variant.id}`}>
                                      {variant.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </>
                    ) : (
                      <p>Please select a term to view its items.</p>
                    )}
                  </Col>
                </Row>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={toggleModal}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleAddItem}>
                  Add Item
                </Button>
              </ModalFooter>
            </Modal>
            <ModalFooter>
              <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
                <Translate contentKey="entity.action.cancel">Cancel</Translate>
              </Button>{' '}
              <Button color="primary" type="submit" data-cy="submit">
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
