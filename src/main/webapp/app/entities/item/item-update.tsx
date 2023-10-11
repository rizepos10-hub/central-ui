import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getMenus } from 'app/entities/menu/menu.reducer';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getItemCategories as getTerms } from 'app/entities/term/term.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { getEntities as getProductionCenters } from 'app/entities/location/production-center/production-center.reducer';

import { getEntities as getAccountingGroups } from 'app/entities/settings/accounting-groups/accounting-groups.reducer';

import { ItemStatus } from 'app/shared/model/enumerations/item-status.model';
import { getEntity, updateEntity, createEntity, reset, getEntities as getItems, importAddons } from './item.reducer';
import Select from 'react-select';
import ItemVariantModal from 'app/entities/item/item-variant-modal';
import attachment, { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Button as PrimeButton } from 'primereact/button';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import AddonImportModal from 'app/entities/item/addon-import-modal';
import PosBranchUser from 'app/entities/branch-pos-user/user.reducer';
import axios from 'axios';

export const ItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const saveButtonRef = useRef(null);
  const toastId = useRef(null);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const menus = useAppSelector(state => state.menu.entities);
  const itemEntity = useAppSelector(state => state.item.entity);
  const loading = useAppSelector(state => state.item.loading);
  const updating = useAppSelector(state => state.item.updating);
  const updateSuccess = useAppSelector(state => state.item.updateSuccess);
  const itemStatusValues = Object.keys(ItemStatus);
  const addons = useAppSelector(state => state.addon.entities);
  const items = useAppSelector(state => state.item.entities);

  const initSelectedAddons = itemEntity.addons?.map(addon => ({ value: addon.id, label: addon.name }));
  const [selectedAddons, setSelectedAddons] = useState(initSelectedAddons);
  const addonsOptions = addons?.map(addon => ({ value: addon.id, label: addon.name }));
  const itemOptions = items?.map(item => ({ value: item.id, label: item.name }));

  const entityTerms = itemEntity.terms?.map(term => ({ value: term.id, label: term.name }));

  const termsOptions = useAppSelector(state => state.term.entities)?.map(term => ({ value: term.id, label: term.name }));

  const accountingGroupsOptions = useAppSelector(state => state.accountingGroups.entities)?.map(term => ({
    value: term.id,
    label: term.name,
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

  const [selectedAccountingGroups, setSelectedAccountingGroups] = useState('');



  const [selectedAttachments, setSelectedAttachments] = useState([]);

  const [variants, setVariants] = useState([]);

  const newItem = useAppSelector(state => state.item.entity);

  const [modalVariantImages, setModalVariantImages] = useState([]);

  const [editingVariantId, setEditingVariantId] = useState(null);

  const [editingVariantIndex, setEditingVariantIndex] = useState(null);


  const [openedAddonModal, setOpenedAddonModal] = useState(false);

  const handleEditExistingVariant = editedVariant => {
    const updatedVariants = variants?.map(variant => (variant?.id === editedVariant?.id ? editedVariant : variant));
    setVariants(updatedVariants);
    setEditingVariantId(null);
    setOpenedModal(false);
  };
  const archiveVariant = variantId => {
    const archivedVariants = variants?.map(variant =>
      variant.id === variantId
        ? {
            ...variant,
            archived: true,
          }
        : variant
    );
    setVariants(archivedVariants);
  };

  const handleArchiveVariant = variantId => {
    console.log(variantId, 'loli');
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
              archiveVariant(variantId);
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
  const openEditVariantModal = variant => {
    const variantIndex = variants.findIndex(v => v.id === variant.id);

    setEditingVariantIndex(variantIndex);
    setEditingVariantId(variant.id);
    setOpenedModal(true);
  };

  const handleVariantImageUpload = variantImage => {
    console.log(variantImage, 'handleVariantImageUpload');
    setModalVariantImages([variantImage]);
  };
  const handleClose = () => {
    navigate(`/item/${id}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getMenus({}));
    dispatch(getAddons({}));
    dispatch(
      getItems({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getTerms({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(getProductionCenters({}))
    dispatch(getDiscounts({}));
    dispatch(getAccountingGroups({}));

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
    if (itemEntity?.terms) {
      setSelectedTerms(itemEntity.terms?.map(term => ({ id: term.id, label: term.name, value: term.id })));
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
    console.log(itemEntity, 'termos');
    if (itemEntity?.addons) {
      setSelectedAddons(itemEntity?.addons?.map(addon => ({ id: addon.id, label: addon.name, value: addon.id })));
    }

    if (uploadImageStatus === 'success' && saveButtonRef.current) {
      saveButtonRef.current.focus();
    }

    if (itemEntity.name) {
      setName(itemEntity.name);
    }
    const { id: newTermId } = newItem;
    if (updateSuccess && newTermId) {
      navigate(`/item/${newTermId}/edit?page=1&sort=id,asc`);
    }
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

  const removeAttachment = attachmentId => {
    setSelectedAttachments(prevAttachments => prevAttachments.filter(attachment => attachment.id !== attachmentId));
  };

  console.log(editingVariantId, 'editingVariantId');

  const handleSaveVariant = (name, price, discount, addons, variantImage, branchVariantDetails, ingredients, specialPricesValues) => {
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
    };
    setVariants(prevVariants => [...prevVariants, newValues]);
  };
  const saveEntity = values => {
    console.log(values, 'values');
    console.log(variants, 'variants');

    const entity = {
      ...itemEntity,
      ...values,
      accountingGroups: accountingGroupsToSave,
      productionCenter: selectedProductionCenter,
      addons: selectedAddons?.map(addon => ({ id: addon.value })),
      terms: selectedTerms?.map(term => ({ id: term.value })),
      attachments: selectedAttachments,
      variants: variants,
      name,
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

  const handleImportAddonModalSave = (itemId: string) => {
    // make request call
    const payload = {
      entity: itemEntity,
      fromItem: itemId,
    };

    dispatch(importAddons(payload));
    console.log('sending request with id ' + itemId);
  };
  const handleImportAddonModalClose = () => {
    setOpenedAddonModal(false);
  };

  console.log(itemEntity, 'itemEntity');

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
          status: 'ENABLED',
          ...itemEntity,
          menu: itemEntity?.menu?.id,
        };

  return (
    <div>
      {openedModal && (
        <ItemVariantModal
          showModal={openedModal}
          handleClose={handleCloseModal}
          handleSave={handleSaveVariant}
          editingVariantIndex={editingVariantIndex}
          onVariantImageUpload={handleVariantImageUpload}
          editingVariantId={editingVariantId}
          itemId={id}
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
          itemOptions={itemOptions}
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
                  <Select isMulti={true} value={selectedTerms} onChange={handleTermChange} options={termsOptions} />
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
              <Col md={8}>
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
                <div className="d-flex justify-content-between mb-1">
                  <div style={{ width: '55%' }}>
                    <ValidatedField label={translate('tempApp.item.status')} id="item-status" name="status" data-cy="status" type="select">
                      {itemStatusValues?.map(itemStatus => (
                        <option value={itemStatus} key={itemStatus}>
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
                    <Translate contentKey="tempApp.item.addons"></Translate>
                    <Select isMulti={true} value={selectedAddons} onChange={handleAddonChange} options={addonsOptions} />
                  </div>
                  <div className={'col md-2'} style={{ display: 'flex', alignItems: 'center' }}>
                    <Button onClick={openImportAddonModal}> Import</Button>
                  </div>
                </Row>
              </Col>
              {variants && (
                <div className="mb-3">
                  <Translate contentKey="tempApp.item.variants">Variants</Translate>
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
                        .filter(variant => variant.archived !== true)
                        ?.map(variant => (
                          <tr key={variant.id && variant.id}>
                            <td className="align-middle">{variant.name}</td>
                            <td className="align-middle">{variant.price}</td>
                            <td className="align-middle">
                              {variant.attachments?.map(attachment => (
                                <img
                                  key={attachment?.id}
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
                                {variant.discounts?.map(discount => (
                                  <li key={discount?.id}>{`${
                                    discount?.type === 'PERCENTAGE' ? `${discount?.value}%` : `${discount?.value} ${discount?.type}`
                                  }`}</li>
                                ))}
                              </ul>
                            </td>

                            <td>
                              <Button type={'button'} onClick={() => openEditVariantModal(variant)} color="secondary">
                                <FontAwesomeIcon icon="pencil-alt" />
                              </Button>
                            </td>
                            <td>
                              <Button type={'button'} color="danger" onClick={() => handleArchiveVariant(variant.id)}>
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
                {/* <ValidatedField id="item-menu" name="menu" data-cy="menu" label={translate('tempApp.item.menu')} type="select"> */}
                {/*   <option value="" key="0" /> */}
                {/*   {menus */}
                {/*     ? menus.map(otherEntity => ( */}
                {/*         <option value={otherEntity.id} key={otherEntity.id}> */}
                {/*           {otherEntity.id + ' ' + otherEntity.name} */}
                {/*         </option> */}
                {/*       )) */}
                {/*     : null} */}
                {/* </ValidatedField> */}
              </div>
              <br />
              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button
                color="primary"
                id="save-entity"
                data-cy="entityCreateSaveButton"
                type="submit"
                disabled={updating}
                innerRef={saveButtonRef}
              >
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ItemUpdate;
