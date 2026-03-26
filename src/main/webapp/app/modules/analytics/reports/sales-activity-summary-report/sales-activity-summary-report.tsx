import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';

import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { fetchSalesActivitySummaryReport } from 'app/modules/analytics/api';
import { IBranch } from 'app/shared/model/branch.model';
import {
  ICashierNegativeRow,
  ICollectedSalesTaxRow,
  IDiscountTypeRow,
  ISalesActivitySummaryReport,
  ITypeAmountQuantityRow,
} from 'app/shared/model/sales-activity-summary-report.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportSection, {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
  reportTotalRowClassName,
} from 'app/shared/components/report/report-ui';
import { useReactToPrint } from 'react-to-print';
import {
  analyticsReportPrintStyles,
  buildSalesActivitySummaryWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { cn } from '@/src/main/webapp/app/lib/utils';

type Column<T> = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
};

type FooterItem = {
  columnKey: string;
  value: React.ReactNode;
};

const formatAmount = (value?: number | null, emptyAsDash = false) => {
  if (value === null || value === undefined) {
    return emptyAsDash ? '-' : '0.00';
  }

  return value.toFixed(2);
};

const formatQuantity = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '0';
  }

  return Number.isInteger(value) ? String(value) : value.toString();
};

const getColumnWidthClass = (columnCount: number, index: number) => {
  if (columnCount === 1) {
    return 'w-full';
  }

  if (columnCount === 2) {
    return index === 0 ? 'w-[70%]' : 'w-[30%]';
  }

  return index === 0 ? 'w-[46%]' : 'w-[27%]';
};

