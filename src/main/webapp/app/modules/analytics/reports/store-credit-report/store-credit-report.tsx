import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useAppSelector } from 'app/config/store';
import { fetchStoreCreditReport } from 'app/modules/analytics/api';
import { IStoreCreditReportRow } from 'app/shared/model/store-credit-report.model';

const PAGE_SIZE = 10;

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

const StoreCreditReport = () => {
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [rows, setRows] = useState<IStoreCreditReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [appliedRange, setAppliedRange] = useState<{ fromDate: string; toDate: string } | null>(null);

  const canGoNext = rows.length === PAGE_SIZE;
  const canGoPrevious = page > 0 && !loading;

  const formatBoundaryDate = (date: Date, boundary: 'start' | 'end') => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = boundary === 'start' ? '00:00:00' : '23:59:59';

    if (!businessTimeZone) {
      const localDate = new Date(date);
      if (boundary === 'start') {
        localDate.setHours(0, 0, 0, 0);
      } else {
        localDate.setHours(23, 59, 59, 0);
      }
      return localDate.toISOString();
    }

    return fromZonedTime(`${year}-${month}-${day} ${time}`, businessTimeZone).toISOString();
  };

  const loadReport = async (nextPage: number, rangeOverride?: { fromDate: string; toDate: string }) => {
    const targetRange = rangeOverride || appliedRange;
    if (!targetRange) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchStoreCreditReport({
        fromDate: targetRange.fromDate,
        toDate: targetRange.toDate,
        page: nextPage,
        size: PAGE_SIZE,
      });
      setRows(data);
      setPage(nextPage);
    } catch (err) {
      setRows([]);
      setError('Unable to load customer balance report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select both from and to dates.');
      return;
    }

    const nextRange = {
      fromDate: formatBoundaryDate(dateRange.from, 'start'),
      toDate: formatBoundaryDate(dateRange.to, 'end'),
    };

    setAppliedRange(nextRange);
    await loadReport(0, nextRange);
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

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">Customer Balance Report</h1>
        </div>

        <Card className="p-3">
          <CardContent className="space-y-3">
            {/* <div className="space-y-1">
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
            </div> */}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {appliedRange ? `Page ${page + 1}` : 'Select a date range to load the report'}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="h-7 text-xs" onClick={() => loadReport(page)} disabled={!appliedRange || loading}>
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
                    {appliedRange ? 'No customer balance records found.' : 'Run the report to view results.'}
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
            {appliedRange ? `Showing ${rows.length} record${rows.length === 1 ? '' : 's'} on page ${page + 1}` : 'No report loaded'}
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
              disabled={!appliedRange || loading || !canGoNext}
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
