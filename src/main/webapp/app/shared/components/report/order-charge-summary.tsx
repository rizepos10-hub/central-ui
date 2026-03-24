import React from 'react';

import ReportSection, {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
  reportTotalRowClassName,
} from 'app/shared/components/report/report-ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from 'app/shared/util/price-utils';

type OrderCharge = {
  name?: string | null;
  numberOfOrders?: number | null;
  netTotal?: number | null;
};

type OrderChargeSummaryData = {
  charges?: OrderCharge[];
  numberOfOrders?: number | null;
  netTotal?: number | null;
};

const OrderChargeSummary = ({ chargesSummary }: { chargesSummary?: OrderChargeSummaryData | null }) => {
  if (!chargesSummary?.charges?.length) {
    return null;
  }

  return (
    <ReportSection title="Order Charge Summary" contentClassName="p-0">
      <Table className={reportTableClassName}>
        <TableHeader>
          <TableRow className={reportHeaderRowClassName}>
            <TableHead className={reportHeadClassName}>Charge Name</TableHead>
            <TableHead className={`${reportHeadClassName} text-right`}>Number of Orders</TableHead>
            <TableHead className={`${reportHeadClassName} text-right`}>Net Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={reportTableBodyClassName}>
          {chargesSummary.charges.map((charge, idx) => (
            <TableRow key={`${charge.name || 'charge'}-${idx}`}>
              <TableCell className={reportCellClassName}>{charge.name || 'No Charge'}</TableCell>
              <TableCell className={reportNumericCellClassName}>{formatNumber(charge.numberOfOrders || 0)}</TableCell>
              <TableCell className={reportNumericCellClassName}>{formatNumber(charge.netTotal || 0)}</TableCell>
            </TableRow>
          ))}
          <TableRow className={reportTotalRowClassName}>
            <TableCell className={reportCellClassName}>Total</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(chargesSummary.numberOfOrders || 0)}</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(chargesSummary.netTotal || 0)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ReportSection>
  );
};

export default OrderChargeSummary;
