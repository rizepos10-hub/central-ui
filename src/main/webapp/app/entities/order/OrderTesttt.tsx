import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, InputGroup, FormGroup, Form, Row, Col, Table } from 'reactstrap';
import {getSortState, JhiItemCount, JhiPagination, TextFormat, Translate, translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './order.css'


import {Calendar, CalendarChangeEvent} from 'primereact/calendar';
import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IOrder } from 'app/shared/model/order.model';
import {searchEntities, getEntities, filterOrders} from './order.reducer';
import {ASC, DESC, ITEMS_PER_PAGE, SORT} from "app/shared/util/pagination.constants";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";

import { searchEntities as searchBranches, getEntities as getBranches } from '../branch/branch.reducer';
import {endOfDay, format, formatISO, startOfDay} from "date-fns";
import {DataTable, DataTableFilterMeta} from "primereact/datatable";
import {Column} from "primereact/column";
import {fromPairs} from "lodash";
import {Dropdown} from "primereact/dropdown";

interface LazyTableState {
  first?: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
}



export const Order = () => {
  const dispatch = useAppDispatch();


  const [selectAll, setSelectAll] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(null);


  const [dates, setDates] = useState<string | Date | Date[] | null>(null);

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'createdDate',
    sortOrder: "asc",
    filters: {
      createdDate: {
        from: dates ? dates[0]?.toISOString() : '',
        to: dates ? dates[1]?.toISOString() : ''
      },
      id:{value: '', matchMode: 'contains'},
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      customer: { value: '', matchMode: 'equals' },
      branchId: { value: '', matchMode: 'equals' },
      tables: {value: '', matchMode: 'contains'}
    }
  });

  console.log(dates, 'dates')

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);

  const loading = useAppSelector(state => state.order.loading);
  const branchList = useAppSelector(state => state.branch.entities);

  console.log(orderList)

  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID')
    const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };

  const filteredBranchOptions = branchList
    .filter((branch) => orderList.some((order) => order.branchId === branch.id))
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));
  // const handleFromDateChange = event => {
  //   setLazyState(prevState => ({
  //     ...prevState,
  //     filters: {
  //       ...prevState.filters,
  //       fromDate: `${event.target.value}T00:00:00.000Z`,
  //     },
  //   }));
  // };
  //
  // const handleToDateChange = event => {
  //   setLazyState(prevState => ({
  //     ...prevState,
  //     filters: {
  //       ...prevState.filters,
  //       toDate: `${event.target.value}T00:00:00.000Z`,
  //     },
  //   }));
  // };


  const onSelectionChange = (event) => {
    const value = event.value;

    setSelectedOrders(value);
    setSelectAll(value.length === orderList.length);
  };

  // const onSelectAllChange = (event) => {
  //   const selectAll = event.checked;
  //
  //   if (selectAll) {
  //     CustomerService.getCustomers().then((data) => {
  //       setSelectAll(true);
  //       setSelectedCustomers(data.customers);
  //     });
  //   } else {
  //     setSelectAll(false);
  //     setSelectedCustomers([]);
  //   }
  // };
  const onFilter = (event) => {
    console.log(event, 'event');

    const newDates = event.filters.createdDate || null;
    setDates(newDates);

    event['first'] = 0;
    setLazyState(event);
  };





  const onSort = (event) => {
    console.log(event, 'event');
    const sortField = event.sortField;
    const sortOrder = event.sortOrder;
    setLazyState((prev) => ({
      ...prev,
      sortField: sortField,
      sortOrder: sortOrder,
    }));
  };
  const onPage = (event) => {
    setLazyState(event);
  };



  useEffect(() => {
    if (
      lazyState.first ||
      lazyState.sortOrder ||
      lazyState.sortField ||
      lazyState.filters.createdDate?.from ||
      lazyState.filters.createdDate?.to ||
      lazyState.filters.byClient?.value ||
      lazyState.filters.status?.value ||
      lazyState.filters.customer?.value ||
      lazyState.filters.branchId?.value ||
      lazyState.filters.id?.value ||
      lazyState.filters.tables?.value ||
      lazyState.filters.orderSource?.value ||
      dates
    ) {
      const queryParams = {
        orderSource: lazyState.filters.byClient?.value || '',
        first: lazyState.first,
        sequenceId:lazyState.filters.id?.value || '',
        page: lazyState.page ,
        customerPhone: lazyState.filters.customer?.value || '',
        branch: lazyState.filters.branchId?.value || '',
        tables: lazyState.filters.tables?.value || '',
        size: lazyState.rows ,
        fromDate: dates && dates[0] ?  startOfDay(new Date(dates[0])).toISOString() : '',
        toDate: dates && dates[1] ? endOfDay(new Date(dates[1])).toISOString() : '',
        sort: `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}`


      };
      console.log(lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '', 'hellolog')

      dispatch(filterOrders(queryParams));
    } else {
      dispatch(getEntities({}));
    }

    dispatch(getBranches({}))
    console.log(lazyState, 'lol')
  }, [lazyState,dates]);



  // useEffect(() => {
  //   dispatch(filterOrders({ lazyState }));
  //   dispatch(getBranches({}))
  //
  // }, [lazyState]);

