  import { IBill } from 'app/shared/model/bill.model';
  import { IBilledItem } from 'app/shared/model/billed-items.model';
  import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
  import { Translate } from 'react-jhipster';
  import React from 'react';
  import { IOrderedItem } from 'app/shared/model/ordered-item.model';
  import { IOrderedAddon } from 'app/shared/model/ordered-addon.model';
  import {TreeTable} from "primereact/treetable";
  import {Column} from "primereact/column";

  interface OrderedItems {
    list: IOrderedItem[];
    totalPayments: number
  }
  export const OrderedItems: React.FC<OrderedItems> = ({ list,totalPayments }) => {
    const transformAddonToTreeNode = (addon) => ({
      key: `addon-${addon.id}`,
      data: {
        name: addon.name,
        amount: addon.amount,
        price: addon.price.toFixed(2),
        discount: addon.discount
          ? addon.discount.type === 'PERCENTAGE'
            ? `${addon.discount.value}%`
            : `${addon.discount.value.toFixed(2)}`
          : '-',
      },
    });

console.log(totalPayments, 'totalPayments')
    const transformItemToTreeNode = (item: IOrderedItem) => ({
      key: `item-${item.id}`,
      data: {
        name: item.itemName,
        variant: item.variantName,
        amount: item.amount,
        returnedAmount: item.returnedAmount,
        totalAmount: (item.amount - item.returnedAmount).toFixed(2),
        discount: item.discount
          ? item.discount.type === 'PERCENTAGE'
            ? `${item.discount.value}%`
            : `${item.discount.value.toFixed(2)}`
          : '-',
        price: item.price.toFixed(2),
        total: (item.price * (item.amount - item.returnedAmount)).toFixed(2),
      },
      children: item.addons.map(transformAddonToTreeNode),
    });


    const treeData = list.map(transformItemToTreeNode);

    const subtotal = list.reduce((acc, item) => acc + item.price * (item.amount - item.returnedAmount), 0);
    const totalDiscounts = list.reduce((acc, item) => {
      if (item.discount?.type === 'PERCENTAGE') {
        return acc + (item.price * item.discount.value * item.amount) / 100;
      } else if (item.discount?.type === 'FLAT') {
        return acc + (item.discount.value !== undefined ? item.discount.value * item.amount : 0);
      } else {
        return acc;
      }
    }, 0);

    const totalPrice = subtotal - totalDiscounts;


    const items = list;
  console.log(items, 'items')
    return (
      <div >
         <h4> <strong>Items</strong></h4>

          <div>
            {list && list.length > 0 ? (
              <TreeTable value={treeData} className="mt-4">
                <Column field="name" header="Name" expander style={{ width: '40%' }} />
                <Column field="variant" header="Variant" style={{ width: '15%' }} />
                <Column field="amount" header="Amount" style={{ width: '15%' }} />
                <Column field="returnedAmount" header="Returned Amount" style={{ width: '20%' }} />
                <Column field="totalAmount" header="Total Amount" style={{ width: '20%' }} />
                <Column field="discount" header="Discount" style={{ width: '15%' }} />
                <Column field="price" header="Price" style={{ width: '15%' }} />
                <Column field="total" header="Total" style={{ width: '15%' }} />
              </TreeTable>

            ) : (
              <div>No items available.</div>
            )}
          </div>

        { list.length > 0 && <Card className="mt-3 p-3">
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
              <strong>Paid</strong>
            </div>
            <div className="text-center">$ {totalPayments.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Remaining</strong>
            </div>
            <div className="text-center">$ {(totalPrice - totalPayments).toFixed(2) }</div>
          </div>
        </Card>}
      </div>
    );
  };
