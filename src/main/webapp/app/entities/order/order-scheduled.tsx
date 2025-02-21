import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterOrders, getOrderSources, getOrderStatuses } from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { format, } from "date-fns";
import { DataTable, } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { startOfDay, endOfDay } from 'date-fns';
import { InputText } from "primereact/inputtext";
import { translate, } from "react-jhipster";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { Label } from 'reactstrap';
import { Checkbox } from 'primereact/checkbox';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { Button } from 'primereact/button';
import { FaCog } from 'react-icons/fa';
import { Menu } from 'primereact/menu';

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
  modifiedDate?: boolean;
}

const OrderScheduled = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const today = new Date();

  const from = startOfDay(today);
  const to = endOfDay(today);
  const LOCAL_STORAGE_KEY = "order-scheduled-columns";
  const menu = useRef(null);
  const [orderStatuses, setOrderStatuses]: any = useState([]);

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
      id: { value: '', matchMode: 'contains' },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: { value: '', matchMode: 'contains' }
    }
  });

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);

  const loading = useAppSelector(state => state.order.loading);
  const orderSources = useAppSelector(state => state.order.orderSources);

  const branchList = useAppSelector(state => state.branch.entities);

  const getBranchName = (branchId) => {
    const branch = branchList.find(branch => branch.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));

  const onFilter = (event) => {
    event['first'] = 0;
    setLazyState(event);
  };

  const onSort = (event) => {
    const sortField = event.sortField;
    const sortOrder = event.sortOrder;
    setLazyState((prev) => ({
      ...prev,
      first: 10,
      sortField,
      sortOrder,
    }));
  };
  const onPage = (event) => {
    setLazyState(event);
  };
  
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
    
    // Check if 'orderToday' exists in the stored data, otherwise initialize it with default visibility
    const storedFields = storedData[LOCAL_STORAGE_KEY] || {
      orderId: true,
      orderBranch: true,
      OrderDate: true,
      orderStatus: true,
      orderSource: true,
      orderTable: true,
      customerEmail: true,
      customerPhone: true,
      orderDiscount: true,
    };
  
    return storedFields;
  });
  
    const toCamelCaseWithSpace = (str) => {
      return str
        .replace(/([A-Z])/g, ' $1')  // Add space before uppercase letters
        .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
        .replace(/\s+/g, ' ')         // Remove any extra spaces
        .trim(); // Remove leading and trailing spaces
    };
  
  const onColumnToggle = (columnKey) => {
    setVisibleColumns((prevState) => {
      const updatedColumns = {
        ...prevState,
        [columnKey]: !prevState[columnKey],
      };
  
      // Retrieve existing visible columns data from localStorage
      const visibleColumnsData = JSON.parse(localStorage.getItem("visible_columns")) || {};
  
      // Update or set the 'orderToday' key with the new column visibility
      visibleColumnsData[LOCAL_STORAGE_KEY] = updatedColumns;
      
      console.log(visibleColumnsData);
      // Save the updated data back to localStorage
      localStorage.setItem("visible_columns", JSON.stringify(visibleColumnsData));
  
      return updatedColumns;
    });
  };
  
    const columnOptions = Object.keys(visibleColumns)
    .map((field) => ({
      field,
      header: toCamelCaseWithSpace(field), // Convert the field name to a human-readable header
    }));

  useEffect(() => {
    const queryParams = {
      orderSource: lazyState.filters.orderSource?.value || '',
      orderStatus: lazyState.filters.status?.value || '',
      first: lazyState.first,
      sequenceId: lazyState.filters.id?.value || '',
      page: lazyState.page,
      customerPhone: lazyState.filters['customer.phone']?.value || '',
      customerEmail: lazyState.filters['customer.email']?.value || '',
      branchId: lazyState.filters.branchId?.value || '',
      tables: lazyState.filters.tables?.value || '',
      size: lazyState.rows,
      modifiedDate: true,
      sort: `_id,asc`,
      scheduled: true
    };

    const filteredQueryParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined
      )
    );

    dispatch(filterOrders(filteredQueryParams));
  }, [lazyState]);

  const header = (
    <div className="p-2 d-flex justify-content-between align-items-center">
      <div className='d-flex align-items-center'>
        Schedule Orders
      </div>
      <div className="relative d-flex justify-end ml-auto">
        <Menu
          model={[
            {
              label: "Select Columns",
              items: columnOptions.map((col) => ({
                template: () => (
                  <div className="p-menuitem mt-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      inputId={col.field}
                      checked={visibleColumns[col.field]}
                      onChange={() => onColumnToggle(col.field)}
                    />
                    <label className="ml-2" htmlFor={col.field} >{col.header}</label>
                  </div>
                ),
              })),
            },
          ]}
          popup
          ref={menu}
        />
        <Button
            data-pr-position="top" 
            icon={<FaCog className="text-xl" />}
            tooltip='Select Columns'
            className="border-0 p-button-text mr-auto bg-transparent hover:bg-transparent focus:bg-transparent flex items-center"
            onClick={(event) => menu.current.toggle(event)}
          />
      </div>
    </div>
  )

  useEffect(() => {
    dispatch(getBranches({}))

    dispatch(getOrderSources())

    dispatch(getOrderStatuses())
      .then((response: any) => {
        setOrderStatuses(response.payload?.map((status) => ({ label: status, value: status })));
      })
  }, []);

  return (
    <div className="p-3 mb-2" style={{ background: 'var(--surface-card)', borderRadius: '10px' }}>
      <DataTable
        value={orderList}
        lazy
        filterDisplay="row"
        dataKey="id"
        paginator
        first={lazyState.first}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        rows={lazyState.rows}
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
        selectionMode="single"
        onSelectionChange={(e: any) => navigate(`/order/${e.value.id}`)}

      >
        { visibleColumns.orderId && <Column
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
              style={{ width: '5rem' }}
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
        /> }

        { visibleColumns.orderBranch && <Column
          field="branchId"
          sortable
          filter
          header={translate('orders.view.table.fields.branch')}
          body={(data) => getBranchName(data.branchId)}
          filterElement={
            <Dropdown
              value={lazyState.filters.branchId?.value || ''}
              options={filteredBranchOptions}
              showClear
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
        /> }

        {visibleColumns.OrderDate && <Column
          body={(rowData) => format(new Date(rowData.createdDate), 'yyyy-MM-dd HH:mm:ss')}
          field="createdDate"
          header={translate('orders.view.table.fields.date')}
          sortable

        />}

        { visibleColumns.orderStatus && <Column
          field="processingStatus"
          header={translate('orders.view.table.fields.status')}
          filter
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
              showClear
              placeholder={translate('orders.view.table.filters.status')}
            />
          }
        /> }

        { visibleColumns.orderSource && <Column field="orderSource" body={(rowData) => rowData.sourceApp?.type} sortable filter
          filterElement={
            <Dropdown
              value={lazyState.filters.orderSource?.value || ''}
              options={orderSources?.map((source) => ({ label: source, value: source }))}
              showClear
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
          header={translate('orders.view.table.fields.source')} />}

        { visibleColumns.orderTable && <Column field="tables" sortable filter header={translate('orders.view.table.fields.tables')}
          filterElement={
            <InputText
              style={{ width: '6rem' }}
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
        />}

        {visibleColumns.customerEmail && <Column
          field="customer.email"
          filter
          filterField="customer.email"
          sortable
          header={translate('orders.view.table.fields.customerEmail')}
          filterElement={
            <InputText
              style={{ width: '11rem' }}
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
        />}

        {visibleColumns.customerPhone && <Column
          field="customer.phone"
          filter
          sortable
          filterField="customer.phone"
          header={translate('orders.view.table.fields.customerPhone')}
          filterElement={
            <InputText
              style={{ width: '11rem' }}
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
        />}

        {visibleColumns.orderDiscount && <Column field="discount" sortable header={translate('orders.view.table.fields.discount')} body={rowData => rowData.discount ? <p className="text-success text-center ">&#10004;</p> :
          <p className="text-danger text-center ">&#10006;</p>}
        />}
      </DataTable>

    </div>
  );
};

export default OrderScheduled;