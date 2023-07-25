import React, { useState, useEffect } from 'react';
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

export const ItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

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
    .filter(term => term.taxonomy.name === 'Item-category')
    .map(term => ({ value: term.id, label: term.name }));
  const [selectedTerms, setSelectedTerms] = useState(entityTerms);

  const [openedModal, setOpenedModal] = useState(false);

  const [variants, setVariants] = useState([]);

  const handleClose = () => {
    navigate('/item' + location.search);
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
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }

    setVariants(itemEntity.variants);
  }, [updateSuccess, itemEntity?.variants]);

  const saveEntity = values => {
    let toBeSavedAddons = [],
      termsToBeSaved = [];
    selectedAddons?.forEach(addon => toBeSavedAddons.push({ id: addon.value }));
    selectedTerms?.forEach(term => termsToBeSaved.push({ id: term.value }));

    console.log(toBeSavedAddons, 'addons save');

    const entity = {
      ...itemEntity,
      ...values,
      menu: menus.find(it => it.id.toString() === values.menu.toString()),
      addons: toBeSavedAddons,
      terms: termsToBeSaved,
      variants: variants,
    };
    console.log(entity, 'entity sent');

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };
  const handleCloseModal = () => {
    setOpenedModal(false);
  };
  const openVariantModal = () => {
    setOpenedModal(true);
  };
  const handleSaveVariant = (name, price, discount) => {
    console.log('variant values');
    // variants.push()
    console.log(name, 'name in var ');
    console.log(price);
    const newValues = { name: name, price: price, discounts: discount };
    const newVariants = [...variants, newValues];

    if (newVariants) {
      console.log(newVariants, 'var1');
      setVariants(prevVariants => [...prevVariants, newValues]);
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
      <ItemVariantModal showModal={openedModal} handleClose={handleCloseModal} handleSave={handleSaveVariant}></ItemVariantModal>

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
              <ValidatedField label={translate('tempApp.item.desc')} id="item-desc" name="desc" data-cy="desc" type="text" />
              <ValidatedField
                label={translate('tempApp.item.orderCount')}
                id="item-orderCount"
                name="orderCount"
                data-cy="orderCount"
                type="text"
              />
              <ValidatedField
                label={translate('tempApp.item.avgRating')}
                id="item-avgRating"
                name="avgRating"
                data-cy="avgRating"
                type="text"
              />
              <ValidatedField
                label={translate('tempApp.item.ratingCount')}
                id="item-ratingCount"
                name="ratingCount"
                data-cy="ratingCount"
                type="text"
              />
              <ValidatedField
                label={translate('tempApp.item.stock')}
                id="item-stock"
                name="stock"
                data-cy="stock"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  validate: v => isNumber(v) || translate('entity.validation.number'),
                }}
              />
              <ValidatedField label={translate('tempApp.item.status')} id="item-status" name="status" data-cy="status" type="select">
                {itemStatusValues.map(itemStatus => (
                  <option value={itemStatus} key={itemStatus}>
                    {translate('tempApp.ItemStatus.' + itemStatus)}
                  </option>
                ))}
              </ValidatedField>
              <div className="mb-3">
                <Translate contentKey="tempApp.item.addons"></Translate>
                <Select isMulti={true} defaultValue={initSelectedAddons} onChange={setSelectedAddons} options={addonsOptions} />
              </div>
              <div className="mb-3">
                <Translate contentKey="tempApp.item.terms">Category</Translate>
                <Select isMulti={true} defaultValue={entityTerms} onChange={setSelectedTerms} options={termsOptions} />
              </div>
              {variants ? (
                variants.map((otherEntity, index) => (
                  <option value={otherEntity.id} key={index}>
                    {index + ' ' + otherEntity.name}
                  </option>
                ))
              ) : (
                <p>empty</p>
              )}
              <Button onClick={openVariantModal}> Add Variant</Button>
              <ValidatedField id="item-menu" name="menu" data-cy="menu" label={translate('tempApp.item.menu')} type="select">
                <option value="" key="0" />
                {menus
                  ? menus.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id + ' ' + otherEntity.name}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/item" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
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
