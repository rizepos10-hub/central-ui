import React, { useEffect, useRef, useState } from 'react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const StoreCreditReport = () => {
  const [rows, setRows] = useState<IStoreCreditReportRow[]>([]);
  const [exportRows, setExportRows] = useState<IStoreCreditReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);

  const canGoNext = rows.length === PAGE_SIZE;
  const canGoPrevious = page > 0 && !loading;
  const hasExportData = hasLoadedReport && rows.length > 0;
  const fileName = createReportFileName(REPORT_TITLE);

  const loadReport = async (nextPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStoreCreditReport({
        page: nextPage,
        size: PAGE_SIZE,
      });
      setRows(data);
      setPage(nextPage);
      setHasLoadedReport(true);
    } catch (err) {
      setRows([]);
      setHasLoadedReport(true);
      setError('Unable to load customer balance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport(0);
  }, []);

  const ensureExportRows = async () => {
    const allRows = await fetchAllStoreCreditRows(fetchStoreCreditReport, { size: EXPORT_PAGE_SIZE });
    setExportRows(allRows);
    await new Promise(resolve => setTimeout(resolve, 0));
    return allRows;
  };

  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      const allRows = await ensureExportRows();
      await saveWorkbookAsExcel(buildStoreCreditWorkbook(allRows, { title: REPORT_TITLE }), fileName);
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

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">{REPORT_TITLE}</h1>
        </div>

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
