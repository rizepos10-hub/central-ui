import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button as PrimeButton } from "primereact/button"
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './pricing-point.reducer';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { FilterMatchMode } from 'primereact/api';
import _ from 'lodash';
import { InputText } from 'primereact/inputtext';
import { IPricingPoint } from 'app/shared/model/PRICING-POINT/pricing-point';

export const PricingPoint = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);
  const loading = useAppSelector(state => state.pricingPoint.loading);
  const totalItems = useAppSelector(state => state.pricingPoint.totalItems);

  const [localNameFilter, setLocalNameFilter] = useState("");

  const query = JSON.parse(searchParams.get("query")) || {
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {
      "categories.id": { value: null, matchMode: FilterMatchMode.EQUALS },
      "attributes": { value: null, matchMode: FilterMatchMode.EQUALS },
      name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  };


  const getAllEntities = () => {
    dispatch(
      getEntities({
        sort: 'key,asc',
        page: 0,
        size: 500,
        key: searchParams.get('key'),
        whenToApply: searchParams.get('whenToApply'),
        branchId: searchParams.get('branch'),
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [
    paginationState.activePage,
    paginationState.order,
    paginationState.sort,
    searchParams.get('key'),
    searchParams.get('whenToApply'),
    searchParams.get('branch'),
  ]);

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

  useEffect(() => {
    dispatch(getBranches({}));
  }, [])

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

  const onFilter = (event: DataTableFilterEvent) => {
    debouncedFilter(event);
  };

  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const nameFilterTemplate = () => {
    return (
      <InputText
        type="text"
        value={localNameFilter}
        onChange={(e) => {
          setLocalNameFilter(e.target.value);
          const newQuery = {
            ...query,
            filters: {
              ...query.filters,
              name: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
            }
          };
          debouncedFilter(newQuery);
        }}
        className="p-inputtext-sm"
        placeholder="Search by Name"
      />
    );
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/pricing-point/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/pricing-point/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pricing-point/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/pricing-point/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Pricing Points</span>
      <div className="ms-auto">
        <PrimeButton label="Refresh List" severity="secondary" raised className="me-5" color="info" disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </PrimeButton>
        <PrimeButton label="Create new Pricing Point" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </PrimeButton>
      </div>
    </div>
  );

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={pricingPoints}
          loading={loading}
          header={header}
          filters={query.filters}
          filterDisplay="row"
          totalRecords={totalItems}
          onFilter={onFilter}
          showGridlines
          paginator
          rows={5}
          rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        >
          <Column
            field="name"
            header="Name"
            filter
            filterField="name"
            filterElement={nameFilterTemplate}
            body={nameColumnTemplate}
            filterPlaceholder="Name"
          />

          <Column
            header="Edit"
            body={editColumnTemplate}
            headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
            bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
          />

          <Column
            header="Delete"
            body={deleteColumnTemplate}
            headerStyle={{ width: '1%', }}
            bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
          />
        </DataTable>
      </div>
    </>
  );
};

export default PricingPoint;
