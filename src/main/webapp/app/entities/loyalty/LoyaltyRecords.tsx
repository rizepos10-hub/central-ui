import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getLoyaltyRecords } from 'app/entities/loyalty/loyalty-records.reducer';
import { searchCustomers } from 'app/entities/customer/customer.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';


export const LoyaltyRecords = () => {
  const ROWS_PER_PAGE = 5;
  const dispatch = useAppDispatch();

  const records = useAppSelector(state => state.loyalty.entities);
  const loading = useAppSelector(state => state.loyalty.loading);
  const totalItems = useAppSelector(state => state.loyalty.totalItems);
  const errorMessage = useAppSelector(state => state.loyalty.errorMessage);


  interface LazyTableState {
    first: number;
    rows: number;
    page: number;
    sortField?: string;
    sortOrder?: any;
    filters: any;
  }
  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: ROWS_PER_PAGE,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      'customer.id': {value: '', matchMode: 'CONTAINS'},
      'customer.firstName': {value: '', matchMode: 'CONTAINS'},
      'customer.lastName': {value: '', matchMode: 'CONTAINS'},
      'customer.email': {value: '', matchMode: 'CONTAINS'},
      'customer.phone': {value: '', matchMode: 'CONTAINS'},
      points: {value: '', matchMode: 'EQUALS'}
    },
  });

  const handleOnFilter = (e) => {
    setLazyState(prev => {
      return {
        ...prev,
        first: 0,
        page: 0,
        filters: {
          'customer.id': e.filters['customer.id'],
          'customer.firstName': e.filters['customer.firstName'],
          'customer.lastName': e.filters['customer.lastName'],
          'customer.email': e.filters['customer.email'],
          'customer.phone': e.filters['customer.phone'],
          points: e.filters.points
        }
      }
    });
  };
  const handleOnSort = (e) => {
    setLazyState(prev => {
      return { ...prev, sortField: e.sortField, sortOrder: e.sortOrder}
    })
  }

  const handleOnPage = (e) => {
    setLazyState(prev => {
      return { ...prev, first: e.first, page: e.page }
    })
  };

  const getCustomersIdsAsync = () => {
    const getCustomersFilters = (keys: string[])=> {
      const customersFilters: any = {};
      keys.forEach((key)=>{
        if (lazyState.filters[`customer.${key}`].value)
          customersFilters[key] = { value: lazyState.filters[`customer.${key}`].value, matchMode: "CONTAINS"};
      })
      return customersFilters;
    }

    return dispatch(searchCustomers({
      first: 0,
      rows: 999999999,
      page: 0,
      sortField: null,
      sortOrder: null,
      filters: getCustomersFilters(['id', 'firstName', 'lastName', 'email', 'phone']),
    }))
  }

  const hasCustomerFilters =
    lazyState.filters['customer.id'].value ||
    lazyState.filters['customer.email'].value ||
    lazyState.filters['customer.firstName'].value ||
    lazyState.filters['customer.lastName'].value ||
    lazyState.filters['customer.phone'].value;

  useEffect(() => {
    const filters: any = {};

    if (lazyState.filters['points']?.value){
      filters['points'] = {value: +(lazyState.filters.points.value), matchMode: 'EQUALS'};
    }

    // set filters by customer id
    if (hasCustomerFilters) {
      getCustomersIdsAsync().then((res:any) => {
        const ids = res?.payload.data.map(customer => customer.id);
        if (ids.length > 0)
          filters['customer.id'] = {
            operator: "OR",
            constraints: ids.map(id => {return {value: id, matchMode: 'EQUALS'}})
          };
        else filters['customer.id'] = {value: '', matchMode: "EQUALS"}

        const params = {
          first: lazyState.first || 0,
          rows: lazyState.rows || ROWS_PER_PAGE,
          page: lazyState.page || 0,
          sortField: lazyState.sortField || null,
          sortOrder: lazyState.sortOrder || null,
          filters,
        }
        dispatch(
          getLoyaltyRecords(params)
        );
        return;
      });
    }

    const params = {
      first: lazyState.first || 0,
      rows: lazyState.rows || ROWS_PER_PAGE,
      page: lazyState.page || 0,
      sortField: lazyState.sortField || null,
      sortOrder: lazyState.sortOrder || null,
      filters,
    }
    dispatch(
      getLoyaltyRecords(params)
    );

  }, [lazyState]);


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Loyalty Records</span>
    </div>
  );

  return (
    <>
      <div className="col-12">
        <DataTable
          lazy
          value={records}
          dataKey='id'
          header={header}
          paginator
          rows={ROWS_PER_PAGE}
          removableSort
          totalRecords={totalItems}
          filterDisplay="row"
          className="datatable-responsive"
          emptyMessage="No Customers found."
          loading={loading}

          first={lazyState.first}
          onFilter={handleOnFilter}
          filters={lazyState.filters}
          onPage={handleOnPage}
          //onSort={handleOnSort}
          sortField={lazyState.sortField}
          sortOrder={lazyState.sortOrder}
        >
          <Column
            field="customer.email"
            header="Email"
            // sortable
            filter
            filterPlaceholder="Search"
            showFilterMenu={false}
            body={(rowData)=>{return rowData.customer?.email}}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.firstName"
            header="First Name"
            body={(rowData)=>{return rowData.customer?.firstName}}
            // sortable
            filter
            filterPlaceholder="Search"
            showFilterMenu={false}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.lastName"
            header="Last Name"
            body={(rowData)=>{return rowData.customer?.lastName}}
            // sortable
            filter
            filterPlaceholder="Search"
            showFilterMenu={false}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.phone"
            header="Phone Number"
            filter
            filterPlaceholder="Search"
            showFilterMenu={false}
            body={(rowData)=>{return rowData.customer?.phone}}
            // sortable
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="points"
            header="Points"
            // sortable
            filter
            filterPlaceholder="Search"
            showFilterMenu={false}
            headerStyle={{ minWidth: '12rem' }}
          />
        </DataTable>
      </div>
    </>
  );
};
