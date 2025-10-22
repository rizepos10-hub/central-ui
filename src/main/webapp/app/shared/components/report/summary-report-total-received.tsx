import React from 'react';
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

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
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-700 hover:bg-gray-700">
              <TableHead className="text-white text-xs font-semibold">PAYMENT</TableHead>
              <TableHead className="text-white text-xs font-semibold text-right">TIP</TableHead>
              <TableHead className="text-white text-xs font-semibold text-right">AMOUNT</TableHead>
              <TableHead className="text-white text-xs font-semibold text-right">REFUND</TableHead>
              <TableHead className="text-white text-xs font-semibold text-right">RECEIVED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData?.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs">{item.paymentType}</TableCell>
                <TableCell className="text-xs text-right">{item.tip?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right">{item.amount?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right">{item.refund?.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-right">{item.received.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Separator className="my-4 bg-gray-400" />
    </>
  );
};

export default SummaryReportTotalReceived;
