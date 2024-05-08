import { IBill } from 'app/shared/model/ORDER/bill.model';
import { IBilledItem } from 'app/shared/model/ORDER/billed-items.model';
import { IPaymentTransaction } from 'app/shared/model/ORDER/payment-transaction.model';
import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
import {translate, Translate} from 'react-jhipster';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import {IOrderedAddon} from "app/shared/model/ORDER/ordered-addon.model";
import { format } from 'date-fns';
import { TreeTable } from 'primereact/treetable';
import {Column} from "primereact/column";

interface OrderBills {
  list:any;
  orderedItems: any
}
export const OrderBill: React.FC<OrderBills> = ({ list, orderedItems }) => {

  const billList = list;

  const transformAddonToTreeNode = (addon) => {

    let total = addon.price * addon.amount;

    if (addon.discount) {
      if (addon.discount.type === 'PERCENTAGE') {
        const discountAmount = (addon.discount.value / 100) * total;
        total -= discountAmount;
      } else if (addon.discount.type === 'FLAT') {
        total -= addon.discount.value;
      }
    }
    return {
      key: `addon-${addon.id}`,
      data: {
        name: addon.name,
        amount: addon.amount.toFixed(2),
        price: addon.price.toFixed(2),
        discount: addon.discount ? (addon.discount.type === 'PERCENTAGE'
            ? `${addon.discount.value}%` : `$${addon.discount.value.toFixed(2)}`)
          : '-',
        total,
      },
    };
  };

  const transformBillToTreeNode = (bill, orderedItems) => {
    const treeNodes = [];
    bill.billItems.forEach((billItem) => {
      const orderedItem = orderedItems.find((item) => item.id === billItem.orderedItemId);

      if (orderedItem) {
        const addonTotal = orderedItem.addons.reduce((total, addon) => {
          let addonTotalPrice = addon.price * addon.amount;

          if (addon.discount) {
            if (addon.discount.type === 'PERCENTAGE') {
              const discountAmount = (addon.discount.value / 100) * addonTotalPrice;
              addonTotalPrice -= discountAmount;
            } else if (addon.discount.type === 'FLAT') {
              addonTotalPrice -= addon.discount.value;
            }
          }

          return total + addonTotalPrice;
        }, 0);

        const itemTotal = (orderedItem.price * billItem.amount) - (orderedItem.discount && orderedItem.discount.type === "PERCENTAGE" ?
          (orderedItem.discount.value / 100) * (orderedItem.price * billItem.amount) : (orderedItem.discount ? orderedItem.discount.value * billItem.amount : 0));
        const total = itemTotal;



        const treeNode = {
          key: `bill-${bill.id}-item-${orderedItem.id}`,
          data: {
            id: bill.sequenceNumber,
            name: orderedItem.itemName,
            amount: billItem.amount.toFixed(2),
            price: orderedItem.price.toFixed(2),
            discount: orderedItem.discount ? (orderedItem.discount.type === 'PERCENTAGE'
                ? `${orderedItem.discount.value}%` : `$${orderedItem.discount.value.toFixed(2)}`)
              : '-',
            total,
            date: format(new Date(bill.dateTime), 'MMMM dd, yyyy'),
          },
          children: orderedItem.addons.map(transformAddonToTreeNode),
        };

        treeNodes.push(treeNode);
      }
    });

    return treeNodes;
  };


  return (
    <div className="d-flex"  >
      <div>
        {list && list.length > 0 ? (
          list.filter((billItem) => !billItem.archived).map((bill, billIndex) => {

            const totalPaid = bill.paymentTransactions.reduce(
              (acc, transaction) => {
                return acc + transaction.amount > 0 ? transaction.amount : 0;
              },
              0
            );

            const transformedTreeData = transformBillToTreeNode(bill, orderedItems);
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

                const addonTotal = orderedItem.addons.reduce((addonTotal, addon) => {
                  let addonTotalPrice = addon.price * addon.amount;

                  if (addon.discount) {
                    if (addon.discount.type === 'PERCENTAGE') {
                      const discountAmount = (addon.discount.value / 100) * addonTotalPrice;
                      addonTotalPrice -= discountAmount;
                    } else if (addon.discount.type === 'FLAT') {
                      addonTotalPrice -= addon.discount.value;
                    }
                  }

                  return addonTotal + addonTotalPrice;
                }, 0);

                itemTotal += addonTotal;

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
              <>
                <div className="d-flex gap-2 ">
                  <div className="flex-grow-1 flex-shrink-1-l" style={{marginBottom: '20px', width: '80%'}}>
                    {/* maxHeight: '300px', overflowY: 'auto', */}
                    <h4><Translate contentKey={'orders.details.billsCard.subTitle'} interpolate={{billId: bill.sequenceNumber}}>Order Bill {bill.sequenceNumber}</Translate></h4>

                    <TreeTable value={transformedTreeData} resizableColumns showGridlines columnResizeMode="expand" tableStyle={{ minWidth: '50rem' }}  className="mt-4">
                      <Column field="id" header={translate('orders.details.billsCard.table.id')}/>
                      <Column field="name"  header={translate('orders.details.billsCard.table.name')}  />
                      <Column field="amount" header={translate('orders.details.common.amount')}/>
                      <Column field="price" header={translate('orders.details.common.price')}/>
                      <Column field="discount" header={translate('orders.details.common.discount')}/>
                      <Column field="total" header={translate('orders.details.common.total')}/>
                      <Column field="date" header={translate('orders.details.billsCard.table.date')}/>
                    </TreeTable>

                  </div>

                  <Card className="p-3  ml-auto">
                    <h4><Translate contentKey={'orders.details.billsCard.payment.title'} interpolate={{billId: billIndex + 1}}>Payment Transactions for Order Bill {billIndex + 1}</Translate></h4>
                    {bill.paymentTransactions.map((item, index) => (
                      <div key={`payment-${billIndex}-${index}`}>
                        <strong><Translate contentKey={'orders.details.billsCard.payment.method'}>Payment Method:</Translate></strong> {item.method}
                        <span className="ml-3">
                          <strong><Translate contentKey={'orders.details.billsCard.payment.amount'}>Amount:</Translate></strong> ${item.amount.toFixed(2)}
                                </span>
                      </div>
                    ))}
                  </Card>
                </div>
                <Card className="mt-3 p-3">
                  <div className="d-flex justify-content-between my-2">
                    <div>
                      <strong><Translate contentKey={'orders.details.common.subtotal'}>Subtotal</Translate></strong>
                    </div>
                    <div className="text-center">$ {subtotal.toFixed(2)}</div>
                  </div>
                  <div className="d-flex justify-content-between my-2">
                    <div>
                      <strong><Translate contentKey={'orders.details.common.totalDiscounts'}>Total Discounts</Translate></strong>
                    </div>
                    <div className="text-center">$ {totalDiscounts.toFixed(2)}</div>
                  </div>
                  <div className="d-flex justify-content-between my-2">
                    <div>
                      <strong><Translate contentKey={'orders.details.common.totalPrice'}>Total Price</Translate></strong>
                    </div>
                    <div className="text-center">$ {totalPrice.toFixed(2)}</div>
                  </div>
                  <div className="d-flex justify-content-between my-2">
                    <div>
                      <strong><Translate contentKey={'orders.details.common.remaining'}>Remaining Amount</Translate></strong>
                    </div>
                    <div className="text-center">$ {remainingAmount.toFixed(2)}</div>
                  </div>
                </Card>
              </>



            )})
        ) : (
          <div><Translate contentKey={'orders.details.billsCard.emptyMessage'}>No Bills available.</Translate></div>
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
