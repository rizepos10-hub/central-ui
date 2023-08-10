import { IBill } from 'app/shared/model/bill.model';
import { IBilledItem } from 'app/shared/model/billed-items.model';
import { IPaymentTransaction } from 'app/shared/model/payment-transaction.model';
import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
import { Translate } from 'react-jhipster';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import {IOrderedAddon} from "app/shared/model/ordered-addon.model";
import { format } from 'date-fns';

interface OrderBills {
  list:any;
  orderedItems: any
}
export const OrderBills: React.FC<OrderBills> = ({ list, orderedItems }) => {
  // id?: string;
  // dateTime?: string;
  // billItems?: IBilledItem[];
  // payee?: string;
  // paymentTransactions?: IPaymentTransaction[];
  const billList = list;

  const items = orderedItems

  console.log(items, 'items' )

  console.log(billList, 'bill')
  let subtotal = 0;
  let totalDiscounts = 0;
  let totalPrice = 0;
  billList.forEach((bill: any) => {
    bill.billItems.forEach((billItem: any) => {
      const orderedItem = orderedItems.find((item: any) => item.id === billItem.orderedItemId);
      if (orderedItem) {
        subtotal += orderedItem.price * billItem.amount;
        totalDiscounts += orderedItem.discount * billItem.amount;
      }
    });
  });
  totalPrice = subtotal - totalDiscounts;


  return (
    <div>
      <h4>Order Bills ({billList.length})</h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {billList && billList.length > 0 ? (
          <Table bordered hover responsive className="table-sm align-middle">
            <thead>
            <tr>
              <th>ID</th>
              <th>Item</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Date</th>
            </tr>
            </thead>
            <tbody>
            {billList.map((bill, i) => (
              <tr key={`entity-${i}`} data-cy="entityTable">
                <td>{bill.id}</td>
                <td>
                  {bill.billItems && bill.billItems.length > 0 ? (
                    <ListGroup>
                      {bill.billItems.map((billItem: any, j: number) => {
                        const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);
                        return (
                          <ListGroupItem key={`${j}`}>
                            {orderedItem ? <>{orderedItem.name || 'Coca-Cola'}</> : <span>Ordered item not found</span>}
                          </ListGroupItem>
                        );
                      })}
                    </ListGroup>
                  ) : (
                    <div>No items available.</div>
                  )}
                </td>
                <td>
                  {bill.billItems && bill.billItems.length > 0 ? (
                    <ListGroup>
                      {bill.billItems.map((billItem: any, j: number) => (
                        <ListGroupItem key={`${j}`}>{billItem.amount.toFixed(2)}</ListGroupItem>
                      ))}
                    </ListGroup>
                  ) : (
                    <div>No items available.</div>
                  )}
                </td>
                <td>
                  {bill.billItems && bill.billItems.length > 0 ? (
                    <ListGroup>
                      {bill.billItems.map((billItem: any, j: number) => {
                        const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);
                        return (
                          <ListGroupItem key={`${j}`}>
                            {orderedItem ? orderedItem.price : '-'}
                          </ListGroupItem>
                        );
                      })}
                    </ListGroup>
                  ) : (
                    ''
                  )}
                </td>
                <td>
                  {bill.billItems && bill.billItems.length > 0 ? (
                    <ListGroup>
                      {bill.billItems.map((billItem: any, j: number) => {

                        const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);
                        console.log(orderedItem, 'lol')
                        return (
                          <ListGroupItem key={`${j}`}>
                            {orderedItem && (orderedItem.discount ?? 0)}
                          </ListGroupItem>
                        );
                      })}
                    </ListGroup>
                  ) : (
                    0
                  )}
                </td>
                <td>
                  {bill.billItems && bill.billItems.length > 0 ? (
                    <ListGroup>
                      {bill.billItems.map((billItem: any, j: number) => {
                        const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);
                        const total = orderedItem ? orderedItem.price * billItem.amount : 0;
                        return (
                          <ListGroupItem key={`${j}`}>{total.toFixed(2)}</ListGroupItem>
                        );
                      })}
                    </ListGroup>
                  ) : (
                    ''
                  )}
                </td>
                <td>
                  {bill.paymentTransactions.map((item, index) => (
                    <div key={index}>
                        <span>
                          {index + 1} - {item.method}
                        </span>
                    </div>
                  ))}
                </td>
                <td>{format(new Date(bill.dateTime), 'MMMM dd, yyyy')}</td>
              </tr>
            ))}
            </tbody>
          </Table>
        ) : (
          <div>No items available.</div>
        )}
      </div>
      {billList.length > 0 && (
        <Card className="mt-3 p-3">
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Subtotal</strong>
            </div>
            <div className="text-center">$ {subtotal.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Total Discounts</strong>
            </div>
            <div className="text-center">$ {totalDiscounts.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Total Price</strong>
            </div>
            <div className="text-center">$ {totalPrice.toFixed(2)}</div>
          </div>
        </Card>
      )}
    </div>
  );
};
