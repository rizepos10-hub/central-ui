import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {Button, Row, Col, Card} from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './order.reducer';
import CustomerDetail from 'app/entities/customer/customer-detail';
import OrderCustomerDetail from 'app/entities/order/order-customer-details';
import { OrderBills } from 'app/entities/order/order-bills';
import { OrderedItems } from 'app/entities/order/ordered-items';

export const OrderDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const orderEntity = useAppSelector(state => state.order.entity);

  console.log(orderEntity, 'orderEntityorderEntity')

  return (
    <Row>
      <h2 data-cy="orderDetailsHeading">
        <Translate contentKey="tempApp.order.detail.title">Order</Translate>
      </h2>
      <Col md="8" className="d-flex flex-wrap container">
              <div className="container">

                <Row>
                <Col md="9">

                    <div>{orderEntity.items ? <OrderedItems list={orderEntity.items} /> : ''}</div>
                </Col>

                {/* Customer Card */}
                <Col md="3" className="mb-3">
                    {orderEntity.customer ? (
                      <Card className="border p-3 mt-lg-3 h-100">

                      <OrderCustomerDetail
                        email={orderEntity.customer.email}
                        firstName={orderEntity.customer.firstName}
                        lastName={orderEntity.customer.lastName}
                        phone={orderEntity.customer.phone}
                      />
                      </Card>

                    ) : (
                      <>
                      <h4 data-cy="customerDetailsHeading">
                      <strong> <Translate contentKey="tempApp.customer.detail.title">Customer</Translate></strong>
                      </h4>
                      <div >
                      Walk In
                      </div>
                      </>
                    )}
                </Col>
                </Row>

</div>
        <div className="container">

        <Col md="12" className="mt-lg-5">


          {orderEntity.bills && <OrderBills orderedItems={orderEntity.items} list={orderEntity.bills}></OrderBills> }
        </Col>
        </div>
      </Col>
      <div className="text-end">
        <Button tag={Link} to="/order" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
      </div>
    </Row>
  );
};

export default OrderDetail;
