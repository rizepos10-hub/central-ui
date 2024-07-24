import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, translate } from "react-jhipster";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  filterEntities } from './branch-registry.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import { IBranchRegistry } from "app/shared/model/branch-registry.model";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { Dropdown } from "primereact/dropdown";
import { getEntities as getBranches} from "app/entities/branch/branch.reducer";


const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "branch.id": { value: null, matchMode: FilterMatchMode.EQUALS },
  }
};



export const BranchRegistry = ({isRegisterClosure} : { isRegisterClosure?: boolean}) => {
  const dispatch = useAppDispatch();
  const branchList = useAppSelector(state => state.branch.entities);
  const branchRegistryList :IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const loading = useAppSelector(state => state.branchRegistry.loading);
  const totalItems = useAppSelector(state => state.branchRegistry.totalItems);

  const [searchParam, setSearchParams]=  useSearchParams();
  const query = JSON.parse(searchParam.get("query")) || initialState;



  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  const handleSyncList = () => {
    getAllEntities();
  };

  useEffect(() => {
    dispatch(getBranches({
      page: 0,
      size: 300,
      sort: 'asc'
    }))
  }, []);


  useEffect(() => {
    getAllEntities();
  }, [searchParam]);





  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };


  const onFilter  = (event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true});
  }



  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const handleBranchChange = (e) => {
    const queryParams = JSON.stringify({
      ...query,
      page: 0,
      first: 0,
      filters: {
        ...query.filters,
        ["branch.id"] : { value: e.value, matchMode: FilterMatchMode.EQUALS }
      }
    })
    setSearchParams({query: queryParams}, {replace: true})
  }


  const branchFilterElement = () => (
    <Dropdown
      value={query.filters?.["branch.id"]?.value || ''}
      options={branchList}
      showClear
      optionLabel={"name"}
      optionValue={"id"}
      onChange={handleBranchChange}
      placeholder={"Filter by Branch"}
    />
  )




  const nameColumnTemplate = (rowData) => {
    const editUrl = isRegisterClosure ?  `/analytics/register-closure/${rowData.id}/edit` :  `/branch-registry/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData: IBranchRegistry) => {
    const editUrl = isRegisterClosure ?  `/analytics/register-closure/${rowData.id}/edit` :  `/branch-registry/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };




  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Branch Register</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
      </div>
    </div>
  );




  return (
    <div>
      <DataTable
        value={branchRegistryList} editMode="row" header={header} removableSort  filters={query.filters} filterDisplay="row"
        paginator totalRecords={totalItems} rows={20} lazy  first={query.first}  onPage={onPage} onFilter={onFilter}
        filterDelay={500} loading={loading}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder} showGridlines
      >
          <Column field="name" header="Name" body={nameColumnTemplate} filter  filterPlaceholder={"Search by name"}  sortable  />
        <Column field="branch" showFilterMenu={false}  filter filterElement={branchFilterElement} header="Branch"  body={(rowData) => rowData?.branch?.name}   sortable  />
        <Column field="code" header="Code" sortable  />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

        </DataTable>
      </div>
  );
};

export default BranchRegistry ;
