import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {Button as PrimeButton } from 'primereact/button';
import {Button} from "reactstrap";
import {  getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntities, reset, updateAllEntities} from './pizza-size.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";

export const PizzaSize = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const pizzaSizesList = useAppSelector(state => state.pizzaSize.entities);
  const [sizeList, setSizeList] = useState([]);
  const loading = useAppSelector(state => state.pizzaSize.loading);
  const totalItems = useAppSelector(state => state.pizzaSize.totalItems);
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
      dispatch(reset())
    }
  }, [paginationState.activePage, paginationState.order, paginationState.sort ]);

  useEffect(() => {
    if(pizzaSizesList.length > 0){
      const sortedSizes = pizzaSizesList?.slice()?.sort((size1, size2) => size1.order - size2.order)
      setSizeList(sortedSizes);
    }

  }, [ pizzaSizesList?.length])





  const handleSyncList = () => {
    getAllEntities();
  };


  const handleSave = () => {
    const newSizesList = sizeList?.map((size, index) => ({...size, order: index}))
    console.log(newSizesList, 'newSizesList')
    dispatch(updateAllEntities(newSizesList))
  }



  const nameColumnTemplate = rowData => {
    const editUrl = `/pizza-size/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/pizza-size/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pizza-size/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate(`/pizza-size/new?order=${totalItems + 1}`)
  }
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Pizza Sizes</span>
      <div className="ms-auto">
        <PrimeButton label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </PrimeButton>
        <PrimeButton label="Add New Size" className={"me-5"} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </PrimeButton>

        <Button className={"btn btn-primary"} onClick={handleSave} disabled={loading} >
          Save
        </Button>

      </div>
    </div>
  );




  return (
    <div>

        <DataTable
          value={sizeList}
          editMode="row"
          header={header}
          removableSort
          reorderableRows
          onRowReorder={(e) => setSizeList(e.value)}
          filters={filters}
          filterDisplay="row"
          paginator
          totalRecords={totalItems}
          rows={20}
        >
          <Column rowReorder className={"w-2rem py-5"} />
          <Column field="name"  header="Name" filter body={nameColumnTemplate} filterPlaceholder={"Search by name"}  sortable  />


          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
  );
};

export default PizzaSize;
