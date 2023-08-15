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
  // let subtotal = 0;
  // let totalDiscounts = 0;
  // let totalPrice = 0;

  // billList.forEach((bill: any) => {
  //   bill.billItems.forEach((billItem: any) => {
  //     const orderedItem = orderedItems.find((item: any) => item.id === billItem.orderedItemId);
  //     if (orderedItem) {
  //       let itemTotal = orderedItem.price * billItem.amount;
  //
  //       if (orderedItem.discount?.type === 'PERCENTAGE') {
  //         const discountAmount = (orderedItem.price * orderedItem.discount.value / 100) * billItem.amount;
  //         itemTotal -= discountAmount;
  //         totalDiscounts += discountAmount;
  //       } else if (orderedItem.discount?.type === 'FLAT') {
  //         itemTotal -= orderedItem.discount.value * billItem.amount;
  //         totalDiscounts += orderedItem.discount.value * billItem.amount;
  //       }
  //       subtotal += itemTotal;
  //     }
  //   });
  // });
  //
  // totalPrice = subtotal;


  console.log(orderedItems, 'billis')
  return (
    <div className="d-flex">
      <div>
        {billList && billList.length > 0 ? (
          billList.map((bill, billIndex) =>{
            const totalPaid = bill.paymentTransactions.reduce(
              (acc, transaction) => acc + transaction.amount,
              0
            );

            const itemsTotal = bill.billItems.reduce((total, billItem) => {
              const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);
              if (orderedItem) {
                let itemTotal = orderedItem.price * billItem.amount;
                if (orderedItem.discount?.type === 'PERCENTAGE') {
                  const discountAmount = (orderedItem.price * orderedItem.discount.value / 100) * billItem.amount;
                  itemTotal -= discountAmount;
                } else if (orderedItem.discount?.type === 'FLAT') {
                  itemTotal -= orderedItem.discount.value * billItem.amount;
                }
                return total + itemTotal;
              }
              return total;
            }, 0);

            const subtotal = itemsTotal;
            const totalDiscounts = bill.billItems.reduce((total, billItem) => {
              const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);
              if (orderedItem && orderedItem.discount?.type === 'PERCENTAGE') {
                const discountAmount = (orderedItem.price * orderedItem.discount.value / 100) * billItem.amount;
                return total + discountAmount;
              } else if (orderedItem && orderedItem.discount?.type === 'FLAT') {
                return total + (orderedItem.discount.value * billItem.amount);
              }
              return total;
            }, 0);
            const totalPrice = subtotal - totalDiscounts;
            const remainingAmount = totalPrice - totalPaid;


            return   (
            <Card key={`bill-${billIndex}`} className="mb-3">
              <div className="d-flex gap-2 ">
                <div style={{ marginBottom: '20px',  maxHeight: '300px', overflowY: 'auto'  }}>
                  <h4>Order Bill {billIndex + 1}</h4>
                  <Table bordered hover responsive className="table-sm align-middle">
                    <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {bill.billItems && bill.billItems.length > 0 ? (
                      bill.billItems.map((billItem, itemIndex) => {
                        const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);

                        let total = 0;

                        if (orderedItem) {
                          console.log(orderedItem, 'ordered1')

                          if (orderedItem.discount?.type === 'PERCENTAGE') {
                            total = (orderedItem.price - (orderedItem.price * orderedItem.discount.value / 100)) * billItem.amount;
                          } else if (orderedItem.discount?.type === 'FLAT') {
                            total = (orderedItem.price - orderedItem.discount.value) * billItem.amount;
                          } else {
                            total = orderedItem.price * billItem.amount;
                          }
                        }

                        return (
                          <tr key={`entity-${itemIndex}`} data-cy="entityTable">
                            <td className="justify-content-s">{bill.sequenceNumber}</td>
                            <td>{orderedItem ? orderedItem.itemName : 'Ordered item not found'}</td>
                            <td>{billItem.amount.toFixed(2)}</td>
                            <td>{orderedItem ? orderedItem.price : '-'}</td>
                            <td>
                              {orderedItem && orderedItem.discount?.value !== undefined
                                ? `${orderedItem.discount.value} ${orderedItem.discount.type}`
                                : '0'}
                            </td>
                            <td>{total.toFixed(2)}</td>
                            <td>{format(new Date(bill.dateTime), 'MMMM dd, yyyy')}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7}>No items available.</td>
                      </tr>
                    )}
                    </tbody>
                  </Table>
                </div>

                  <Card className="p-3  ml-auto">
                  <h4>Payment Transactions for Order Bill {billIndex + 1}</h4>
                  {bill.paymentTransactions.map((item, index) => (
                    <div key={`payment-${billIndex}-${index}`}>
                      <strong>Payment Method:</strong> {item.method}
                      <span className="ml-3">
                      <strong>Amount:</strong> ${item.amount.toFixed(2)}
                    </span>
                    </div>
                  ))}
                  </Card>
              </div>
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
                <div className="d-flex justify-content-between my-2">
                  <div>
                    <strong>Remaining Amount</strong>
                  </div>
                  <div className="text-center">$ {remainingAmount.toFixed(2)}</div>
                </div>
              </Card>

            </Card>


          )})
        ) : (
          <div>No items available.</div>
        )}

        {/* {billList.length > 0 && ( */}
        {/*   <Card className="mt-3 p-3"> */}
        {/*     <div className="d-flex justify-content-between my-2"> */}
        {/*       <div> */}
        {/*         <strong>Subtotal</strong> */}
        {/*       </div> */}
        {/*       <div className="text-center">$ {subtotal.toFixed(2)}</div> */}
        {/*     </div> */}
        {/*     <div className="d-flex justify-content-between my-2"> */}
        {/*       <div> */}
        {/*         <strong>Total Discounts</strong> */}
        {/*       </div> */}
        {/*       <div className="text-center">$ {totalDiscounts.toFixed(2)}</div> */}
        {/*     </div> */}
        {/*     <div className="d-flex justify-content-between my-2"> */}
        {/*       <div> */}
        {/*         <strong>Total Price</strong> */}
        {/*       </div> */}
        {/*       <div className="text-center">$ {totalPrice.toFixed(2)}</div> */}
        {/*     </div> */}
        {/*   </Card> */}
        {/* )} */}
      </div>
    </div>
  );
};
