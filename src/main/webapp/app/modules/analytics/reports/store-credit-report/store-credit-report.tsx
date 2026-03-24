import React, { useEffect, useState } from 'react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw } from 'lucide-react';
import { fetchStoreCreditReport } from 'app/modules/analytics/api';
import { IStoreCreditReportRow } from 'app/shared/model/store-credit-report.model';

const PAGE_SIZE = 10;

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

const StoreCreditReport = () => {
  const [rows, setRows] = useState<IStoreCreditReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);

  const canGoNext = rows.length === PAGE_SIZE;
  const canGoPrevious = page > 0 && !loading;

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

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">Customer Balance Report</h1>
        </div>

        {error && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

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
            <TableBody>
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
      </div>
    </PageWrapper>
  );
};

export default StoreCreditReport;
