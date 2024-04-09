import React, { useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, Card, Spinner, CardHeader, CardBody, Label} from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './order.reducer';
import OrderCustomerDetail from 'app/entities/order/order-customer-details';
import { OrderedItems } from 'app/entities/order/ordered-items';
import {OrderBill} from "app/entities/order/order-bill";
import OrderGeneralInfo from "app/entities/order/order-general-info";
import {SelectButton} from "primereact/selectbutton";
import AuditLogs from "app/shared/components/logs/audit-logs";

export const OrderDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { id } = useParams<'id'>();
  const orderEntity = useAppSelector(state => state.order.entity);
  const loading = useAppSelector(state => state.order.loading);
  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items)
      ? orderEntity.items.filter(item => item.archived !== true)
      : [],
  };

  const navigateCustomer = () => {
    navigate(`/customer/${filteredOrderEntity?.customer?.id}/edit?from=${location.pathname}`);
  };

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
        return acc + transactionAmount;
      },
      0
    );
    return total + billPaymentTotal;
  }, 0);

  if(loading){
    return <Spinner />;
  }

  return (
    <>
      <h3 className="mb-3">
        <Translate contentKey={'orders.details.title'}>Order</Translate> <span className="text-primary">#{filteredOrderEntity.sequenceNumber}</span>
      </h3>
      <div className={"d-flex flex-row"} >
      <Col md="9" className="d-flex flex-wrap ">
                <Card className={"w-full d-flex flex-column gap-2"}>
                 <OrderGeneralInfo order={filteredOrderEntity} />
                </Card>
                <Card className={"w-full"}>

              <div className="d-flex flex-grow-1 gap-2">
                <Col md="9" >
                  <h3> <strong><Translate contentKey={'orders.details.itemsCard.title'}>Items</Translate></strong></h3>

                    <div>
                      {orderEntity?.items ?
                      <OrderedItems list={filteredOrderEntity.items} totalPayments={totalPaymentAmount} />
                      : null}
                    </div>
                </Col>

                <Col md="3" className="mt-3">
                    {filteredOrderEntity.customer ? (
                      <Card className="border p-3 mt-lg-3 cursor-pointer" style={{ height: '28.5rem'}} onClick={navigateCustomer}>

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
        <div className="w-full">

        <Col md="12" className="mt-lg-5">
          <Card className="mb-3">
            <h3> <strong><Translate contentKey={'orders.details.billsCard.title'}>Bills</Translate></strong></h3>
          {filteredOrderEntity.bills && <OrderBill orderedItems={filteredOrderEntity?.items} list={filteredOrderEntity?.bills}></OrderBill> }
          </Card>
        </Col>
        </div>
      </Col>
      <Col md="3" className={'ml-3'}>
        <Card>
          <CardHeader>Actions</CardHeader>

          <div className="text-end mt-3">
            <Button tag={Link} to="/order" replace color="info" data-cy="entityDetailsBackButton">
              <FontAwesomeIcon icon="arrow-left" />{' '}
              <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
            </Button>
          </div>

        </Card>

        {orderEntity?.id &&  <AuditLogs entityId={orderEntity?.id} />}
      </Col>
      </div>
    </>
  );
};

export default OrderDetail;
