import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSortState, Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IUser } from 'app/shared/model/user.model';
import { getEntities } from './user.reducer';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

export const User = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const userList: IUser[] = useAppSelector(state => state.onlineOrderingUser.entities);
  const loading = useAppSelector(state => state.onlineOrderingUser.loading);
  const totalItems = useAppSelector(state => state.onlineOrderingUser.totalItems);

  const [filters, setFilters] = useState({
    firstName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    lastName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    login: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const modifiedUserList = userList.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`
  }));

  const getUsers = () => {
    dispatch(getEntities({
      page: 0,
      size: 1000,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  };

  useEffect(() => {
    getUsers();
  }, []);

  const nameColumnTemplate = rowData => rowData.name;

  const handleNameFilterChange = e => {
    const filterValue = e.target.value;
    setFilters({
      ...filters,
      name: { value: filterValue || null, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  const activeColumnTemplate = rowData => (
    rowData.verified ? <p className="text-success ml-2">&#10004;</p> :
      <p className="text-danger ml-2">&#10006;</p>
  );

  const onPageChange = (event) => {
    setPaginationState({
      ...paginationState,
      activePage: event.page + 1,
      itemsPerPage: event.rows, 
    });
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">
        <Translate contentKey={'onlineOrderingUser.user.table.title'} />
      </span>
      <div className="ms-auto">
        <Button label={translate("onlineOrderingUser.user.buttons.refreshList")} className="me-5" onClick={getUsers} disabled={loading}>
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <DataTable
        value={modifiedUserList}
        editMode="row"
        header={header}
        paginator
        rows={10}
        totalRecords={totalItems} // Set the total records count here
        loading={loading}
        className="datatable-responsive"
        filters={filters}
        filterDisplay="row"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
      >
        <Column
          field="name"
          header={translate("onlineOrderingUser.user.table.fields.name")}
          filter
          filterElement={<InputText placeholder={translate("onlineOrderingUser.user.table.search.name")} onChange={handleNameFilterChange} />}
          filterField="name"
          body={nameColumnTemplate}
          sortable
        />
        <Column field="login" header={translate("onlineOrderingUser.user.table.fields.username")} filter sortable />
        <Column field="email" header={translate("onlineOrderingUser.user.table.fields.email")} filter sortable />
        <Column header={translate("onlineOrderingUser.user.table.fields.enabled")} body={activeColumnTemplate} style={{ width: '10%' }} />
      </DataTable>
    </div>
  );
};

export default User;