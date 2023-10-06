import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {  getEntities } from './printing-profile.reducer';
import { getEntities  as getBranches} from '../../../branch/branch.reducer';

import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Button} from "primereact/button";
import {FilterMatchMode} from "primereact/api";
import {InputText} from "primereact/inputtext";
import printingProfiles from "app/entities/settings/printing/printing-profiles/printing-profile.reducer";
import {Dropdown} from "primereact/dropdown";

export const PrintingProfiles = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const printingProfilesList = useAppSelector(state => state.printingProfiles.entities);
  const loading = useAppSelector(state => state.printingProfiles.loading);
  const totalItems = useAppSelector(state => state.printingProfiles.totalItems);
  const branchList = useAppSelector(state => state.branch.entities);


  console.log(printingProfiles, 'lol')






  const handleCreate = () => {
  navigate('/printing-profiles/new')
  };

  const filteredBranchOptions = branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }));






  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    "branch.name": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    printers: { value: null, matchMode: FilterMatchMode.STARTS_WITH },

  });






  const getPrintingProfiles = () => {
  dispatch(getEntities({}))
    dispatch(getBranches({}))

  };


  useEffect(() => {
    getPrintingProfiles()

  }, []);






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
    const editUrl = `/printing-profiles/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };




  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Printing Profiles</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={getPrintingProfiles} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create New Printing Profile" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (
    <div>
      <h2 >
        Printing Profiles View

      </h2>

      <div >
        <DataTable value={printingProfilesList} editMode="row" header={header}  paginator filters={filters} filterDisplay="row" totalRecords={totalItems} rows={5}>
          <Column
            field="name" header="Name" filter
            filterElement={ <InputText  placeholder="Search by Name" onChange={handleNameFilterChange}/> }
            filterField="name"  sortable
          />


          <Column field="branch" body={(rowData) => rowData?.branch?.name} header="Branch" filter   sortable filterElement={
            <Dropdown
              value={filters["branch.name"]?.value || ''}
              options={filteredBranchOptions}
              onChange={(e) => {
                setFilters((prevState) => ({
                  ...prevState,
                  ["branch.id"]: {value: e.value, matchMode: FilterMatchMode.CONTAINS},
                }))
              }}
              placeholder="Select a branch" />
          }
            />

          <Column field="printers" header="Printers" body={(rowData) => rowData?.printers?.map((printer) => printer.name).join(' | ')}    />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

        </DataTable>
      </div>
    </div>
  );
};

export default PrintingProfiles;
