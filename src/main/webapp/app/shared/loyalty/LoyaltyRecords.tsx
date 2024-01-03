import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getLoyaltyRecords } from 'app/shared/loyalty/loyalty-records.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState } from 'react-jhipster';
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export const LoyaltyRecords = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const records = useAppSelector(state => state.loyalty.entities);
  const loading = useAppSelector(state => state.loyalty.loading);
  const totalItems = useAppSelector(state => state.loyalty.totalItems);
  const errorMessage = useAppSelector(state => state.loyalty.errorMessage);

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const getAllLoyaltyRecords = () => {
    if (search) {
      dispatch(
        getLoyaltyRecords({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getLoyaltyRecords({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };

  const sortLoyaltyRecords = () => {
    getAllLoyaltyRecords();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortLoyaltyRecords();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const nameBodyTemplate = (rowData: any) => {
    return (
      <>
        <span className="p-column-title">Name</span>
        <span className="font-medium text-lg mb-1 font-bold" key={rowData.id}>
          {rowData.customer.firstName + ' ' + rowData.customer.lastName}{' '}
        </span>
      </>
    );
  };
  const pointsBodyTemplate = (rowData: any) => {
    return (
      <>
        <span className="p-column-title">Points</span>
        <span className="font-medium text-lg mb-1 font-bold" key={rowData.id}>
          {rowData.points}{' '}
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
    return { customerName: record.customer.firstName + ' ' + record.customer.lastName, ...record };
  });

  console.log(mappedRecords);

  return (
    <>
      <div className="col-12">
        <DataTable
          value={mappedRecords}
          header={header}
          paginator
          rows={5}
          removableSort
          totalRecords={totalItems}
          filterDisplay="row"
          className="datatable-responsive"
          emptyMessage="No Customers found."
          loading={loading}
        >
          <Column
            field="customerName"
            header="Name"
            sortable
            filter
            filterPlaceholder="Search by name"
            body={nameBodyTemplate}
            headerStyle={{ minWidth: '12rem' }}
          />
          <Column
            field="points"
            header="Points"
            sortable
            filter
            filterPlaceholder="Search by points"
            body={pointsBodyTemplate}
            headerStyle={{ minWidth: '10rem' }}
          />
          {/* <Column field="currentPrice" header="Price" body={priceBodyTemplate} sortable headerStyle={{ minWidth: '10rem' }} />
            <Column field="inventoryStatus" header="Status" body={statusBodyTemplate} sortable headerStyle={{ minWidth: '10rem' }} /> */}
        </DataTable>
      </div>
    </>
  );
};
