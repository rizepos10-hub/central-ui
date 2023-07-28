import { IBill } from 'app/shared/model/bill.model';
import { IBilledItem } from 'app/shared/model/billed-items.model';
import { Button, Table } from 'reactstrap';
import { Translate } from 'react-jhipster';
import React from 'react';
import { IOrderedItem } from 'app/shared/model/ordered-item.model';
import { IOrderedAddon } from 'app/shared/model/ordered-addon.model';

interface OrderedItems {
  list: IOrderedItem[];
}
export const OrderedItems: React.FC<OrderedItems> = ({ list }) => {
  // addons?: IOrderedAddon[];

  const items = list;

  return (
    <div className="table-responsive">
      <h4>Items</h4>
      {items && items.length > 0 ? (
        <Table responsive>
          <thead>
            <tr>
              <th>
                <Translate contentKey="tempApp.order.id">ID</Translate>
              </th>
              <th>Price</th>
              <th>Amount</th>
              <th>Discount</th>
              <th>Seats</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={`entity-${i}`} data-cy="entityTable">
                <td>{item.id}</td>
                <td>{item.price}</td>
                <td>{item.amount}</td>
                <td>{item.discount}</td>
                <td>{item.seats}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        ''
      )}
    </div>
  );
};
