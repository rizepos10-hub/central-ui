import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";

import { Spinner } from "reactstrap";

import { FilterMatchMode } from "primereact/api";
import { Calendar } from "primereact/calendar";
import { translate } from "react-jhipster";
import { Dropdown } from "primereact/dropdown";
import { getEntities as getUsers } from "app/entities/branch-pos-user/user.reducer";
import userClock, { filterEntities, getEntityReport } from "app/modules/analytics/user-clock/user-clock.reducer";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { convertDateTimeFromServer, convertDateTimeFromServerTimeOnly } from "app/shared/util/date-utils";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
import SummaryReportTotalReceived from "app/shared/components/report/summary-report-total-received";
import { Link } from "react-router-dom";
import { IUserClock } from "app/shared/model/user-clock.model";
import ReactToPrint from "react-to-print";
import { Button } from "primereact/button";
import { format } from "date-fns";
import { exportExcelSummaryReport } from "app/shared/util/excel-utils";


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
  const printWrapper = useRef(null);
  const users = useAppSelector(state => state.PosBranchUser.entities);
  const loadingUsers = useAppSelector(state => state.PosBranchUser.loading);
  const userClocks = useAppSelector(state => state.userClock.entities);
  const loadingClocks = useAppSelector(state => state.userClock.loading);
  const summaryReport = useAppSelector(state => state.userClock.report);
  const loadingReport = useAppSelector(state => state.userClock.loadingReport);

  const [filterState, setFilterState] = useState(initialState);
  const [selectedShift, setSelectedShift] = useState<IUserClock | null>(null);


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


  const handleDateChange = (e: any) => {
    const startDate = e?.value?.[0];
    const endDate = e?.value?.[1];
    setFilterState({
      ...filterState,
      filters: {
        ...filterState.filters,
        instantClockedIn: { value: startDate, matchMode: FilterMatchMode.STARTS_WITH },
        instantClockedOut: { value: endDate, matchMode: FilterMatchMode.ENDS_WITH },
      }
    });
  }

  const calenderValue =
    filterState.filters?.instantClockedIn.value && !filterState.filters.instantClockedOut.value
      ?
      [filterState.filters?.instantClockedIn.value, null]
      :
      filterState.filters?.instantClockedIn.value && filterState.filters.instantClockedOut.value
        ?
        [filterState.filters?.instantClockedIn.value, filterState.filters?.instantClockedOut.value]
        :
        null;
  console.log(calenderValue, 'calenderValue')
  const selectedShiftTemplate = (option, props) => {
    if (option) {
      return (
        <div className="flex align-items-center">
          <div>
            {convertDateTimeFromServer(option.instantClockedIn)} - {convertDateTimeFromServer(option.instantClockedOut)}
          </div>
        </div>
      );
    }

    return <span>{props.placeholder}</span>;
  };

  const shiftOptionTemplate = option => {
    return (
      <div className="flex align-items-center">
        <div>
          {convertDateTimeFromServer(option.instantClockedIn)} - {convertDateTimeFromServer(option.instantClockedOut)}
        </div>
      </div>
    );
  };

  const pageStyle = `
    @media print {
      .hide-on-print {
        display: none !important;
      }

      .shift-report-print-header {
        display: flex !important;
        flex-direction: column !important;
      }

      @page {
        size: A4;
        margin: 0;
      }
    }
  `;


  return (
    <div className={'bg-white p-5'}>
      <div className="w-100 flex justify-content-between align-items-center">
        <h1>Shift Report</h1>
        <span className="hide-on-print d-flex gap-2">
          <Button type="button" className='rounded-circle' icon="pi pi-file-excel" severity="success" rounded onClick={
            () => exportExcelSummaryReport(summaryReport)
          } data-pr-tooltip="XLS"
            disabled={!summaryReport}
          />
          <ReactToPrint
            trigger={() => (
              <Button
                type="button"
                className="rounded-circle"
                icon="pi pi-print"
                severity="info"
                rounded
                data-pr-tooltip="PRINT"
                disabled={!summaryReport}
              />
            )}
            content={() => printWrapper.current}
            pageStyle={pageStyle}
          />
        </span>
      </div>
      <div className={'d-flex flex-column gap-3'}>
        <div className={'col-8 d-flex gap-3'}>
          <div className={'d-flex flex-column gap-3'}>
            <label htmlFor="username">Username</label>
            <Dropdown
              id={'username'}
              options={users}
              optionLabel={'userName'}
              loading={loadingUsers}
              optionValue={'userName'}
              value={filterState.filters.username.value}
              onChange={e =>
                setFilterState({
                  ...filterState,
                  filters: {
                    ...filterState.filters,
                    username: { value: e.value, matchMode: FilterMatchMode.EQUALS },
                  },
                })
              }
              placeholder={'Select User'}
            />
          </div>

          <div className={'d-flex flex-column gap-3'}>
            <label htmlFor="date">Date Range</label>
            <Calendar
              style={{ width: '12rem' }}
              disabled={!users || users?.length === 0}
              value={calenderValue}
              id={'date'}
              onChange={handleDateChange}
              selectionMode="range"
              placeholder={translate('orders.view.table.filters.date')}
              showButtonBar
            />
          </div>
        </div>

        <div className={'d-flex col-4 flex-column gap-3'}>
          <label htmlFor="shifts">Select Shift to Get Report</label>
          <Dropdown
            id={'shifts'}
            style={{ minWidth: '12rem' }}
            options={userClocks}
            optionLabel={'instantClockedIn'}
            value={selectedShift}
            loading={loadingClocks}
            itemTemplate={shiftOptionTemplate}
            valueTemplate={selectedShiftTemplate}
            onChange={e => setSelectedShift(e.value)}
            placeholder={'Select Shift'}
          />
        </div>
      </div>
      {loadingReport && <Spinner />}

      {summaryReport ?
        <div ref={printWrapper}>
          <div className={"mt-3"}>

            <div
              className='gap-3 px-2 shift-report-print-header'
              style={{
                display: 'none',
              }}
            >
              <div className='fs-2 fw-bold text-center'>Shift Report</div>
              <div className='fs-5 fw-semibold d-flex flex-column gap-1'>
                <div>
                  <span>Username : </span>
                  <span>{filterState.filters.username.value}</span>
                </div>
                <div>
                  <span>Date Range : </span>
                  <span>{format(new Date(filterState.filters.instantClockedIn.value), "yyyy-MM-dd")} - {format(new Date(filterState.filters.instantClockedOut.value), "yyyy-MM-dd")}</span>
                </div>
                <div>
                  <span>Selected Shift : </span>
                  <span>{format(new Date(selectedShift?.instantClockedIn), "yyyy-MM-dd")} - {format(new Date(selectedShift?.instantClockedOut), "yyyy-MM-dd")}</span>
                </div>
              </div>
            </div>


            <GenericSalesReport title={'Total Sales'} report={summaryReport?.totalSales} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["DineIn"]} title={"Dine In Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["Delivery"]} title={"Delivery Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["PickUp"]} title={"Pick Up Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["WalkIn"]} title={"Walk In Sales"} />

            {summaryReport?.totalReceived && <SummaryReportTotalReceived totalReceived={summaryReport.totalReceived} />}
          </div>
        </div>
        : null}


    </div>
  );
}
export default ShiftReport;
