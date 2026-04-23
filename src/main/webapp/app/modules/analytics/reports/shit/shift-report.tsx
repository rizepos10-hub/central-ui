import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FilterMatchMode } from "primereact/api";
import { translate } from "react-jhipster";
import { getEntities as getUsers } from "app/entities/branch-pos-user/user.reducer";
import userClock, { filterEntities, getEntityReport } from "app/modules/analytics/user-clock/user-clock.reducer";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { convertDateTimeFromServer } from "app/shared/util/date-utils";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
import SummaryReportTotalReceived from "app/shared/components/report/summary-report-total-received";
import { IUserClock } from "app/shared/model/user-clock.model";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { exportExcelSummaryReport } from "app/shared/util/excel-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
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

const initialState = {
  first: 0,
  rows: 20,
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
  const reportContentRef = useRef(null);
  const users = useAppSelector(state => state.PosBranchUser.entities);
  const loadingUsers = useAppSelector(state => state.PosBranchUser.loading);
  const userClocks = useAppSelector(state => state.userClock.entities);
  const loadingClocks = useAppSelector(state => state.userClock.loading);
  const summaryReport = useAppSelector(state => state.userClock.report);
  const loadingReport = useAppSelector(state => state.userClock.loadingReport);
  const userClockErrorMessage = useAppSelector(state => state.userClock.errorMessage);

  const [filterState, setFilterState] = useState(initialState);
  const [selectedShift, setSelectedShift] = useState<IUserClock | null>(null);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  useEffect(() => {
    dispatch(getUsers({}));
  }, []);

  useEffect(() => {
    getShifts();
  }, [filterState]);

  useEffect(() => {
    if (selectedShift?.id) {
      dispatch(getEntityReport(selectedShift?.id))
    }
  }, [selectedShift?.id]);

  const getShifts = () => {
    if (!filterState.filters.instantClockedIn.value || !filterState.filters.instantClockedOut.value || !filterState.filters.username.value) return;
    const updatedState = applyMatchModeMap(filterState);
    dispatch(
      filterEntities({
        query: updatedState,
      })
    );
  }

  const handleDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    setFilterState({
      ...filterState,
      filters: {
        ...filterState.filters,
        instantClockedIn: { value: range.from, matchMode: FilterMatchMode.STARTS_WITH },
        instantClockedOut: { value: range.to, matchMode: FilterMatchMode.ENDS_WITH },
      }
    });
  }

  const fileName = createReportFileName('Shift Report', [filterState.filters.username.value, selectedShift?.id || null]);
  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      setError(null);
      await exportExcelSummaryReport(summaryReport);
    } catch (error) {
      setError(getReportApiErrorMessage(error, 'Unable to export shift report.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!reportContentRef.current || !summaryReport) {
      return;
    }

    try {
      setBusyAction('pdf');
      setError(null);
      await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'portrait' });
    } catch (error) {
      setError(getReportApiErrorMessage(error, 'Unable to export shift report.'));
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

  return (
    <PageWrapper>
      {error || userClockErrorMessage ? (
        <ReportErrorState
          message={error || getReportApiErrorMessage(userClockErrorMessage, 'Unable to load shift report.')}
          dataTestId="shift-report-error"
          className="mb-3"
        />
      ) : null}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold">Shift Report</h1>
        <div className="hide-on-print flex gap-1">
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={!summaryReport || busyAction !== null || !!error || !!userClockErrorMessage}
            busyAction={busyAction}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="username" className="text-xs">Username</Label>
            <Select
              value={filterState.filters.username.value}
              onValueChange={(value) =>
                setFilterState({
                  ...filterState,
                  filters: {
                    ...filterState.filters,
                    username: { value, matchMode: FilterMatchMode.EQUALS },
                  },
                })
              }
            >
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
            <Label htmlFor="shifts" className="text-xs">Select Shift to Get Report</Label>
            <Select
              value={selectedShift?.id}
              onValueChange={(value) => {
                const shift = userClocks.find(clock => clock.id === value);
                setSelectedShift(shift);
              }}
            >
              <SelectTrigger id="shifts" className="h-7 text-xs">
                <SelectValue placeholder="Select Shift" />
              </SelectTrigger>
              <SelectContent>
                {userClocks.map(option => (
                  <SelectItem key={option.id} value={option.id} className="text-xs">
                    {convertDateTimeFromServer(option.instantClockedIn)} - {convertDateTimeFromServer(option.instantClockedOut)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loadingReport && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {summaryReport && !error && !userClockErrorMessage && (
        <div ref={reportContentRef} className="report-export-root space-y-3">
          <ReportExportHeader
            reportTitle="Shift Report"
            hiddenOnScreen
            forceVisible={busyAction === 'pdf'}
            filters={[
              { label: 'Username', value: filterState.filters.username.value },
              {
                label: 'Date Range',
                value:
                  dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "yyyy-MM-dd")} - ${format(dateRange.to, "yyyy-MM-dd")}`
                    : null,
              },
              {
                label: 'Selected Shift',
                value:
                  selectedShift
                    ? `${formatDateForDisplay(selectedShift.instantClockedIn, "yyyy-MM-dd")} - ${formatDateForDisplay(selectedShift.instantClockedOut, "yyyy-MM-dd")}`
                    : null,
              },
            ]}
          />

          <div className="mt-2 space-y-3">
            <GenericSalesReport title={'Total Sales'} report={summaryReport?.totalSales} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["DineIn"]} title={"Dine In Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["Delivery"]} title={"Delivery Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["PickUp"]} title={"Pick Up Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["WalkIn"]} title={"Walk In Sales"} />

            {summaryReport?.totalReceived && <SummaryReportTotalReceived totalReceived={summaryReport.totalReceived} />}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default ShiftReport;
