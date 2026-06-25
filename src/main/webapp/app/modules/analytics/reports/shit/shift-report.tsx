import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FilterMatchMode } from "primereact/api";
import { translate } from "react-jhipster";
import { getEntities as getUsers } from "app/entities/branch-pos-user/user.reducer";
import { filterEntities, getEntityReport } from "app/modules/analytics/user-clock/user-clock.reducer";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
import SummaryReportTotalReceived from "app/shared/components/report/summary-report-total-received";
import { IUserClock } from "app/shared/model/user-clock.model";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { exportExcelSummaryReport, parseSummaryReport } from "app/shared/util/excel-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { formatClockDuration } from 'app/shared/util/duration-format-utils';
import { formatShiftOptionLabel, hasSalesActivity } from 'app/shared/util/shift-report-utils';
import ReportActionBar from "app/shared/components/report/report-action-bar";
import ReportErrorState from 'app/shared/components/report/report-error-state';
import ReportExportHeader from "app/shared/components/report/report-export-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/src/main/webapp/app/lib/utils";
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from "app/shared/util/report-export-utils";
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';

const ORDER_OPTION_SECTIONS = [
  { key: 'DineIn', title: 'Dine In Sales' },
  { key: 'Delivery', title: 'Delivery Sales' },
  { key: 'PickUp', title: 'Pick Up Sales' },
  { key: 'WalkIn', title: 'Walk In Sales' },
] as const;

const initialState = {
  first: 0,
  rows: 500,
  page: 0,
  sortField: null,
  sortOrder: null,
  filters: {
    username: { value: null, matchMode: FilterMatchMode.EQUALS },
    instantClockedIn: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    instantClockedOut: { value: null, matchMode: FilterMatchMode.ENDS_WITH },
  }
};

