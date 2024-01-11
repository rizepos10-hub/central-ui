import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {  getEntities as getPizzaCrustThicknesses} from './pizza-crust-thickness.reducer';
import {  getEntities as getPizzaCrustTypes} from './pizza-crust-type.reducer';

import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import pizzaCrustType from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer";

export const PizzaCrust = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const crustThicknessList = useAppSelector(state => state.pizzaCrustThickness.entities);
  const crustThicknessLoading = useAppSelector(state => state.pizzaCrustThickness.loading);
  const crustThicknessTotalItems = useAppSelector(state => state.pizzaCrustThickness.totalItems);
  const crustTypeList = useAppSelector(state => state.pizzaCrustType.entities);
  const crustTypeLoading = useAppSelector(state => state.pizzaCrustType.loading);
  const crustTypeTotalItems = useAppSelector(state => state.pizzaCrustType.totalItems);



  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const getAllEntities = () => {

    dispatch(
      getPizzaCrustThicknesses({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getPizzaCrustTypes({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };




  useEffect(() => {
    getAllEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);





  const handleSyncList = () => {
    getAllEntities();
  };


  const crustTypeNameTemplate = rowData => {
    const editUrl = `/pizza-crust-type/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const crustTypeEditColumnTemplate = (rowData) => {
    const editUrl = `/pizza-crust-type/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const crustTypeDeleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pizza-crust-type/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCrustTypeCreate = () => {
    navigate('/pizza-crust-type/new')
  }
  const crustTypeHeader = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Crust Types</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={crustTypeLoading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={crustTypeLoading} />{' '}
        </Button>
        <Button label="Add New Crust Type" raised onClick={handleCrustTypeCreate} disabled={crustTypeLoading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  const thicknessNameColumnTemplate = rowData => {
    const editUrl = `/pizza-crust-thickness/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const thicknessEditColumnTemplate = (rowData) => {
    const editUrl = `/pizza-crust-thickness/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const thicknessDeleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pizza-crust-thickness/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleThicknessCreate = () => {
    navigate('/pizza-crust-thickness/new')
  }
  const thicknessHeader = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Crust Thickness</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={crustThicknessLoading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={crustThicknessLoading} />{' '}
        </Button>
        <Button label="Add New Crust Thickness" raised onClick={handleThicknessCreate} disabled={crustThicknessLoading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );



  return (
    <div>
      <h2 >
        Pizza Crust View
      </h2>

      <div className={"card"} >
      <DataTable  value={crustThicknessList} editMode="row" header={thicknessHeader} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={crustThicknessTotalItems} rows={5}>
          <Column field="name" header="Name" filter body={thicknessNameColumnTemplate} filterPlaceholder={"Search by name"}  sortable  />

          <Column field="hiddenOnSizes" header="Hidden On Sizes"  body={(rowData) => rowData?.hiddenOnSizes?.map(size => size.name).join(" | ")}  sortable  />

          <Column header="Edit"  body={thicknessEditColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={thicknessDeleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />
        </DataTable>
      </div>
      <div className={"card mt-3"} >
        <DataTable  value={crustTypeList} editMode="row" header={crustTypeHeader} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={crustTypeTotalItems} rows={5}>
          <Column field="name" header="Name" filter body={crustTypeNameTemplate} filterPlaceholder={"Search by name"}  sortable  />
          <Column field="hiddenOnSizes" header="Hidden On Sizes" body={(rowData) => rowData?.hiddenOnSizes?.map(size => size.name).join(" | ")}  sortable  />

          <Column header="Edit"  body={crustTypeEditColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={crustTypeDeleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default PizzaCrust;
