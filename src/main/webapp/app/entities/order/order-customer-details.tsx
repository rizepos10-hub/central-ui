import React from 'react';
import { ICustomer } from 'app/shared/model/customer.model';
import { Translate } from 'react-jhipster';

export const OrderCustomerDetail = (props: ICustomer) => {
  const customerEntity = props;
  console.log(customerEntity, 'customerEntity');
  return (
    <div>
      <h4 data-cy="customerDetailsHeading">
        <Translate contentKey="tempApp.customer.detail.title">Customer</Translate>
      </h4>
      <dl className="jh-entity-details">
        <dt>
          <span id="name">
          <strong>  <Translate contentKey="tempApp.customer.name">Name</Translate></strong>
          </span>
        </dt>
        <dd>{customerEntity.firstName + ' ' +  customerEntity.lastName }</dd>
        <dt>
          <span id="orderCount">
            <Translate contentKey="tempApp.customer.email">Email</Translate>
          </span>
        </dt>
        <dd>{customerEntity.email}</dd>
        <dt>
          <span id="phone">
            <Translate contentKey="tempApp.customer.phone">Phone</Translate>
          </span>
        </dt>
        <dd>{customerEntity.phone}</dd>

      </dl>
    </div>
  );
};

export default OrderCustomerDetail;
