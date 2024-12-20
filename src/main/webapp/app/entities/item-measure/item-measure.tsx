import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './item-measure.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";

export const ItemMeasure = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const itemMeasureList = useAppSelector(state => state.itemMeasure.entities);
  const loading = useAppSelector(state => state.itemMeasure.loading);
  const totalItems = useAppSelector(state => state.itemMeasure.totalItems);
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    code: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };





  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);





  const handleSyncList = () => {
    sortEntities();
  };


  const nameColumnTemplate = rowData => {
    const editUrl = `/item-measure/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/item-measure/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/item-measure/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/item-measure/new')
  }

  console.log(itemMeasureList, 'itemMeasurelist')
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.itemMeasure.view.table.title'}>Measurements</Translate></span>
      <div className="ms-auto">
        <Button label={translate("tempApp.itemMeasure.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.itemMeasure.view.table.buttons.createNewItemMeasure")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );



  return (
      <div >
        <DataTable
          value={itemMeasureList}
          editMode="row"
          header={header}
          removableSort
          filters={filters}
          filterDisplay="row"
          paginator
          loading={loading}
          totalRecords={totalItems}
          rows={20}
        >
          <Column field="name" header={translate('tempApp.itemMeasure.view.table.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('tempApp.itemMeasure.view.table.search.name')}  sortable  />
          <Column field="code" header={translate('tempApp.itemMeasure.view.table.fields.code')}
                  filter filterPlaceholder={translate('tempApp.itemMeasure.view.table.search.code')} sortable />

          <Column header={translate('tempApp.itemMeasure.view.table.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('tempApp.itemMeasure.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
    </div>
  );
};

export default ItemMeasure;
