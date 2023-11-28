import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {Button, Row, Col, Card} from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './order.reducer';
import OrderCustomerDetail from 'app/entities/order/order-customer-details';
import { OrderedItems } from 'app/entities/order/ordered-items';
import {OrderBill} from "app/entities/order/order-bill";

export const OrderDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();
  const orderEntity = useAppSelector(state => state.order.entity);
  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items)
      ? orderEntity.items.filter(item => item.archived !== true)
      : [],
  };

  console.log(orderEntity, 'orderEntity')

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const subtotal = filteredOrderEntity.items?.reduce((acc, item) => acc + item.price, 0);
  const totalDiscounts = filteredOrderEntity.items?.reduce((acc, item) => {
    if (item.discount?.type === 'PERCENTAGE') {
      return acc + (item.price * item.discount.value) / 100;
    } else if (item.discount?.type === 'FLAT') {
      return acc + (item.discount.value !== undefined ? item.discount.value : 0);
    } else {
      return acc;
    }
  }, 0);

  const totalItemsPrice = subtotal - totalDiscounts;

  const totalPaymentAmount = filteredOrderEntity?.bills?.reduce((total, bill) => {
    const billPaymentTotal = bill.paymentTransactions.filter((payment) => payment.returnType !== "refund").reduce(
      (acc, transaction) => {
        const transactionAmount = transaction.amount ? transaction.amount : 0;
        console.log(`Transaction amount: ${transactionAmount}`);
        return acc + transactionAmount;
      },
      0
    );

    console.log(`Bill payment total: ${billPaymentTotal}`);

    return total + billPaymentTotal;
  }, 0);

  console.log(`Total payment amount: ${totalPaymentAmount}`);



  console.log(orderEntity.bills, 'orderEntityorderEntity')
  console.log(totalItemsPrice, 'totalItemsPrice')

  console.log(totalPaymentAmount, 'totalPaymentAmount')


  return (
    <Row>
      <h2 className="mb-3">
        Order <span className="text-primary">#{filteredOrderEntity.sequenceNumber}</span>
      </h2>
      <Col md="12" className="d-flex flex-wrap ">
        <Card>

              <div className="d-flex flex-grow-1 gap-2">

                <Col md="9">

                    <div>{orderEntity?.items ? <OrderedItems list={filteredOrderEntity.items} totalPayments={totalPaymentAmount} /> : ''}</div>
                </Col>

                <Col md="3" className="mt-3">
                    {filteredOrderEntity.customer ? (
                      <Card className="border p-3 mt-lg-3 " style={{ height: '28.5rem'}} >

                      <OrderCustomerDetail
                        email={filteredOrderEntity.customer.email}
                        firstName={filteredOrderEntity.customer.firstName}
                        lastName={filteredOrderEntity.customer.lastName}
                        phone={filteredOrderEntity.customer.phone}
                      />
                      </Card>

                    ) : (
                      <>
                      <h4 data-cy="customerDetailsHeading">
                      <strong> <Translate contentKey="tempApp.customer.detail.title">Customer</Translate></strong>
                      </h4>
                        <Card className="border p-3 mt-lg-3 "  style={{ height: '28.5rem'}}>

                        Walk In
                      </Card>
                      </>
                    )}
                </Col>

</div>
        </Card>
        <div className="">

        <Col md="12" className="mt-lg-5">


          {filteredOrderEntity.bills && <OrderBill orderedItems={filteredOrderEntity?.items} list={filteredOrderEntity?.bills}></OrderBill> }
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
