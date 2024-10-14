import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Table,
  Label, FormGroup
} from 'reactstrap';
import { Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer, IWholesalePriceLine } from 'app/shared/model/CUSTOMER/customer.model';
import { getEntity, updateEntity, createEntity, reset, changeEntityField, updatePrices, getPricesForCustomer } from './customer.reducer';
import { Card as PrimeCard } from 'primereact/card'
import { filterOrders } from "app/entities/order/order.reducer";
import Order from "app/entities/order/order";
import { getEntities } from "app/entities/loyalty/loyalty-records.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

export const CustomerUpdate = ({
  firstName,
  isPopUp,
  closePopUp
}: {
  firstName?: string
  isPopUp?: boolean
  closePopUp?: (id) => void
}) => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const priceLineOptions: (IWholesalePriceLine[keyof IWholesalePriceLine])[] = [
    "PRICE_1", "PRICE_2", "PRICE_3", "PRICE_4", "PRICE_5"
  ];


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();
  const fromLocation = new URLSearchParams(search).get('from');


  const customerEntity: ICustomer = useAppSelector(state => state.customer.entity);
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


  // useEffect(() => {
  //   if (firstName) {
  //     console.log(1)
  //     dispatch(changeEntityField({ name: 'firstName', value: firstName }));
  //     console.log(customerEntity)
  //   }
  // }, [firstName]);


  // console.log(customerEntity)
  // console.log(customerEntity?.firstName)

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {

    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
      const filters = {};
      filters['customer.id'] = { value: id, matchMode: "EQUALS" }
      const params = {
        first: 0,
        rows: 100,
        page: 0,
        sortField: null,
        sortOrder: null,
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

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...customerEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            if(isPopUp) {
              closePopUp(newId)
              return
            }
            navigate(`/customer/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/customer/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="12">
          <h2 id="tempApp.customer.home.createOrEditLabel" data-cy="CustomerCreateUpdateHeading">
            {isNew ? (
              <Translate contentKey="tempApp.createNewCustomer">Create New Customer</Translate>
            ) : (
              <Translate contentKey="tempApp.editCustomer">Edit Customer</Translate>
            )}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <FormGroup>
                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-firstName">{translate('tempApp.firstName')}</Label>
                    <InputText
                      id="customer-firstName"
                      value={customerEntity?.firstName || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'firstName', value: e.target.value }))}
                      required={!customerEntity?.businessDetails?.businessName}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-lastName">{translate('tempApp.lastName')}</Label>
                    <InputText
                      id="customer-lastName"
                      value={customerEntity?.lastName || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'lastName', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-phone">{translate('tempApp.phone')}</Label>
                    <InputText
                      id="customer-phone"
                      value={customerEntity?.phone || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'phone', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-mobileNumber">{translate('tempApp.mobileNumber')}</Label>
                    <InputText
                      id="customer-mobileNumber"
                      value={customerEntity?.mobileNumber || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'mobileNumber', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-fax">{translate('tempApp.fax')}</Label>
                    <InputText
                      id="customer-fax"
                      value={customerEntity?.fax || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'fax', value: e.target.value }))}
                    />
                  </div>

                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-phone">{translate('tempApp.email')}</Label>
                    <InputText
                      id="customer-email"
                      value={customerEntity?.email || ''}
                      onChange={e => dispatch(changeEntityField({ name: 'email', value: e.target.value }))}
                    />
                  </div>

                  {!isNew && (
                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="customer-phone">{translate('tempApp.loyaltyRecord')}</Label>
                      <InputNumber id="customer-loyaltyRecord" value={loyaltyRecord?.points ?? ''} disabled />
                    </div>
                  )}
                  <>
                    <h4>{translate("common.additionalInfo")}</h4>
                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="customer-businessName">{translate('tempApp.businessName')}</Label>
                      <InputText
                        id="customer-businessName"
                        value={customerEntity?.businessDetails?.businessName || ""}
                        onChange={e => dispatch(changeEntityField({
                          name: 'businessDetails', value: {
                            ...customerEntity.businessDetails,
                            businessName: e.target.value
                          }
                        }))}
                        required={!customerEntity?.firstName}
                      />
                    </div>
                  </>

                  {wholeSaleBranches?.length > 0 ? (
                    <>
                      <h4>Wholesale Price</h4>
                      <Table>
                        <thead>
                          <tr>
                            <th>
                              <Translate contentKey={'common.branch'}>Branch</Translate>
                            </th>
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
                                    placeholder={'Enter Price Line'}
                                    value={customerEntity?.wholesalePriceLines?.[branch.id] || ''}
                                    options={priceLineOptions}
                                    style={{ minWidth: '15rem' }}
                                    onChange={event => handleBranchPriceChange(branch.id, event.target.value)}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </>
                  ) : null}

                  <h4>{translate("tempApp.customerOrders")}</h4>
                  {customerEntity?.id && (
                    <div>
                      <Order customer={customerEntity?.id} />
                    </div>
                  )}
                </FormGroup>
                {!isPopUp ? (
                  <>
                    <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                      <FontAwesomeIcon icon="arrow-left" />
                      &nbsp;
                      <span className="d-none d-md-inline">
                        <Translate contentKey="entity.action.back">Back</Translate>
                      </span>
                    </Button>
                    &nbsp;
                    <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                      <FontAwesomeIcon icon="save" />
                      &nbsp;
                      <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                    &nbsp;
                    <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                      <FontAwesomeIcon icon="save" />
                      &nbsp;
                      <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                    </Button>
                  </>
                ) : (
                  <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <FontAwesomeIcon icon="save" />
                    &nbsp;
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                )}
              </form>
            )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerUpdate;
