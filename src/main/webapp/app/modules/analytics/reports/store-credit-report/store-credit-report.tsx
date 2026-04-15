import React, { useEffect, useRef, useState } from 'react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { fetchStoreCreditReport } from 'app/modules/analytics/api';
import { IStoreCreditReportRow } from 'app/shared/model/store-credit-report.model';
import { reportTableBodyClassName } from 'app/shared/components/report/report-ui';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import { useReactToPrint } from 'react-to-print';
import {
  analyticsReportPrintStyles,
  buildStoreCreditWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  fetchAllStoreCreditRows,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 250;
const REPORT_TITLE = 'Customer Balance Report';

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

type StoreCreditFilters = {
  onAccountEnabledOnly: boolean;
  accountNumber: string;
};

const StoreCreditReport = () => {
  const [rows, setRows] = useState<IStoreCreditReportRow[]>([]);
  const [exportRows, setExportRows] = useState<IStoreCreditReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [filters, setFilters] = useState<StoreCreditFilters>({ onAccountEnabledOnly: false, accountNumber: '' });
  const [appliedFilters, setAppliedFilters] = useState<StoreCreditFilters>({ onAccountEnabledOnly: false, accountNumber: '' });
  const exportContentRef = useRef<HTMLDivElement>(null);

  const canGoNext = rows.length === PAGE_SIZE;
  const canGoPrevious = page > 0 && !loading;
  const hasExportData = hasLoadedReport && rows.length > 0;
  const fileName = createReportFileName(REPORT_TITLE, [
    appliedFilters.onAccountEnabledOnly ? 'on-account-enabled' : null,
    appliedFilters.accountNumber || null,
  ]);

  const loadReport = async (nextPage: number, filtersOverride?: StoreCreditFilters) => {
    const targetFilters = filtersOverride || appliedFilters;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchStoreCreditReport({
        onAccountEnabled: targetFilters.onAccountEnabledOnly ? true : null,
        accountNumber: targetFilters.accountNumber.trim() || null,
        page: nextPage,
        size: PAGE_SIZE,
      });
      setRows(data);
      setPage(nextPage);
      setHasLoadedReport(true);
      setAppliedFilters(targetFilters);
    } catch (err) {
      setRows([]);
      setHasLoadedReport(true);
      setError('Unable to load customer balance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport(0, appliedFilters);
  }, []);

  const ensureExportRows = async () => {
    const allRows = await fetchAllStoreCreditRows(fetchStoreCreditReport, {
      onAccountEnabled: appliedFilters.onAccountEnabledOnly ? true : null,
      accountNumber: appliedFilters.accountNumber.trim() || null,
      size: EXPORT_PAGE_SIZE,
    });
    setExportRows(allRows);
    await new Promise(resolve => setTimeout(resolve, 0));
    return allRows;
  };

  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      const allRows = await ensureExportRows();
      await saveWorkbookAsExcel(
        buildStoreCreditWorkbook(allRows, {
          title: REPORT_TITLE,
          filters: [
            { label: 'On Account Enabled', value: appliedFilters.onAccountEnabledOnly ? 'Yes' : 'All' },
            { label: 'Account Number', value: appliedFilters.accountNumber || 'All' },
          ],
        }),
        fileName
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!exportContentRef.current) {
      return;
    }

    try {
      setBusyAction('pdf');
      await ensureExportRows();

      if (exportContentRef.current) {
        await downloadElementAsPdf(exportContentRef.current, {
          fileName,
          orientation: 'portrait',
        });
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => exportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('portrait'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
      await ensureExportRows();
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  const handleApplyFilters = async () => {
    setExportRows([]);
    await loadReport(0, {
      onAccountEnabledOnly: filters.onAccountEnabledOnly,
      accountNumber: filters.accountNumber.trim(),
    });
  };

  const handleResetFilters = async () => {
    const defaultFilters = { onAccountEnabledOnly: false, accountNumber: '' };
    setFilters(defaultFilters);
    setExportRows([]);
    await loadReport(0, defaultFilters);
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">{REPORT_TITLE}</h1>
        </div>

        <Card className="report-filters-card p-3">
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="store-credit-account-number" className="text-xs font-semibold">
                  Account Number
                </Label>
                <Input
                  id="store-credit-account-number"
                  className="h-7 text-xs"
                  value={filters.accountNumber}
                  onChange={event => setFilters(current => ({ ...current, accountNumber: event.target.value }))}
                  placeholder="Enter account number"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <div className="flex h-7 items-center gap-2 rounded-md border px-3">
                  <Checkbox
                    id="store-credit-on-account-enabled"
                    checked={filters.onAccountEnabledOnly}
                    onCheckedChange={checked =>
                      setFilters(current => ({ ...current, onAccountEnabledOnly: checked === true }))
                    }
                  />
                  <Label htmlFor="store-credit-on-account-enabled" className="cursor-pointer text-xs font-normal">
                    On Account Enabled Only
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {appliedFilters.onAccountEnabledOnly || appliedFilters.accountNumber
                  ? 'Filters applied'
                  : 'Showing all customer balances'}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleResetFilters}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button type="button" size="sm" className="h-7 text-xs" onClick={handleApplyFilters} disabled={loading}>
                  Apply Filters
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
            disabled={!hasExportData || loading || busyAction !== null}
            busyAction={busyAction}
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Customer Name</TableHead>
                <TableHead className="text-xs">Customer ID</TableHead>
                <TableHead className="text-xs text-right">Limit</TableHead>
                <TableHead className="text-xs text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={reportTableBodyClassName}>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                    {hasLoadedReport ? 'No customer balance records found.' : 'Loading customer balance report...'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow key={`${row.customerId}-${row.customerName}`}>
                    <TableCell className="text-xs">{row.customerName}</TableCell>
                    <TableCell className="text-xs">{row.customerId}</TableCell>
                    <TableCell className="text-xs text-right">{formatAmount(row.creditLimit)}</TableCell>
                    <TableCell className="text-xs text-right">{formatAmount(row.balance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            {hasLoadedReport ? `Showing ${rows.length} record${rows.length === 1 ? '' : 's'} on page ${page + 1}` : 'No report loaded'}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => loadReport(page - 1)}
              disabled={!canGoPrevious}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => loadReport(page + 1)}
              disabled={!hasLoadedReport || loading || !canGoNext}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="fixed -left-[10000px] top-0 w-[1000px] bg-white p-6" aria-hidden="true">
          <div ref={exportContentRef} className="report-export-root space-y-4">
            <div className="rounded-md border bg-white p-4">
              <h2 className="text-lg font-semibold">{REPORT_TITLE}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Full export dataset</p>
              <p className="mt-1 text-xs text-muted-foreground">
                On Account Enabled: {appliedFilters.onAccountEnabledOnly ? 'Yes' : 'All'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Account Number: {appliedFilters.accountNumber || 'All'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Total records: {exportRows.length}</p>
            </div>

            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Customer Name</TableHead>
                    <TableHead className="text-xs">Customer ID</TableHead>
                    <TableHead className="text-xs text-right">Limit</TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={reportTableBodyClassName}>
                  {exportRows.map(row => (
                    <TableRow key={`export-${row.customerId}-${row.customerName}`}>
                      <TableCell className="text-xs">{row.customerName}</TableCell>
                      <TableCell className="text-xs">{row.customerId}</TableCell>
                      <TableCell className="text-xs text-right">{formatAmount(row.creditLimit)}</TableCell>
                      <TableCell className="text-xs text-right">{formatAmount(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StoreCreditReport;
