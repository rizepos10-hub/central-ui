import React, { useState } from 'react';

import { ISummaryReport } from 'app/shared/model/report-summary.model';
import ReportSection, {
  reportLabelCellClassName,
  reportNumericCellClassName,
  reportSubLabelCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
} from 'app/shared/components/report/report-ui';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatNumber } from 'app/shared/util/price-utils';

const GenericSalesReport = ({ title, report }: { title: string; report: ISummaryReport['totalSales'] }) => {
  if (!report) return null;

  const { orders, subTotal, discount, appliedCoupon, deliveryCharge, deliveryTAX,
    refunds, netSales, totalTAX, grossSales, walletCredits, totalTip, taxes } = report;

  const [show, setShow] = useState(true);

  const handleClick = () => {
    setShow(prevState => !prevState);
  };

  const taxEntries = Object.entries(taxes || {});

  return (
    <ReportSection title={title} contentClassName="p-0">
      <Table className={reportTableClassName}>
        <colgroup>
          <col className="w-[68%]" />
          <col className="w-[32%]" />
        </colgroup>
        <TableBody className={reportTableBodyClassName}>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>New Sales (Orders)</TableCell>
            <TableCell className={`${reportNumericCellClassName} font-semibold`}>{orders}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>
              <div className="flex flex-col gap-0.5">
                <span>Gross Sales</span>
                <span className="text-[11px] font-normal text-muted-foreground">Sales include refunds</span>
              </div>
            </TableCell>
            <TableCell className={`${reportNumericCellClassName} font-semibold`}>{formatNumber(grossSales + refunds)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Refunds</TableCell>
            <TableCell className={`${reportNumericCellClassName} font-semibold text-destructive`}>{formatNumber(refunds || 0)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Gross Sales</TableCell>
            <TableCell className={`${reportNumericCellClassName} font-semibold`}>{formatNumber(grossSales)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>
              <button
                type="button"
                onClick={handleClick}
                className="inline-flex items-center gap-1 text-left text-primary hover:underline"
                title={`Tax breakdown (${taxEntries.length} types)`}
              >
                Tax ({taxEntries.length})
                {show ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </TableCell>
            <TableCell className={`${reportNumericCellClassName} font-semibold text-destructive`}>{formatNumber(totalTAX)}</TableCell>
          </TableRow>
          {show &&
            taxEntries.map(([taxType, amount]) => (
              <TableRow key={taxType}>
                <TableCell className={reportSubLabelCellClassName}>{taxType}</TableCell>
                <TableCell className={reportNumericCellClassName}>{formatNumber(amount)}</TableCell>
              </TableRow>
            ))}
          <TableRow className="border-t bg-muted/10 hover:bg-muted/10">
            <TableCell className={reportLabelCellClassName}>Net Sales</TableCell>
            <TableCell className={`${reportNumericCellClassName} font-semibold`}>{formatNumber(netSales)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Discounts</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(discount)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Applied Coupon</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(appliedCoupon)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Sub Total</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(subTotal)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Delivery Charge</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(deliveryCharge)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Delivery Tax</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(deliveryTAX)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={reportLabelCellClassName}>Tip</TableCell>
            <TableCell className={reportNumericCellClassName}>{formatNumber(totalTip)}</TableCell>
          </TableRow>
          {walletCredits !== undefined && walletCredits !== null ? (
            <TableRow>
              <TableCell className={reportLabelCellClassName}>Wallet Credits</TableCell>
              <TableCell className={reportNumericCellClassName}>{formatNumber(walletCredits)}</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </ReportSection>
  );
};

export default GenericSalesReport;
