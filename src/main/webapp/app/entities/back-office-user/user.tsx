import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IUser } from 'app/shared/model/user.model';
import { searchEntities, getEntities } from './user.reducer';
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

  const userList = useAppSelector(state => state.user.entities);
  const loading = useAppSelector(state => state.user.loading);
  const totalItems = useAppSelector(state => state.user.totalItems);

  const [filters, setFilters] = useState({
    firstname: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lastname: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    username: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const modifiedUserList = userList.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`
  }));

  const getUsers = () => {
    dispatch(getEntities({}));
  };


  useEffect(() => {
    getUsers()
  }, []);

  const nameColumnTemplate = (rowData) => {
    const editUrl = `/back-office-user/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
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
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
      });
    } else {
      setFilters({
        ...filters,
        name: { value: filterValue, matchMode: FilterMatchMode.CONTAINS },
      });
    }
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/back-office-user/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  // const deleteColumnTemplate = (rowData) => {
  //   const deleteUrl = `/back-office-user/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
  //   return (
  //     <Link to={deleteUrl}>
  //       <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
  //     </Link>
  //   );
  // };

  const handleCreate = () => {
    navigate('/back-office-user/new')
  }

  const activeColumnTemplate = rowData => {
    return rowData.enabled ? <p className="text-success ml-2  ">&#10004;</p> :
      <p className="text-danger ml-2 ">&#10006;</p>
  };

  const Header = () => (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.backOfficeUsers'} /></span>
      <div className="ms-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={getUsers}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.createNewUser")} raised onClick={handleCreate}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div>
        <Header />
      </div>
      <DataTable value={modifiedUserList} editMode="row" paginator showGridlines
        globalFilterFields={['firstName', 'lastName']} loading={loading} className="datatable-responsive"
        filters={filters} filterDisplay="row" totalRecords={totalItems} rows={20}>
        <Column
          field="name" header={translate("common.name")} filter
          filterElement={<InputText placeholder={translate("common.search.name")} onChange={handleNameFilterChange} />}
          filterField="name" body={nameColumnTemplate} sortable
        />

        <Column field="username" header={translate("tempApp.username")} filter filterPlaceholder={translate("tempApp.searchUsername")} sortable />

        <Column field="email" header={translate("common.email")} filter filterPlaceholder={translate("common.search.email")} sortable />

        <Column header={translate("common.enabled")} body={activeColumnTemplate} style={{ width: '10%' }} />
        <Column header={translate("common.edit")} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        {/* <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }} */}
        {/*          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} /> */}
      </DataTable>
    </div>
  );
};

export default User;
