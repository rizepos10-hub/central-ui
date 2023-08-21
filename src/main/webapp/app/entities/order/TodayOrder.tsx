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


  const today = new Date();

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
        from: today ? today.toISOString() : '',
        to: today ? today.toISOString() : ''
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
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));



  const onSelectionChange = (event) => {
    const value = event.value;

    setSelectedOrders(value);
    setSelectAll(value.length === orderList.length);
  };


  const onFilter = (event) => {

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

      const queryParams = {
        orderSource: lazyState.filters.byClient?.value || '',
        page: lazyState.page || 0,
        customerEmail: lazyState.filters.customer?.value || '',
        branch: lazyState.filters.branchId?.value || '',
        limit: lazyState.rows || 10,
        fromDate: lazyState.filters.createdDate?.from
          ? new Date(lazyState.filters.createdDate.from).toISOString().replace(/\T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'T00:00:00.000Z')
          : '',

      };

      dispatch(filterOrders(queryParams));

    dispatch(getBranches({}))
    console.log(lazyState, 'lol')
  }, [lazyState]);





  console.log(orderList.length, 'len')
  return (
    <div>
      <h1>Order View</h1>

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
            emptyMessage="No Orders Found"
            tableStyle={{ minWidth: '75rem' , alignContent: 'center'}}
            selection={selectedOrders}
            onSelectionChange={onSelectionChange}
          >
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
              header="Order Date"
              style={{ width: '10%' }}


            />

            <Column field="discount" sortable  header="Order Discount" body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
              <p className="text-danger text-center ">&#10006;</p> } filterMatchMode="custom"
                    style={{ width: '13%' }}

            />

            <Column field="byClient" filter header="Order Source" />
            <Column field="tables" style={{ width: '13%' }} header="Order Tables" />
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
