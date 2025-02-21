import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar } from 'primereact/calendar';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, filterOrders, getOrderSources, getOrderStatuses, reset } from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import { endOfDay, startOfDay } from "date-fns";
import { DataTable, } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import { debounce } from "lodash";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { translate } from "react-jhipster";
import { toLocalISOString } from "app/shared/util/date-utils";
import { Toast } from "primereact/toast";
import { Checkbox } from 'primereact/checkbox';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import {  Label } from 'reactstrap';
import { Button } from 'primereact/button';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { getEntity as getUiSettings } from 'app/entities/online-ordering/settings/settings.reducer';
import { FaCog, FaCopy } from 'react-icons/fa';
import { Menu } from 'primereact/menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface LazyTableState {
  first?: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
}

type OrderProps = {
  customer?: string;
  appSourceProp?: "ONLINE_ORDERING" | "BRANCH_POS" | "BUSINESS_ADMIN" | "CENTRAL_APP";
}


export const Order = ({ customer = '', appSourceProp }: OrderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useRef(null);
  const menu = useRef(null);
  const LOCAL_STORAGE_KEY = "order-history-columns";
  const [dates, setDates] = useState<string | Date | Date[] | null>(null);
  const [orderStatuses, setOrderStatuses]: any = useState([]);
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
      id: { value: '', matchMode: 'contains' },
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.id": { value: customer, matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: { value: '', matchMode: 'contains' }
    }
  });

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);
  const loading = useAppSelector(state => state.order.loading);
  const branchList = useAppSelector(state => state.branch.entities);
  const orderSources = useAppSelector(state => state.order.orderSources);
  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);


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
    const newDates = event.filters.createdDate || null;
    setDates(newDates);

    event['first'] = 0;
    setLazyState(event);
  };


  const onSort = (event) => {
    const sortField = event.sortField === "id" ? "_id" : event.sortField;
    const sortOrder = event.sortOrder;
    console.log(event)
    console.log(event.sortField)
    setLazyState((prev) => ({
      ...prev,
      sortField,
      sortOrder,
    }));
  };
  const onPage = (event) => {
    setLazyState(event);
  };

  const handleSelect = (e) => {
    if (e?.value?.items?.length > 0) {
      navigate(`/order/${e.value.id}`)
    } else {
      toast.current.show({ severity: 'warn', summary: 'No Order Items', detail: `Order ID: ${e.value.sequenceNumber}`, life: 3000 });
    }
  }


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
    const handleFilterOrders = debounce(() => {
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
          id: lazyState.filters._id?.value || '',
          client: appSourceProp || lazyState.filters.orderSource?.value || '',
          orderProcessingStatus: lazyState.filters.status?.value || '',
          first: lazyState.first,
          sequenceId: lazyState.filters.id?.value || '',
          page: lazyState.page,
          customerPhone: lazyState.filters['customer.phone']?.value || '',
          customerEmail: lazyState.filters['customer.email']?.value || '',
          customerId: lazyState.filters['customer.id']?.value || '',
          branchId: lazyState.filters.branchId?.value || '',
          tables: lazyState.filters.tables?.value || '',
          size: lazyState.rows,
          fromDate: dates && dates[0] ? toLocalISOString(startOfDay(new Date(dates[0]))) : '',
          toDate: dates && dates[1] ? toLocalISOString(endOfDay(new Date(dates[1]))) : '',
          sort: `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}`
        };

        const filteredQueryParams = Object.fromEntries(
          Object.entries(queryParams).filter(
            ([_, value]) => value !== '' && value !== null && value !== undefined
          )
        );

        dispatch(filterOrders(filteredQueryParams));
      } else {
        dispatch(getEntities({}));
      }
    }, 300);

    handleFilterOrders();

    return () => {
      handleFilterOrders.cancel();
    };
  }, [lazyState, dates]);



  useEffect(() => {
    dispatch(getBranches({}))
    dispatch(getOrderSources())
    dispatch(getUiSettings())
    dispatch(getOrderStatuses())
      .then((response: any) => {
        setOrderStatuses(response.payload?.map((status) => ({ label: status, value: status })));
      })
  }, []);

  const header = () => {
    return (
      <div className="p-2 d-flex justify-content-between">
        <span className='d-flex align-items-center'>
          Order History
        </span>
        {UiSettingsEntity.orderConfirmation && (
          <span className='d-flex gap-2 d-flex align-items-center'>
            <Label>
              Filter By Awaiting Confirmation
            </Label>
            <Checkbox
              checked={lazyState.filters?.status?.value === OrderStatus.DRAFT && lazyState.filters?.orderSource?.value === 'ONLINE_ORDERING'}
              onChange={(e) => {
                if (e.checked) {
                  setLazyState((prevState) => ({
                    ...prevState,
                    filters: {
                      ...prevState.filters,
                      orderSource: { value: 'ONLINE_ORDERING', matchMode: 'equals' },
                      status: { value: OrderStatus.DRAFT, matchMode: 'equals' },
                    },
                  }))
                } else {
                  setLazyState((prevState) => ({
                    ...prevState,
                    filters: {
                      ...prevState.filters,
                      orderSource: { value: null, matchMode: 'equals' },
                      status: { value: null, matchMode: 'equals' },
                    },
                  }))
                }
              }}
            />
          </span>
        )}
        
        <div className="flex justify-between items-center">
          <div className="relative d-flex justify-end mr-auto">
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
      </div>
    )
  }

  return (
    <div>
      <div className="p-3 mb-2" style={{ background: 'var(--surface-card)', borderRadius: '10px' }}>
        <Toast ref={toast} />

        <DataTable
          showGridlines
          value={orderList}
          lazy
          filterDisplay="row"
          dataKey="id"
          paginator
          first={lazyState.first}
          rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
          rows={lazyState.rows}
          totalRecords={totalOrders}
          emptyMessage={translate('orders.view.table.emptyMessage')}
          onPage={onPage}
          onSort={onSort}
          sortOrder={lazyState.sortOrder}
          sortField={lazyState.sortField}
          filters={lazyState.filters}
          onFilter={onFilter}
          header={header}
          removableSort
          loading={loading}
          style={{ background: 'var(--surface-card)', borderRadius: '10px' }}
          selectionMode="single"
          onSelectionChange={handleSelect}
        >
          {visibleColumns.orderId && <Column
            field="_id"
            header={translate('orders.view.table.fields.id')}
            sortable
            filter
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
                      _id: { value: e.target.value, matchMode: 'equals' },
                    },
                  }))
                }
                placeholder={translate('orders.view.table.filters.id')}
              />
            }
          />}
          {visibleColumns.orderBranch && <Column
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
          />}
          { visibleColumns.OrderDate && <Column
            field="createdDate"
            filter
            sortable
            header={translate('orders.view.table.fields.date')}
            body={(rowData) => (
              <span>
                {rowData.createdDate &&
                  `${new Date(rowData.createdDate).toLocaleString()} `}
              </span>
            )}

            filterElement={
              <Calendar
                style={{ width: '12rem' }}
                value={dates as any}
                onChange={(e: any) => setDates(e.value)}
                selectionMode="range"
                placeholder={translate('orders.view.table.filters.date')}
              />
            }
          />}

          {visibleColumns.orderStatus && <Column
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
          />}

          {visibleColumns.orderSource && <Column
            header={translate('orders.view.table.fields.source')}
            field="orderSource" body={(rowData) => rowData.sourceApp?.type} filter={!appSourceProp}
            filterElement={!appSourceProp ?
              <Dropdown
                value={lazyState.filters.orderSource?.value || ''}
                placeholder={translate('orders.view.table.filters.source')}
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
              /> : null}
          />}


          {visibleColumns.orderTable && <Column field="tables" sortable filter header={translate('orders.view.table.fields.tables')} filterElement={
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


          {!customer && visibleColumns.customerEmail ? <Column
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
          />
            : null}

          {!customer && visibleColumns.customerPhone ? <Column
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
          /> : null}


          {visibleColumns.orderDiscount && <Column field="discount" sortable
            header={translate('orders.view.table.fields.discount')} body={rowData => rowData.discount ? <p className="text-success text-center ">&#10004;</p> :
              <p className="text-danger text-center ">&#10006;</p>}
          />}

        </DataTable>
      </div>
    </div>
  );
};



export default Order;

