import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IUser } from 'app/shared/model/user.model';
import { searchEntities, getEntities } from './user.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";

export const User = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const userList :IUser[] = useAppSelector(state => state.onlineOrderingUser.entities);
  const loading = useAppSelector(state => state.onlineOrderingUser.loading);
  const totalItems = useAppSelector(state => state.onlineOrderingUser.totalItems);



  const [filters, setFilters] = useState({
    firstName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    lastName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    username: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const modifiedUserList = userList.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`
  }));


  console.log(userList,'userList')





  const getUsers = () => {
    dispatch(getEntities({}));
  };


  useEffect(() => {
    getUsers();
  }, []);


  const nameColumnTemplate = (rowData) => {
    const editUrl = `/back-office-user/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return  rowData.name
    // (
    //   <Link to={editUrl}>
    //
    //   </Link>
    // );
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
    const editUrl = `/back-office-user/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };


  const handleCreate = () => {
    navigate('/back-office-user/new')
  }

  const activeColumnTemplate = rowData => {
    return rowData.verified ?<p className="text-success ml-2  ">&#10004;</p>:
      <p className="text-danger ml-2 ">&#10006;</p>
  };


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'onlineOrderingUser.user.table.title'}/></span>
      <div className="ms-auto">
        <Button label={translate("onlineOrderingUser.user.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={getUsers} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        {/* <Button label={translate("onlineOrderingUser.user.buttons.createNewUser")} raised onClick={handleCreate} disabled={loading}> */}
        {/*   &nbsp; */}
        {/* </Button> */}
      </div>
    </div>
  );
  return (

      <div >
        <DataTable value={modifiedUserList} editMode="row" header={header}  paginator showGridlines
                   globalFilterFields={['firstName', 'lastName' ]} loading={loading} className="datatable-responsive"
                   filters={filters} filterDisplay="row" totalRecords={totalItems} rows={20}>
          <Column
            field="name" header={translate("onlineOrderingUser.user.table.fields.name")} filter
            filterElement={ <InputText  placeholder={translate("onlineOrderingUser.user.table.search.name")} onChange={handleNameFilterChange}/> }
            filterField="name" body={nameColumnTemplate} sortable
          />

          <Column field="login" header={translate("onlineOrderingUser.user.table.fields.username")} filter filterPlaceholder={translate("onlineOrderingUser.user.table.search.username")}  sortable   />

          <Column field="email" header={translate("onlineOrderingUser.user.table.fields.email")} filter filterPlaceholder={translate("onlineOrderingUser.user.table.search.email")}  sortable   />

          <Column header={translate("onlineOrderingUser.user.table.fields.enabled")} body={activeColumnTemplate} style={{width: '10%'}}   />
          {/* <Column header={translate("onlineOrderingUser.user.table.fields.edit")}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}} */}
          {/*         bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} /> */}




        </DataTable>
    </div>
  );
};

export default User;
