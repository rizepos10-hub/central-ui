import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getBranchRegistries } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { getEntities as getTills } from 'app/entities/settings/branch-registry/till/till.reducer';
import { fetchOptimizedProductSalesReport } from 'app/modules/analytics/api';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { ITill } from 'app/shared/model/till.model';
import { IOptimizedProductSalesReport } from 'app/shared/model/optimized-product-sales-report.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import { reportTableBodyClassName } from 'app/shared/components/report/report-ui';
import { useReactToPrint } from 'react-to-print';
import {
  analyticsReportPrintStyles,
  buildOptimizedProductSalesWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { cn } from '@/src/main/webapp/app/lib/utils';

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

const formatPercent = (value?: number | null) => (value ?? 0).toFixed(2);

const formatQuantity = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '0';
  }

  return Number.isInteger(value) ? `${value}` : `${value}`;
};

const REPORT_TITLE = 'Optimized Product Sales Report';

const OptimizedProductSalesReport = () => {
  const dispatch = useAppDispatch();
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const branchRegistries: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const tills: ITill[] = useAppSelector(state => state.till.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null);
  const [selectedTillId, setSelectedTillId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IOptimizedProductSalesReport | null>(null);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<{
    fromDate: string;
    toDate: string;
    branch: string | null;
    source: string | null;
    registryId: string | null;
    tillId: string | null;
    username: string | null;
  } | null>(null);
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
    dispatch(
      getBranchRegistries({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRegistryId) {
      setSelectedTillId(null);
      return;
    }

    dispatch(
      getTills({
        id: selectedRegistryId,
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch, selectedRegistryId]);

  useEffect(() => {
    if (!selectedRegistryId) {
      return;
    }

    const hasSelectedTill = tills.some(till => till.id === selectedTillId);
    if (!hasSelectedTill) {
      setSelectedTillId(null);
    }
  }, [selectedRegistryId, selectedTillId, tills]);

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

  const loadReport = async (
    filtersOverride?: {
      fromDate: string;
      toDate: string;
      branch: string | null;
      source: string | null;
      registryId: string | null;
      tillId: string | null;
      username: string | null;
    }
  ) => {
    const targetFilters = filtersOverride || appliedFilters;
    if (!targetFilters) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchOptimizedProductSalesReport(targetFilters);
      setReportData(data);
      setHasLoadedReport(true);
      setAppliedFilters(targetFilters);
    } catch (err) {
      setReportData(null);
      setHasLoadedReport(true);
      setError('Unable to load optimized product sales report.');
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
      source: selectedSource,
      registryId: selectedRegistryId,
      tillId: selectedTillId,
      username: username.trim() ? username.trim() : null,
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

  const isEmpty = reportData !== null && (!reportData.items || reportData.items.length === 0);
  const appliedBranchName = branchList.find(branch => branch.id === appliedFilters?.branch)?.name || 'All branches';
  const appliedRegistryName = branchRegistries.find(registry => registry.id === appliedFilters?.registryId)?.name || 'All registries';
  const appliedTillName = tills.find(till => till.id === appliedFilters?.tillId)?.name || 'All tills';
  const intervalLabel =
    appliedFilters?.fromDate && appliedFilters?.toDate
      ? `${formatDateForDisplay(appliedFilters.fromDate, 'PP')} - ${formatDateForDisplay(appliedFilters.toDate, 'PP')}`
      : 'Not selected';
  const fileName = createReportFileName(REPORT_TITLE, [appliedBranchName, appliedFilters?.source || 'all-sources', intervalLabel]);
  const exportDisabled = loading || busyAction !== null || isEmpty || !hasLoadedReport || !reportData;

  const handleExcelExport = async () => {
    if (!reportData) {
      return;
    }

    try {
      setBusyAction('excel');
      await saveWorkbookAsExcel(
        buildOptimizedProductSalesWorkbook(reportData, {
          title: REPORT_TITLE,
          filters: [
            { label: 'Branch', value: appliedBranchName },
            { label: 'Source', value: appliedFilters?.source || 'All sources' },
            { label: 'Registry', value: appliedRegistryName },
            { label: 'Till', value: appliedTillName },
            { label: 'Username', value: appliedFilters?.username || 'All users' },
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
      await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'landscape' });
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('landscape'),
  });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">{REPORT_TITLE}</h1>
        </div>

        <Card className="report-filters-card p-3">
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Source</Label>
                <Select value={selectedSource ?? 'null'} onValueChange={value => setSelectedSource(value === 'null' ? null : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {Object.values(SourceType).map(source => (
                      <SelectItem key={source} value={source} className="text-xs">
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Registry</Label>
                <Select
                  value={selectedRegistryId ?? 'null'}
                  onValueChange={value => setSelectedRegistryId(value === 'null' ? null : value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select registry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {branchRegistries.map(registry => (
                      <SelectItem key={registry.id} value={registry.id} className="text-xs">
                        {registry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Till</Label>
                <Select value={selectedTillId ?? 'null'} onValueChange={value => setSelectedTillId(value === 'null' ? null : value)} disabled={!selectedRegistryId}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder={selectedRegistryId ? 'Select till' : 'Select registry first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {tills.map(till => (
                      <SelectItem key={till.id} value={till.id} className="text-xs">
                        {till.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="optimized-product-sales-username" className="text-xs font-semibold">Username</Label>
                <Input
                  id="optimized-product-sales-username"
                  className="h-7 text-xs"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
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
              <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">Branch</div>
                  <div className="mt-1 text-sm font-semibold">{appliedBranchName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Source</div>
                  <div className="mt-1 text-sm font-semibold">{appliedFilters?.source || 'All sources'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Registry</div>
                  <div className="mt-1 text-sm font-semibold">{appliedRegistryName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Till</div>
                  <div className="mt-1 text-sm font-semibold">{appliedTillName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Username</div>
                  <div className="mt-1 text-sm font-semibold">{appliedFilters?.username || 'All users'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date Range</div>
                  <div className="mt-1 text-sm font-semibold">{intervalLabel}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </div>
              ) : !hasLoadedReport ? (
                <div className="py-10 text-center text-xs text-muted-foreground">Run the report to view results.</div>
              ) : isEmpty ? (
                <div className="py-10 text-center text-xs text-muted-foreground">No optimized product sales found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Receipt Alias</TableHead>
                      <TableHead className="text-xs text-right">Quantity</TableHead>
                      <TableHead className="text-xs text-right">Quantity %</TableHead>
                      <TableHead className="text-xs text-right">Ext Cost</TableHead>
                      <TableHead className="text-xs text-right">Sales</TableHead>
                      <TableHead className="text-xs text-right">Margin</TableHead>
                      <TableHead className="text-xs text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={reportTableBodyClassName}>
                    {reportData?.items?.map(item => (
                      <TableRow key={item.itemId || item.receiptAlias}>
                        <TableCell className="text-xs">{item.receiptAlias || '-'}</TableCell>
                        <TableCell className="text-xs text-right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell className="text-xs text-right">{formatPercent(item.quantityPercent)}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(item.extCost)}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(item.sales)}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(item.margin)}</TableCell>
                        <TableCell className="text-xs text-right">{formatPercent(item.marginPercent)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="text-xs font-semibold">Totals</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{formatQuantity(reportData?.totalQuantity)}</TableCell>
                      <TableCell className="text-xs text-right">-</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{formatAmount(reportData?.totalExtCost)}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{formatAmount(reportData?.totalSales)}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{formatAmount(reportData?.totalMargin)}</TableCell>
                      <TableCell className="text-xs text-right">-</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default OptimizedProductSalesReport;
