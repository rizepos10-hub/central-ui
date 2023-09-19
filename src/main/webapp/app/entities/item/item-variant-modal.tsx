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
  handleSave: (name: string, price: number, discount: any, attachments: any, branchPrices: any, ingredients: any , selectedVariantAddons: any) => void;
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

  const [itemNameMap, setItemNameMap] = useState({});

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
        if (!prevItems.some(selectedItem => selectedItem?.id === itemId)) {
          return [...prevItems, itemList.find(item => item?.id === itemId)];
        }
        return prevItems;
      });
    } else {
      if (!selectedVariants[itemId] || selectedVariants[itemId].length === 0) {
        setSelectedItems(prevItems => prevItems.filter(item => item?.id !== itemId));
      }
    }
  };
  const handleQuantityChange = (itemId, variantId, quantity) => {
    const parsedQuantity = parseFloat(quantity);

    setRecipeDetails((prevDetails) => ({
      ...prevDetails,
      [itemId]: {
        ...prevDetails[itemId],
        variantQuantities: {
          ...(prevDetails[itemId]?.variantQuantities || {}),
          [variantId]: parsedQuantity,
        },
      },
    }));

    setIngredients((prevIngredients) => {
      return prevIngredients.map((ingredient) => {
        if (ingredient.item?.id === itemId && ingredient.variantId === variantId) {
          return {
            ...ingredient,
            amount: parsedQuantity,
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

    props.handleSave(name, parseFloat(price), selectedDiscountObjects,selectedVariantAddons, variantImage, branchPrices, ingredients);
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
      })) || [];

      // Prepare attachments to send
      let attachmentsToSend = [];
      if (selectedImage) {
        const imageInfo = await handleImageUpload();
        attachmentsToSend.push(imageInfo);
      }
      if (attachments.length > 0) {
        attachmentsToSend = attachmentsToSend.concat(attachments);
      }

      const formattedIngredients = ingredients.map((ingredient) => {
        // Filter out addons with an amount of 0
        const filteredAddons = ingredient.addons.filter((addon) => addon.amount > 0);

        return {
          item: { id: ingredient.item.id },
          variant: {id: ingredient.variantId},
          amount: ingredient.amount,
          addons: filteredAddons.map((addon) => ({
            addon: { id: addon.addon.id },
            amount: addon.amount,
          })),
        };
      });

      console.log(formattedIngredients, 'formattedIngredients')

      const formattedBranchPrices = {};
      Object.keys(branchPrices).forEach(branchId => {
        formattedBranchPrices[branchId] = { price: parseFloat(branchPrices[branchId]) };
      });

      const editedVariant = {
        name,
        price: parseFloat(price),
        discounts: selectedDiscountObjects,
        attachments: attachmentsToSend,
        addons: selectedVariantAddons,
        branchVariantDetails: formattedBranchPrices,
        ingredients: formattedIngredients,
      };

      console.log(formattedBranchPrices, 'formattedBranchPrices')

      // If editing an existing variant, update it
      if (props.editingVariantId !== null) {
        const existingVariant = props.variants.find(variant => variant.id === props.editingVariantId);
        const updatedVariant = { ...existingVariant, ...editedVariant };
        props.handleEditExistingVariant(updatedVariant);
      } else {

       props.handleSave(name, parseFloat(price), selectedDiscountObjects, selectedVariantAddons, attachmentsToSend, formattedBranchPrices, formattedIngredients);
        resetForm();
        setSelectedDiscounts([]);
      }

      // Close the modal
      props.handleClose();
    } catch (error) {
      console.error('Error handling variant save:', error);
    }
  };


  const handleAddonChange = (selectedAddon) => {
    setSelectedVariantAddons((prevAddons) => [
      ...prevAddons,
      ...selectedAddon.map((addon) => ({ id: addon.value })),
    ]);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setSelectedDiscounts([]);
    setSelectedImage(null);
    setBranchPrices({});
    setAttachments([]);
  };


  const updateRecipeDetails = (itemId, variantId, data) => {
    setRecipeDetails((prevState) => ({
      ...prevState,
      [itemId]: {
        ...(prevState[itemId] || {}),
        variantQuantities: {
          ...(prevState[itemId]?.variantQuantities || {}),
          [variantId]: data.quantity,
        },
        selectedAddons: {
          ...(prevState[itemId]?.selectedAddons || {}),
          [variantId]: data.selectedAddons,
        },
      },
    }));
  };


  const handleAddItem = () => {
    if (selectedItems.length > 0) {
      const newIngredientsData = selectedItems.flatMap((selectedItem) => {
        return selectedVariants[selectedItem.id].map((variant) => {
          const quantityFieldName = `quantity_${selectedItem.id}_${variant.id}`;
          const variantQuantity = parseFloat(recipeDetails[selectedItem.id]?.variantQuantities?.[variant.id] || 0);

          const newIngredient = {
            item: {
              id: selectedItem.id,
            },
            variantId: variant.id,
            amount: variantQuantity,
            addons: [],
          };

          // Check if the ingredient already exists in ingredients state
          const existingIngredientIndex = ingredients.findIndex((ingredient) => {
            return (
              ingredient.item?.id === newIngredient.item?.id &&
              ingredient.variantId === newIngredient.variantId
            );
          });

          if (existingIngredientIndex !== -1) {
            // If the ingredient already exists, update it
            ingredients[existingIngredientIndex].amount += newIngredient.amount;

            newIngredient.addons.forEach((addon) => {
              const existingAddonIndex = ingredients[existingIngredientIndex].addons.findIndex(
                (existingAddon) => existingAddon.addon.id === addon.addon.id
              );

              if (existingAddonIndex !== -1) {
                ingredients[existingIngredientIndex].addons[existingAddonIndex].amount += addon.amount;
              } else {
                ingredients[existingIngredientIndex].addons.push(addon);
              }
            });
          } else {
            // If the ingredient does not exist, add it to ingredients state
            ingredients.push(newIngredient);
          }

          return newIngredient;
        });
      });

      setIngredients([...ingredients]);

      setSelectedItemsForRecipe((prevItems) => [...prevItems, ...selectedItems]);
      setSelectedItems([]);
      setModalOpen(false);
    }
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
      if(editingVariant?.addons){
        setSelectedVariantAddons(editingVariant?.addons.map((addon) => ({label: addon.name, value: addon.id})))

      }

      console.log(editingVariant, 'ba');
      console.log(selectedVariantAddons, 'ba');

      const formattedBranchPrices = {};
      if (editingVariant.branchVariantDetails) {
        Object.keys(editingVariant.branchVariantDetails)?.forEach(branchId => {
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
  }, [editingVariant,isNew]);





  useEffect(() => {
    dispatch(getItemsForRecipe({ itemId: itemId ?? null, editingVariant: editingVariant?.id ?? null }));

    dispatch(getBranches({}));
  }, [props.editingVariantId,editingVariant,isNew]);


  useEffect(() => {
    const initialSelectedVariants = {};
    const initialVariantItems = [];
    const initialRecipeDetails = {};
    const initialIngredients = [];

    const initialItemNameMap = {};

    if (editingVariant && recipeDetails) {
      editingVariant?.ingredients?.forEach((itemData) => {
        const { item, variant, amount, addons } = itemData;
        const id = item?.id;

        if (!initialSelectedVariants[id]) {
          initialSelectedVariants[id] = [];
        }

        const selectedAddons = recipeDetails[id]?.selectedAddons?.[variant.id] || [];

        initialSelectedVariants[id].push({
          id: variant.id,
          name: variant.name,
          quantity: amount,
          selectedAddons: selectedAddons,
        });

        initialVariantItems.push({
          id,
          name: item?.name,
          variantId: variant.id,
          quantity: amount,
          selectedAddons,
        });

        initialRecipeDetails[id] = {
          ...(initialRecipeDetails[id] || {}),
          variantQuantities: {
            ...(initialRecipeDetails[id]?.variantQuantities || {}),
            [variant.id]: amount,
          },
          selectedAddons: {
            ...(initialRecipeDetails[id]?.selectedAddons || {}),
            [variant.id]: addons.map((addon) => ({
              id: addon.addonId,
              name: addon.addon.name,
              amount: addon.amount,
            })),
          },
        };

        const ingredient = {
          item: {
            id: id,
            name: item?.name, // Store the item name in the ingredient
          },
          variantId: variant.id,
          amount: amount,
          addons: addons.map((addon) => ({
            addon: {
              id: addon.addonId,
            },
            amount: addon.amount,
          })),
        };

        initialIngredients.push(ingredient);

        // Populate the itemNameMap
        if (id && item?.name) {
          initialItemNameMap[id] = item.name;
        }
      });
    }

    setSelectedVariants(initialSelectedVariants);
    setVariantItems(initialVariantItems);
    setRecipeDetails(initialRecipeDetails);
    setIngredients(initialIngredients);
    setItemNameMap(initialItemNameMap); // Set the itemNameMap

  }, []);





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

  const defaultAddons = editingVariant?.addons?.map(addon => ({
      label: addon.name,
      value: addon.id,
    })) || [];

  const formattedDiscountOptions = discounts?.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value,
  }));
  const AddonDropdown = ({ itemAddons = [], variantAddons = [], selectedAddons, onAddAddon, onIncrement, onDecrement }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const allAddons = [...itemAddons, ...variantAddons];

    const toggle = () => setDropdownOpen(!dropdownOpen);

    const isAllAddonsSelected = allAddons.every((addon) => selectedAddons.some((selectedAddon) => selectedAddon?.id === addon?.id));


    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle disabled={allAddons.length < 1 || isAllAddonsSelected} caret>Add Addons</DropdownToggle>
        <DropdownMenu >
          {allAddons
            .filter((addon) => !selectedAddons.some((selectedAddon) => selectedAddon?.id === addon?.id))
            .map((addon) => (
              <DropdownItem key={addon?.id} onClick={() => onAddAddon(addon)}>
                {addon.name}
              </DropdownItem>
            ))}
        </DropdownMenu>
        <div>
          {selectedAddons.map((selectedAddon) => (
            <div key={selectedAddon?.id} className="mt-2">
              <span style={{ width: '130px', display: 'inline-block' }}>{selectedAddon.name}:</span>
              <Button
                className="decrement-button"
                onClick={() => onDecrement(selectedAddon)}
                style={{ display: 'inline-block', marginRight: '10px' }}
                disabled={selectedAddon.amount <= 0}
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

  const handleAddAddon = (itemId, variantId, addon) => {
    setRecipeDetails((prevDetails) => {
      const existingSelectedAddons = prevDetails[itemId]?.selectedAddons?.[variantId] || [];

      // Check if the addon already exists in the selected addons
      const isAddonExist = existingSelectedAddons.some((selectedAddon) => selectedAddon.id === addon.id);

      // If the addon doesn't exist, add it
      if (!isAddonExist) {
        const updatedSelectedAddons = {
          ...prevDetails[itemId]?.selectedAddons,
          [variantId]: [
            ...(prevDetails[itemId]?.selectedAddons?.[variantId] || []),
            { id: addon.id, name: addon.name, amount: 0 },
          ],
        };

        return {
          ...prevDetails,
          [itemId]: {
            ...prevDetails[itemId],
            selectedAddons: updatedSelectedAddons,
          },
        };
      }

      // If the addon already exists, don't make any changes
      return prevDetails;
    });
  };

  const handleDeleteItem = (itemId, variantId) => {
    // Filter out the selected variant from the selectedVariants state
    setSelectedVariants(prevVariants => {
      const updatedVariants = { ...prevVariants };
      if (updatedVariants[itemId]) {
        updatedVariants[itemId] = updatedVariants[itemId].filter(v => v.id !== variantId);
      }
      return updatedVariants;
    });

    // Filter out the ingredient associated with the variant
    setIngredients(prevIngredients => prevIngredients.filter(ingredient => !(ingredient.item.id === itemId && ingredient.variantId === variantId)));
  };




  const handleAddonAmountChange = (itemId, variantId, addonId, action) => {
    setRecipeDetails((prevDetails) => {
      const updatedSelectedAddons = {
        ...prevDetails[itemId]?.selectedAddons,
        [variantId]: [...(prevDetails[itemId]?.selectedAddons?.[variantId] || [])],
      };

      const addonIndex = updatedSelectedAddons[variantId].findIndex(
        (addon) => addon?.id === addonId
      );

      if (addonIndex !== -1) {
        if (action === "increment") {
          updatedSelectedAddons[variantId][addonIndex].amount++;
        } else if (action === "decrement") {
          updatedSelectedAddons[variantId][addonIndex].amount = Math.max(
            0,
            updatedSelectedAddons[variantId][addonIndex].amount - 1
          );
        }

        setIngredients((prevIngredients) => {
          return prevIngredients.map((ingredient) => {
            if (
              ingredient.item?.id === itemId &&
              ingredient.variantId === variantId
            ) {
              const updatedAddons = ingredient.addons || [];
              const existingAddonIndex = updatedAddons.findIndex(
                (addon) => addon.addon?.id === addonId
              );

              if (existingAddonIndex !== -1) {
                // If the addon already exists, update its amount
                updatedAddons[existingAddonIndex].amount =
                  updatedSelectedAddons[variantId][addonIndex].amount;
              } else {
                // If the addon doesn't exist, add it with the updated amount
                updatedAddons.push({
                  addon: {
                    id: addonId,
                  },
                  amount: updatedSelectedAddons[variantId][addonIndex].amount,
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




  console.log(variantItems, 'helloss');

  console.log(editingVariant, 'editingVariant?');
  console.log(isNew, 'isnew?');

  console.log(defaultAttachments, 'defaultAttachments');
  console.log('recipeDetails:', recipeDetails);

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
                          src={attachment?.url}
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
                <Select isMulti={true} defaultValue={defaultAddons} onChange={handleAddonChange} options={props.addonsOptions} />
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
                <h3>Combo</h3>
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
                    <th>Delete</th>
                  </tr>
                  </thead>
                  <tbody>
                  {Object.keys(selectedVariants).map((itemId) => (
                    <React.Fragment key={itemId}>
                      {console.log('Debug - itemId:', itemId)}
                      {console.log('Debug - selectedVariants[itemId]:', selectedVariants[itemId])}

                      {/* Debugging */}
                      {selectedVariants[itemId].map((variant) => {
                        const item = itemList.find((item) => item?.id === itemId);
                        const itemName = itemNameMap[itemId];
                        console.log(selectedVariants, 'lolili')

                        const recipeDetail = recipeDetails[itemId] || {};
                        const variantQuantity = recipeDetail.variantQuantities?.[variant?.id] || "";
                        const selectedAddons = recipeDetail.selectedAddons?.[variant?.id] || [];

                        console.log('Debug - item:', item);
                        console.log('Debug - itemList:', itemList);

                        console.log('Debug - variant:', variant);
                        console.log('Debug - recipeDetail:', recipeDetail);
                        console.log('Debug - variantQuantity:', variantQuantity);
                        console.log('Debug - selectedAddons:', selectedAddons);

                        return (
                          <tr key={variant?.id}>
                            <td>{item?.name || itemName}</td>
                            <td>{variant?.name}</td>
                            <td>
                              Quantity:{" "}
                              <ValidatedField
                                type="number"
                                name={`quantity_${itemId}_${variant?.id}`}
                                placeholder={`Enter quantity for ${variant.name}`}
                                value={variantQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(itemId, variant?.id, e.target.value)
                                }
                              />
                            </td>
                            <td>
                              Addons:
                              <div className="addon-select-wrapper">

                                <AddonDropdown
                                  itemAddons={item?.addons}
                                  variantAddons={variant?.addons}
                                  selectedAddons={selectedAddons}
                                  onAddAddon={(addon) =>
                                    handleAddAddon(itemId, variant?.id, {
                                      id: addon?.id,
                                      name: addon.name,
                                    })
                                  }
                                  onIncrement={(selectedAddon) =>
                                    handleAddonAmountChange(
                                      itemId,
                                      variant?.id,
                                      selectedAddon?.id,
                                      "increment"
                                    )
                                  }

                                  onDecrement={(selectedAddon) =>
                                    handleAddonAmountChange(
                                      itemId,
                                      variant?.id,
                                      selectedAddon?.id,
                                      "decrement"
                                    )
                                  }

                                />
                              </div>
                            </td>

                                <td>
                                  <Button type={"button"} color="danger"  onClick={() => handleDeleteItem(itemId, variant.id)}  >
                                    <FontAwesomeIcon icon="trash"  />
                                  </Button>
                                </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
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
                                    background: `url(${item.attachments[0]?.url})`,
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
                                      id={`variant-${variant?.id}`}
                                      name={`variant-${item?.id}`} // Use the same name for all variant radios within the same item
                                      checked={selectedVariants[item?.id]?.some(v => v.id === variant.id)}
                                      onChange={e => handleVariantSelection(item?.id, variant, e.target.checked)}
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
