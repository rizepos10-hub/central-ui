import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {Button as PrimeButton } from 'primereact/button';
import {Button} from "reactstrap";
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntities, reset} from './mix-and-match-rule.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";

export const MixAndMatchRule = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const mixAndMatchRulesList = useAppSelector(state => state.mixAndMatchRule.entities);
  const loading = useAppSelector(state => state.mixAndMatchRule.loading);
  const totalItems = useAppSelector(state => state.mixAndMatchRule.totalItems);
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const getAllEntities = () => {

      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
  };




  useEffect(() => {
    getAllEntities();
    return () => {
      dispatch(reset())
    }
  }, [paginationState.activePage, paginationState.order, paginationState.sort ]);



  const handleSyncList = () => {
    getAllEntities();
  };





  const nameColumnTemplate = rowData => {
    const editUrl = `/mix-and-match-rule/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/mix-and-match-rule/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/mix-and-match-rule/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate(`/mix-and-match-rule/new`)
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Mix & Match Rules</span>
      <div className="ms-auto">
        <PrimeButton label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </PrimeButton>
        <PrimeButton label="Add New Mix And Match Rule" className={"me-5"} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </PrimeButton>
      </div>
    </div>
  );




  return (
    <div>

        <DataTable
          value={mixAndMatchRulesList}
          editMode="row"
          header={header}
          removableSort
          reorderableRows
          filters={filters}
          filterDisplay="row"
          paginator
          totalRecords={totalItems}
          rows={20}
        >
          <Column field="name"  header="Name" filter body={nameColumnTemplate} filterPlaceholder={"Search by name"}  sortable  />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
  );
};

export default MixAndMatchRule;
