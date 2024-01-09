import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getLoyaltyRecords } from 'app/shared/loyalty/loyalty-records.reducer';
import { searchCustomers } from 'app/shared/loyalty/loyalty-customers-reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {getEntities} from "app/entities/customer/customer.reducer";
import {layouts} from "chart.js";



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
      points: {value: '', matchMode: 'STARTS_WITH'}
    },
  });

  const handleOnFilter = (e) => {
    setLazyState(prev => {
      return {
        ...prev,
        first: 0,
        filters: {
          'customer.id': e.filters['customer.id'],
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



  useEffect(() => {
    const filters: any = {};

    if (lazyState.filters.points.value){
      filters['points'] = {value: +(lazyState.filters.points.value), matchMode: 'EQUALS'};
    }
    if (lazyState.filters['customer.id'].value) {
      const searchKey = lazyState.filters['customer.id'].value;

      dispatch(searchCustomers({
        first: 0,
          rows: ROWS_PER_PAGE,
          page: 0,
          sortField: null,
          sortOrder: null,
          filters: {
            email: {value: searchKey, matchMode: "CONTAINS"}
          },
      }))
        .then((res:any) => {
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

  const nameBodyTemplate = (rowData: any) => {
    return (
      <>
        <span className="p-column-title">Name</span>
        <span key={rowData.id}>
          {rowData.customerName}
        </span>
      </>
    );
  };
  const pointsBodyTemplate = (rowData: any) => {
    return (
      <>
        <span className="p-column-title">Points</span>
        <span key={rowData.id}>
          {rowData.points}
        </span>
      </>
    );
  };
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Loyalty Records</span>
    </div>
  );
  const mappedRecords = records.map(record => {
    return { customerName: record?.customer? record.customer.firstName  + ' ' + record.customer.lastName : '', ...record };
  });

  return (
    <>
      <div className="col-12">
        <DataTable
          lazy
          value={mappedRecords}
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
            field="customer.id"
            header="Email"
            // sortable
            filter
            filterPlaceholder="Search by email"
            body={(rowData)=>{return rowData.customer?.id}}
            headerStyle={{ minWidth: '12rem' }}
            filterMatchMode={'contains'}
          />
          <Column
            field="customerName"
            header="Name"
            // sortable
            body={nameBodyTemplate}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="customer.phone"
            header="Phone Number"
            // sortable
            body={(rowData)=>{return rowData.customer?.phone}}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="points"
            header="Points"
            // sortable
            filter
            filterPlaceholder="Search by points"
            body={pointsBodyTemplate}
            headerStyle={{ minWidth: '10rem' }}
            filterMatchMode={"startsWith"}
          />
        </DataTable>
      </div>
    </>
  );
};
