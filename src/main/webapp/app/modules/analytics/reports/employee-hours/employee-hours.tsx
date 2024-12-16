import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";

import { Spinner } from "reactstrap";

import { FilterMatchMode } from "primereact/api";
import { Calendar } from "primereact/calendar";
import { translate } from "react-jhipster";
import { Dropdown } from "primereact/dropdown";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import userClock, { filterEntities, getEntityReport } from "app/modules/analytics/user-clock/user-clock.reducer";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { convertDateTimeFromServer, convertDateTimeFromServerTimeOnly } from "app/shared/util/date-utils";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
import SummaryReportTotalReceived from "app/shared/components/report/summary-report-total-received";
import { Link, useSearchParams } from "react-router-dom";
import { IUserClock } from "app/shared/model/user-clock.model";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { format, intervalToDuration } from "date-fns";
import { Button } from "primereact/button";
import { saveAsExcelFile } from "app/shared/util/excel-utils";


const initialState = {
    first: 0,
    rows: 500,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
        branchId: { value: null, matchMode: FilterMatchMode.EQUALS },
        instantClockedIn: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        instantClockedOut: { value: null, matchMode: FilterMatchMode.ENDS_WITH },
    }
};



const EmployeeHoursReport = () => {
    const dispatch = useAppDispatch();
    const branches = useAppSelector(state => state.branch.entities);
    const loadingUsers = useAppSelector(state => state.PosBranchUser.loading);
    const userClocks: IUserClock[] = useAppSelector(state => state.userClock.entities);
    const loadingClocks = useAppSelector(state => state.userClock.loading);
    const loadingReport = useAppSelector(state => state.userClock.loadingReport);

    const [filterState, setFilterState] = useState(initialState);

    const [searchParams, setSearchParams] = useSearchParams();
    const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;

    useEffect(() => {
        dispatch(getBranches({}));
    }, []);

    const getUserClocks = () => {
        const updatedState = applyMatchModeMap(filterState);

        dispatch(filterEntities({
            query: updatedState,
        }))
    }


    const handleDateChange = (e: any) => {
        const startDate = e.value[0];
        const endDate = e.value[1];
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



    const onPage = (event) => {
        const queryParams = JSON.stringify(event);
        setSearchParams({ query: queryParams }, { replace: true })
    };

    const differenceTemplate = (rowData) => {
        const start = new Date(rowData?.instantClockedIn);
        const end = new Date(rowData?.instantClockedOut);

        const duration = intervalToDuration({ start, end });

        const formattedDuration = `${String(duration.hours).padStart(2, '0')}:${String(duration.minutes).padStart(2, '0')}:${String(duration.seconds).padStart(2, '0')}`;

        return <span>{formattedDuration}</span>;
    }

    const footerTemplate = (data) => {
        const user = data.username;
        const userInstances = userClocks.filter(clock => clock.username === user);

        let totalSeconds = 0;

        userInstances.forEach(clock => {
            const clockIn = new Date(clock.instantClockedIn);
            const clockOut = new Date(clock.instantClockedOut);

            const duration = intervalToDuration({ start: clockIn, end: clockOut });
            totalSeconds += duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
        });

        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const totalSecs = totalSeconds % 60;

        const formattedTotalTime = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;

        return (
            <React.Fragment>
                <td colSpan={5}>
                    <div className="flex justify-content-end font-bold w-full">
                        Total Hours : {formattedTotalTime}
                    </div>
                </td>
            </React.Fragment>
        );
    };

    const exportExcel = async () => {
        // Group userClocks by username
        const clocksByUser = {};
        userClocks.forEach(clock => {
            if (!clocksByUser[clock.username]) {
                clocksByUser[clock.username] = [];
            }
            clocksByUser[clock.username].push(clock);
        });

        // Build an array of rows in the order we want for Excel
        // We'll also calculate the working hours (HH:MM:SS) for each row
        // and then a "Total Hours" row per user
        const structuredExcelData = [];

        Object.keys(clocksByUser).forEach(username => {
            let totalSeconds = 0;
            clocksByUser[username].forEach(clock => {
                const clockIn = new Date(clock.instantClockedIn);
                const clockOut = new Date(clock.instantClockedOut);

                const duration = intervalToDuration({ start: clockIn, end: clockOut });
                const secondsThisClock = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
                totalSeconds += secondsThisClock;

                // Format single row time
                const hours = String(duration.hours).padStart(2, '0');
                const mins = String(duration.minutes).padStart(2, '0');
                const secs = String(duration.seconds).padStart(2, '0');
                const workingHours = `${hours}:${mins}:${secs}`;

                structuredExcelData.push({
                    Name: username,
                    'Clock In': clock.instantClockedIn,
                    'Clock Out': clock.instantClockedOut,
                    'Working Hours': workingHours
                });
            });

            // After we push the user clock rows, push a "Total Hours" row
            const totalHours = Math.floor(totalSeconds / 3600);
            const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
            const totalSecs = totalSeconds % 60;
            const formattedTotal = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;

            structuredExcelData.push({
                Name: '', // empty name cell
                'Clock In': '',
                'Clock Out': '',
                'Working Hours': `Total Hours : ${formattedTotal}`
            });
        });

        // Prepare headers
        const headers = ['Name', 'Clock In', 'Clock Out', 'Working Hours'];

        // Use xlsx-js-style to create and style the sheet
        const xlsx = await import('xlsx-js-style');
        const worksheet = xlsx.utils.json_to_sheet(structuredExcelData, { header: headers });

        // Make the first row (headers) bold
        headers.forEach((_, colIndex) => {
            const cellAddress = xlsx.utils.encode_cell({ r: 0, c: colIndex });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    font: { bold: true },
                };
            }
        });

        // Adjust column widths
        worksheet['!cols'] = headers.map(() => ({ wpx: 180 }));

        // Create the workbook and write it
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAsExcelFile(excelBuffer, 'UserClocks.xlsx');
    };

    const header = (
        <div className="flex align-items-center justify-content-end gap-2">
            <Button type="button" className='rounded-circle' icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="XLS" />
            {/* <ReactToPrint
                trigger={() => (
                    <Button
                        type="button"
                        className="rounded-circle"
                        icon="pi pi-print"
                        severity="info"
                        rounded
                        data-pr-tooltip="PRINT"
                    />
                )}
                content={() => dtWrapper.current}
                pageStyle={pageStyle}
            /> */}
        </div>
    );

    return (
        <div className={'bg-white p-5'}>
            <h1>Employee Hours Report</h1>
            <div className={'d-flex flex-column gap-3'}>
                <div className={'col-8 d-flex gap-3 align-items-center'}>
                    <label htmlFor="branchId">Branch</label>
                    <Dropdown
                        id={'branchId'}
                        options={branches}
                        optionLabel={'name'}
                        loading={loadingUsers}
                        optionValue={'id'}
                        value={filterState.filters.branchId.value}
                        onChange={e =>
                            setFilterState({
                                ...filterState,
                                filters: {
                                    ...filterState.filters,
                                    branchId: { value: e.value, matchMode: FilterMatchMode.EQUALS },
                                },
                            })
                        }
                        placeholder={'Select Branch'}
                    />

                    <label htmlFor="date">Date Range</label>
                    <Calendar
                        style={{ width: '12rem' }}
                        disabled={!branches || branches?.length === 0}
                        value={calenderValue}
                        id={'date'}
                        onChange={handleDateChange}
                        selectionMode="range"
                        placeholder={translate('orders.view.table.filters.date')}
                    />

                    <div>
                        <Button type='button' onClick={() => getUserClocks()}>Get Report</Button>
                    </div>
                </div>
            </div>
            {loadingReport && <Spinner />}

            {userClocks?.length > 0 ?
                <div className={"mt-3"}>
                    <DataTable
                        value={userClocks}
                        rowGroupMode="subheader"
                        groupRowsBy="username"
                        sortMode="single"
                        sortField="username"
                        sortOrder={1}
                        scrollable
                        scrollHeight="400px"
                        tableStyle={{ minWidth: '50rem' }}
                        rowGroupFooterTemplate={footerTemplate}
                        header={header}
                    >

                        {/* <DataTable
                        value={userClocks} 
                        lazy
                         filterDisplay="row"
                          dataKey="id"
                           paginator
                        first={query.first}
                         rows={query?.rows}
                          totalRecords={50}
                           onPage={onPage}
                        sortField={query.sortField}
                         sortOrder={query.sortOrder}
                        filters={query.filters}
                         loading={loadingClocks} 
                         tableStyle={{ minWidth: '75rem' }}
                        removableSort
                        showGridlines
                        className={"mt-3"}
                    > */}
                        <Column
                            field="username"
                            header={translate('items.view.fields.name')}
                            body={rowData => rowData?.username}
                            filterPlaceholder={translate('items.view.filters.username')}
                            sortable
                        />

                        <Column
                            header="Clock In"
                            field="instantClockedIn"
                            body={rowData => format(new Date(rowData?.instantClockedIn), 'yyyy-MM-dd HH:mm:ss')}
                            sortable
                            showFilterMatchModes={false}
                        />

                        <Column
                            header="Clock Out"
                            field="instantClockedOut"
                            body={rowData => format(new Date(rowData?.instantClockedOut), 'yyyy-MM-dd HH:mm:ss')}
                            sortable
                            showFilterMatchModes={false}
                        />

                        <Column
                            header="Working hours"
                            field="instantClockedOut"
                            body={differenceTemplate}
                            sortable
                            showFilterMatchModes={false}
                        />
                    </DataTable>
                </div>
                : null}


        </div>
    );
}
export default EmployeeHoursReport;
