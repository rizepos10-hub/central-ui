import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities } from './supplier.reducer';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    address: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phoneNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

export const Supplier = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const supplierList = useAppSelector(state => state.supplier.entities);
  const loading = useAppSelector(state => state.supplier.loading);
  const totalItems = useAppSelector(state => state.supplier.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/inventory/supplier/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/inventory/supplier/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/supplier/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/inventory/supplier/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.supplier.title'}>Suppliers</Translate></span>
      <div className="ms-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.supplier.createNew")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  const onSort = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onFilter = event => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onPage = event => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  return (
    <div >
      <DataTable
        value={supplierList}
        editMode="row"
        header={header}
        removableSort
        filters={query.filters}
        filterDisplay="row"
        paginator
        totalRecords={totalItems}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        rows={query?.rows}
        lazy
        first={query.first}
        onPage={onPage}
        onFilter={onFilter}
        filterDelay={500}
        loading={loading}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        showGridlines
      >
        <Column field="name" header={translate('common.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('common.search.name')} sortable />
        <Column field="address" header={translate('common.address')}
          filter filterPlaceholder={translate('common.search.address')} sortable />

        <Column field="email" header={translate('common.email')}
          filter filterPlaceholder={translate('common.search.email')} sortable />

        <Column field="phoneNumber" header={translate('common.phone')}
          filter filterPlaceholder={translate('common.search.phone')} sortable />

        <Column header={translate('common.edit')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('common.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


      </DataTable>
    </div>
  );
};

export default Supplier;
