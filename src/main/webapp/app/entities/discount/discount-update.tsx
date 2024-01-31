import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { IDiscount } from 'app/shared/model/discount.model';
import { DiscountType } from 'app/shared/model/ENUMS/discount-type.model';
import { getEntity, updateEntity, createEntity, reset } from './discount.reducer';

export const DiscountUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addons = useAppSelector(state => state.addon.entities);
  const discountEntity = useAppSelector(state => state.discount.entity);
  const loading = useAppSelector(state => state.discount.loading);
  const updating = useAppSelector(state => state.discount.updating);
  const updateSuccess = useAppSelector(state => state.discount.updateSuccess);
  const discountTypeValues = Object.keys(DiscountType);

  const handleClose = () => {
    navigate('/discount' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }


  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    const entity = {
      ...discountEntity,
      ...values,
      // addon: addons.find(it => it.id.toString() === values.addon.toString()),
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
          type: 'PERCENTAGE',
          ...discountEntity,
          addon: discountEntity?.addon?.id,
        };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.discount.home.createOrEditLabel" data-cy="DiscountCreateUpdateHeading">
            {isNew? "Create New Discount" : "Edit Discount"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="discount-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('tempApp.discount.value')}
                id="discount-value"
                name="value"
                data-cy="value"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  validate: v => isNumber(v) || translate('entity.validation.number'),
                }}
              />
              <ValidatedField label={translate('tempApp.discount.type')} id="discount-type" name="type" data-cy="type" type="select">
                {discountTypeValues.map(discountType => (
                  <option value={discountType} key={discountType}>
                    {translate('tempApp.DiscountType.' + discountType)}
                  </option>
                ))}
              </ValidatedField>
              {/* <ValidatedField id="discount-addon" name="addon" data-cy="addon" label={translate('tempApp.discount.addon')} type="select"> */}
              {/*   <option value="" key="0" /> */}
              {/*   {addons */}
              {/*     ? addons.map(otherEntity => ( */}
              {/*         <option value={otherEntity.id} key={otherEntity.id}> */}
              {/*           {otherEntity.id} */}
              {/*         </option> */}
              {/*       )) */}
              {/*     : null} */}
              {/* </ValidatedField> */}
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/discount" replace color="info">
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

export default DiscountUpdate;
