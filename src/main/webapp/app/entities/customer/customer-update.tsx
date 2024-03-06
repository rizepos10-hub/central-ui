import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormText, Table, DropdownToggle, Dropdown, DropdownItem, DropdownMenu} from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import {getEntity, updateEntity, createEntity, reset, updatePrices, getPricesForCustomer} from './customer.reducer';
import Select from "react-select";
import {Card as PrimeCard} from 'primereact/card'
import {filterOrders} from "app/entities/order/order.reducer";
import Order from "app/entities/order/order";
import {getEntities} from "app/entities/loyalty/loyalty-records.reducer";

export const CustomerUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();



  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();
  const fromLocation = new URLSearchParams(search).get('from');


  const customerEntity = useAppSelector(state => state.customer.entity);
  const loyaltyRecord = useAppSelector(state => state.loyalty.entities?.[0]);

  const loading = useAppSelector(state => state.customer.loading);
  const updating = useAppSelector(state => state.customer.updating);
  const updateSuccess = useAppSelector(state => state.customer.updateSuccess);
  const orderList = useAppSelector(state => state.order.entities);





  const handleClose = () => {
    navigate('/customer' + location.search);
  };

  useEffect(() => {

    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
      const filters = {};
      filters['customer.id'] = {value: id, matchMode: "EQUALS"}
      const params = {
        first:  0,
        rows: 100,
        page: 0,
        sortField:  null,
        sortOrder:  null,
        filters,
      }
      dispatch(
        getEntities(params)
      );
      const queryParams = {
        customerEmail: id,
      };
      dispatch(filterOrders(queryParams));
    }

  }, []);






  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = async (values) => {
    const entity = {
      ...customerEntity,
      ...values,
    };
    const customerId = customerEntity.id;

    if (isNew) {
      dispatch(createEntity(entity))
    } else {
      dispatch(updateEntity(entity));
    }
  };

  console.log(customerEntity, 'customerEntity');

  console.log(loyaltyRecord, 'loyaltyRecord')

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...customerEntity,
             loyaltyRecord: loyaltyRecord?.points
        };





  return (
    <div>
      <Row >
        <Col md="8">
          <h2 id="tempApp.customer.home.createOrEditLabel" data-cy="CustomerCreateUpdateHeading">
            {isNew? <Translate contentKey="customers.update.create.title">Create New Customer</Translate> : <Translate contentKey="customers.update.edit.title">Edit Customer</Translate>}
          </h2>
        </Col>
      </Row>
      <Row >
        <Col md="8"  className="d-flex flex-column p-3">
          <PrimeCard>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>

              <ValidatedField
                label={translate('customers.update.firstName')}
                id="customer-firstName"
                name="firstName"
                data-cy="firstName"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('customers.update.lastName')}
                id="customer-lastName"
                name="lastName"
                data-cy="lastName"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('customers.update.phone')}
                id="customer-phone"
                name="phone"
                data-cy="phone"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
              <ValidatedField
                label={translate('customers.update.email')}
                id="customer-email"
                name="email"
                data-cy="email"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />

              <ValidatedField
                label={translate('customers.update.loyaltyRecord')}
                id="loyalty-record"
                name="loyaltyRecord"
                data-cy="loyaltyRecord"
                type="number"
                disabled
                validate={{
                  disabled: true
                }}
              />

              {customerEntity?.id && (
                <div>
                  <Order customer={customerEntity?.id} />
                </div>
              )}

              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to={fromLocation ? fromLocation : "/customer"} replace color="info">
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
          </PrimeCard>
        </Col>
      </Row>

    </div>
  );
};

export default CustomerUpdate;
