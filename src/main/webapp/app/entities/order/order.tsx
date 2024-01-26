import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, InputGroup, FormGroup, Form, Row, Col, Table } from 'reactstrap';



import {Calendar, CalendarChangeEvent} from 'primereact/calendar';
import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IOrder } from 'app/shared/model/order.model';
import {searchEntities, getEntities, filterOrders, getOrderSources, getOrderStatuses} from './order.reducer';
import {ASC, DESC, ITEMS_PER_PAGE, SORT} from "app/shared/util/pagination.constants";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";

import { searchEntities as searchBranches, getEntities as getBranches } from '../branch/branch.reducer';
import {endOfDay, format, formatISO, startOfDay} from "date-fns";
import {DataTable, DataTableFilterMeta} from "primereact/datatable";
import {Column} from "primereact/column";
import {fromPairs} from "lodash";
import {Dropdown} from "primereact/dropdown";
import {InputText} from "primereact/inputtext";

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


  const [orderStatuses, setOrderStatuses]:any = useState([]);



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
        "customer.email": { value: '', matchMode: 'contains' },
        "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: {value: '', matchMode: 'contains'}
    }
  });

  console.log(dates, 'dates')

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);

  const loading = useAppSelector(state => state.order.loading);
  const branchList = useAppSelector(state => state.branch.entities);

  const orderSources = useAppSelector(state => state.order.orderSources);


  console.log(orderList, 'orderList')

  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID')
    const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };

  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));

  const statusOptions = [
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'PROCESSING', value: 'PROCESSING' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Done', value: 'DONE' }
  ];
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
      lazyState.filters.customer?.phone?.value ||
      lazyState.filters.customer?.email?.value ||
      lazyState.filters.branchId?.value ||
      lazyState.filters.id?.value ||
      lazyState.filters.tables?.value ||
      lazyState.filters.orderSource?.value ||
      lazyState.filters.status?.value ||
      dates
    ) {
      const queryParams = {
        orderSource: lazyState.filters.orderSource?.value || '',
        orderStatus: lazyState.filters.status?.value || '',
        first: lazyState.first,
        sequenceId:lazyState.filters.id?.value || '',
        page: lazyState.page ,
        customerPhone:lazyState.filters['customer.phone']?.value || '',
        customerEmail: lazyState.filters['customer.email']?.value || '',
        branch: lazyState.filters.branchId?.value || '',
        tables: lazyState.filters.tables?.value || '',
        size: lazyState.rows ,
        fromDate: dates && dates[0] ?  startOfDay(new Date(dates[0])).toISOString() : '',
        toDate: dates && dates[1] ? endOfDay(new Date(dates[1])).toISOString() : '',
        sort: `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}`


      };
      console.log(lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '', 'hellolog')
      console.log(lazyState.filters.customer?.phone, 'hellologs')

      dispatch(filterOrders(queryParams));
    } else {
      dispatch(getEntities({}));
    }

    dispatch(getBranches({}))
    dispatch(getOrderSources())

    dispatch(getOrderStatuses())
      .then((response :any) => {
        setOrderStatuses(response.payload?.map((status) => ({label: status, value: status})));
      })
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

          <div className="p-3 mb-2" style={{ background: 'var(--surface-card)', borderRadius: '10px'}}>
            <DataTable
              value={orderList}
              lazy
              filterDisplay="row"
              dataKey="id"
              paginator
              first={lazyState.first}
              rows={20}
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
                header="Order ID"
                sortable
                filter
                body={(rowData): any => (
                  <Link to={`/order/${rowData.id}`}>
                    {rowData.sequenceNumber}
                  </Link>
                )}
                filterElement={
                  <InputText
                    style={{width: '5rem'}}
                    onChange={(e) =>
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          id: { value: e.target.value, matchMode: 'equals' },
                        },
                      }))
                    }
                    placeholder="Enter id"
                  />
                }
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

                header="Order Date"
                body={(rowData) => (
                  <span>
      {rowData.createdDate &&
        `${new Date(rowData.createdDate).toLocaleString()} `}
    </span>
                )}
                filterElement={
                  <Calendar
                    style={{width: '12rem'}}
                    value={dates}
                    onChange={(e: CalendarChangeEvent) => setDates(e.value)}
                    selectionMode="range"
                    placeholder={"Enter date range"}
                  />
                }
              />


              <Column field="discount" sortable
                header="Order Discount" body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
                <p className="text-danger text-center ">&#10006;</p> } filterMatchMode="custom"
              />

              <Column field="orderSource" body={(rowData) => rowData.sourceApp.type} sortable filter
                      filterElement={
                        <Dropdown
                          value={lazyState.filters.orderSource?.value || ''}
                          options={orderSources?.map((source) => ({label: source, value: source}))}
                          onChange={(e) =>
                            setLazyState((prevState) => ({
                              ...prevState,
                              filters: {
                                ...prevState.filters,
                                orderSource: { value: e.value, matchMode: 'equals' },
                              },
                            }))
                          }
                          placeholder="Select a source"
                        />
                      }
                      header="Order Source"  />


              <Column field="tables" sortable  filter  header="Order Tables"  filterElement={
                <InputText
                  style={{width: '6rem'}}
                  onChange={(e) =>
                    setLazyState((prevState) => ({
                      ...prevState,
                      filters: {
                        ...prevState.filters,
                        tables: { value: e.target.value, matchMode: 'equals' },
                      },
                    }))
                  }
                  placeholder="Enter table"
                />
              }
              />
              <Column
                field="customer.email"
                filter
                filterField="customer.email"
                sortable
                header="Customer Email "
                filterElement={
                  <InputText
                    style={{width: '11rem'}}
                    onChange={(e) =>
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          "customer.email": { value: e.target.value, matchMode: 'equals' },
                        },
                      }))
                    }
                    placeholder="Enter customer email"
                  />
                }
              />

              <Column
                field="customer.phone"
                filter
                sortable
                filterField="customer.phone"
                header="Customer Phone"
                filterElement={
                  <InputText
                    style={{width: '11rem'}}
                    onChange={(e) =>
                      setLazyState((prevState) => ({
                        ...prevState,
                        filters: {
                          ...prevState.filters,
                          "customer.phone": { value: e.target.value, matchMode: 'equals' },
                        },
                      }))
                    }
                    placeholder="Enter customer phone"
                  />
                }
              />

              <Column field="status" sortable filter header="Order Status"
                      filterElement={
                        <Dropdown
                          value={lazyState.filters.status?.value || ''}
                          options={orderStatuses}
                          onChange={(e) =>
                            setLazyState((prevState) => ({
                              ...prevState,
                              filters: {
                                ...prevState.filters,
                                status: { value: e.value, matchMode: 'equals' },
                              },
                            }))
                          }
                          placeholder="Select a status"
                        />
                      }
              />
            </DataTable>
          </div>

      </div>
    </div>
  );
};



export default Order;