console.log(orderList.length, 'len')
  return (
    <div>
      <Row>
        <Col sm="12">

          {/* <form onSubmit={event => { event.preventDefault(); }}> */}
          {/*   <div className="row mb-3"> */}
          {/*     <div className="col-md-6"> */}
          {/*       <label htmlFor="fromDate" className="form-label">From Date:</label> */}
          {/*       <input type="date" id="fromDate" className="form-control" value={lazyState.filters.fromDate} onChange={handleFromDateChange} /> */}
          {/*     </div> */}
          {/*     <div className="col-md-6"> */}
          {/*       <label htmlFor="toDate" className="form-label">To Date:</label> */}
          {/*       <input type="date" id="toDate" className="form-control" value={lazyState.filters.toDate} onChange={handleToDateChange} /> */}
          {/*     </div> */}
          {/*   </div> */}
          {/*   <div className="text-center"> */}
          {/*     <button type="submit" className="btn btn-primary">{loading ? 'Loading...' : 'Get Orders'}</button> */}
          {/*   </div> */}
          {/* </form> */}
        </Col>
      </Row>
      <div>

          <div className="cardox">
            <DataTable
              value={orderList}
              lazy
              filterDisplay="row"
              dataKey="id"
              paginator
              first={lazyState.first}
              rows={10}
              totalRecords={totalOrders}
              emptyMessage="No Orders Found"
              onPage={onPage}
              onSort={onSort}
              sortOrder={lazyState.sortOrder}
              sortField={lazyState.sortField}
              filters={lazyState.filters}
              onFilter={onFilter}
              removableSort
              loading={loading}
              tableStyle={{ minWidth: '75rem' , alignContent: 'center'}}
              selection={selectedOrders}
              onSelectionChange={onSelectionChange}
              // selectAll={selectAll}
              // onSelectAllChange={onSelectAllChange}
            >
              {/* <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} /> */}
              <Column
                field="id"
                style={{ width: '10%' }}
                header="Order ID"
                sortable
                filter
                body={(rowData): any => (
                  <Link to={`/order/${rowData.id}`}>
                    {rowData.sequenceNumber}
                  </Link>
                )}
              />
              <Column
                field="branchId"
                sortable
                filter
                header="Order Branch"
                body={(data) => getBranchName(data.branchId)}
                filterElement={
                  <Dropdown
                    value={lazyState.filters.branchId?.value || ''}
                    options={filteredBranchOptions}
                    onChange={(e) =>
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          branchId: { value: e.value, matchMode: 'equals' },
                        },
                      }))
                    }
                    placeholder="Select a branch"
                  />
                }
              />
              <Column
                field="createdDate"
                filter
                sortable
                style={{width: '20%'}}

                header="Order Date"
                body={(rowData) => (
                  <span>
      {rowData.createdDate &&
        `${new Date(rowData.createdDate).toLocaleString()} `}
    </span>
                )}
                filterElement={
                  <Calendar
                    value={dates}
                    onChange={(e: CalendarChangeEvent) => setDates(e.value)}
                    selectionMode="range"
                  />
                }
              />


              <Column field="discount" sortable  style={{ width: '13%' }}
                header="Order Discount" body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
                <p className="text-danger text-center ">&#10006;</p> } filterMatchMode="custom"
              />

              <Column field="byClient" sortable filter header="Order Source" />
              <Column field="tables" sortable style={{ width: '10%' }} filter  header="Order Tables" />
              <Column
                field="customer"
                filter
                sortable
                header="Order Customer"
                body={(rowData) => rowData.customer ? `${rowData.customer.phone}` : ''}
              />

              <Column field="status" sortable filter header="Order Status" />
            </DataTable>
          </div>

      </div>
    </div>
  );
};



export default Order;
