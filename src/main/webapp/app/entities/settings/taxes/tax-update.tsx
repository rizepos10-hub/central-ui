import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IItem } from 'app/shared/model/item.model';
import { getEntities as getItems } from 'app/entities/item/restaurant/regular-item/item.reducer';
import { ITax } from 'app/shared/model/tax.model';
import { getEntity, updateEntity, createEntity, reset } from './tax.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from "react-select";
import value from "*.json";


export const TaxUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const items = useAppSelector(state => state.item.entities);
  const taxEntity = useAppSelector(state => state.tax.entity);
  const loading = useAppSelector(state => state.tax.loading);
  const updating = useAppSelector(state => state.tax.updating);
  const updateSuccess = useAppSelector(state => state.tax.updateSuccess);
  const discounts = useAppSelector(state => state.discount.entities);

  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const  handleDiscountsChange = selectedOptions => {
    console.log(selectedOptions, 'news')
    const selectedValues = selectedOptions.map((option) => ({
      id: option.id,
      type: option.type,
      value: option.value
    }));

    setSelectedDiscounts(selectedValues);
  };
  const handleClose = () => {
    navigate('/tax' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

  }, []);

  useEffect(() => {
    if(taxEntity.discounts){

    }
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    console.log(values, 'values')
    console.log(taxEntity, 'taxEntity')
    const entity = {
      ...taxEntity,
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
      ? {}
      : {
          ...taxEntity,
        discounts: taxEntity.discounts,
        };

  const defaultDiscountsOptions = taxEntity?.discounts?.map(discount => ({
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


  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="tempApp.tax.home.createOrEditLabel" data-cy="TaxCreateUpdateHeading">
            <Translate contentKey="tempApp.tax.home.createOrEditLabel">Create or edit a Tax</Translate>
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
                  id="tax-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('tempApp.tax.code')}
                id="tax-code"
                name="code"
                data-cy="code"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField label={translate('tempApp.tax.desc')} id="tax-desc" name="desc" data-cy="desc" type="text" />
              <ValidatedField
                label={translate('tempApp.tax.value')}
                id="tax-value"
                name="value"
                data-cy="value"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  validate: v => isNumber(v) || translate('entity.validation.number'),
                }}
              />
              <div className="mb-3">
                <Translate contentKey="tempApp.item.variant.discount">Discount</Translate>
                <Select isMulti={true}
                        defaultValue={defaultDiscountsOptions}
                        options={discountsOptions}
                        onChange={handleDiscountsChange} />
              </div>

              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/tax" replace color="info">
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

export default TaxUpdate;
