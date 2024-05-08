  import { IBill } from 'app/shared/model/ORDER/bill.model';
  import { IBilledItem } from 'app/shared/model/ORDER/billed-items.model';
  import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
  import {translate, Translate} from 'react-jhipster';
  import React from 'react';
  import { IOrderedItem } from 'app/shared/model/ORDER/ordered-item.model';
  import { IOrderedAddon } from 'app/shared/model/ORDER/ordered-addon.model';
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

    const transformItemToTreeNode = (item: IOrderedItem) => ({
      key: `item-${item.id}`,
      data: {
        name: item.itemName,
        variant: item.variantName,
        amount: item.amount.toFixed(2),
        returnedAmount: item.returnedAmount.toFixed(2),
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


    return (
      <div >

          <div>
            {list && list.length > 0 ? (
              <TreeTable value={treeData}   resizableColumns showGridlines columnResizeMode="expand" tableStyle={{ minWidth: '70rem' }} className="mt-4">
                <Column field="name"  header={translate('orders.details.itemsCard.table.name')}  />
                <Column field="variant"   header={translate('orders.details.itemsCard.table.variant')}  />
                <Column field="amount" header={translate('orders.details.common.amount')}  />
                <Column field="returnedAmount" headerStyle={{width: '158px'}}  header={translate('orders.details.itemsCard.table.returnedAmount')} />
                <Column field="totalAmount"  headerStyle={{width: '148px'}} header={translate('orders.details.itemsCard.table.totalAmount')}  />
                <Column field="discount" header={translate('orders.details.common.discount')} />
                <Column field="price" header={translate('orders.details.common.price')} />
                <Column field="total" header={translate('orders.details.common.total')}  />
              </TreeTable>

            ) : (
              <div><Translate contentKey={'orders.details.itemsCard.emptyMessage'}>No items available.</Translate></div>
            )}
          </div>

        { list.length > 0 && <Card className="mt-3 p-3">
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>{translate('orders.details.common.subtotal')}</strong>
            </div>
            <div className="text-center">$ {subtotal.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>{translate('orders.details.common.totalDiscounts')}</strong>
            </div>
            <div className="text-center">$ {totalDiscounts.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>{translate('orders.details.common.totalPrice')}</strong>
            </div>
            <div className="text-center">$ {totalPrice.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>{translate('orders.details.common.paid')}</strong>
            </div>
            <div className="text-center">$ {totalPayments.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>{translate('orders.details.common.remaining')}</strong>
            </div>
            <div className="text-center">$ {(totalPrice - totalPayments).toFixed(2) }</div>
          </div>
        </Card>}
      </div>
    );
  };
