import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { fetchCommissionFeesReport } from 'app/modules/analytics/api';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { IBranch } from 'app/shared/model/branch.model';
import { ICommissionFeesReport } from 'app/shared/model/commission-fees-report.model';
import {
  analyticsReportPrintStyles,
  buildCommissionFeesWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReactToPrint } from 'react-to-print';
import { cn } from '@/src/main/webapp/app/lib/utils';

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  branch: string;
};

const REPORT_TITLE = 'Commission Fees Report';

const formatAmount = (value?: number | null) => (value ?? 0).toFixed(2);

const formatCount = (value?: number | null) => {
  const safeValue = value ?? 0;
  return Number.isInteger(safeValue) ? `${safeValue}` : `${safeValue}`;
};

const formatRate = (value?: number | null) => `${(value ?? 0).toFixed(2)}%`;

const buildBoundaryDate = (date: Date, boundary: 'start' | 'end', timeZone?: string) => {
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

const CommissionFeesReport = () => {
  const dispatch = useAppDispatch();
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ICommissionFeesReport | null>(null);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
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

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) {
      return 'Pick a date range';
    }

    if (!dateRange.to) {
      return format(dateRange.from, 'PP');
    }

    return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
  }, [dateRange]);

  const selectedBranchEntity = useMemo(
    () => branchList.find(branch => branch.id === selectedBranch) || null,
    [branchList, selectedBranch]
  );

  const appliedBranchName = useMemo(
    () => branchList.find(branch => branch.id === appliedFilters?.branch)?.name || '',
    [appliedFilters?.branch, branchList]
  );

  const intervalLabel =
    appliedFilters?.fromDate && appliedFilters?.toDate
      ? `${formatDateForDisplay(appliedFilters.fromDate, 'PP')} - ${formatDateForDisplay(appliedFilters.toDate, 'PP')}`
      : 'Not selected';

  const fileName = createReportFileName(REPORT_TITLE, [appliedBranchName, intervalLabel]);
  const hasRequiredFilters = Boolean(dateRange?.from && dateRange?.to && selectedBranch);
  const hasReportData = hasLoadedReport && reportData !== null;
  const exportDisabled = loading || busyAction !== null || !hasReportData;

  const loadReport = async (filtersOverride?: AppliedFilters) => {
    const targetFilters = filtersOverride || appliedFilters;
    if (!targetFilters) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchCommissionFeesReport(targetFilters);
      setReportData(data);
      setHasLoadedReport(true);
      setAppliedFilters(targetFilters);
    } catch (err) {
      setReportData(null);
      setHasLoadedReport(true);
      setError('Unable to load commission fees report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    if (!dateRange?.from || !dateRange?.to || !selectedBranch) {
      setError('Please select from date, to date, and branch.');
      return;
    }

    const targetTimeZone = selectedBranchEntity?.timezone || businessTimeZone;
    const nextFilters = {
      fromDate: buildBoundaryDate(dateRange.from, 'start', targetTimeZone),
      toDate: buildBoundaryDate(dateRange.to, 'end', targetTimeZone),
      branch: selectedBranch,
    };

    await loadReport(nextFilters);
  };

  const handleExcelExport = async () => {
    if (!reportData) {
      return;
    }

    try {
      setBusyAction('excel');
      await saveWorkbookAsExcel(
        buildCommissionFeesWorkbook(reportData, {
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
      <div className="max-w-5xl mx-auto space-y-3">
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
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
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
                {appliedFilters ? 'Filters applied' : 'Select required filters to load the report'}
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
                <Button type="button" className="h-7 text-xs" onClick={handleGetReport} disabled={!hasRequiredFilters || loading}>
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
            <CardContent className="py-6 text-center text-sm text-destructive" data-testid="commission-fees-report-error">
              {error}
            </CardContent>
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
            <ReportExportHeader
              reportTitle={REPORT_TITLE}
              hiddenOnScreen
              forceVisible={busyAction === 'pdf'}
              filters={[
                { label: 'Branch', value: appliedBranchName },
                { label: 'Date Range', value: intervalLabel },
              ]}
            />
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
          ) : !reportData ? (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted-foreground">No commission fees data found.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Orders Count</div>
                  <div className="mt-2 text-2xl font-semibold">{formatCount(reportData.ordersCount)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Subtotal Sum</div>
                  <div className="mt-2 text-2xl font-semibold">{formatAmount(reportData.subtotalSum)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Commission Rate</div>
                  <div className="mt-2 text-2xl font-semibold">{formatRate(reportData.commissionRate)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Commission Amount</div>
                  <div className="mt-2 text-2xl font-semibold">{formatAmount(reportData.commissionAmount)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default CommissionFeesReport;
