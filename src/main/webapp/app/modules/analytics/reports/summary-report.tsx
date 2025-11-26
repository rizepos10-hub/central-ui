import React, { useEffect, useState, useRef } from 'react';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import axios from "axios";
import { format, addDays, addMonths } from 'date-fns';
import { useAppDispatch, useAppSelector } from "app/config/store";
import { dateToUTCString, formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { SourceType } from "app/shared/model/ENUMS/source-type.model";
import { translate, Translate } from "react-jhipster";
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import { exportExcelEodSummaryReport, exportExcelSummaryReport } from 'app/shared/util/excel-utils';
import DynamicEndOfDayReportUI from './end-of-day/dynamic-end-of-day-report';
import { fetchRecentByDate } from '../api';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, BarChart3, CalendarIcon } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';

const SalesSummaryReport = () => {
  const dispatch = useAppDispatch();

  const [salesData, setSalesData] = useState<ISummaryReport>();
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // const [billsSummary, setBillsSummary] = useState<any>(null);
  const branchList = useAppSelector(state => state.branch.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const sourceTypeOptions = [
    { label: "Both", value: null },
    ...Object.values(SourceType).map(source => ({
      label: source,
      value: source,
    })),
  ];

  const filteredBranchOptions = [
    { label: "All", value: null },
    ...branchList.map(branch => ({
      label: branch.name,
      value: branch.id,
    })),
  ];

  const handleFromDateChange = (date: Date | undefined) => {
    setFromDate(date || null);
  };


  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      const adjustedDate = new Date(date);
      adjustedDate.setHours(23, 59, 59, 999);
      setToDate(adjustedDate);
    } else {
      setToDate(null);
    }
  };

  const fetchLastWeekData = () => {
    const today = new Date();
    const lastWeekStartDate = addDays(today, -7);
    setFromDate(lastWeekStartDate);
    setToDate(today);

    handleSubmit(undefined, lastWeekStartDate, today);
  };

  const fetchLastTwoWeeksData = () => {
    const today = new Date();
    const lastTwoWeeksStartDate = addDays(today, -14);
    setFromDate(lastTwoWeeksStartDate);
    setToDate(today);

    handleSubmit(undefined, lastTwoWeeksStartDate, today);
  };

  const fetchLastMonthData = () => {
    const today = new Date();
    const lastMonthStartDate = addMonths(today, -1);
    setFromDate(lastMonthStartDate);
    setToDate(today);

    handleSubmit(undefined, lastMonthStartDate, today);
  };

  const fetchLastThreeMonthsData = () => {
    const today = new Date();
    const lastThreeMonthsStartDate = addMonths(today, -3);
    setFromDate(lastThreeMonthsStartDate);
    setToDate(today);

    handleSubmit(undefined, lastThreeMonthsStartDate, today);
  };

  const handleSubmit = async (event?: React.FormEvent, customFromDate?: Date, customToDate?: Date) => {
    if (event) event.preventDefault();

    const fromDateToUse = customFromDate || fromDate;
    const toDateToUse = customToDate || toDate;

    if (!fromDateToUse || !toDateToUse) {
      alert("Please select both from and to dates.");
      return;
    }

    const fromDateObj = new Date(fromDateToUse);
    const toDateObj = new Date(toDateToUse);
    if (fromDateObj > toDateObj) {
      alert("From date cannot be later than To date.");
      return;
    }
    try {
      setLoading(true);

      const formattedFromDate = dateToUTCString(fromDateToUse);
      const formattedToDate = dateToUTCString(toDateToUse);

      console.log('=== Date Conversion ===');
      console.log('Business timezone:', businessTimeZone);
      console.log('From date (raw):', fromDateToUse);
      console.log('From date (formatted):', formattedFromDate);
      console.log('To date (raw):', toDateToUse);
      console.log('To date (formatted):', formattedToDate);

      const formData = new FormData();
      formData.append('fromDate', formattedFromDate);
      formData.append('toDate', formattedToDate);
      if (selectedBranch) formData.append('branch', selectedBranch);
      if (selectedSource) formData.append('source', selectedSource);
      if (selectedDay) formData.append('dayOfWeek', selectedDay);

      const { data } = await axios.post<ISummaryReport>(`/api/report/sales-summary`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalesData(data);
    } catch (error) {
      console.log(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExcelData = async () => {
    if (branchList && fromDate && toDate) {
      const promises = branchList.map(async (branch) => {
        const formData = new FormData();

        const formattedFromDate = dateToUTCString(fromDate);
        const formattedToDate = dateToUTCString(toDate);

        formData.append('fromDate', formattedFromDate);
        formData.append('toDate', formattedToDate);
        if (selectedSource) formData.append('source', selectedSource);
        if (selectedDay) formData.append('dayOfWeek', selectedDay);
        formData.append('branch', branch?.id);

        const { data } = await axios.post(`/api/report/sales-summary`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        return { branch, data };
      });

      const excelDataArr = await Promise.all(promises);

      exportExcelEodSummaryReport(
        selectedBranch ? excelDataArr.filter(d => d.branch?.id === selectedBranch) : excelDataArr,
        formatDateForDisplay(fromDate),
        formatDateForDisplay(toDate),
        'Sales Summary Report'
      )
    }
  };

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  useEffect(() => {
    // Fetch initial report on first load with default dates/filters
    handleSubmit();
  }, []);

  const printWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-3">
          <h4 className="text-sm font-semibold">
            <Translate contentKey={'analytics.summary.report.title'}>
              Sales Summary Report
            </Translate>
          </h4>
        </div>

        <form className="mb-3">
          <Card className="p-3">
            <CardContent className="space-y-3">
              {/* Date Range Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fromDate" className="text-xs font-semibold">
                    <Translate contentKey={'analytics.summary.fromDate'}>
                      From Date
                    </Translate>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-7 w-full justify-start text-xs font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {fromDate ? format(fromDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromDate || undefined}
                        onSelect={handleFromDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="toDate" className="text-xs font-semibold">
                    <Translate contentKey={'analytics.summary.toDate'}>
                      To Date
                    </Translate>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-7 w-full justify-start text-xs font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {toDate ? format(toDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate || undefined}
                        onSelect={handleToDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    <Translate contentKey={'analytics.summary.select.source'}>
                      Source
                    </Translate>
                  </Label>
                  <Select
                    value={selectedSource || undefined}
                    onValueChange={(value) => setSelectedSource(value === "null" ? null : value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder={translate('analytics.summary.select.source')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null" className="text-xs">Both</SelectItem>
                      {Object.values(SourceType).map((source) => (
                        <SelectItem key={source} value={source} className="text-xs">
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    <Translate contentKey={'analytics.summary.select.branch'}>
                      Branch
                    </Translate>
                  </Label>
                  <Select
                    value={selectedBranch || undefined}
                    onValueChange={(value) => setSelectedBranch(value === "null" ? null : value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder={translate('analytics.summary.select.branch')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null" className="text-xs">All</SelectItem>
                      {branchList.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id} className="text-xs">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    <Translate contentKey={'analytics.summary.select.day'}>
                      Day of Week
                    </Translate>
                  </Label>
                  <Select
                    value={selectedDay || undefined}
                    onValueChange={(value) => setSelectedDay(value === "null" ? null : value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder={translate('analytics.summary.select.day')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null" className="text-xs">All Days</SelectItem>
                      <SelectItem value="MONDAY" className="text-xs">Monday</SelectItem>
                      <SelectItem value="TUESDAY" className="text-xs">Tuesday</SelectItem>
                      <SelectItem value="WEDNESDAY" className="text-xs">Wednesday</SelectItem>
                      <SelectItem value="THURSDAY" className="text-xs">Thursday</SelectItem>
                      <SelectItem value="FRIDAY" className="text-xs">Friday</SelectItem>
                      <SelectItem value="SATURDAY" className="text-xs">Saturday</SelectItem>
                      <SelectItem value="SUNDAY" className="text-xs">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={fetchLastWeekData}
                  >
                    <Translate contentKey={'analytics.summary.buttons.lastWeek'}>
                      Last Week
                    </Translate>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={fetchLastTwoWeeksData}
                  >
                    <Translate contentKey={'analytics.summary.buttons.lastTwoWeeks'}>
                      Last Two Weeks
                    </Translate>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={fetchLastMonthData}
                  >
                    <Translate contentKey={'analytics.summary.buttons.lastMonth'}>
                      Last Month
                    </Translate>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={fetchLastThreeMonthsData}
                  >
                    <Translate contentKey={'analytics.summary.buttons.lastThreeMonths'}>
                      Last 3 Months
                    </Translate>
                  </Button>
                </div>
                <Button type="button" onClick={handleSubmit} className="h-7 text-xs" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <Translate contentKey={'analytics.summary.buttons.getReport'}>
                      Get Report
                    </Translate>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Report Results */}
        {salesData ? (
          <DynamicEndOfDayReportUI
            reportData={salesData}
            endOfDay={null}
            printWrapperRef={printWrapperRef}
            loading={loading}
            title=""
            branchId={selectedBranch}
            fromDate={fromDate?.toISOString()}
            toDate={toDate?.toISOString()}
            source={selectedSource}
            handleExcelExport={fetchExcelData}
          />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="mx-auto h-12 w-12 mb-3" />
            <p className="text-xs">
              <Translate contentKey={'analytics.summary.noData'}>
                Select your filters and click Get Report to view sales data.
              </Translate>
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SalesSummaryReport;
