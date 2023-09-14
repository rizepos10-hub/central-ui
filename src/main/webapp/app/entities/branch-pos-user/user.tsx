import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";

import { IUser } from 'app/shared/model/user.model';
import { searchEntities, getEntities } from './user.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";
import PosBranchUser from "app/entities/branch-pos-user/user.reducer";
import {Dropdown} from "primereact/dropdown";

export const User = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const userList = useAppSelector(state => state.PosBranchUser.entities);
  const loading = useAppSelector(state => state.PosBranchUser.loading);
  const totalItems = useAppSelector(state => state.PosBranchUser.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);


  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    branchId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },

  });

    console.log(userList, 'listo')

  const modifiedUserList = userList.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName !== null ? user.lastName : ''}`
  }));

    console.log(branchList, 'branchList')
  const getBranchName = (branchId) => {
    console.log(branchId, 'branchID')
    const branch = branchList.find(branch => branch.id === branchId);
    console.log(branch, 'branch')

    return branch ? branch.name : 'Unknown Branch';
  };

  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));

  console.log(userList,'userList')





  const getUsers = () => {
    dispatch(getEntities({}));
    dispatch(getBranches({}))
  };


  useEffect(() => {
    getUsers()
  }, []);






  const nameColumnTemplate = (rowData) => {
    const editUrl = `/branch-pos-user/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
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
    const editUrl = `/branch-pos-user/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/user/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/branch-pos-user/new')
  }

  const activeColumnTemplate = rowData => {
    return rowData.activated ?<p className="text-success ml-2  ">&#10004;</p>:
      <p className="text-danger ml-2 ">&#10006;</p>
  };


  console.log(userList, 'userList')
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Users</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={getUsers} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create new User" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (
    <div>
      <h2 >
    Users View

      </h2>

      <div >
        <DataTable value={modifiedUserList} editMode="row" header={header}  paginator
                   globalFilterFields={['firstName', 'lastName' ]} loading={loading}
                   filters={filters} filterDisplay="row" totalRecords={totalItems} rows={5}>
          <Column
            field="name" header="Name" filter
            filterElement={ <InputText  placeholder="Search by name" onChange={handleNameFilterChange}/> }
            filterField="name" body={nameColumnTemplate} sortable
          />


          <Column field="email" header="Email" filter filterPlaceholder="Search by email"  sortable   />

          <Column
            field="branchId"
            sortable
            filter
            header="Branch"
            body={(data) => getBranchName(data.branchId)}
            filterElement = {
              <Dropdown
                value={filters.branchId?.value || ''}
                options={filteredBranchOptions}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    branchId: { value: e.target.value,  matchMode: FilterMatchMode.CONTAINS  },
                  })
                }
                placeholder="Select a branch"
              />
            }
            />

          <Column field="authorities" header="Authorities" body={(rowData) => rowData.authorities.join('|')}  sortable   />


          <Column header="Activated" body={activeColumnTemplate} style={{width: '10%'}}   />
          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          {/* <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }} */}
          {/*          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} /> */}


        </DataTable>
      </div>
    </div>
  );
};

export default User;
