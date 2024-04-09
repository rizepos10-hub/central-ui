import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, FormText, Spinner} from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from "react-select";
import value from "*.json";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {Card as PrimeCard} from 'primereact/card'


export const AddonUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addonEntity = useAppSelector(state => state.addon.entity);
  const loading = useAppSelector(state => state.addon.loading);
  const updating = useAppSelector(state => state.addon.updating);
  const updateSuccess = useAppSelector(state => state.addon.updateSuccess);
  const discounts = useAppSelector(state => state.discount.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const  handleDiscountsChange = selectedOptions => {
    console.log(selectedOptions, 'news')


    setSelectedDiscounts(selectedOptions);
  };
  const handleClose = () => {
    navigate('/addon' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    return () => {
      reset()
      setSelectedDiscounts([])
    }
  }, []);

  useEffect(() => {
    if(addonEntity.discounts){
      console.log(addonEntity.discounts, 'addonEntity.discounts')
      const defaultDiscounts = addonEntity?.discounts?.map(discount => ({
        label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
        id: discount.id,
        type: discount.type,
        value: discount.value
      })) || [];
      setSelectedDiscounts(defaultDiscounts)
    }
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess,addonEntity]);

  const saveEntity = values => {
    const entity = {
      ...addonEntity,
      ...values,
      discounts: selectedDiscounts,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {
        price: 0
      }
      : {
          ...addonEntity,
        };

  const defaultDiscountsOptions = addonEntity?.discounts?.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  })) || [];


  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  }));

  if(loading){
    return <Spinner />
  }


  return (
    <div>

      <Row>
        <Row>
          <Col md="8">
            <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
              {isNew ? <Translate contentKey={'addons.update.create.title'}>Create New Addon</Translate> : <Translate contentKey={'addons.update.edit.title'}>Edit Addon</Translate>}
            </h2>
          </Col>
        </Row>
        <Col md="8"  className="d-flex flex-column p-3">
          <PrimeCard>
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="addon-id"
                  label={translate('addons.update.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('addons.update.name')}
                id="addon-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField label={translate('addons.update.description')} id="addon-desc" name="desc" data-cy="desc" type="text" />
              <ValidatedField
                label={translate('addons.update.price')}
                id="addon-price"
                name="price"
                data-cy="price"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  validate: v => isNumber(v) || translate('entity.validation.number'),
                }}
              />
              <div className="mb-3">
                <Translate contentKey="addons.update.discount">Discount</Translate>
                <Select isMulti={true}
                        value={selectedDiscounts}
                        options={discountsOptions}
                        onChange={handleDiscountsChange} />
              </div>

              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/addon" replace color="info">
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
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default AddonUpdate;