const ShiftReport = () => {
  const dispatch = useAppDispatch();
  const reportContentRef = useRef<HTMLDivElement>(null);
  const users = useAppSelector(state => state.PosBranchUser.entities);
  const userClocks = useAppSelector(state => state.userClock.entities);
  const loadingClocks = useAppSelector(state => state.userClock.loading);
  const summaryReport = useAppSelector(state => state.userClock.report);
  const loadingReport = useAppSelector(state => state.userClock.loadingReport);
  const userClockErrorMessage = useAppSelector(state => state.userClock.errorMessage);

  const [filterState, setFilterState] = useState(initialState);
  const [selectedShift, setSelectedShift] = useState<IUserClock | null>(null);
  const [hasLoadedShifts, setHasLoadedShifts] = useState(false);
  const [hasLoadedShiftReport, setHasLoadedShiftReport] = useState(false);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  const selectedUsername = filterState.filters.username.value;
  const canLoadShifts = !!selectedUsername && !!dateRange.from && !!dateRange.to;
  const parsedSummaryReport = useMemo(() => parseSummaryReport(summaryReport), [summaryReport]);
  const reportError = error || (userClockErrorMessage ? getReportApiErrorMessage(userClockErrorMessage, 'Unable to load shift report.') : null);
  const fileName = createReportFileName('Shift Report', [selectedUsername, selectedShift?.id || null]);

  useEffect(() => {
    dispatch(getUsers({}));
  }, []);

  useEffect(() => {
    if (!selectedShift?.id) {
      setHasLoadedShiftReport(false);
      return;
    }

    setHasLoadedShiftReport(false);
    dispatch(getEntityReport(selectedShift.id))
      .unwrap()
      .finally(() => setHasLoadedShiftReport(true));
  }, [selectedShift?.id]);

  const resetShiftSelection = () => {
    setSelectedShift(null);
    setHasLoadedShiftReport(false);
  };

  const loadShifts = async () => {
    if (!canLoadShifts) {
      setError('Please select a user and full date range.');
      return;
    }

    setError(null);
    resetShiftSelection();

    const updatedState = applyMatchModeMap(filterState);
    try {
      await dispatch(filterEntities({ query: updatedState })).unwrap();
      setHasLoadedShifts(true);
    } catch {
      setHasLoadedShifts(true);
    }
  };

  const handleUsernameChange = (value: string) => {
    resetShiftSelection();
    setHasLoadedShifts(false);
    setFilterState({
      ...filterState,
      filters: {
        ...filterState.filters,
        username: { value, matchMode: FilterMatchMode.EQUALS },
      },
    });
  };

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    resetShiftSelection();
    setHasLoadedShifts(false);

    let endDate = range.to;
    if (endDate) {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59);
    }

    setFilterState({
      ...filterState,
      filters: {
        ...filterState.filters,
        instantClockedIn: { value: range.from, matchMode: FilterMatchMode.STARTS_WITH },
        instantClockedOut: { value: endDate, matchMode: FilterMatchMode.ENDS_WITH },
      }
    });
  };

  const handleExcelExport = async () => {
    if (!parsedSummaryReport) {
      return;
    }

    try {
      setBusyAction('excel');
      setError(null);
      await exportExcelSummaryReport(parsedSummaryReport);
    } catch (exportError) {
      setError(getReportApiErrorMessage(exportError, 'Unable to export shift report.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!reportContentRef.current || !parsedSummaryReport) {
      return;
    }

    try {
      setBusyAction('pdf');
      setError(null);
      await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'portrait' });
    } catch (exportError) {
      setError(getReportApiErrorMessage(exportError, 'Unable to export shift report.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: fileName,
    pageStyle: `${analyticsReportPrintStyles('portrait')}
      @media print {
        .hide-on-print {
          display: none !important;
        }
      }
    `,
    onBeforeGetContent: async () => {
      setError(null);
      setBusyAction('print');
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  const showShiftSummaryCard = !!selectedShift && hasLoadedShiftReport && !!parsedSummaryReport && !loadingReport;
  const showReportSections = showShiftSummaryCard;

  return (
    <PageWrapper>
      <h1 className="text-lg font-semibold mb-2">Shift Report</h1>

      <div className="flex flex-col gap-2 mb-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="username" className="text-xs">Username</Label>
            <Select value={selectedUsername ?? undefined} onValueChange={handleUsernameChange}>
              <SelectTrigger id="username" className="h-7 text-xs">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.userName} value={user.userName} className="text-xs">
                    {user.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="date" className="text-xs">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "h-7 text-xs justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                  disabled={!users || users?.length === 0}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>{translate('orders.view.table.filters.date')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => handleDateChange(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="shifts" className="text-xs">Select Shift</Label>
            <Select
              value={selectedShift?.id}
              onValueChange={(value) => {
                const shift = userClocks.find(clock => clock.id === value) ?? null;
                setSelectedShift(shift);
              }}
              disabled={!hasLoadedShifts || loadingClocks || userClocks.length === 0}
            >
              <SelectTrigger id="shifts" className="h-7 text-xs">
                <SelectValue placeholder="Select Shift" />
              </SelectTrigger>
              <SelectContent>
                {userClocks.map(option => (
                  <SelectItem key={option.id} value={option.id} className="text-xs">
                    {formatShiftOptionLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {!canLoadShifts
              ? 'Select a user and date range, then load shifts.'
              : hasLoadedShifts
                ? `${userClocks.length} shift${userClocks.length === 1 ? '' : 's'} found`
                : 'Ready to load shifts for the selected filters.'}
          </p>
          <Button size="sm" className="h-7 text-xs" onClick={loadShifts} disabled={!canLoadShifts || loadingClocks}>
            {loadingClocks ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              'Load Shifts'
            )}
          </Button>
        </div>
      </div>

      {reportError ? <ReportErrorState message={reportError} dataTestId="shift-report-error" className="mb-3" /> : null}

      {loadingClocks && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!reportError && !loadingClocks && !hasLoadedShifts && (
        <div
          className="rounded-lg border px-4 py-10 text-center text-xs text-muted-foreground"
          data-testid="shift-report-not-loaded"
        >
          Select a user and date range, then load shifts.
        </div>
      )}

      {!reportError && !loadingClocks && hasLoadedShifts && userClocks.length === 0 && (
        <div
          className="rounded-lg border px-4 py-10 text-center text-xs text-muted-foreground"
          data-testid="shift-report-empty-shifts"
        >
          No shifts found for the selected user and date range.
        </div>
      )}

      {!reportError && !loadingClocks && hasLoadedShifts && userClocks.length > 0 && !selectedShift && (
        <div
          className="rounded-lg border px-4 py-10 text-center text-xs text-muted-foreground"
          data-testid="shift-report-select-shift"
        >
          Select a shift to view the report.
        </div>
      )}

      {selectedShift && loadingReport && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {selectedShift && hasLoadedShiftReport && !loadingReport && !parsedSummaryReport && !reportError && (
        <div
          className="rounded-lg border px-4 py-10 text-center text-xs text-muted-foreground"
          data-testid="shift-report-empty-data"
        >
          No sales data available for this shift.
        </div>
      )}

      {showReportSections && parsedSummaryReport && (
        <div className="space-y-3">
          <div className="flex justify-end hide-on-print">
            <ReportActionBar
              onExcel={handleExcelExport}
              onPdf={handlePdfExport}
              onPrint={handlePrint}
              disabled={!parsedSummaryReport || busyAction !== null || !!reportError}
              busyAction={busyAction}
            />
          </div>

          <div ref={reportContentRef} className="report-export-root space-y-3">
            <ReportExportHeader
              reportTitle="Shift Report"
              hiddenOnScreen
              forceVisible={busyAction === 'pdf'}
              filters={[
                { label: 'Username', value: selectedUsername },
                {
                  label: 'Date Range',
                  value:
                    dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "yyyy-MM-dd")} - ${format(dateRange.to, "yyyy-MM-dd")}`
                      : null,
                },
                {
                  label: 'Selected Shift',
                  value: selectedShift
                    ? formatShiftOptionLabel(selectedShift)
                    : null,
                },
              ]}
            />

            <div className="rounded-lg border p-3 text-xs">
              <div className="font-semibold mb-2">Shift Summary</div>
              <div className="grid gap-1 sm:grid-cols-2">
                <div><span className="text-muted-foreground">User:</span> {selectedUsername}</div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  {formatClockDuration(selectedShift.instantClockedIn, selectedShift.instantClockedOut)}
                </div>
                <div>
                  <span className="text-muted-foreground">Clock In:</span>{' '}
                  {formatDateForDisplay(selectedShift.instantClockedIn)}
                </div>
                <div>
                  <span className="text-muted-foreground">Clock Out:</span>{' '}
                  {formatDateForDisplay(selectedShift.instantClockedOut)}
                </div>
                {selectedShift.deposit != null ? (
                  <div>
                    <span className="text-muted-foreground">Deposit:</span> {selectedShift.deposit.toFixed(2)}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-2 space-y-3">
              <GenericSalesReport title="Total Sales" report={parsedSummaryReport.totalSales} />

              {ORDER_OPTION_SECTIONS.map(({ key, title }) => {
                const sectionReport = parsedSummaryReport.totalSalesByOrderOption?.[key];
                if (!hasSalesActivity(sectionReport)) {
                  return null;
                }

                return <GenericSalesReport key={key} report={sectionReport} title={title} />;
              })}

              {parsedSummaryReport.totalReceived ? (
                <SummaryReportTotalReceived totalReceived={parsedSummaryReport.totalReceived} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ShiftReport;
