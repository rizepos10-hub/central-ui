import React from 'react';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';

// Development toggle: set to true to show all values including zero/null
const SHOW_ZERO_VALUES = false;

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

interface EodReportLayoutProps {
  summary: any;
  isEndOfDay?: boolean;
  branchTimezone?: string;
}

export const EodReportLayout: React.FC<EodReportLayoutProps> = ({ summary, isEndOfDay = false, branchTimezone }) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  // Parse the report field if it's a string
  let reportData = null;
  try {
    reportData = typeof summary.report === 'string' ? JSON.parse(summary.report) : summary.report;
  } catch (e) {
    console.error('Failed to parse report data', e);
  }

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const shouldShowValue = (value: any) => {
    if (SHOW_ZERO_VALUES) return true;
    return value !== null && value !== undefined && value !== 0;
  };

  return (
    <>
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @page {
              margin: 5mm;
            }
          }

          .eod-report-wrapper {
            padding: 16px;
            background: white;
            overflow: auto;
          }

          .eod-report-container {
            width: 384px;
            margin: 0 auto;
            padding: 8px;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.5;
          }

          .eod-report-container table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .eod-report-container td {
            padding: 2px 0;
          }

          .eod-report-container .col-2-left {
            width: 70%;
          }

          .eod-report-container .col-2-right {
            width: 30%;
            text-align: right;
          }

          .eod-report-container .col-3-left {
            width: 50%;
          }

          .eod-report-container .col-3-middle {
            width: 25%;
            text-align: right;
          }

          .eod-report-container .col-3-right {
            width: 25%;
            text-align: right;
          }

          .eod-report-container .col-4-name {
            width: 40%;
          }

          .eod-report-container .col-4-qty {
            width: 15%;
            text-align: right;
          }

          .eod-report-container .col-4-percent {
            width: 20%;
            text-align: right;
          }

          .eod-report-container .col-4-amount {
            width: 25%;
            text-align: right;
          }

          .print-only {
            display: none;
          }

          @media print {
            .eod-report-wrapper {
              padding: 0;
            }

            .eod-report-container {
              width: 100% !important;
              max-width: 100% !important;
            }

            .print-only {
              display: block;
            }
          }
        `}
      </style>
      <div className="eod-report-wrapper">
        <div className="eod-report-container">
        {/* Header Section */}
        <div className="mb-4">
          <div className="text-center mb-2">
            {summary.brandingInformation?.businessName && (
              <h1 className="text-lg font-bold">{summary.brandingInformation.businessName}</h1>
            )}
            {summary.brandingInformation?.businessAddress && (
              <p className="font-bold">{summary.brandingInformation.businessAddress}</p>
            )}
            {summary.brandingInformation?.branchName && (
              <p className="font-bold">{summary.brandingInformation.branchName}</p>
            )}
          </div>

          <div className="my-2"></div>

          <div className="text-center text-xs">
            {summary.number && <p>Daily Report # {summary.number}</p>}
            {summary.fromDateString && <p>Start: {formatDateForDisplay(summary.fromDateString, 'MM/dd/yyyy hh:mm:ss a', branchTimezone)}</p>}
            {summary.toDateString && <p>End: {formatDateForDisplay(summary.toDateString, 'MM/dd/yyyy hh:mm:ss a', branchTimezone)}</p>}
            <p className="print-only">Printed: {formatDateForDisplay(new Date().toISOString(), 'MM/dd/yyyy hh:mm:ss a', branchTimezone)}</p>
            {summary.branchRegistry?.name && <p>Register: {summary.branchRegistry.name}</p>}
          </div>

          <div className="my-2"></div>

          <div className="text-center text-xs">
            {summary.orderDateRange?.firstOrderDate && <p>First Order: {formatDateForDisplay(summary.orderDateRange.firstOrderDate, 'MM/dd/yyyy hh:mm:ss a', branchTimezone)}</p>}
            {summary.orderDateRange?.lastOrderDate && <p>Last Order: {formatDateForDisplay(summary.orderDateRange.lastOrderDate, 'MM/dd/yyyy hh:mm:ss a', branchTimezone)}</p>}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {reportData && (
          <>
            {/* Sales/Reconciliation Section */}
            <div className="my-2"></div>
            <div className="text-center font-bold text-xs">Sales/Reconciliation</div>
            <div className="my-2"></div>

            <table className="font-bold">
              <tbody>
                {/* Net Sales */}
                <tr>
                  <td className="col-3-left">Net Sales</td>
                  <td className="col-3-middle">{reportData.totalSales?.orders || 0}</td>
                  <td className="col-3-right">{formatCurrency(reportData.totalSales?.netSales)}</td>
                </tr>

                {/* Dynamic Taxes */}
                {reportData.taxSaleSummary?.taxes && Object.keys(reportData.taxSaleSummary.taxes).length > 0 && (
                  <>
                    {Object.entries(reportData.taxSaleSummary.taxes)
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                      .map(([taxName, taxValue]) => (
                        <tr key={taxName}>
                          <td className="col-3-left">{taxName}</td>
                          <td className="col-3-middle"></td>
                          <td className="col-3-right">{formatCurrency(taxValue as number)}</td>
                        </tr>
                      ))}
                  </>
                )}

                {/* Gross Sales */}
                <tr>
                  <td className="col-3-left">Gross Sales</td>
                  <td className="col-3-middle"></td>
                  <td className="col-3-right">{formatCurrency(reportData.totalSales?.grossSales)}</td>
                </tr>

                {/* Refunds */}
                <tr>
                  <td className="col-3-left">Refunds</td>
                  <td className="col-3-middle">{reportData.totalReceived?.filter((tr: any) => tr.refund > 0).length || 0}</td>
                  <td className="col-3-right">{formatCurrency(reportData.totalSales?.refunds)}</td>
                </tr>

                {/* Gross Sales (minus refunds) */}
                <tr>
                  <td className="col-3-left">Gross Sales</td>
                  <td className="col-3-middle"></td>
                  <td className="col-3-right">{formatCurrency((reportData.totalSales?.grossSales || 0) - (reportData.totalSales?.refunds || 0))}</td>
                </tr>

                {/* Total Discounts */}
                <tr>
                  <td className="col-3-left">Total Discounts</td>
                  <td className="col-3-middle"></td>
                  <td className="col-3-right">{formatCurrency((reportData.totalSales?.discount || 0) + (reportData.totalSales?.appliedCoupon || 0))}</td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Payment Methods Section */}
            {(reportData.totalReceived || [])
              .filter((payment: any) => payment.paymentType.toUpperCase() !== 'CASH' && shouldShowValue(payment.received))
              .map((payment: any, idx: number) => (
                <React.Fragment key={idx}>
                  <div className="my-2"></div>
                  <table>
                    <tbody>
                      <tr className="font-bold">
                        <td className="col-3-left">{formatPaymentMethodLabel(payment.paymentType || 'Unknown')}</td>
                        {payment.salesOrderCount != null && payment.salesOrderCount !== 0 && (
                          <td className="col-3-middle">{payment.salesOrderCount.toFixed(0)}</td>
                        )}
                        <td className="col-3-right">{formatCurrency(payment.received)}</td>
                      </tr>
                      {payment.amount !== undefined && shouldShowValue(payment.amount) && (
                        <tr>
                          <td className="col-3-left pl-4">Sales</td>
                          {payment.salesOrderCount != null && payment.salesOrderCount !== 0 && (
                            <td className="col-3-middle">{payment.salesOrderCount.toFixed(0)}</td>
                          )}
                          <td className="col-3-right">{formatCurrency(payment.amount)}</td>
                        </tr>
                      )}
                      {payment.tip !== undefined && shouldShowValue(payment.tip) && (
                        <tr>
                          <td className="col-3-left pl-4">Tips</td>
                          {payment.tipOrderCount != null && payment.tipOrderCount !== 0 && (
                            <td className="col-3-middle">{payment.tipOrderCount.toFixed(0)}</td>
                          )}
                          <td className="col-3-right">{formatCurrency(payment.tip)}</td>
                        </tr>
                      )}
                      {payment.refund !== undefined && shouldShowValue(payment.refund) && (
                        <tr>
                          <td className="col-3-left pl-4">Refunds</td>
                          <td className="col-3-middle"></td>
                          <td className="col-3-right">{formatCurrency(payment.refund)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </React.Fragment>
              ))}

            <div className="my-2"></div>

            {/* Cash Sales Records */}
            {reportData.cashSales?.cashSaleRecords && reportData.cashSales.cashSaleRecords.length > 0 && (
              <>
                <table>
                  <tbody>
                    {reportData.cashSales.cashSaleRecords.map((record: any, idx: number) => (
                      <tr key={idx}>
                        <td className="col-3-left">{record.title || record.label || ''}</td>
                        <td className="col-3-middle">{record.orderCount?.toString() || ''}</td>
                        <td className="col-3-right">{formatCurrency(Math.abs(record.amount))}</td>
                      </tr>
                    ))}

                    {/* Cash Back (if exists) */}
                    {reportData.cashSales?.cashBack && shouldShowValue(reportData.cashSales.cashBack.amount) && (
                      <tr>
                        <td className="col-3-left">- {reportData.cashSales.cashBack.title || 'Cash Back'}</td>
                        <td className="col-3-middle">{reportData.cashSales.cashBack.orderCount?.toString() || ''}</td>
                        <td className="col-3-right">{formatCurrency(Math.abs(reportData.cashSales.cashBack.amount))}</td>
                      </tr>
                    )}

                    {/* Tips (if exists) */}
                    {reportData.cashSales?.tips && shouldShowValue(reportData.cashSales.tips.amount) && (
                      <tr>
                        <td className="col-3-left">- {reportData.cashSales.tips.title || 'Tips'}</td>
                        <td className="col-3-middle">{reportData.cashSales.tips.orderCount?.toString() || ''}</td>
                        <td className="col-3-right">{formatCurrency(Math.abs(reportData.cashSales.tips.amount))}</td>
                      </tr>
                    )}

                    {/* Expected Cash */}
                    {reportData.cashSales?.expectedTotal && (
                      <tr className="font-bold">
                        <td className="col-3-left">{reportData.cashSales.expectedTotal.title || 'Expected Cash'}</td>
                        <td className="col-3-middle"></td>
                        <td className="col-3-right">{formatCurrency(reportData.cashSales.expectedTotal.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {/* Counted Cash and Short/Over - EOD Only */}
            {isEndOfDay && (
              <>
                {/* Counted Cash */}
                {summary.cash != null && (
                  <table>
                    <tbody>
                      <tr>
                        <td className="col-3-left">Counted Cash</td>
                        <td className="col-3-middle"></td>
                        <td className="col-3-right">{formatCurrency(summary.cash)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Short/Over */}
                {summary.cashOverAndShortage != null && (
                  <table>
                    <tbody>
                      <tr className="font-bold">
                        <td className="col-3-left">Short/Over</td>
                        <td className="col-3-middle"></td>
                        <td className="col-3-right">{formatCurrency(summary.cashOverAndShortage)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Space and divider after EOD fields */}
                <div className="my-2"></div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </>
            )}

            {/* Category Sales Section */}
            {(reportData.categorySaleSummary?.categories || []).filter((category: any) => shouldShowValue(category.amount)).length > 0 && (
              <>
                <div className="my-2"></div>
                <div className="text-center font-bold text-xs">CATEGORY SALES</div>
                <div className="my-2"></div>
                <table>
                  <tbody>
                    {reportData.categorySaleSummary.categories
                      .filter((category: any) => shouldShowValue(category.amount))
                      .map((category: any, idx: number) => (
                        <tr key={idx}>
                          <td className="col-4-name">{category.name || category.categoryName || 'Unknown'}</td>
                          <td className="col-4-qty">{category.orderQuantity?.toFixed(0) || ''}</td>
                          <td className="col-4-percent">{category.percentageFromNetSales?.toFixed(2) || category.percentage?.toFixed(2)}%</td>
                          <td className="col-4-amount">{formatCurrency(category.amount)}</td>
                        </tr>
                      ))}
                    {/* Total Row */}
                    <tr className="font-bold">
                      <td className="col-4-name">Total</td>
                      <td className="col-4-qty">
                        {reportData.categorySaleSummary.categories
                          .filter((category: any) => shouldShowValue(category.amount))
                          .reduce((sum: number, c: any) => sum + (c.orderQuantity || 0), 0)
                          .toFixed(0)}
                      </td>
                      <td className="col-4-percent"></td>
                      <td className="col-4-amount">
                        {formatCurrency(
                          reportData.categorySaleSummary.categories
                            .filter((category: any) => shouldShowValue(category.amount))
                            .reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </>
            )}

            {/* Order Charge Summary Section */}
            {reportData.chargesSummary?.charges && reportData.chargesSummary.charges.length > 0 && (
              <>
                <div className="my-2"></div>
                <div className="text-center font-bold text-xs">ORDER CHARGE SUMMARY</div>
                <div className="my-2"></div>
                <table>
                  <tbody>
                    {reportData.chargesSummary.charges.map((charge: any, idx: number) => (
                      <tr key={idx}>
                        <td className="col-3-left">{charge.name || 'No Charge'}</td>
                        <td className="col-3-middle">{charge.numberOfOrders?.toFixed(1) || '0.0'}</td>
                        <td className="col-3-right">{formatCurrency(charge.netTotal)}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="font-bold">
                      <td className="col-3-left"></td>
                      <td className="col-3-middle">{reportData.chargesSummary.numberOfOrders?.toFixed(1) || '0.0'}</td>
                      <td className="col-3-right">{formatCurrency(reportData.chargesSummary.netTotal)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </>
            )}

            {/* Statistics Section */}
            {reportData.stats && (
              <>
                <div className="my-2"></div>
                <div className="text-center font-bold text-xs">Statistics</div>
                <div className="my-2"></div>
                <table>
                  <tbody>
                    <tr>
                      <td className="col-2-left">Customers</td>
                      <td className="col-2-right">{reportData.stats.newCustomerCount?.toFixed(0) || 0}</td>
                    </tr>
                    <tr>
                      <td className="col-2-left">Transactions</td>
                      <td className="col-2-right">{reportData.stats.totalTransactions?.toFixed(0) || 0}</td>
                    </tr>
                    <tr>
                      <td className="col-2-left">Items Sold</td>
                      <td className="col-2-right">{reportData.stats.itemsSold?.toFixed(0) || 0}</td>
                    </tr>
                    <tr>
                      <td className="col-2-left">Voids</td>
                      <td className="col-2-right">{formatCurrency(reportData.stats?.voids || 0)}</td>
                    </tr>
                    <tr>
                      <td className="col-2-left">Refunds</td>
                      <td className="col-2-right">{formatCurrency(reportData.totalSales?.refunds)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </>
            )}

            {/* Tips Out Section */}
            {(reportData.tipSummary || []).length > 0 && (
              <>
                <div className="my-2"></div>
                <div className="text-center font-bold text-xs">Tips Out</div>
                <div className="my-2"></div>
                <table>
                  <tbody>
                    {reportData.tipSummary.map((tip: any, idx: number) => (
                      <tr key={idx}>
                        <td className="col-2-left">{tip.username || tip.employeeName || 'Unknown'}</td>
                        <td className="col-2-right">{formatCurrency(tip.totalTips || tip.tipAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </>
            )}

            <div className="text-center text-xs mt-4">-----END OF REPORT-----</div>
          </>
        )}
        </div>
      </div>
    </>
  );
};
