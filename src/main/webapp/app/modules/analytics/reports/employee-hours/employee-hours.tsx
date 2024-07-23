import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";

import { Button, Spinner } from "reactstrap";

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


const initialState = {
    first: 0,
    rows: 20,
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
    const userClocks = useAppSelector(state => state.userClock.entities);
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
                        placeholder={'Select User'}
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
                        value={userClocks} lazy filterDisplay="row" dataKey="id" paginator
                        first={query.first} rows={query?.rows} totalRecords={20} onPage={onPage}
                        sortField={query.sortField} sortOrder={query.sortOrder}
                        filters={query.filters} loading={loadingClocks} tableStyle={{ minWidth: '75rem' }}
                        removableSort
                        showGridlines
                        className={"mt-3"}
                    >
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
