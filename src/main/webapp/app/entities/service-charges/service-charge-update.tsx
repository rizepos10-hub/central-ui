import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label} from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntity, updateEntity, createEntity, reset, changeEntityField} from './service-charge.reducer';
import Select from "react-select";
import {InputNumber} from "primereact/inputnumber";
import {DiscountType} from "app/shared/model/ENUMS/discount-type.model";

export const ServiceChargeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const discountEntity = useAppSelector(state => state.discount.entity);
  const loading = useAppSelector(state => state.discount.loading);
  const updating = useAppSelector(state => state.discount.updating);
  const updateSuccess = useAppSelector(state => state.discount.updateSuccess);
  const discountTypeValuesOptions = Object.keys(DiscountType).map(opt => ({label: opt, value: opt}));

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    return () => {
      dispatch(reset());
    }
  }, [updateSuccess]);



  const handleClose = () => {
    navigate('/discount' + location.search);
  };

  const saveEntity = (e) => {
    e.preventDefault();
    if (isNew) {
      dispatch(createEntity(discountEntity));
    } else {
      dispatch(updateEntity(discountEntity));
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.discount.home.createOrEditLabel" data-cy="DiscountCreateUpdateHeading">
            {isNew ? "Create New Discount" : "Edit Discount"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
              <div className={"d-flex flex-column mb-3"}>
                <Label htmlFor="discount-value">{translate('tempApp.discount.value')}</Label>
                <InputNumber
                  id="discount-value"
                  value={discountEntity.value || null}
                  onChange={e => dispatch(changeEntityField({name: 'value',value: e.value}))}
                  required
                />
              </div>

              <div className="d-flex flex-column">
                <Label htmlFor="discount-type">{translate('tempApp.discount.type')}</Label>
                <Select
                  id="discount-type"
                  name={"type"}
                  required
                  options={discountTypeValuesOptions}
                  value={discountEntity?.type ? {label: discountEntity?.type, value: discountEntity?.type} : null}
                  onChange={(selectedType: {label: string, value: string}) => dispatch(changeEntityField({name: 'type', value: selectedType?.value}))}
                />
              </div>
              </FormGroup>

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
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ServiceChargeUpdate;
