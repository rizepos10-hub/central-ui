import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Table,
  Label, FormGroup
} from 'reactstrap';
import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {ICustomer, IWholesalePriceLine} from 'app/shared/model/CUSTOMER/customer.model';
import {getEntity, updateEntity, createEntity, reset, updatePrices, getPricesForCustomer} from './customer.reducer';
import {Card as PrimeCard} from 'primereact/card'
import {filterOrders} from "app/entities/order/order.reducer";
import Order from "app/entities/order/order";
import {getEntities} from "app/entities/loyalty/loyalty-records.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {InputNumber} from "primereact/inputnumber";
import {changeEntityField} from "app/entities/discount/discount.reducer";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";

export const CustomerUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const priceLineOptions: (IWholesalePriceLine[keyof IWholesalePriceLine])[] = [
    "PRICE_1", "PRICE_2", "PRICE_3", "PRICE_4", "PRICE_5"
  ];


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();
  const fromLocation = new URLSearchParams(search).get('from');


  const customerEntity :ICustomer = useAppSelector(state => state.customer.entity);
  const loyaltyRecord = useAppSelector(state => state.loyalty.entities?.[0]);
  const branchList = useAppSelector(state => state.branch.entities);
  const wholeSaleBranches = branchList?.filter(branch => branch.wholesale);
  const loading = useAppSelector(state => state.customer.loading);
  const updating = useAppSelector(state => state.customer.updating);
  const updateSuccess = useAppSelector(state => state.customer.updateSuccess);

  const handleBranchPriceChange = (branchId, priceLine) => {
    dispatch(changeEntityField({
      name: 'wholesalePriceLines',
      value: {
      ...customerEntity.wholesalePriceLines,
        [branchId]: priceLine
      }
    }));
  };






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

    dispatch(getBranches({
      page: 0,
      size: 500,
      sort: 'asc',
    }));

  }, []);






  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity =  (e) => {
    e.preventDefault();
    const entity = {
      ...customerEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity))
    } else {
      dispatch(updateEntity(entity));
    }
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
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-firstName">{translate('customers.update.firstName')}</Label>
                  <InputText
                    id="customer-firstName"
                    value={customerEntity?.firstName || null}
                    onChange={e => dispatch(changeEntityField({name: 'firstName', value: e.target.value}))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-lastName">{translate('customers.update.lastName')}</Label>
                  <InputText
                    id="customer-lastName"
                    value={customerEntity?.lastName || null}
                    onChange={e => dispatch(changeEntityField({name: 'lastName', value: e.target.value}))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-phone">{translate('customers.update.phone')}</Label>
                  <InputText
                    id="customer-phone"
                    value={customerEntity?.phone || null}
                    onChange={e => dispatch(changeEntityField({name: 'phone', value: e.target.value}))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-mobileNumber">{translate('customers.update.mobileNumber')}</Label>
                  <InputText
                    id="customer-mobileNumber"
                    value={customerEntity?.mobileNumber || null}
                    onChange={e => dispatch(changeEntityField({name: 'mobileNumber', value: e.target.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-fax">{translate('customers.update.fax')}</Label>
                  <InputText
                    id="customer-fax"
                    value={customerEntity?.fax || null}
                    onChange={e => dispatch(changeEntityField({name: 'fax', value: e.target.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-phone">{translate('customers.update.email')}</Label>
                  <InputText
                    id="customer-email"
                    value={customerEntity?.email || null}
                    onChange={e => dispatch(changeEntityField({name: 'email', value: e.target.value}))}
                    required
                  />
                </div>

                {!isNew && <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="customer-phone">{translate('customers.update.loyaltyRecord')}</Label>
                  <InputNumber
                    id="customer-loyaltyRecord"
                    value={loyaltyRecord?.points ?? null}
                    disabled
                  />
                </div>}

                {wholeSaleBranches?.length > 0 ?
                  <>
                  <h4>Wholesale Price</h4>
                  <Table>
                  <thead>
                  <tr>
                  <th><Translate contentKey={'items.update.branch'}>Branch</Translate></th>
            <th>Price Line</th>
            </tr>
            </thead>
            <tbody>
          {wholeSaleBranches.map(branch => {
            return (
            <tr key={branch.id}>
            <td>{branch.name}</td>
            <td>
              <Dropdown
                placeholder={"Enter Price Line"}
                value={customerEntity?.wholesalePriceLines?.[branch.id]}
                options={priceLineOptions}
                style={{minWidth: '15rem'}}
                onChange={event => handleBranchPriceChange(branch.id, event.target.value)}
              />
            </td>
          </tr>
          )
          })}
        </tbody>
      </Table>
      </> : null}

                <h4>Customer Orders</h4>
                {customerEntity?.id && (
                  <div>
                    <Order customer={customerEntity?.id} />
                  </div>
                )}
              </FormGroup>

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
            </form>
          )}
          </PrimeCard>
        </Col>
      </Row>

    </div>
  );
};

export default CustomerUpdate;
