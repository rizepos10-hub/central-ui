import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import axios from "axios";
import { format, addDays, addMonths } from 'date-fns';
import { useAppDispatch, useAppSelector } from "app/config/store";
import { Dropdown } from "primereact/dropdown";
import { SourceType } from "app/shared/model/ENUMS/source-type.model";
import { translate, Translate } from "react-jhipster";
import { ISummaryReport } from 'app/shared/model/report-summary.model';
import { Button } from 'primereact/button';
import { exportExcelEodSummaryReport, exportExcelSummaryReport } from 'app/shared/util/excel-utils';
import { Calendar } from 'primereact/calendar';
import DynamicEndOfDayReportUI from './end-of-day/dynamic-end-of-day-report';
import { fetchRecentByDate } from '../api';

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

  const handleFromDateChange = (e: any) => {
    console.log(e.value)
    setFromDate(e.value);
  };
  console.log(fromDate)

  const handleToDateChange = (e: any) => {
    const date = new Date(e.value);
    date.setHours(23, 59, 59, 999);
    setToDate(date);
  };

  const fetchLastWeekData = () => {
    const today = new Date();
    const lastWeekStartDate = addDays(today, -7);
    setFromDate(lastWeekStartDate);
    setToDate(today);

    setTimeout(() => handleSubmit(), 100);
  };

  const fetchLastTwoWeeksData = () => {
    const today = new Date();
    const lastTwoWeeksStartDate = addDays(today, -14);
    setFromDate(lastTwoWeeksStartDate);
    setToDate(today);

    setTimeout(() => handleSubmit(), 100);
  };

  const fetchLastMonthData = () => {
    const today = new Date();
    const lastMonthStartDate = addMonths(today, -1);
    setFromDate(lastMonthStartDate);
    setToDate(today);

    setTimeout(() => handleSubmit(), 100);
  };

  const fetchLastThreeMonthsData = () => {
    const today = new Date();
    const lastThreeMonthsStartDate = addMonths(today, -3);
    setFromDate(lastThreeMonthsStartDate);
    setToDate(today);

    setTimeout(() => handleSubmit(), 100);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    if (fromDateObj > toDateObj) {
      alert("From date cannot be later than To date.");
      return;
    }
    try {
      setLoading(true);
      const formattedFromDate = (fromDate).toISOString();
      const formattedToDate = (toDate).toISOString();
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
        formData.append('fromDate', fromDate.toISOString());
        formData.append('toDate', toDate.toISOString());
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
        fromDate.toLocaleString(),
        toDate.toLocaleString(),
        'Sales Summary Report'
      )
    }
  };

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  const printWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mt-5">
      <div className="text-center mb-4">
        <h4>
          <Translate contentKey={'analytics.summary.report.title'}>
            Sales Summary Report
          </Translate>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="card p-4">
          {/* Date Range Section */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label htmlFor="fromDate" className="form-label fw-bold">
                <Translate contentKey={'analytics.summary.fromDate'}>
                  From Date
                </Translate>
              </label>
              <Calendar
                id="fromDate"
                value={fromDate}
                onChange={handleFromDateChange}
                dateFormat="yy-mm-dd"
                showIcon
                className="w-100"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="toDate" className="form-label fw-bold">
                <Translate contentKey={'analytics.summary.toDate'}>
                  To Date
                </Translate>
              </label>
              <Calendar
                id="toDate"
                value={toDate}
                onChange={handleToDateChange}
                dateFormat="yy-mm-dd"
                showIcon
                className="w-100"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold">
                <Translate contentKey={'analytics.summary.select.source'}>
                  Source
                </Translate>
              </label>
              <Dropdown
                value={selectedSource}
                options={sourceTypeOptions}
                onChange={(e) => setSelectedSource(e.value)}
                placeholder={translate('analytics.summary.select.source')}
                showClear
                className="w-100"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">
                <Translate contentKey={'analytics.summary.select.branch'}>
                  Branch
                </Translate>
              </label>
              <Dropdown
                value={selectedBranch}
                options={filteredBranchOptions}
                onChange={(e) => setSelectedBranch(e.value)}
                placeholder={translate('analytics.summary.select.branch')}
                showClear
                className="w-100"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">
                <Translate contentKey={'analytics.summary.select.day'}>
                  Day of Week
                </Translate>
              </label>
              <Dropdown
                value={selectedDay}
                options={[
                  { label: 'Monday', value: 'MONDAY' },
                  { label: 'Tuesday', value: 'TUESDAY' },
                  { label: 'Wednesday', value: 'WEDNESDAY' },
                  { label: 'Thursday', value: 'THURSDAY' },
                  { label: 'Friday', value: 'FRIDAY' },
                  { label: 'Saturday', value: 'SATURDAY' },
                  { label: 'Sunday', value: 'SUNDAY' },
                ]}
                onChange={(e) => setSelectedDay(e.value)}
                placeholder={translate('analytics.summary.select.day')}
                showClear
                className="w-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={fetchLastWeekData}
              >
                <Translate contentKey={'analytics.summary.buttons.lastWeek'}>
                  Last Week
                </Translate>
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={fetchLastTwoWeeksData}
              >
                <Translate contentKey={'analytics.summary.buttons.lastTwoWeeks'}>
                  Last Two Weeks
                </Translate>
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={fetchLastMonthData}
              >
                <Translate contentKey={'analytics.summary.buttons.lastMonth'}>
                  Last Month
                </Translate>
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={fetchLastThreeMonthsData}
              >
                <Translate contentKey={'analytics.summary.buttons.lastThreeMonths'}>
                  Last 3 Months
                </Translate>
              </button>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span>
                  <i className="pi pi-spin pi-spinner me-2"></i>
                  Loading...
                </span>
              ) : (
                <Translate contentKey={'analytics.summary.buttons.getReport'}>
                  Get Report
                </Translate>
              )}
            </button>
          </div>
        </div>
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
        <div className="text-center text-muted py-5">
          <i className="pi pi-chart-line" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">
            <Translate contentKey={'analytics.summary.noData'}>
              Select your filters and click Get Report to view sales data.
            </Translate>
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesSummaryReport;
