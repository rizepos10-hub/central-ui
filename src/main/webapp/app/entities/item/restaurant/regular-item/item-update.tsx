import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Col, Row, Table, Card, CardBody} from 'reactstrap';
import {getSortState, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import {overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import {useAppDispatch, useAppSelector} from 'app/config/store';

import {getEntities as getAddons} from 'app/entities/addon/addon.reducer';
import {getEntities as getAddonGroups} from 'app/entities/addon-groups/addon-groups.reducer';

import {
  getEntities as getRestaurantCategories
} from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import {getEntities as getDiscounts} from 'app/entities/discount/discount.reducer';
import {getEntities as getProductionCenters} from 'app/entities/location/production-center/production-center.reducer';

import {getEntities as getAccountingGroups} from 'app/entities/settings/accounting-groups/accounting-groups.reducer';

import {ItemStatus} from 'app/shared/model/enumerations/item-status.model';
import {createEntity, getEntities as getItems, getEntity, reset, updateEntity} from './item.reducer';
import Select from 'react-select';
import ItemVariantModal from 'app/entities/item/restaurant/regular-item/item-variant-modal';
import {uploadImage} from 'app/entities/attachment/attachment.reducer';
import {faTrashAlt} from '@fortawesome/free-solid-svg-icons';
import {toast} from 'react-toastify';
import {Button as PrimeButton} from 'primereact/button';
import {ITEMS_PER_PAGE} from 'app/shared/util/pagination.constants';
import AddonImportModal from 'app/entities/item/restaurant/regular-item/addon-import-modal';
import {Checkbox} from "primereact/checkbox";
import _default from "chart.js/dist/plugins/plugin.tooltip";
import {IItem} from "app/shared/model/item.model";
import {getEntities as getSharedItemEntities} from "app/entities/item/restaurant/restaurant-item.reducer";

import {TabPanel, TabView} from "primereact/tabview";

import Visibility from 'app/shared/Visibility/Visibility'
import { IVisibility } from "app/shared/model/visibility.model";


export const ItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const saveButtonRef = useRef(null);
  const toastId = useRef(null);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const menus = useAppSelector(state => state.menu.entities);
  const itemEntity = useAppSelector(state => state.regularItem.entity);
  const loading = useAppSelector(state => state.regularItem.loading);
  const updating = useAppSelector(state => state.regularItem.updating);
  const updateSuccess = useAppSelector(state => state.regularItem.updateSuccess);
  const itemStatusValues = Object.keys(ItemStatus);
  const addons = useAppSelector(state => state.addon.entities);
  const addonGroups = useAppSelector(state => state.addonGroups.entities);

  const items = useAppSelector(state => state.regularItem.entities);

  const [selectedAddons, setSelectedAddons] = useState([]);

  const [selectedAddonGroups, setSelectedAddonGroups] = useState([]);

  const itemTypeOptions = [{label: 'ITEM', value: 'ITEM'}, {label: "PIZZA", value: "PIZZA"}]

  const addonsOptions = addons?.map(addon => ({ value: addon.id, label: addon.name, id: addon.id }));

  const addonGroupsOptions = addonGroups?.map(addon => ({ value: addon.id, label: addon.name, id: addon.id}));

  const itemOptions = items?.map(item => ({ value: item.id, label: item.name }));

  const entityTerms = itemEntity.categories?.map(category => ({ value: category.id, label: category.name }));

  const categoriesOptions = useAppSelector(state => state.restaurantCategory.entities)?.map(category => ({ value: category.id, label: category.name }));


  const accountingGroupsOptions = useAppSelector(state => state.accountingGroups.entities)?.map(category => ({
    value: category.id,
    label: category.name,
  }));

  const productionCenterOptions = useAppSelector(state => state.productionCenter.entities).map(pCenter => ({
      label: pCenter.name,
      value: pCenter.id,
      id: pCenter.id
  }))


  const [accountingGroupsToSave, setAccountingGroupsToSave] = useState([]);

  const [selectedTerms, setSelectedTerms] = useState(entityTerms);

  const [selectedProductionCenter, setSelectedProductionCenter] = useState(null);
  const [openedModal, setOpenedModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [itemStatus, setItemStatus] = useState('ENABLED');


  const [selectedAccountingGroups, setSelectedAccountingGroups] = useState('');



  const [selectedAttachments, setSelectedAttachments] = useState([]);

  const [variants, setVariants] = useState([]);

  const newItem = useAppSelector(state => state.regularItem.entity);

  const [modalVariantImages, setModalVariantImages] = useState([]);

  const [editingVariantId, setEditingVariantId] = useState(null);

  const [editingVariantIndex, setEditingVariantIndex] = useState(null);


  const [openedAddonModal, setOpenedAddonModal] = useState(false);

  const handleEditExistingVariant = editedVariant => {
    const updatedVariants = [...variants];

    updatedVariants[editingVariantIndex] = editedVariant;

    setVariants(updatedVariants);
    setEditingVariantId(null);
    setOpenedModal(false);
  };
  const archiveVariant = (index) => {
    const filteredVariants = variants?.filter((_, i) => i !== index);
    setVariants(filteredVariants);
  };

  const handleArchiveVariant = (index) => {
    console.log(index, 'loli');
    if (toast.isActive(toastId.current)) {
      return;
    }
    toastId.current = toast.info(
      <div>
        <span>Are you sure you want to delete this variant?</span>
        <div className="d-flex mt-2 h-2rem">
          <PrimeButton
            label="Yes"
            onClick={() => {
              toast.dismiss(toastId.current);
              archiveVariant(index);
            }}
            className="p-button-sm"
          />

          <PrimeButton
            label="No"
            className="p-button-secondary p-button-sm ms-2"
            onClick={() => {
              toast.dismiss(toastId.current);
            }}
          />
        </div>
      </div>,
      {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  console.log(variants, 'variants');
  const openEditVariantModal = (variant, index) => {
    console.log(variant, 'variants121');


    setEditingVariantIndex(index);
    setEditingVariantId(variant.id);
    setOpenedModal(true);
  };

  const handleVariantImageUpload = variantImage => {
    console.log(variantImage, 'handleVariantImageUpload');
    setModalVariantImages([variantImage]);
  };
  const handleClose = () => {
    navigate(`/restaurant/regular/${id}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getAddons({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getAddonGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(
      getItems({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getRestaurantCategories({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(getProductionCenters({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getAccountingGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(
      getSharedItemEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    // console.log(modalVariantImages, 'variantfromchild');

    return () => {
      dispatch(reset());
    };
  }, [updateSuccess]);

  useEffect(() => {
    // if (updateSuccess) {
    //   handleClose();
    // }
    if (itemEntity?.variants) {
      setVariants(itemEntity.variants);
    }
    if (itemEntity?.categories) {
      setSelectedTerms(itemEntity.categories?.map(category => ({ id: category.id, label: category.name, value: category.id })));
    }
    if (itemEntity?.accountingGroups) {
      setSelectedAccountingGroups(itemEntity.accountingGroups?.map(group => ({ label: group.name, value: group.id })));
      setAccountingGroupsToSave(itemEntity.accountingGroups?.map(group => ({ id: group.id })));
    }
    if (itemEntity?.productionCenter) {
      setSelectedProductionCenter( ({ label: itemEntity.productionCenter?.name, value: itemEntity.productionCenter?.id, id: itemEntity.productionCenter?.id }));
    }

    if (itemEntity?.attachments) {
      setSelectedAttachments(itemEntity.attachments?.map(attachment => ({ id: attachment.id, url: attachment?.url })));
    }
    console.log(itemEntity, 'categoryos');
    if (itemEntity?.addons) {
      setSelectedAddons(itemEntity?.addons?.map(addon => ({ id: addon.id, label: addon.name, value: addon.id })));
    }
    if (itemEntity?.addonGroups?.length > 0) {
      setSelectedAddonGroups(itemEntity?.addonGroups?.map(adngrp => (
        {
          required: adngrp.required,
          addonGroup:
            {
              id: adngrp.addonGroup.id,
              label: adngrp.addonGroup.name,
              value: adngrp.addonGroup.id
            }
        })));

    }
    if (uploadImageStatus === 'success' && saveButtonRef.current) {
      saveButtonRef.current.focus();
    }
    if (itemEntity.status) {
      setItemStatus(itemEntity.status);
    }
    if (itemEntity.name) {
      setName(itemEntity.name);
    }
    if (itemEntity.desc) {
      setDesc(itemEntity.desc);
    }
    const { id: newItemId } = newItem;
    if (updateSuccess && newItemId) {
      navigate(`/restaurant/regular/${newItemId}/edit` + location.search);
    }

    setVisibility(itemEntity.visibility || []);
  }, [updateSuccess, itemEntity]);

  const handleTermChange = selectedOptions => {
    setSelectedTerms(selectedOptions);
  };
  const handleAccountingGroupsChange = selectedAccounting => {
    setSelectedAccountingGroups(selectedAccounting);

    setAccountingGroupsToSave([{ id: selectedAccounting.value }]);
  };

  const handleProductionCenterChange = (selectedProductionCenter) => {

    setSelectedProductionCenter(selectedProductionCenter);
  };
  const handleAddonChange = selectedAddon => {
    setSelectedAddons(selectedAddon);
  };

  const handleAddonGroupChange = (selectedOptions) => {
    const existingAddonGroupsMap = new Map(selectedAddonGroups.map(option => [option.addonGroup.id, option]));

    const updatedSelectedAddonGroups = selectedOptions.map(option => {
      const existingOption = existingAddonGroupsMap.get(option.value);
      return {
        required: existingOption ? existingOption.required : option.required,
        addonGroup: {
          label: option.label,
          value: option.value,
          id: option.value
        }
      };
    });

    setSelectedAddonGroups(updatedSelectedAddonGroups);
  };



  function handleCheckboxChange(index) {
    setSelectedAddonGroups(prevSelectedAddonGroups => {
      const updatedSelectedAddonGroups = [...prevSelectedAddonGroups];
      updatedSelectedAddonGroups[index] = {
        ...updatedSelectedAddonGroups[index],
        required: !updatedSelectedAddonGroups[index].required
      };
      return updatedSelectedAddonGroups;
    });
  }


  const removeAttachment = attachmentId => {
    setSelectedAttachments(prevAttachments => prevAttachments.filter(attachment => attachment.id !== attachmentId));
  };

  console.log(editingVariantId, 'editingVariantId');

  const handleSaveVariant = (name, price, discount = null, addons, variantImage, branchVariantDetails, ingredients, specialPricesValues, selectedModifiersFromOptions) => {
    console.log(variants, 'variants new');

    const newValues = {
      name,
      price,
      discounts: discount,
      attachments: variantImage,
      branchVariantDetails: branchVariantDetails,
      ingredients: ingredients,
      addons: addons,
      specialPrices: specialPricesValues,
      options: selectedModifiersFromOptions
    };
    setVariants(prevVariants => [...prevVariants, newValues]);
  };
  const saveEntity = (values = null) => {
    console.log(values, 'values');
    console.log(variants, 'variants');

    const entity = {
      ...itemEntity,
      itemType: "RESTAURANT",
      itemVariantType: "RESTAURANT_VARIABLE",
      status: itemStatus,
      accountingGroups: accountingGroupsToSave,
      productionCenter: selectedProductionCenter,
      addons: selectedAddons,
      addonGroups: selectedAddonGroups,
      categories: selectedTerms?.map(category => ({ id: category.value })),
      attachments: selectedAttachments,
      variants,
      name,
      desc,
      visibility
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
    console.log(entity, 'entity sent');
  };
  const handleCloseModal = () => {
    setEditingVariantId(null);
    setEditingVariantIndex(null)
    setOpenedModal(false);
  };
  const openVariantModal = () => {
    setOpenedModal(true);
  };

  const openImportAddonModal = () => {
    console.log('opened ' + openedAddonModal);
    setOpenedAddonModal(true);
  };

  // const handleImportAddonModalSave = (itemId: string) => {
  //   const payload = {
  //     fromItem: itemId,
  //   };
  //
  //   dispatch(importAddons(payload)).then((data) => {
  //     console.log(data.payload.addons, 'dddda');
  //
  //     // For addons
  //     const prevAddonsMap = new Map(selectedAddons.map((addon) => [addon.id, addon]));
  //
  //     if (data.payload.addons) {
  //       for (const addon of data.payload.addons) {
  //         prevAddonsMap.set(addon.id, {
  //           id: addon.id,
  //           label: addon.name,
  //           value: addon.id
  //         });
  //       }
  //     }
  //
  //     const mergedAddonsArray = Array.from(prevAddonsMap.values());
  //
  //     setSelectedAddons(mergedAddonsArray);
  //
  //     // For addonGroups
  //     console.log(data.payload.addonGroups, 'kamel12')
  //
  //     const prevAddonGroupsMap = new Map(selectedAddonGroups.map((group) => [group.addonGroup.id, group]));
  //
  //     console.log(selectedAddonGroups , 'selectedAddonGroups21')
  //
  //     if (data.payload.addonGroups && data.payload.addonGroups.length > 0) {
  //       for (const group of data.payload.addonGroups) {
  //         prevAddonGroupsMap.set(group.addonGroup.id, {
  //           required: group.required,
  //           addonGroup: {
  //             label: group.addonGroup.name,
  //             value: group.addonGroup.id,
  //             id: group.addonGroup.id
  //           }
  //         });
  //       }
  //
  //       const mergedAddonGroupsArray = Array.from(prevAddonGroupsMap.values());
  //
  //       setSelectedAddonGroups(mergedAddonGroupsArray);
  //     } else {
  //       console.log('No addonGroups in the imported item');
  //     }
  //   });
  //
  //   console.log('sending request with id ' + itemId);
  // };


  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/regular");

    }
  }
  const handleImportAddonModalClose = () => {
    setOpenedAddonModal(false);
  };

  console.log(itemEntity, 'itemEntity')
  console.log(selectedAddons, 'selectedAddons');


  // const handleImageSubmit = async () => {
  //   setUploadImageStatus('uploading');
  //   try {
  //     const imageInfo = await handleImageUpload();
  //     if (imageInfo) {
  //       setSelectedImage(null);
  //       setSelectedAttachments((prevAttachments) => [...prevAttachments, imageInfo]);
  //       setUploadImageStatus('success');
  //       return imageInfo;
  //     } else {
  //       setUploadImageStatus('error');
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error('Error uploading image:', error);
  //     setUploadImageStatus('error');
  //     return null; // Resolve the promise with null if an error occurred
  //   }
  // };

  // const handleImageUpload = async () => {
  //   if (!selectedImage) {
  //     console.error('No image selected.');
  //     return null;
  //   }
  //   const formData = new FormData();
  //   formData.append('file', selectedImage);
  //   try {
  //     const response: any = await dispatch(uploadImage(formData));
  //     const imageUrl = response?.payload?.url;
  //     const imageInfo = {
  //       id: response?.payload?.id,
  //       name: response?.payload?.name,
  //       path: response?.payload?.path,
  //       size: response?.payload?.size,
  //       type: response?.payload?.type,
  //       createdAt: response?.payload?.createdAt,
  //       updatedAt: response?.payload?.updatedAt,
  //       url: imageUrl,
  //     };
  //     return imageInfo;
  //   } catch (error) {
  //     console.error('Error uploading image:', error);
  //     return null;
  //   }
  // };

  const handleImageChange = async event => {
    const file = event.target.files[0];

    if (!file) {
      console.error('No image selected.');
      return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadImageStatus('uploading');
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
      setSelectedAttachments(prevAttachments => [ imageInfo]);
      setUploadImageStatus('success');
      console.log(imageInfo, 'helloi');

      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadImageStatus('error');

      return null;
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {

          ...itemEntity,
        };

  const options = useAppSelector(state => state.restaurantItems.entities);
  const handleImportAddonModalSave = (option: IItem) => {
    const addons = itemEntity.addons || [];
    const extraAddons = option.addons;
    const uniqueIds = Array.from(new Set([...addons, ...extraAddons].map(item => item.id)));
    const mergedAddons = uniqueIds.map(id => [...addons, ...extraAddons].find(item => item.id === id));

    setSelectedAddons(mergedAddons.map(addon => ({ id: addon.id, label: addon.name, value: addon.id })));
  }


  /// Visibility Section
  const [visibility, setVisibility] = useState<IVisibility[]>();

  return (
      <Row>
        <Card>
          <CardBody>
            <Row>
              <Col md={10}>
                <TabView>
                  <TabPanel header={'Details'}>
                    <div>
                      {openedModal && (
                        <ItemVariantModal
                          showModal={openedModal}
                          itemType={"RESTAURANT"}
                          handleClose={handleCloseModal}
                          handleSave={handleSaveVariant}
                          editingVariantIndex={editingVariantIndex}
                          onVariantImageUpload={handleVariantImageUpload}
                          editingVariantId={editingVariantId}
                          itemId={id}
                          itemName={name}
                          variants={variants}
                          handleEditExistingVariant={handleEditExistingVariant}
                          addonsOptions={addonsOptions}
                        />
                      )}

                      {openedAddonModal && (
                        <AddonImportModal
                          showModal={openedAddonModal}
                          handleSave={handleImportAddonModalSave}
                          handleClose={handleImportAddonModalClose}
                          itemOptions={options}
                        />
                      )}

                      <Row >
                        <Col md="8">
                          <h2 id="tempApp.item.home.createOrEditLabel" data-cy="ItemCreateUpdateHeading">
                            <Translate contentKey="tempApp.item.home.createOrEditLabel">Create or edit a Item</Translate>
                          </h2>
                        </Col>
                      </Row>
                      <Row >
                        <Col md="8" className="d-flex flex-column p-3  bg-white">
                          {loading ? (
                            <p>Loading...</p>
                          ) : (
                            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
                              {!isNew ? (
                                <ValidatedField
                                  name="id"
                                  required
                                  readOnly
                                  id="item-id"
                                  label={translate('global.field.id')}
                                  validate={{ required: true }}
                                />
                              ) : null}
                              <div className="d-flex justify-content-between mb-1 gap-3">
                                <div style={{ width: '33%' }}>
                                  <ValidatedField
                                    label={translate('tempApp.item.name')}
                                    id="item-name"
                                    name="name"
                                    data-cy="name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    validate={{
                                      required: { value: true, message: translate('entity.validation.required') },
                                    }}
                                  />
                                </div>
                                <div style={{ width: '22%' }}>
                                  <Translate contentKey="tempApp.item.terms">Category</Translate>
                                  <Select  isMulti={true} value={selectedTerms} onChange={handleTermChange} options={categoriesOptions} />
                                </div>
                                <div style={{ width: '22%' }}>
                                  <Translate contentKey="tempApp.item.accountingGroups">Accounting Groups</Translate>
                                  <Select value={selectedAccountingGroups} onChange={handleAccountingGroupsChange} options={accountingGroupsOptions} />
                                </div>
                                <div style={{ width: '21%' }}>
                                  <Translate contentKey="tempApp.item.productionCenter">Production Center</Translate>
                                  <Select value={selectedProductionCenter} onChange={handleProductionCenterChange} options={productionCenterOptions} />
                                </div>
                              </div>
                              <Col md={12}>
                                {/* <ValidatedField */}
                                {/*   label={translate('tempApp.item.orderCount')} */}
                                {/*   id="item-orderCount" */}
                                {/*   name="orderCount" */}
                                {/*   data-cy="orderCount" */}
                                {/*   type="text" */}
                                {/* /> */}
                                {/* <ValidatedField */}
                                {/*   label={translate('tempApp.item.avgRating')} */}
                                {/*   id="item-avgRating" */}
                                {/*   name="avgRating" */}
                                {/*   data-cy="avgRating" */}
                                {/*   type="text" */}
                                {/* /> */}
                                {/* <ValidatedField */}
                                {/*   label={translate('tempApp.item.ratingCount')} */}
                                {/*   id="item-ratingCount" */}
                                {/*   name="ratingCount" */}
                                {/*   data-cy="ratingCount" */}
                                {/*   type="text" */}
                                {/* /> */}
                                {/* <ValidatedField */}
                                {/*   label={translate('tempApp.item.stock')} */}
                                {/*   id="item-stock" */}
                                {/*   name="stock" */}
                                {/*   data-cy="stock" */}
                                {/*   type="text" */}
                                {/*   validate={{ */}
                                {/*     required: { value: true, message: translate('entity.validation.required') }, */}
                                {/*     validate: v => isNumber(v) || translate('entity.validation.number'), */}
                                {/*   }} */}
                                {/* /> */}
                                <div className="d-flex  mb-1 gap-4">
                                  <div style={{ width: '34' }}>
                                    <ValidatedField label={translate('tempApp.item.status')}
                                                    value={itemStatus} id="item-status" name="status"
                                                    data-cy="status" type="select"
                                                    onChange={(e) => setItemStatus(e.target.value)}
                                    >
                                      {itemStatusValues?.map((itemStatus, i) => (
                                        <option value={itemStatus} key={i}>
                                          {translate('tempApp.ItemStatus.' + itemStatus)}
                                        </option>
                                      ))}
                                    </ValidatedField>
                                  </div>

                                  <div style={{ width: '35%' }}>
                                    <ValidatedField
                                      label={translate('tempApp.item.desc')}
                                      id="item-desc"
                                      name="desc"
                                      data-cy="desc"
                                      type="text"
                                      value={desc}
                                      onChange={e => setDesc(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                  <div className="mb-3">
                                    <ValidatedField
                                      label={'Item Image'}
                                      id="item-image"
                                      name="image"
                                      data-cy="image"
                                      type="file"
                                      onChange={handleImageChange}
                                      accept="image/*"
                                    />
                                    {selectedAttachments?.map((attachment, index) => (
                                      <div key={index} style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
                                        <img
                                          src={attachment?.url}
                                          alt={attachment.name}
                                          className="img-fluid"
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

                                    {selectedImage && uploadImageStatus === 'success' && (
                                      <div className={`alert alert-${uploadImageStatus === 'success' ? 'success' : 'danger'}`} role="alert">
                                        {uploadImageStatus === 'success' && 'Uploaded successfully!'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Col>
                              <Col>
                                <Row>
                                  <div className="col md-6">
                                    <Translate contentKey="tempApp.item.addons">Addons</Translate>
                                    <Select isMulti={true} value={selectedAddons} onChange={handleAddonChange} options={addonsOptions} />
                                  </div>
                                  <div className={'col md-2 mt-4 ml-3'} style={{ display: 'flex', alignItems: 'center' }}>
                                    <Button onClick={openImportAddonModal}> Import Addons</Button>
                                  </div>
                                </Row>
                              </Col>
                              <Col>
                                <Row>


                                  <div className="mt-2">
                                    <h5>Addon Groups</h5>

                                    <div className="col-md-6">
                                      <Select isMulti={true} value={selectedAddonGroups.map(group => ({
                                        value: group.addonGroup?.value,
                                        label: group.addonGroup?.label
                                      }))}
                                              onChange={handleAddonGroupChange} options={addonGroupsOptions} />
                                    </div>
                                    <Table>
                                      <thead>
                                      <tr>
                                        <th>Name</th>
                                        <th>Required</th>
                                      </tr>
                                      </thead>
                                      <tbody>
                                      {selectedAddonGroups.map((group, index) => (
                                        <tr key={index}>
                                          <td>{group.addonGroup?.label}</td>
                                          <td>
                                            <Checkbox
                                              checked={group?.required}
                                              onChange={(e) => handleCheckboxChange(index)}
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                </Row>
                              </Col>

                              {variants && (
                                <div className="mb-3">
                                  <h5> <Translate contentKey="tempApp.item.variants">Variants</Translate></h5>
                                  <table className="table table-striped">
                                    <thead>
                                    <tr>
                                      <th>Name</th>
                                      <th>Price</th>
                                      <th>Image</th>
                                      <th>Discounts</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {variants
                                      .filter(variant => variant.isArchived !== true)
                                      ?.map((variant, index) => (
                                        <tr key={index}>
                                          <td className="align-middle">{variant.name}</td>
                                          <td className="align-middle">{variant.price}</td>
                                          <td className="align-middle">
                                            {variant.attachments?.map((attachment,i) => (
                                              <img
                                                key={i}
                                                alt={attachment?.name}
                                                src={attachment?.url}
                                                className="img-fluid m-lg-1"
                                                style={{
                                                  maxWidth: '40px',
                                                  maxHeight: '45px',
                                                }}
                                              />
                                            ))}
                                          </td>
                                          <td className="align-middle">
                                            <ul>
                                              {variant.discounts?.map((discount,i) => (
                                                <li key={i}>{`${
                                                  discount?.type === 'PERCENTAGE' ? `${discount?.value}%` : `${discount?.value} ${discount?.type}`
                                                }`}</li>
                                              ))}
                                            </ul>
                                          </td>

                                          <td>
                                            <Button type={'button'} onClick={() => openEditVariantModal(variant,index)} color="secondary">
                                              <FontAwesomeIcon icon="pencil-alt" />
                                            </Button>
                                          </td>
                                          <td>
                                            <Button type={'button'} color="danger" onClick={() => handleArchiveVariant( index)}>
                                              <FontAwesomeIcon icon="trash" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              <div className="mt-4 mb-4">
                                <Button onClick={openVariantModal}> Add Variant</Button>
                              </div>
                              <br />
                        {/*       <Button id="cancel-save" data-cy="entityCreateCancelButton" replace color="info" onClick={handleBackClick} > */}
                        {/*         <FontAwesomeIcon icon="arrow-left" /> */}
                        {/*         &nbsp; */}
                        {/*         <span className="d-none d-md-inline"> */}
                        {/*   <Translate contentKey="entity.action.back">Back</Translate> */}
                        {/* </span> */}
                        {/*       </Button> */}
                        {/*       &nbsp; */}
                        {/*       <Button */}
                        {/*         color="primary" */}
                        {/*         id="save-entity" */}
                        {/*         data-cy="entityCreateSaveButton" */}
                        {/*         type="submit" */}
                        {/*         disabled={updating} */}
                        {/*         innerRef={saveButtonRef} */}
                        {/*       > */}
                        {/*         <FontAwesomeIcon icon="save" /> */}
                        {/*         &nbsp; */}
                        {/*         <Translate contentKey="entity.action.save">Save</Translate> */}
                        {/*       </Button> */}
                            </ValidatedForm>
                          )}
                        </Col>
                      </Row>
                    </div>
                  </TabPanel>
                  <TabPanel header={'Visibility'}>
                    <Visibility initialState={visibility} onStateChanged={(state) => setVisibility(state)}/>
                  </TabPanel>
                </TabView>
              </Col>
              <Col md={2}>
                <Button color='secondary' className='mr-1' onClick={handleBackClick}>Back</Button>
                <Button color='primary' onClick={saveEntity}> Save </Button>

              </Col>
            </Row>
          </CardBody>
        </Card>
      </Row>
  );
};

export default ItemUpdate;
