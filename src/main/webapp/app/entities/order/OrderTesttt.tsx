import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, InputGroup, FormGroup, Form, Row, Col, Table } from 'reactstrap';
import {getSortState, JhiItemCount, JhiPagination, TextFormat, Translate, translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './order.css'


import { Calendar } from 'primereact/calendar';
import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IOrder } from 'app/shared/model/order.model';
import {searchEntities, getEntities, filterOrders} from './order.reducer';
import {ASC, DESC, ITEMS_PER_PAGE, SORT} from "app/shared/util/pagination.constants";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";

import { searchEntities as searchBranches, getEntities as getBranches } from '../branch/branch.reducer';
import {format, formatISO} from "date-fns";
import {DataTable, DataTableFilterMeta} from "primereact/datatable";
import {Column} from "primereact/column";
import {fromPairs} from "lodash";
import {Dropdown} from "primereact/dropdown";

interface LazyTableState {
  first: number;
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
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,

      filters: {
        createdDate: {
          from: fromDate ? fromDate.toISOString() : '',
          to: toDate ? toDate.toISOString() : ''
        },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' } ,
      customer: { value: '', matchMode: 'equals' } ,
      branchId: { value: '', matchMode: 'equals' } ,

  }});


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
    console.log(event,'event')

    console.log(fromDate,'from')
    console.log(toDate, 'to')
    event['first'] = 0;
    setLazyState(event);
  };





  const onSort = (event) => {
    console.log(event, 'event');
    const sortField = event.sortField;
    const sortOrder = event.sortOrder;
    setLazyState((prev) => ({
      ...prev,
      first: 10,
      sortField: sortField,
      sortOrder: sortOrder,
    }));
  };
  const onPage = (event) => {
    setLazyState(event);
  };



  useEffect(() => {
    if (
      lazyState.filters.createdDate?.from ||
      lazyState.filters.createdDate?.to ||
      lazyState.filters.byClient?.value ||
      lazyState.filters.status?.value ||
      lazyState.filters.customer?.value ||
      lazyState.filters.branchId?.value ||
      lazyState.filters.orderSource?.value
    ) {
      const queryParams = {
        orderSource: lazyState.filters.byClient?.value || '',
        page: lazyState.page || 0,
        customerEmail: lazyState.filters.customer?.value || '',
        branch: lazyState.filters.branchId?.value || '',
        limit: lazyState.rows || 10,
          fromDate: lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '',
          toDate: lazyState.filters.createdDate?.to ? new Date(lazyState.filters.createdDate.to).toISOString() : '',
      };
      console.log(lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '', 'hellolog')

      dispatch(filterOrders(queryParams));
    } else {
      dispatch(getEntities({}));
    }
    dispatch(getBranches({}))
    console.log(lazyState, 'lol')
  }, [lazyState]);



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
              onPage={onPage}
              onSort={onSort}
              sortOrder={lazyState.sortOrder}
              sortField={lazyState.sortField}
              filters={lazyState.filters}
              onFilter={onFilter}
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
                style={{ width: '6%' }}
                header="Order ID"
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
                body={(rowData) => format(new Date(rowData.createdDate), 'yyyy-MM-dd HH:mm:ss')}
                field="createdDate"
                filter
                header="Order Date"
                filterElement={
                  <div className="d-flex gap-1">
                    <div className="p-mr-2 text-center">
                      <label>From</label>
                      <Calendar
                        value={fromDate}
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              createdDate: {
                                ...prevState.filters.createdDate,
                                from: e.value,
                              },
                            },
                          }))
                        }
                        dateFormat={APP_LOCAL_DATE_FORMAT}
                        className="p-mb-2"
                      />
                    </div>
                    <div className="text-center">
                      <label>To</label>
                      <Calendar
                        value={toDate}
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              createdDate: {
                                ...prevState.filters.createdDate,
                                to: e.value,
                              },
                            },
                          }))
                        }
                        dateFormat={APP_LOCAL_DATE_FORMAT}
                      />
                    </div>
                  </div>
                }
              />

              <Column field="discount" sortable  style={{ width: '13%' }}
                header="Order Discount" body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
                <p className="text-danger text-center ">&#10006;</p> } filterMatchMode="custom"
              />

              <Column field="byClient" filter header="Order Source" />
              <Column field="tables" style={{ width: '10%' }}   header="Order Tables" />
              <Column
                field="customer"
                filter
                header="Order Customer"
                body={(rowData) => rowData.customer ? `${rowData.customer.firstName} ${rowData.customer.lastName}` : ''}
              />

              <Column field="status" filter header="Order Status" />
            </DataTable>
          </div>

      </div>
    </div>
  );
};



export default Order;
