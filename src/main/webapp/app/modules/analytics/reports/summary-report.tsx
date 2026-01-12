import React, { useEffect, useState, useRef } from 'react';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import axios from "axios";
import { format, addDays, addMonths } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
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
import type { DateRange } from 'react-day-picker';

const SalesSummaryReport = () => {
  const dispatch = useAppDispatch();

  const [salesData, setSalesData] = useState<ISummaryReport>();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [convertedFromDate, setConvertedFromDate] = useState<string | undefined>(undefined);
  const [convertedToDate, setConvertedToDate] = useState<string | undefined>(undefined);
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

  const fetchLastWeekData = () => {
    const today = new Date();
    const lastWeekStartDate = addDays(today, -7);
    setDateRange({ from: lastWeekStartDate, to: today });
  };

  const fetchLastTwoWeeksData = () => {
    const today = new Date();
    const lastTwoWeeksStartDate = addDays(today, -14);
    setDateRange({ from: lastTwoWeeksStartDate, to: today });
  };

  const fetchLastMonthData = () => {
    const today = new Date();
    const lastMonthStartDate = addMonths(today, -1);
    setDateRange({ from: lastMonthStartDate, to: today });
  };

  const fetchLastThreeMonthsData = () => {
    const today = new Date();
    const lastThreeMonthsStartDate = addMonths(today, -3);
    setDateRange({ from: lastThreeMonthsStartDate, to: today });
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select both from and to dates.");
      return;
    }

    try {
      setLoading(true);

      // Convert dates using the same pattern as order.tsx
      const targetTimeZone = (selectedBranch ? branchList.find(b => b.id === selectedBranch)?.timezone : null) || businessTimeZone;

      // Format fromDate (00:00:00)
      const fromDateStr = `${dateRange.from.getFullYear()}-${String(dateRange.from.getMonth() + 1).padStart(2, '0')}-${String(dateRange.from.getDate()).padStart(2, '0')}`;
      const formattedFromDate = fromZonedTime(`${fromDateStr} 00:00:00`, targetTimeZone).toISOString();

      // Format toDate (23:59:59)
      const toDateStr = `${dateRange.to.getFullYear()}-${String(dateRange.to.getMonth() + 1).padStart(2, '0')}-${String(dateRange.to.getDate()).padStart(2, '0')}`;
      const formattedToDate = fromZonedTime(`${toDateStr} 23:59:59`, targetTimeZone).toISOString();

      // Store converted dates for bills-summary API
      setConvertedFromDate(formattedFromDate);
      setConvertedToDate(formattedToDate);

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
    if (branchList && dateRange?.from && dateRange?.to) {
      const promises = branchList.map(async (branch) => {
        const formData = new FormData();

        // Convert dates using the same pattern as order.tsx
        const targetTimeZone = branch?.timezone || businessTimeZone;

        // Format fromDate (00:00:00)
        const fromDateStr = `${dateRange.from.getFullYear()}-${String(dateRange.from.getMonth() + 1).padStart(2, '0')}-${String(dateRange.from.getDate()).padStart(2, '0')}`;
        const formattedFromDate = fromZonedTime(`${fromDateStr} 00:00:00`, targetTimeZone).toISOString();

        // Format toDate (23:59:59)
        const toDateStr = `${dateRange.to.getFullYear()}-${String(dateRange.to.getMonth() + 1).padStart(2, '0')}-${String(dateRange.to.getDate()).padStart(2, '0')}`;
        const formattedToDate = fromZonedTime(`${toDateStr} 23:59:59`, targetTimeZone).toISOString();

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
        formatDateForDisplay(dateRange.from),
        formatDateForDisplay(dateRange.to),
        'Sales Summary Report'
      )
    }
  };

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

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
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  <Translate contentKey={'analytics.summary.dateRange'}>
                    Date Range
                  </Translate>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-7 text-xs w-full justify-start">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PP")} - {format(dateRange.to, "PP")}
                          </>
                        ) : (
                          format(dateRange.from, "PP")
                        )
                      ) : (
                        <span>
                          <Translate contentKey={'analytics.summary.selectDateRange'}>
                            Pick a date range
                          </Translate>
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range)}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
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
          <DynamicEndOfDayReportUI
            reportData={salesData}
            endOfDay={null}
            printWrapperRef={printWrapperRef}
            loading={loading}
            title=""
            branchId={selectedBranch}
            fromDate={convertedFromDate}
            toDate={convertedToDate}
            source={selectedSource}
            handleExcelExport={fetchExcelData}
          />
      </div>
    </PageWrapper>
  );
};

export default SalesSummaryReport;
