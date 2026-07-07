import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { deleteEntities, filterOrders, getOrderSources, getOrderStatuses } from './order.reducer';

import { getEntities as getBranches } from '../branch/branch.reducer';
import { format } from 'date-fns';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { startOfDay, endOfDay } from 'date-fns';
import { InputText } from 'primereact/inputtext';
import { translate } from 'react-jhipster';
import { convertDateTimeFromServer } from "app/shared/util/date-utils";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";
import { formatSourceScopedIdentifier } from 'app/shared/util/order-identifier-utils';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
  modifiedDate?: boolean;
}

const RegisterClosureOrder = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tillId } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const registry = searchParams.get('registry');

  const [orderStatuses, setOrderStatuses]: any = useState([]);

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'createdDate',
    sortOrder: -1,
    modifiedDate: true,
    filters: {
      createdDate: {
        from,
        to
      },
      id: { value: '', matchMode: 'contains' },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      'customer.email': { value: '', matchMode: 'contains' },
      'customer.phone': { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: { value: '', matchMode: 'contains' },
    },
  });

  const orderList: IOrder[] = useAppSelector(state => state.order.entities);
  const [selectedOrders, setSelectedOrders] = useState<IOrder[]>([]);
  const totalOrders = useAppSelector(state => state.order.totalOrders);

  const loading = useAppSelector(state => state.order.loading);
  const orderSources = useAppSelector(state => state.order.orderSources);

  const branchList = useAppSelector(state => state.branch.entities);

  const getBranchName = branchId => {
    const matchedBranch = branchList.find(item => item.id === branchId);
    return matchedBranch ? matchedBranch.name : 'Unknown Branch';
  };

  const filteredBranchOptions = branchList.map(branch => ({
    label: branch.name,
    value: branch.id,
  }));

  const onFilter = event => {
    event['first'] = 0;
    setLazyState(event);
  };

  const onSort = event => {
    const sortField = event.sortField;
    const sortOrder = event.sortOrder;
    setLazyState(prev => ({
      ...prev,
      first: 10,
      sortField,
      sortOrder,
    }));
  };
  const onPage = event => {
    setLazyState(event);
  };

  const getFilteredOrders = () => {
    const queryParams = {
      orderSource: lazyState.filters.orderSource?.value || '',
      orderStatus: lazyState.filters.status?.value || '',
      first: lazyState.first,
      sequenceId: lazyState.filters.id?.value || '',
      tillId,
      page: lazyState.page,
      customerPhone: lazyState.filters['customer.phone']?.value || '',
      customerEmail: lazyState.filters['customer.email']?.value || '',
      branch: lazyState.filters.branchId?.value || '',
      tables: lazyState.filters.tables?.value || '',
      size: lazyState.rows,
      fromDate: lazyState.filters.createdDate?.from ? new Date(lazyState.filters.createdDate.from).toISOString() : '',
      toDate: lazyState.filters.createdDate?.to ? new Date(lazyState.filters.createdDate.to).toISOString() : '',
      modifiedDate: true,
      sort: lazyState.sortField ? `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}` : 'createdDate,desc'
    };

    dispatch(filterOrders(queryParams));
  }

  useEffect(() => {
    getFilteredOrders();
  }, [lazyState]);

  useEffect(() => {
    dispatch(getBranches({}));

    dispatch(getOrderSources());

    dispatch(getOrderStatuses()).then((response: any) => {
      setOrderStatuses(response.payload?.map(status => ({ label: status, value: status })));
    });
  }, []);

  const confirm1 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleBulkDelete()
    });
  };

  const handleBulkDelete = async () => {
    await dispatch(deleteEntities(selectedOrders.map(product => product.id)));
    getFilteredOrders();
    setSelectedOrders([]);
  }

  const header = (
    <div>
      <div className='d-flex justify-content-between align-items-end'>
        <span className='fs-5'>
          {`Orders from ${convertDateTimeFromServer(from)} to  ${convertDateTimeFromServer(to)} for ${registry} register`}
        </span>
        <span>
          {/* danger prime button */}
          <Button
            label="Delete"
            severity="danger"
            className="p-2"
            disabled={selectedOrders.length === 0}
            onClick={() => confirm1()}
          >
          </Button>
        </span>
      </div>
    </div>
  )

  return (
    <div className="p-3 mb-2" style={{ background: 'var(--surface-card)', borderRadius: '10px' }}>
      <DataTable
        value={orderList}
        lazy
        selectionMode='checkbox'
        selection={selectedOrders}
        editMode="row"
        filterDisplay="row"
        dataKey="id"
        paginator
        first={lazyState.first}
        rows={20}
        totalRecords={totalOrders}
        onPage={onPage}
        onSort={onSort}
        header={header}
        sortOrder={lazyState.sortOrder}
        sortField={lazyState.sortField}
        filters={lazyState.filters}
        onFilter={onFilter}
        loading={loading}
        removableSort
        emptyMessage={translate('orders.view.table.emptyMessage')}
        tableStyle={{ minWidth: '75rem', alignContent: 'center' }}
        onSelectionChange={(e) => setSelectedOrders(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column
          field="id"
          header={translate('orders.view.table.fields.id')}
          filter
          sortable
          body={(rowData): any => <Link to={`/order/${rowData.id}`}>{formatSourceScopedIdentifier(rowData.sourceApp?.type, rowData.sequenceNumber, rowData.id)}</Link>}
          filterElement={
            <InputText
              style={{ width: '5rem' }}
              onChange={e =>
                setLazyState(prevState => ({
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
          body={data => getBranchName(data.branchId)}
          filterElement={
            <Dropdown
              value={lazyState.filters.branchId?.value || ''}
              options={filteredBranchOptions}
              onChange={e =>
                setLazyState(prevState => ({
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
          body={rowData => formatDateForDisplay(rowData.createdDate)}
          field="createdDate"
          header={translate('orders.view.table.fields.date')}
          sortable
        />

        <Column
          field="discount"
          sortable
          header={translate('orders.view.table.fields.discount')}
          body={rowData =>
            rowData.discount ? <p className="text-success text-center ">&#10004;</p> : <p className="text-danger text-center ">&#10006;</p>
          }
        />

        <Column
          field="orderSource"
          body={rowData => rowData.sourceApp.type}
          sortable
          filter
          filterElement={
            <Dropdown
              value={lazyState.filters.orderSource?.value || ''}
              options={orderSources?.map(source => ({ label: source, value: source }))}
              onChange={e =>
                setLazyState(prevState => ({
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
          header={translate('orders.view.table.fields.source')}
        />

        <Column
          field="tables"
          sortable
          filter
          header={translate('orders.view.table.fields.tables')}
          filterElement={
            <InputText
              style={{ width: '6rem' }}
              onChange={e =>
                setLazyState(prevState => ({
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
              style={{ width: '11rem' }}
              onChange={e =>
                setLazyState(prevState => ({
                  ...prevState,
                  filters: {
                    ...prevState.filters,
                    'customer.email': { value: e.target.value, matchMode: 'equals' },
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
              style={{ width: '11rem' }}
              onChange={e =>
                setLazyState(prevState => ({
                  ...prevState,
                  filters: {
                    ...prevState.filters,
                    'customer.phone': { value: e.target.value, matchMode: 'equals' },
                  },
                }))
              }
              placeholder={translate('orders.view.table.filters.customerPhone')}
            />
          }
        />
        <Column
          field="status"
          sortable
          filter
          header={translate('orders.view.table.fields.status')}
          filterElement={
            <Dropdown
              value={lazyState.filters.status?.value || ''}
              options={orderStatuses}
              onChange={e =>
                setLazyState(prevState => ({
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
  );
};

export default RegisterClosureOrder;
