import { Translate } from 'react-jhipster';
import React from 'react';
import { Table } from 'reactstrap';
import { ISummaryReport } from 'app/shared/model/report-summary.model';

const EndOfTillTotalReceived = ({ totalReceived }: { totalReceived: ISummaryReport['totalReceived'] }) => {
  return (
    <Table striped bordered size={'lg'}>
      <thead>
        <tr className="bg-gray-700">
          <th className={'text-white'}>PAYMENT</th>
          <th className={'text-white'}>TIP</th>
          <th className={'text-white'}>AMOUNT</th>
          <th className={'text-white'}>REFUND</th>
          <th className={'text-white'}>RECEIVED</th>
        </tr>
      </thead>
      <tbody>
        {totalReceived?.map((item, index) => (
          <tr key={index}>
            <td>{item.paymentType}</td>
            <td className="text-end p-4">{item.tip.toFixed(2)}</td>
            <td className="text-end p-4">{item.amount?.toFixed(2)}</td>
            <td className="text-end p-4">{item.refund?.toFixed(2)}</td>
            <td className="text-end">{item.received.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default EndOfTillTotalReceived;
