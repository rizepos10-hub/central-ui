import React, {useState, useEffect, useRef} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText, FormGroup, Input, Alert } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IMenu } from 'app/shared/model/menu.model';
import { getEntities as getMenus } from 'app/entities/menu/menu.reducer';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntities as getTerms } from 'app/entities/term/term.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';

import { IItem } from 'app/shared/model/item.model';
import { ItemStatus } from 'app/shared/model/enumerations/item-status.model';
import { getEntity, updateEntity, createEntity, reset } from './item.reducer';
import Select from 'react-select';
import ItemVariantModal from 'app/entities/item/item-variant-modal';
import {at} from "lodash";
import {uploadImage} from "app/entities/attachment/attachment.reducer";
import {faTrashAlt} from "@fortawesome/free-solid-svg-icons";

export const ItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const saveButtonRef = useRef(null);


  const menus = useAppSelector(state => state.menu.entities);
  const itemEntity = useAppSelector(state => state.item.entity);
  const loading = useAppSelector(state => state.item.loading);
  const updating = useAppSelector(state => state.item.updating);
  const updateSuccess = useAppSelector(state => state.item.updateSuccess);
  const itemStatusValues = Object.keys(ItemStatus);
  const addons = useAppSelector(state => state.addon.entities);
  const initSelectedAddons = itemEntity.addons?.map(addon => ({ value: addon.id, label: addon.name }));
  const [selectedAddons, setSelectedAddons] = useState(initSelectedAddons);
  const addonsOptions = addons.map(addon => ({ value: addon.id, label: addon.name }));


  const entityTerms = itemEntity.terms?.map(term => ({ value: term.id, label: term.name }));

  const termsOptions = useAppSelector(state => state.term.entities)
    .filter(term => term.taxonomy.name === 'Item Category').map(term => ({ value: term.id, label: term.name }));


  const [selectedTerms, setSelectedTerms] = useState(entityTerms);

  const [selectedOption, setSelectedOption] = useState(null)
  const [openedModal, setOpenedModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');

  const [selectedAttachments, setSelectedAttachments] = useState([])

  const [variants, setVariants] = useState([]);

  const newItem = useAppSelector(state => state.item.entity)

  const [modalVariantImages, setModalVariantImages] = useState([]);

  const [editingVariantId, setEditingVariantId] = useState(null);

  const handleEditExistingVariant = (editedVariant) => {
    const updatedVariants = variants?.map((variant) =>
      variant?.id === editedVariant?.id ? editedVariant : variant
    );
    setVariants(updatedVariants);
    setEditingVariantId(null);
    setOpenedModal(false);
  };
  const archiveVariant = (variantId) => {
    const shouldArchive = window.confirm("Are you sure you want to delete this variant?");
    if (shouldArchive) {
      const archivedVariants = variants?.map((variant) =>
        variant.id === variantId ? { ...variant, archived: true } : variant
      );
      setVariants(archivedVariants);
    }
  };


  console.log(variants, 'variants')
  const openEditVariantModal = (variant) => {
    setEditingVariantId(variant.id);
    setOpenedModal(true);
  };


  const handleVariantImageUpload = (variantImage) => {
    console.log(variantImage, 'handleVariantImageUpload')
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
    dispatch(getTerms({}));
    dispatch(getDiscounts({}));
    // console.log(modalVariantImages, 'variantfromchild');

    return () => {
      dispatch(reset());
    };

  }, [updateSuccess]);

  useEffect(() => {
    // if (updateSuccess) {
    //   handleClose();
    // }
    if(itemEntity?.variants){
      setVariants(itemEntity.variants);
    }
    if(itemEntity?.terms){
      setSelectedTerms(itemEntity.terms?.map((term) => ({id: term.id})))
    }
    if (itemEntity?.attachments) {
      setSelectedAttachments(itemEntity.attachments?.map(attachment => ({ id: attachment.id, url: attachment.url })));
    }
console.log(itemEntity, 'termos')
    if(itemEntity?.addons){
      setSelectedAddons(itemEntity?.addons?.map((addon) => ({id: addon.id})))
    }

    if (uploadImageStatus === 'success' && saveButtonRef.current) {
      saveButtonRef.current.focus();
    }

    const {id: newTermId} = newItem
    if (updateSuccess && newTermId) {
      navigate(`/item/${newTermId}/edit?page=1&sort=id,asc`)
    }
    return () => {
      dispatch(reset());
    };

  }, [updateSuccess, itemEntity?.variants ]);


  const handleTermChange = (selectedTerm) => {
    setSelectedTerms(selectedTerm.map((term) => ({id: term.value})));
  }

  const handleAddonChange = (selectedAddon) => {
    setSelectedAddons(selectedAddon.map((addon) => ({id: addon.value})));
  }

  const removeAttachment = (attachmentId) => {
    setSelectedAttachments((prevAttachments) =>
      prevAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  console.log(editingVariantId, 'editingVariantId')
  const saveEntity = values => {

    const entity = {
      ...itemEntity,
      ...values,
      // menu: menus.find(it => it.id.toString() === values.menu.toString()),
      addons: selectedAddons,
      terms : selectedTerms,
      attachments: selectedAttachments,
      variants: variants,
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };
  const handleCloseModal = () => {
    setEditingVariantId(null);
    setOpenedModal(false);
  };
  const openVariantModal = () => {
    setOpenedModal(true);
  };
  const handleSaveVariant = (name, price, discount, variantImage) => {
    const newValues = { name, price, discounts: discount, attachments: variantImage  };
    setVariants(prevVariants => [...prevVariants, newValues]);
  };



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

  const handleImageChange = async (event) => {
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
      setSelectedAttachments((prevAttachments) => [...prevAttachments, imageInfo]);
      setUploadImageStatus('success');
      console.log(imageInfo, 'helloi')

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
      <ItemVariantModal
        showModal={openedModal}
        handleClose={handleCloseModal}
        handleSave={handleSaveVariant}
        onVariantImageUpload={handleVariantImageUpload}
        editingVariantId={editingVariantId}
        variants={variants}
        handleEditExistingVariant={handleEditExistingVariant}
      />

      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="tempApp.item.home.createOrEditLabel" data-cy="ItemCreateUpdateHeading">
            <Translate contentKey="tempApp.item.home.createOrEditLabel">Create or edit a Item</Translate>
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
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
              <ValidatedField
                label={translate('tempApp.item.name')}
                id="item-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField label={translate('tempApp.item.desc')} id="item-desc" name="desc" data-cy="desc" type="textarea" />
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

              <ValidatedField label={translate('tempApp.item.status')} id="item-status" name="status" data-cy="status" type="select">
                {itemStatusValues.map(itemStatus => (
                  <option value={itemStatus} key={itemStatus}>
                    {translate('tempApp.ItemStatus.' + itemStatus)}
                  </option>
                ))}
              </ValidatedField>
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
                <div className="mb-3">
                  {selectedAttachments.map((attachment, index) => (
                    <div key={index} style={{ display: 'inline-block', marginRight: '10px', position: 'relative' }}>
                      <img
                        src={attachment.url}
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
                        <FontAwesomeIcon icon={faTrashAlt}  />
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
                    <div className={`alert alert-${uploadImageStatus === 'success' ? 'success' : 'danger'}`}
                         role="alert">
                      {uploadImageStatus === 'success' && 'Uploaded successfully!'}
                    </div>
                  )}
                </div>
              </div>



              <div className="mb-3">
                <Translate contentKey="tempApp.item.addons"></Translate>
                <Select isMulti={true} defaultValue={initSelectedAddons} onChange={handleAddonChange} options={addonsOptions} />
              </div>
              <div className="mb-3">
                <Translate contentKey="tempApp.item.terms">Category</Translate>
                <Select isMulti={true} defaultValue={entityTerms} onChange={handleTermChange} options={termsOptions} />
              </div>
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
                    {variants.filter((variant) => variant.archived !== true)?.map((variant) => (
                      <tr key={variant.id && variant.id}>
                        <td className="align-middle">{variant.name}</td>
                        <td className="align-middle">{variant.price}</td>
                        <td className="align-middle">
                          {variant.attachments?.map((attachment) => (
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
                            {variant.discounts?.map((discount) => (
                              <li key={discount?.id}>{`${discount?.type === 'PERCENTAGE' ? `${discount?.value}%` : `${discount?.value} ${discount?.type}`}`}</li>
                            ))}
                          </ul>

                        </td>

                        <td>
                          <Button  type={"button"}  onClick={() => openEditVariantModal(variant)} color="secondary" >
                            <FontAwesomeIcon icon="pencil-alt" />
                          </Button>
                        </td>
                        <td>
                          <Button type={"button"} color="danger" onClick={() => archiveVariant(variant.id)}  >
                            <FontAwesomeIcon icon="trash"  />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}<div className="mt-4 mb-4">
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
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/item" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating} innerRef={saveButtonRef}>
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
