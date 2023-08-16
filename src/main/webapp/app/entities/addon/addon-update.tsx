import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IItem } from 'app/shared/model/item.model';
import { getEntities as getItems } from 'app/entities/item/item.reducer';
import { IAddon } from 'app/shared/model/addon.model';
import { getEntity, updateEntity, createEntity, reset } from './addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from "react-select";
import value from "*.json";


export const AddonUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const items = useAppSelector(state => state.item.entities);
  const addonEntity = useAppSelector(state => state.addon.entity);
  const loading = useAppSelector(state => state.addon.loading);
  const updating = useAppSelector(state => state.addon.updating);
  const updateSuccess = useAppSelector(state => state.addon.updateSuccess);
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
    navigate('/addon' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getDiscounts({}));

    dispatch(getItems({}));
  }, []);

  useEffect(() => {
    if(addonEntity.discounts){

    }
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    console.log(values, 'values')
    console.log(addonEntity, 'addonEntity')
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
      ? {}
      : {
          ...addonEntity,
        discounts: addonEntity.discounts,
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
            <Translate contentKey="tempApp.addon.home.createOrEditLabel">Create or edit a Addon</Translate>
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
                  id="addon-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('tempApp.addon.name')}
                id="addon-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField label={translate('tempApp.addon.desc')} id="addon-desc" name="desc" data-cy="desc" type="text" />
              <ValidatedField
                label={translate('tempApp.addon.price')}
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
                <Translate contentKey="tempApp.item.variant.discount">Discount</Translate>
                <Select isMulti={true} defaultValue={addonEntity?.discounts?.map((discount) => ({label: `${discount.type} ${discount.value}`, id: discount.id, type: discount.type, value: discount.value  }) )}  onChange={handleDiscountsChange}
                        options={discounts.map((discount) => ({label: `${discount.type} ${discount.value}`, id: discount.id, type: discount.type, value: discount.value  }) )} />
              </div>
              {/* <ValidatedField id="addon-item" name="item" data-cy="item" label={translate('tempApp.addon.item')} type="select"> */}
              {/*   <option value="" key="0" /> */}
              {/*   {items */}
              {/*     ? items.map(otherEntity => ( */}
              {/*         <option value={otherEntity.id} key={otherEntity.id}> */}
              {/*           {otherEntity.name} */}
              {/*         </option> */}
              {/*       )) */}
              {/*     : null} */}
              {/* </ValidatedField> */}
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
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AddonUpdate;
