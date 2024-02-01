import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';


import { Calendar } from 'primereact/calendar';
import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IOrder } from 'app/shared/model/ORDER/order.model';
import {searchEntities, getEntities, filterOrders, getOrderSources, getOrderStatuses} from './order.reducer';


import { searchEntities as searchBranches, getEntities as getBranches } from '../branch/branch.reducer';
import {format, formatISO} from "date-fns";
import {DataTable, DataTableFilterMeta} from "primereact/datatable";
import {Column} from "primereact/column";
import {fromPairs} from "lodash";
import {Dropdown} from "primereact/dropdown";
import { startOfDay, endOfDay } from 'date-fns';
import {InputText} from "primereact/inputtext";
import {translate, Translate} from "react-jhipster";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
  modifiedDate?: boolean;
}



export const Order = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const today = new Date();

  const from = startOfDay(today);
  const to = endOfDay(today);

  const [selectAll, setSelectAll] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(null);


  const [orderStatuses, setOrderStatuses]:any = useState([]);

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    modifiedDate: true,
    filters: {
      createdDate: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      id:{value: '', matchMode: 'contains'},
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: {value: '', matchMode: 'contains'}
    }});



  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);

  const loading = useAppSelector(state => state.order.loading);
  const orderSources = useAppSelector(state => state.order.orderSources);

  const branchList = useAppSelector(state => state.branch.entities);



  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID')
    const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };

  const statusOptions = [
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'Kitchen', value: 'KITCHEN' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Done', value: 'DONE' }
  ];

  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));





  const onFilter = (event) => {

    console.log(from,'from')
    console.log(to, 'to')
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
      fromDate: lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '',
      toDate: lazyState.filters.createdDate?.to ? new Date(lazyState.filters.createdDate.to).toISOString() : '',
      modifiedDate: true

    };

      dispatch(filterOrders(queryParams));

    dispatch(getBranches({}))

    dispatch(getOrderSources())

    dispatch(getOrderStatuses())
      .then((response :any) => {
        setOrderStatuses(response.payload?.map((status) => ({label: status, value: status})));
      })
  }, [lazyState]);





  console.log(orderList.length, 'len')
  return (
    <div>
      <h1><Translate contentKey={'orders.view.title'}>Orders View</Translate></h1>

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
            onPage={onPage}
            onSort={onSort}
            sortOrder={lazyState.sortOrder}
            sortField={lazyState.sortField}
            filters={lazyState.filters}
            onFilter={onFilter}
            loading={loading}
            removableSort
            emptyMessage={translate('orders.view.table.emptyMessage')}
            tableStyle={{ minWidth: '75rem' , alignContent: 'center'}}
            selectionMode="single"
            onSelectionChange={(e:any) => navigate(`/order/${e.value.id}`)}

          >
            <Column
              field="id"
              header={translate('orders.view.table.fields.id')}
              filter
              sortable
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
                  placeholder={translate('orders.view.table.filters.id')}
                />
              }
            />
            <Column
              field="branchId"
              sortable
              filter
              header={translate('orders.view.table.fields.branch')}
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
                  placeholder={translate('orders.view.table.filters.branch')}
                />
              }
            />
            <Column
              body={(rowData) => format(new Date(rowData.createdDate), 'yyyy-MM-dd HH:mm:ss')}
              field="createdDate"
              header={translate('orders.view.table.fields.date')}
              sortable

            />

            <Column field="discount" sortable  header={translate('orders.view.table.fields.discount')} body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
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
                        placeholder={translate('orders.view.table.filters.source')}
                      />
                    }
                    header={translate('orders.view.table.fields.source')}   />

            <Column field="tables" sortable  filter header={translate('orders.view.table.fields.tables')}
                    filterElement={
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
                        placeholder={translate('orders.view.table.filters.tables')}
                      />
                    }
            />
            <Column
              field="customer.email"
              filter
              filterField="customer.email"
              sortable
              header={translate('orders.view.table.fields.customerEmail')}
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
                  placeholder={translate('orders.view.table.filters.customerEmail')}
                />
              }
            />

            <Column
              field="customer.phone"
              filter
              sortable
              filterField="customer.phone"
              header={translate('orders.view.table.fields.customerPhone')}
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
                  placeholder={translate('orders.view.table.filters.customerPhone')}
                />
              }

            />
            <Column field="status" sortable filter header={translate('orders.view.table.fields.status')}
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
                        placeholder={translate('orders.view.table.filters.status')}
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
