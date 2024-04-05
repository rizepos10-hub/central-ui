import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {  getEntities } from './accounting-group.reducer';

import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";

export const AccountingGroup = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const accountingGroupsList = useAppSelector(state => state.accountingGroup.entities);
  const loading = useAppSelector(state => state.accountingGroup.loading);
  const totalItems = useAppSelector(state => state.accountingGroup.totalItems);

  const [filters, setFilters] :any = useState({
    accountingId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    profiles: { value: null, matchMode: FilterMatchMode.STARTS_WITH },

  });

  const handleCreate = () => {
    navigate('/accounting-groups/new')
  };


  const getAccountingGroups = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  };


  useEffect(() => {
    getAccountingGroups()
  }, []);



  const nameColumnTemplate = (rowData) => {
    const editUrl = `/accounting-groups/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const handleNameFilterChange = (e) => {
    const filterValue = e.target.value;
    if (filterValue === '') {
      setFilters({
        ...filters,
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      });
    } else {
      setFilters({
        ...filters,
        name: { value: filterValue, matchMode: FilterMatchMode.CONTAINS },
      });
    }
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/accounting-groups/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };



  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Accounting Groups</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={getAccountingGroups} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create New Accounting Group" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (
    <div>

        <DataTable  loading={loading} value={accountingGroupsList} editMode="row" header={header}  paginator filters={filters} filterDisplay="row" totalRecords={totalItems} rows={20}>
          <Column
            field="name" header="Name" filter
            body={nameColumnTemplate}
            filterElement={ <InputText  placeholder="Search by Name" onChange={handleNameFilterChange}/> }
            filterField="name"  sortable
          />
          <Column field="accountingId" header="Accounting Id" filter filterPlaceholder="Search by accounting id"  sortable   />

          <Column field="profiles" header="Profiles" body={(rowData) => rowData.profiles.map((profile) => profile.name).join(' | ')}   sortable   />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          {/* <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }} */}
          {/*          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} /> */}
        </DataTable>
    </div>
  );
};

export default AccountingGroup;