const AmountQuantitySection = <T,>({
  title,
  rows,
  columns,
  totals,
}: {
  title: string;
  rows?: T[];
  columns: Column<T>[];
  totals: FooterItem[];
}) => (
  <ReportSection title={title} contentClassName="p-0">
      <Table className={reportTableClassName}>
        <colgroup>
          {columns.map((column, index) => (
            <col key={column.key} className={getColumnWidthClass(columns.length, index)} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className={reportHeaderRowClassName}>
            {columns.map(column => (
              <TableHead
                key={column.key}
                className={`${reportHeadClassName} ${column.align === 'right' ? 'text-right' : ''}`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={reportTableBodyClassName}>
          {!rows?.length ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-center text-xs text-muted-foreground">
                No data
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell
                    key={column.key}
                    className={column.align === 'right' ? reportNumericCellClassName : reportCellClassName}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className={reportTotalRowClassName}>
            {columns.map((column, index) => {
              const footerItem = totals.find(total => total.columnKey === column.key);
              const content = footerItem ? footerItem.value : index === 0 ? 'Totals' : '';
              const className =
                footerItem || column.align === 'right'
                  ? `${reportNumericCellClassName} font-semibold`
                  : `${reportCellClassName} font-semibold`;

              return (
                <TableCell key={column.key} className={className}>
                  {content}
                </TableCell>
              );
            })}
          </TableRow>
        </TableFooter>
      </Table>
  </ReportSection>
);

const REPORT_TITLE = 'Sales Activity Summary Report';

const SalesActivitySummaryReport = () => {
  const dispatch = useAppDispatch();
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ISalesActivitySummaryReport | null>(null);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<{ fromDate: string; toDate: string; branch: string | null } | null>(null);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

  const formatBoundaryDate = (date: Date, boundary: 'start' | 'end', timeZone?: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = boundary === 'start' ? '00:00:00' : '23:59:59';

    if (!timeZone) {
      const localDate = new Date(date);
      if (boundary === 'start') {
        localDate.setHours(0, 0, 0, 0);
      } else {
        localDate.setHours(23, 59, 59, 0);
      }
      return localDate.toISOString();
    }

    return fromZonedTime(`${year}-${month}-${day} ${time}`, timeZone).toISOString();
  };

  const loadReport = async (filtersOverride?: { fromDate: string; toDate: string; branch: string | null }) => {
    const targetFilters = filtersOverride || appliedFilters;
    if (!targetFilters) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchSalesActivitySummaryReport(targetFilters);
      setReportData(data);
      setHasLoadedReport(true);
      setAppliedFilters(targetFilters);
    } catch (err) {
      setReportData(null);
      setHasLoadedReport(true);
      setError('Unable to load sales activity summary report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select both from and to dates.');
      return;
    }

    const branchTimeZone = branchList.find(branch => branch.id === selectedBranch)?.timezone || businessTimeZone;
    const nextFilters = {
      fromDate: formatBoundaryDate(dateRange.from, 'start', branchTimeZone),
      toDate: formatBoundaryDate(dateRange.to, 'end', branchTimeZone),
      branch: selectedBranch,
    };

    await loadReport(nextFilters);
  };

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) {
      return 'Pick a date range';
    }

    if (!dateRange.to) {
      return format(dateRange.from, 'PP');
    }

    return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
  }, [dateRange]);

  const cashierNegativeColumns: Column<ICashierNegativeRow>[] = [
    { key: 'field', label: 'Field', render: row => row.field || '-' },
    { key: 'amount', label: 'Amount', align: 'right', render: row => formatAmount(row.amount, true) },
    { key: 'quantity', label: 'Quantity', align: 'right', render: row => formatQuantity(row.quantity) },
  ];

  const discountColumns: Column<IDiscountTypeRow>[] = [
    { key: 'discountType', label: 'Discount Type', render: row => row.discountType || '-' },
    { key: 'amount', label: 'Amount', align: 'right', render: row => formatAmount(row.amount, true) },
    { key: 'quantity', label: 'Quantity', align: 'right', render: row => formatQuantity(row.quantity) },
  ];

  const salesTaxColumns: Column<ICollectedSalesTaxRow>[] = [
    { key: 'taxCode', label: 'Tax Code', render: row => row.taxCode || '-' },
    { key: 'amount', label: 'Amount', align: 'right', render: row => formatAmount(row.amount, true) },
    { key: 'taxableSales', label: 'Taxable Sales', align: 'right', render: row => formatAmount(row.taxableSales) },
  ];

  const typeColumns: Column<ITypeAmountQuantityRow>[] = [
    { key: 'type', label: 'Type', render: row => row.type || '-' },
    { key: 'amount', label: 'Amount', align: 'right', render: row => formatAmount(row.amount, true) },
    { key: 'quantity', label: 'Quantity', align: 'right', render: row => formatQuantity(row.quantity) },
  ];

  const isReportResponseEmpty = reportData !== null && Object.keys(reportData).length === 0;
  const appliedBranchName = branchList.find(branch => branch.id === appliedFilters?.branch)?.name || 'All branches';
  const intervalLabel =
    appliedFilters?.fromDate && appliedFilters?.toDate
      ? `${formatDateForDisplay(appliedFilters.fromDate, 'PP')} - ${formatDateForDisplay(appliedFilters.toDate, 'PP')}`
      : 'Not selected';
  const fileName = createReportFileName(REPORT_TITLE, [appliedBranchName, intervalLabel]);
  const exportDisabled = loading || busyAction !== null || isReportResponseEmpty || !hasLoadedReport || !reportData;

  const handleExcelExport = async () => {
    if (!reportData) {
      return;
    }

    try {
      setBusyAction('excel');
      await saveWorkbookAsExcel(
        buildSalesActivitySummaryWorkbook(reportData, {
          title: REPORT_TITLE,
          filters: [
            { label: 'Branch', value: appliedBranchName },
            { label: 'Date Range', value: intervalLabel },
          ],
        }),
        fileName
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!reportContentRef.current) {
      return;
    }

    try {
      setBusyAction('pdf');
      await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'portrait' });
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('portrait'),
  });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">{REPORT_TITLE}</h1>
        </div>

        <Card className="report-filters-card p-3">
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('h-7 text-xs w-full justify-start', !dateRange?.from && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateRangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Branch</Label>
                <Select value={selectedBranch ?? 'null'} onValueChange={value => setSelectedBranch(value === 'null' ? null : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {branchList.map(branch => (
                      <SelectItem key={branch.id} value={branch.id} className="text-xs">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {appliedFilters ? 'Filters applied' : 'Select a date range to load the report'}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => loadReport()}
                  disabled={!appliedFilters || loading}
                >
                  <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button type="button" className="h-7 text-xs" onClick={handleGetReport} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Get Report'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={exportDisabled}
            busyAction={busyAction}
          />
        </div>

        <div ref={reportContentRef} className="report-export-root space-y-3">
          {appliedFilters && (
            <Card className="report-export-header">
              <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Branch</div>
                  <div className="mt-1 text-sm font-semibold">{appliedBranchName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date Range</div>
                  <div className="mt-1 text-sm font-semibold">{intervalLabel}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : !hasLoadedReport ? (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted-foreground">Run the report to view results.</CardContent>
            </Card>
          ) : isReportResponseEmpty ? (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted-foreground">No sales activity summary data found.</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AmountQuantitySection
                title="Cashier Negative"
                rows={reportData?.cashierNegative?.rows}
                columns={cashierNegativeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.cashierNegative?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.cashierNegative?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Line Item Discount"
                rows={reportData?.lineItemDiscount?.rows}
                columns={discountColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.lineItemDiscount?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.lineItemDiscount?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Subtotal Discount"
                rows={reportData?.subtotalDiscount?.rows}
                columns={discountColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.subtotalDiscount?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.subtotalDiscount?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Collected Sales Tax"
                rows={reportData?.collectedSalesTax?.rows}
                columns={salesTaxColumns}
                totals={[{ columnKey: 'amount', value: formatAmount(reportData?.collectedSalesTax?.totalAmount) }]}
              />

              <AmountQuantitySection
                title="Exempted Sales Tax"
                rows={reportData?.exemptedSalesTax?.rows}
                columns={[{ key: 'empty', label: 'Tax Exempt Sales', align: 'right', render: () => '-' }]}
                totals={[{ columnKey: 'empty', value: formatAmount(reportData?.exemptedSalesTax?.totalTaxExemptSales) }]}
              />

              <AmountQuantitySection
                title="Credit Card Breakdown"
                rows={reportData?.creditCardBreakdown?.rows}
                columns={typeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.creditCardBreakdown?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.creditCardBreakdown?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="House Charge"
                rows={reportData?.houseCharge?.rows}
                columns={typeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.houseCharge?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.houseCharge?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Department Net Sales"
                rows={reportData?.departmentNetSales?.rows}
                columns={typeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.departmentNetSales?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.departmentNetSales?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Paid Out"
                rows={reportData?.paidOut?.rows}
                columns={typeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.paidOut?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.paidOut?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Paid In"
                rows={reportData?.paidIn?.rows}
                columns={typeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.paidIn?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.paidIn?.totalQuantity) },
                ]}
              />

              <AmountQuantitySection
                title="Gift Card"
                rows={reportData?.giftCard?.rows}
                columns={typeColumns}
                totals={[
                  { columnKey: 'amount', value: formatAmount(reportData?.giftCard?.totalAmount) },
                  { columnKey: 'quantity', value: formatQuantity(reportData?.giftCard?.totalQuantity) },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default SalesActivitySummaryReport;
