import React, { useState, useEffect, ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities, searchEntities, updateEntity } from "./till.reducer";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {ITv} from "app/shared/model/TV/tv.model";
import { ITill } from "app/shared/model/till.model";
import { InputNumber } from "primereact/inputnumber";
import { convertDateTimeFromServer, convertDateTimeToServer, toLocalISOString } from "app/shared/util/date-utils";
import { Calendar } from "primereact/calendar";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";

export const Till = ({registryId}: {registryId: string}) => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const tillsList :ITill[] = useAppSelector(state => state.till.entities);
  const loading = useAppSelector(state => state.till.loading);
  const updating = useAppSelector(state => state.till.updating);
  const updateSuccess = useAppSelector(state => state.till.updateSuccess);
  const totalItems = useAppSelector(state => state.till.totalItems);

  console.log(tillsList, 'tillsList')

  const [lazyState, setLazyState] = useState({
      first: 0,
      rows: 20,
      page: 0,
      sortField: null,
      sortOrder: null,
      query: '',
      filters: {
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        "registry.id": { value: registryId, matchMode: FilterMatchMode.EQUALS },
        startDate: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        endDate: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      }
  });


  const getAllEntities = () => {
    const modifiedFilters = applyMatchModeMap(lazyState);
    dispatch(searchEntities(modifiedFilters));
  };


  useEffect(() => {
    getAllEntities();
  }, [updateSuccess, lazyState]);



  const onPage = (event) => {
    setLazyState(event);
  };

  const onSort = (event) => {
    setLazyState(event);
  };

  const onRowEditComplete = (e) => {
     const entity = e.newData as ITill;
     dispatch(updateEntity(entity));
  };

  const handleFilterDateChange = (e, field: "startDate" | "endDate") => {
    setLazyState(prevState => ({
      ...prevState,
      filters: {
        ...lazyState.filters,
        [field]: { value: toLocalISOString(e.value), matchMode: FilterMatchMode.STARTS_WITH },
      },
    }));
  }

  console.log(lazyState, 'lazyStatelazyState')

  const InputNumberEditor = (options) => {
    return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} />;
  };

  const allowEdit = (rowData: ITill) => {
    return rowData.status === "OPENED";
  };


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Tills</span>
    </div>
  );




  return (
    <div>

      <DataTable
         value={tillsList} header={header} loading={loading || updating}
         editMode="row"  removableSort  filters={lazyState.filters} filterDisplay="row"
         paginator totalRecords={totalItems} rows={20} lazy  first={lazyState.first}

         onSort={onSort}  onPage={onPage}
         sortField={lazyState.sortField} sortOrder={lazyState.sortOrder} showGridlines
        >
        <Column field="openAmount" header="Open Amount" editor={(options) => InputNumberEditor(options)} />
        <Column field="status" header="Status" />
        <Column
          field="startDate"
          filter
          filterElement={<Calendar  value={lazyState?.filters?.startDate?.value} onChange={(e) => handleFilterDateChange(e, 'startDate')}  />}
          body={(rowData) => convertDateTimeFromServer(rowData?.startDate)}
          header="Start Date"
        />
        <Column field="endDate" header="End Date" />
        <Column rowEditor={allowEdit} headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
      </DataTable>
      </div>
  );
};

export default Till;
