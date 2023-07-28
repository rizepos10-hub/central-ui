import React from 'react';
import { ICustomer } from 'app/shared/model/customer.model';
import { Translate } from 'react-jhipster';

export const OrderCustomerDetail = (props: ICustomer) => {
  const customerEntity = props;
  console.log(customerEntity);
  return (
    <div>
      <h4 data-cy="customerDetailsHeading">
        <Translate contentKey="tempApp.customer.detail.title">Customer</Translate>
      </h4>
      <dl className="jh-entity-details">
        <dt>
          <span id="id">
            <Translate contentKey="global.field.id">ID</Translate>
          </span>
        </dt>
        <dd>{customerEntity.id}</dd>
        <dt>
          <span id="orderCount">
            <Translate contentKey="tempApp.customer.orderCount">Order Count</Translate>
          </span>
        </dt>
        <dd>{customerEntity.orderCount}</dd>
        <dt>
          <span id="phone">
            <Translate contentKey="tempApp.customer.phone">Phone</Translate>
          </span>
        </dt>
        <dd>{customerEntity.phone}</dd>
        <dt>
          <span id="status">
            <Translate contentKey="tempApp.customer.status">Status</Translate>
          </span>
        </dt>
        <dd>{customerEntity.status}</dd>
      </dl>
    </div>
  );
};

export default OrderCustomerDetail;
