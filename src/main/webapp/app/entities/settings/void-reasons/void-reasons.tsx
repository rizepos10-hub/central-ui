import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from './void-reasons.reducer';

 import { IVoidReasons } from 'app/shared/model/void-reasons.model';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";

export const VoidReasons = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const voidReasonsList = useAppSelector(state => state.voidReasons.entities);
  const loading = useAppSelector(state => state.voidReasons.loading);
  const totalItems = useAppSelector(state => state.voidReasons.totalItems);


  console.log(voidReasonsList, 'lol')






  const handleCreate = () => {
    navigate('/void-reasons/new')
  };







  const [filters, setFilters] :any = useState({
    reason: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    profiles: { value: null, matchMode: FilterMatchMode.STARTS_WITH },

  });






  const getVoidReasons = () => {
  dispatch(getEntities({}))
  };


  useEffect(() => {
    getVoidReasons()
  }, []);






  const codeColumnTemplate = (rowData) => {
    const editUrl = `/void-reasons/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.code}
      </Link>
    );
  };

  const handleCodeFilterChange = (e) => {
    const filterValue = e.target.value;
    if (filterValue === '') {
      setFilters({
        ...filters,
        code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      });
    } else {
      setFilters({
        ...filters,
        code: { value: filterValue, matchMode: FilterMatchMode.CONTAINS },
      });
    }
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/void-reasons/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };






  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Void Reasons</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={getVoidReasons} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create new Void Reason" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (
    <div>
      <h2 >
        Void Reasons View

      </h2>

      <div >
        <DataTable value={voidReasonsList} editMode="row" header={header}  paginator filters={filters} filterDisplay="row" totalRecords={totalItems} rows={20}>
          <Column
            field="code" header="Code" filter
            body={codeColumnTemplate}
            filterElement={ <InputText  placeholder="Search by Code" onChange={handleCodeFilterChange}/> }
            filterField="code"  sortable
          />
          <Column field="reason" header="Reason" filter filterPlaceholder="Search by Reason"  sortable   />




          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

        </DataTable>
      </div>
    </div>
  );
};

export default VoidReasons;
