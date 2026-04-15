import React from 'react';
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import ReportSection, {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
} from 'app/shared/components/report/report-ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatPaymentMethodLabel = (method: string): string => {
  // Special case for master
  if (method === 'master') {
    return 'Master Card';
  }

  // Convert camelCase to Title Case with spaces
  return method
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

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
    <ReportSection title="Total Received" contentClassName="p-0">
      <Table className={reportTableClassName}>
        <TableHeader>
          <TableRow className={reportHeaderRowClassName}>
            <TableHead className={reportHeadClassName}>Payment</TableHead>
            <TableHead className={`${reportHeadClassName} text-right`}>Tip</TableHead>
            <TableHead className={`${reportHeadClassName} text-right`}>Amount</TableHead>
            <TableHead className={`${reportHeadClassName} text-right`}>Refund</TableHead>
            <TableHead className={`${reportHeadClassName} text-right`}>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={reportTableBodyClassName}>
          {filteredData?.map((item, index) => (
            <TableRow key={index}>
              <TableCell className={reportCellClassName}>{formatPaymentMethodLabel(item.paymentType)}</TableCell>
              <TableCell className={reportNumericCellClassName}>{item.tip?.toFixed(2)}</TableCell>
              <TableCell className={reportNumericCellClassName}>{item.amount?.toFixed(2)}</TableCell>
              <TableCell className={reportNumericCellClassName}>{item.refund?.toFixed(2)}</TableCell>
              <TableCell className={`${reportNumericCellClassName} font-semibold`}>{item.received.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ReportSection>
  );
};

export default SummaryReportTotalReceived;
