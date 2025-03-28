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
import { exportExcelSummaryReport } from 'app/shared/util/excel-utils';
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
  };

  const fetchLastTwoWeeksData = () => {
    const today = new Date();
    const lastTwoWeeksStartDate = addDays(today, -14);
    setFromDate(lastTwoWeeksStartDate);
    setToDate(today);
  };

  const fetchLastMonthData = () => {
    const today = new Date();
    const lastMonthStartDate = addMonths(today, -1);
    setFromDate(lastMonthStartDate);
    setToDate(today);
  };

  const fetchLastThreeMonthsData = () => {
    const today = new Date();
    const lastThreeMonthsStartDate = addMonths(today, -3);
    setFromDate(lastThreeMonthsStartDate);
    setToDate(today);
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

  const fetchTodayData = async () => {
    await handleSubmit();
  };

  useEffect(() => {
    fetchTodayData();
    dispatch(getBranches({}));
  }, [dispatch]);

  useEffect(() => {
    if (fromDate && toDate) {
      handleSubmit();
    }
  }, [fromDate, toDate, selectedSource, selectedBranch]);

  const printWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mt-5">
      {salesData ? (
        <>
          <div className="text-center">
            <div className="text-center">
              {/* <span></span> */}
              <h4>
                <Translate contentKey={'analytics.summary.report.title'}>
                  Sales Summary Report
                </Translate>
              </h4>
              {/* <Button
                type="button"
                className="rounded-circle"
                icon="pi pi-file-excel"
                severity="success"
                rounded
                onClick={() => exportExcelSummaryReport(salesData)}
                data-pr-tooltip="XLS"
              /> */}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6 d-flex flex-column gap-2">
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
                  />
                </div>
                <div className="col-md-6 d-flex flex-column gap-2">
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
                  />
                </div>
              </div>
              <div className="text-center">
                <button type="submit" className="btn btn-primary">
                  <Translate contentKey={'analytics.summary.buttons.getReport'}>
                    Get Report
                  </Translate>
                </button>
              </div>
              <div className="d-flex justify-content-start gap-5 my-2">
                <Dropdown
                  style={{ minWidth: '7rem' }}
                  value={selectedSource}
                  options={sourceTypeOptions}
                  onChange={(e) => setSelectedSource(e.value)}
                  placeholder={translate('analytics.summary.select.source')}
                  showClear
                />
                <Dropdown
                  style={{ minWidth: '7rem' }}
                  value={selectedBranch}
                  options={filteredBranchOptions}
                  onChange={(e) => setSelectedBranch(e.value)}
                  placeholder={translate('analytics.summary.select.branch')}
                  showClear
                />
                <Dropdown
                  style={{ minWidth: '7rem' }}
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
                />
              </div>
              <div className="d-flex justify-content-end gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={fetchLastWeekData}
                >
                  <Translate contentKey={'analytics.summary.buttons.lastWeek'}>
                    Last Week
                  </Translate>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={fetchLastTwoWeeksData}
                >
                  <Translate contentKey={'analytics.summary.buttons.lastTwoWeeks'}>
                    Last Two Weeks
                  </Translate>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={fetchLastMonthData}
                >
                  <Translate contentKey={'analytics.summary.buttons.lastMonth'}>
                    Last Month
                  </Translate>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={fetchLastThreeMonthsData}
                >
                  <Translate contentKey={'analytics.summary.buttons.lastThreeMonths'}>
                    Last 3 Months
                  </Translate>
                </button>
              </div>
            </form>
          </div>
          <DynamicEndOfDayReportUI
            reportData={salesData}
            endOfDay={null}
            printWrapperRef={printWrapperRef}
            loading={loading}
            title=""
            branchId={selectedBranch}
            fromDate={fromDate.toISOString()}
            toDate={toDate.toISOString()}
            source={selectedSource}
          />
        </>
      ) : (
        <div>No data available.</div>
      )}
    </div>
  );
};

export default SalesSummaryReport;
