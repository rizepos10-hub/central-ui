import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  getEntities } from './till.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {ITv} from "app/shared/model/TV/tv.model";
import { ITill } from "app/shared/model/till.model";
import { InputNumber } from "primereact/inputnumber";

export const Till = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const tillsList :ITill[] = useAppSelector(state => state.till.entities);
  const loading = useAppSelector(state => state.till.loading);
  const totalItems = useAppSelector(state => state.till.totalItems);

  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);



  const onRowEditComplete = (e) => {
   console.log(e);
  };


  const InputNumberEditor = (options) => {
    return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} />;
  };

  const allowEdit = (rowData: ITill) => {
    return rowData.status !== "OPENED";
  };


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Tills</span>
    </div>
  );




  return (
    <div>

      <DataTable
        value={tillsList} header={header} editMode="row" dataKey="id"
        onRowEditComplete={onRowEditComplete} tableStyle={{ minWidth: '50rem' }}
        paginator filters={filters} filterDisplay="row" totalRecords={totalItems}
        >
        <Column field="amount" header="Amount" editor={(options) => InputNumberEditor(options)} />
        <Column field="status" header="Status" />
        <Column field="startDate" header="Start Date" />
        <Column field="endDate" header="End Date" />
        <Column rowEditor={allowEdit} headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
      </DataTable>
      </div>
  );
};

export default Till;
