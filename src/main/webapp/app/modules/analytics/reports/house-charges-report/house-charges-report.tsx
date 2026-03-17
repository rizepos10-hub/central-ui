import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';

import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { fetchHouseChargesReport } from 'app/modules/analytics/api';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { IHouseChargesReportRow } from 'app/shared/model/house-charges-report.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/src/main/webapp/app/lib/utils';

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

const HouseChargesReport = () => {
  const dispatch = useAppDispatch();
  const branchList = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<IHouseChargesReportRow[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<{ fromDate: string; toDate: string; branch: string | null } | null>(null);

  useEffect(() => {
    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

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

  const loadReport = async (filtersOverride?: { fromDate: string; toDate: string; branch: string | null }) => {
    const targetFilters = filtersOverride || appliedFilters;
    if (!targetFilters) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchHouseChargesReport({
        fromDate: targetFilters.fromDate,
        toDate: targetFilters.toDate,
        branch: targetFilters.branch,
      });
      setRows(Array.isArray(data) ? data : []);
      setAppliedFilters(targetFilters);
    } catch (err) {
      setRows([]);
      setError('Unable to load house charges report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select both from and to dates.');
      return;
    }

    const nextFilters = {
      fromDate: formatBoundaryDate(dateRange.from, 'start'),
      toDate: formatBoundaryDate(dateRange.to, 'end'),
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

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">House Charges Report</h1>
        </div>

        <Card className="p-3">
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
                <Select
                  value={selectedBranch ?? 'null'}
                  onValueChange={value => setSelectedBranch(value === 'null' ? null : value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select branch" />
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
                {appliedFilters ? 'Filters applied' : 'Select filters to load the report'}
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

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : !appliedFilters ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Run the report to view results.</div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">No house charges records found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Terminal</TableHead>
                    <TableHead className="text-xs">Receipt</TableHead>
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Account Number</TableHead>
                    <TableHead className="text-xs">Customer Name</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={`${row.terminal}-${row.receipt}-${row.timestamp}`}>
                      <TableCell className="text-xs">{row.terminal || '-'}</TableCell>
                      <TableCell className="text-xs">{row.receipt || '-'}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {row.timestamp ? formatDateForDisplay(row.timestamp) : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{row.accountNumber || '-'}</TableCell>
                      <TableCell className="text-xs">{row.customerName || '-'}</TableCell>
                      <TableCell className="text-xs text-right">{formatAmount(row.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default HouseChargesReport;
