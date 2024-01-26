import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


import { useAppDispatch, useAppSelector } from 'app/config/store';



import {  getEntities as getBranches } from '../../../entities/branch/branch.reducer';
import {format, formatISO} from "date-fns";
import {DataTable, DataTableFilterMeta} from "primereact/datatable";
import {Column} from "primereact/column";
import {fromPairs} from "lodash";
import {Dropdown} from "primereact/dropdown";
import { startOfDay, endOfDay } from 'date-fns';
import {InputText} from "primereact/inputtext";
import {getOrderSources, getOrderStatuses} from "app/entities/order/order.reducer";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: any;
  filters: any;
  modifiedDate?: boolean;
}



export const OpenedOrders = ({openedOrders}) => {
  const dispatch = useAppDispatch();

  const today = new Date();

  const from = startOfDay(today);
  const to = endOfDay(today);

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
      sequenceNumber:{value: '', matchMode: 'contains'},
      byClient: { value: '', matchMode: 'contains' },
      status: { value: '', matchMode: 'contains' },
      "customer.email": { value: '', matchMode: 'contains' },
      "customer.phone": { value: '', matchMode: 'contains' },
      branchId: { value: '', matchMode: 'equals' },
      tables: {value: '', matchMode: 'contains'},
      "sourceApp.type": {value: '', matchMode: 'contains'}
    }});



  const totalOrders = openedOrders?.length;

  const orderSources = useAppSelector(state => state.order.orderSources);

  const branchList = useAppSelector(state => state.branch.entities);



  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID')
    const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };






  const onSelectionChange = (event) => {
    const value = event.value;

    setSelectedOrders(value);
  };


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

    dispatch(getBranches({}))

    dispatch(getOrderSources())
    dispatch(getOrderStatuses())
      .then((response :any) => {
        setOrderStatuses(response.payload?.map((status) => ({label: status, value: status})));
      })
  }, []);





  console.log(lazyState.filters, 'lazyState.filters')

  return (
    <div>

      <div>
        <div className="p-3 my-5" style={{ background: 'var(--surface-card)', borderRadius: '10px'}}>
          <h4>Unclosed Orders</h4>

          <DataTable
            value={openedOrders}
            filterDisplay="row"
            dataKey="id"
            paginator
            first={lazyState.first}
            rows={20}
            totalRecords={totalOrders}
            filters={lazyState.filters}
            onFilter={onFilter}
            removableSort
            emptyMessage="No Orders Found"
            tableStyle={{ minWidth: '75rem' , alignContent: 'center'}}
            selection={selectedOrders}
            onSelectionChange={onSelectionChange}
          >
            <Column
              field="sequenceNumber"
              header="Order ID"
              filter
              sortable
              body={(rowData): any => (
                <Link to={`/order/${rowData.id}`}>
                  {rowData.sequenceNumber}
                </Link>
              )}
              filterElement = {
            <InputText
              style={{ width: '5rem' }}
              placeholder="Enter id"
              onChange={(e) => {
                const newValue = e.target.value;
                setLazyState((prevState) => ({
                  ...prevState,
                  filters: {
                    ...prevState.filters,
                    sequenceNumber: { value: newValue, matchMode: 'contains' },
                  },
                }));
              }}
            /> }
            />
            <Column
              field="branchId"
              sortable
              filter
              header="Order Branch"
              body={(data) => getBranchName(data.branchId)}
            />
            <Column
              body={(rowData) => format(new Date(rowData.createdDate), 'yyyy-MM-dd HH:mm:ss')}
              field="createdDate"
              header="Order Date"
              sortable

            />

            <Column field="discount" sortable  header="Order Discount" body={rowData => rowData.discount? <p className="text-success text-center ">&#10004;</p>:
              <p className="text-danger text-center ">&#10006;</p> } filterMatchMode="custom"

            />

            <Column field="sourceApp.type" body={(rowData) => rowData.sourceApp.type} sortable filter
                    filterElement={
                      <Dropdown
                        value={lazyState.filters["sourceApp.type"]?.value || ''}
                        options={orderSources?.map((source) => ({label: source, value: source}))}
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                             "sourceApp.type": { value: e.value, matchMode: 'contains' },
                            },
                          }))
                        }
                        placeholder="Select a source"
                      />
                    }
                    header="Order Source"   />

            <Column field="tables" sortable  filter header="Order Tables"
                    filterElement={
                      <InputText
                        style={{width: '6rem'}}
                        onChange={(e) =>
                          setLazyState((prevState) => ({
                            ...prevState,
                            filters: {
                              ...prevState.filters,
                              tables: { value: e.target.value, matchMode: 'contains' },
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
                        "customer.email": { value: e.target.value, matchMode: 'contains' },
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
                        "customer.phone": { value: e.target.value, matchMode: 'contains' },
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



export default OpenedOrders;
