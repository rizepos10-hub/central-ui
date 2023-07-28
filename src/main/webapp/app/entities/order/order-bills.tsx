import { IBill } from 'app/shared/model/bill.model';
import { IBilledItem } from 'app/shared/model/billed-items.model';
import { IPaymentTransaction } from 'app/shared/model/payment-transaction.model';
import { Button, Table } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface OrderBills {
  list: IBill[];
}
export const OrderBills: React.FC<OrderBills> = ({ list }) => {
  // id?: string;
  // dateTime?: string;
  // billItems?: IBilledItem[];
  // payee?: string;
  // paymentTransactions?: IPaymentTransaction[];
  const billList = list;

  return (
    <div className="table-responsive">
      <h4>Order Bills</h4>
      {billList && billList.length > 0 ? (
        <Table responsive>
          <thead>
            <tr>
              <th>
                <Translate contentKey="tempApp.order.id">ID</Translate>
              </th>
              <th>
                <Translate contentKey="tempApp.order.dateTime">Time</Translate>
              </th>
              <th>
                <Translate contentKey="tempApp.order.payee">Payee</Translate>
              </th>
              <th>
                <Translate contentKey="tempApp.order.type">Transaction Type</Translate>
              </th>
              <th>
                <Translate contentKey="tempApp.order.billed-item">Billed Item</Translate>
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {billList.map((bill, i) => (
              <tr key={`entity-${i}`} data-cy="entityTable">
                <td>{bill.id}</td>
                <td>{bill.dateTime}</td>
                <td>{bill.payee}</td>
                <td>{bill.paymentTransactions.join('|')}</td>
                {/*{*/}
                {/*  bill.billItems ?*/}
                {/*    bill.billItems.map( (bill) => {*/}
                {/*      <tr>*/}
                {/*        <td>*/}
                {/*          {bill.id}*/}
                {/*        </td>*/}
                {/*        <td>*/}
                {/*          {bill.orderedItemId}*/}
                {/*        </td>*/}
                {/*        <td>*/}
                {/*          {bill.amount}*/}
                {/*        </td>*/}
                {/*        <td>*/}
                {/*          {bill.seat}*/}
                {/*        </td>*/}
                {/*        <td>*/}
                {/*          {bill.paymentStatus}*/}
                {/*        </td>*/}
                {/*        <td>*/}
                {/*          {bill.status}*/}
                {/*        </td>*/}
                {/*      </tr>*/}
                {/*      }*/}
                {/*    )*/}

                {/*    :""*/}
                {/*}*/}
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
