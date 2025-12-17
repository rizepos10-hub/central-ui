import React, { useState } from "react";
import { ISummaryReport } from "app/shared/model/report-summary.model";
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

const GenericSalesReport = ({ title, report, payments }: { title: string; report: ISummaryReport["totalSales"], payments?: ISummaryReport["totalReceived"] }) => {
  if (!report) return null;

  const { orders, subTotal, discount, appliedCoupon, deliveryCharge, deliveryTAX,
    refunds, netSales, totalTAX, grossSales, walletCredits, totalTip, taxes } = report;

  const [show, setShow] = useState(true);
  const [showPayments, setShowPayments] = useState(true);

  const handleClick = () => {
    setShow(prevState => !prevState);
  };

  const handlePaymentsClick = () => {
    setShowPayments(prevState => !prevState);
  };

  // Group payments by method
  const paymentsByMethod = payments?.reduce((acc, payment) => {
    const method = payment.paymentType || 'unknown';
    if (!acc[method]) {
      acc[method] = 0;
    }
    acc[method] += payment.received || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-0">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} className="text-xs font-semibold">New sales (orders)</TableCell>
              <TableCell colSpan={2} className="text-xs text-right font-semibold">
                {orders}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-xs font-semibold">Gross Sales</TableCell>
              <TableCell colSpan={2} className="text-xs text-right font-semibold">
                {(grossSales + refunds).toFixed(2)}
              </TableCell>
              <TableCell colSpan={2} className="text-xs text-right text-muted-foreground">
                Sales include refunds
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-xs font-semibold">Refunds</TableCell>
              <TableCell colSpan={2} className="text-xs text-right text-destructive font-semibold">
                {refunds || 0}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-xs font-semibold">Gross Sales</TableCell>
              <TableCell colSpan={2} className="text-xs text-right font-semibold">
                {grossSales}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-xs">
                <span
                  onClick={handleClick}
                  className="text-primary cursor-pointer inline-flex items-center gap-1 hover:underline"
                  title={`Tax breakdown (${Object.keys(taxes || {})?.length} types)`}
                >
                  Tax ({Object.keys(taxes || {})?.length})
                  {show ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </span>
              </TableCell>
              <TableCell colSpan={2} className="text-xs text-right text-destructive font-semibold">
                {totalTAX}
              </TableCell>
            </TableRow>
            {Object?.entries(taxes || {})?.map(([taxType, amount]) => (
              <TableRow key={taxType} className={`${!show && 'hidden'}`}>
                <TableCell colSpan={3} className="text-xs pl-6">{taxType}</TableCell>
                <TableCell className="text-xs text-right">{amount}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} className="h-4">&nbsp;</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-semibold">Net Sales</TableCell>
              <TableCell colSpan={2} className="text-xs text-right font-semibold">
                <span>${netSales}</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-semibold">Discounts</TableCell>
              <TableCell colSpan={2} className="text-xs text-right font-semibold">
                <span>${discount}</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-semibold">Tip</TableCell>
              <TableCell colSpan={2} className="text-xs text-right font-semibold">
                {totalTip}
              </TableCell>
            </TableRow>
            {/* {payments && (
              <>
                <TableRow>
                  <TableCell colSpan={4} className="h-4">&nbsp;</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="text-xs">
                    <span
                      onClick={handlePaymentsClick}
                      className="text-primary cursor-pointer inline-flex items-center gap-1 hover:underline"
                      title={`Payment methods breakdown (${Object.keys(paymentsByMethod || {})?.length} types)`}
                    >
                      Collected ({Object.keys(paymentsByMethod || {})?.length})
                      {showPayments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </TableCell>
                  <TableCell colSpan={2} className="text-xs text-right font-semibold">
                    {payments.reduce((sum, payment) => sum + (payment.received || 0), 0).toFixed(2)}
                  </TableCell>
                </TableRow>
                {Object?.entries(paymentsByMethod || {})?.map(([method, amount]) => (
                  <TableRow key={method} className={`${!showPayments && 'hidden'}`}>
                    <TableCell colSpan={3} className="text-xs pl-6">{formatPaymentMethodLabel(method)}</TableCell>
                    <TableCell className="text-xs text-right">{amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </>
            )} */}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default GenericSalesReport;
