import React from 'react';
import { Table } from 'reactstrap';
import { ISummaryReport } from 'app/shared/model/report-summary.model';

const SummaryReportTotalReceived = ({ totalReceived }: { totalReceived: ISummaryReport['totalReceived'] }) => {
  const filteredData = totalReceived?.filter(
    item =>
      item.tip !== 0 ||
      item.amount !== 0 ||
      item.refund !== 0 ||
      item.received !== 0
  );

  if (!filteredData || filteredData.length === 0) return null;

  return (
    <>
      <Table striped bordered size="sm">
        <thead>
          <tr className="bg-gray-700">
            <th className="text-white">PAYMENT</th>
            <th className="text-white">TIP</th>
            <th className="text-white">AMOUNT</th>
            <th className="text-white">REFUND</th>
            <th className="text-white">RECEIVED</th>
          </tr>
        </thead>
        <tbody>
          {filteredData?.map((item, index) => (
            <tr key={index}>
              <td>{item.paymentType}</td>
              <td className="text-end">{item.tip?.toFixed(2)}</td>
              <td className="text-end">{item.amount?.toFixed(2)}</td>
              <td className="text-end">{item.refund?.toFixed(2)}</td>
              <td className="text-end">{item.received.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <hr className='p-2' style={{ backgroundColor: 'gray' }} />
    </>
  );
};

export default SummaryReportTotalReceived;
