import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText, FormGroup, Label } from "reactstrap";
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './tax.reducer';
import Select from "react-select";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

export const TaxUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const taxEntity = useAppSelector(state => state.tax.entity);
  const loading = useAppSelector(state => state.tax.loading);
  const updating = useAppSelector(state => state.tax.updating);
  const updateSuccess = useAppSelector(state => state.tax.updateSuccess);
  const discounts = useAppSelector(state => state.discount.entities);

  const taxCodeRef = useRef(null);
  const taxDescRef = useRef(null);
  const taxValueRef = useRef(null);

  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const  handleDiscountsChange = selectedOptions => {
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
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={'d-flex flex-column'}>
                  <Label for="tax-code">{translate('tempApp.tax.code')}</Label>
                  <InputText required={true} id="tax-code" ref={taxCodeRef} />
                </div>

                <div className={'d-flex flex-column'}>
                  <Label for="tax-desc">{translate('tempApp.tax.desc')}</Label>
                  <InputTextarea id="tax-desc" ref={taxDescRef} />
                </div>

                <div className={'d-flex flex-column'}>
                  <Label for="tax-value">{translate('tempApp.tax.value')}</Label>
                  <InputTextarea id="tax-value" ref={taxValueRef} />
                </div>


              </FormGroup>
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
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TaxUpdate;
