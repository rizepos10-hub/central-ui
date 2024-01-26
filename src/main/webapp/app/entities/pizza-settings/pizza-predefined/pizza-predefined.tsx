import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntities, reset as resetPredefined} from './pizza-predefined.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {IPredefinedPizza} from "app/shared/model/predefined-pizza.model";

export const PredefinedPizza = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const predefinedPizzaList :IPredefinedPizza[] = useAppSelector(state => state.predefinedPizza.entities);
  const loading = useAppSelector(state => state.predefinedPizza.loading);
  const totalItems = useAppSelector(state => state.predefinedPizza.totalItems);
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
      return () => {
        dispatch(resetPredefined())
      }
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);





  const handleSyncList = () => {
    getAllEntities();
  };





  const nameColumnTemplate = rowData => {
    const editUrl = `/predefined-pizza/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/predefined-pizza/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/predefined-pizza/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/predefined-pizza/new')
  }
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Predefined Pizza</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Add New Predefined Pizza" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  return (
    <div>
      <h2 >
        Predefined Pizza View
      </h2>

      <div >
        <DataTable value={predefinedPizzaList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={totalItems}
                   rows={20}>
          <Column field="name" header="Name" filter body={nameColumnTemplate} filterPlaceholder={"Search by name"}  sortable  />

          <Column field="toppings" header="Toppings" filter body={(rowData)=> rowData?.toppings?.map(topping => topping?.name).join(" | ")}   sortable  />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
    </div>
  );
};

export default PredefinedPizza;
