import React, {useState, useEffect, useRef} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {Calendar} from 'primereact/calendar';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, filterOrders, getOrderSources, getOrderStatuses, reset} from './order.reducer';
import { getEntities as getBranches } from '../branch/branch.reducer';
import {endOfDay,  startOfDay} from "date-fns";
import {DataTable, } from "primereact/datatable";
import {Column} from "primereact/column";
import {debounce} from "lodash";
import {Dropdown} from "primereact/dropdown";
import {InputText} from "primereact/inputtext";
import {translate} from "react-jhipster";
import {toLocalISOString} from "app/shared/util/date-utils";
import {Toast} from "primereact/toast";

interface LazyTableState {
  first?: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
}


export const Order = ({customer = ''} : {customer?: string}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useRef(null);

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
        "customer.email": { value: customer, matchMode: 'contains' },
        "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: {value: '', matchMode: 'contains'}
    }
  });

  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders);
  const loading = useAppSelector(state => state.order.loading);
  const branchList = useAppSelector(state => state.branch.entities);
  const orderSources = useAppSelector(state => state.order.orderSources);


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
    const sortField = event.sortField;
    const sortOrder = event.sortOrder;
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
    if(e?.value?.items?.length > 0){
      navigate(`/order/${e.value.id}`)
    }else{
      console.log(toast?.current, 'fsf')
      toast.current.show({ severity: 'warn', summary: 'No Order Items', detail: `Order ID: ${e.value.sequenceNumber}`, life: 3000 });
    }
  }



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
          orderSource: lazyState.filters.orderSource?.value || '',
          orderStatus: lazyState.filters.status?.value || '',
          first: lazyState.first,
          sequenceId: lazyState.filters.id?.value || '',
          page: lazyState.page,
          customerPhone: lazyState.filters['customer.phone']?.value || '',
          customerEmail: lazyState.filters['customer.email']?.value || '',
          branch: lazyState.filters.branchId?.value || '',
          tables: lazyState.filters.tables?.value || '',
          size: lazyState.rows,
          fromDate: dates && dates[0] ? toLocalISOString(startOfDay(new Date(dates[0]))) : '',
          toDate: dates && dates[1] ? toLocalISOString(endOfDay(new Date(dates[1]))) : '',
          sort: `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}`
        };
        dispatch(filterOrders(queryParams));
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

    dispatch(getOrderStatuses())
      .then((response :any) => {
        setOrderStatuses(response.payload?.map((status) => ({label: status, value: status})));
      })
  }, []);


  return (
    <div>
          <div className="p-3 mb-2" style={{ background: 'var(--surface-card)', borderRadius: '10px'}}>
            <Toast ref={toast} />

            <DataTable
              showGridlines
              value={orderList}
              lazy
              filterDisplay="row"
              dataKey="id"
              paginator
              first={lazyState.first}
              rows={20}
              totalRecords={totalOrders}
              emptyMessage={translate('orders.view.table.emptyMessage')}
              onPage={onPage}
              onSort={onSort}
              sortOrder={lazyState.sortOrder}
              sortField={lazyState.sortField}
              filters={lazyState.filters}
              onFilter={onFilter}
              header={"Order History"}
              removableSort
              loading={loading}
              tableStyle={{ minWidth: '75rem' , alignContent: 'center'}}
              selectionMode="single"
              onSelectionChange={handleSelect}
            >
              <Column
                field="id"
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
                    style={{width: '12rem'}}
                    value={dates as any}
                    onChange={(e: any) => setDates(e.value)}
                    selectionMode="range"
                    placeholder={translate('orders.view.table.filters.date')}
                  />
                }
              />

              <Column field="discount" sortable
                header={translate('orders.view.table.fields.discount')} body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
                <p className="text-danger text-center ">&#10006;</p> }
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
                      header={translate('orders.view.table.fields.source')}  />


              <Column field="tables" sortable  filter  header={translate('orders.view.table.fields.tables')}  filterElement={
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
              {!customer ? <Column
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
                          "customer.email": {value: e.target.value, matchMode: 'equals'},
                        },
                      }))
                    }
                    placeholder={translate('orders.view.table.filters.customerEmail')}
                  />
                }
              />
              :null}

              {!customer ?  <Column
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
                        "customer.phone": {value: e.target.value, matchMode: 'equals'},
                      },
                    }))
                  }
                  placeholder={translate('orders.view.table.filters.customerPhone')}
                />
              }
            /> : null}

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
  );
};



export default Order;

