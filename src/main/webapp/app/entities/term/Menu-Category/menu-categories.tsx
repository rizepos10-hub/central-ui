import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ITerm } from 'app/shared/model/term.model';
import {searchEntities, getEntities} from './menu-category.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";

export const MenuCategories = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const menuCategoryList = useAppSelector(state => state.menuCategory.entities)
  const loading = useAppSelector(state => state.menuCategory.loading);
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });
  const totalItems = menuCategoryList.length;


  console.log(menuCategoryList, 'menuCategories')

  const getAllEntities = () => {

      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };


  const handleSyncList = () => {
    sortEntities();
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/category/${rowData.id}/menus/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/category/${rowData.id}/menus/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/category/${rowData.id}/menus/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/category/menus/new')
  }
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Categories</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create new Menu Category" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  return (
    <div>
      <h2 id="menu-heading" data-cy="MenuHeading" className="mb-5">
        Menu Categories View

      </h2>

      <div className="table-responsive">
        <DataTable value={menuCategoryList} editMode="row" header={header}
                   loading={loading} removableSort filters={filters} filterDisplay="row"
                   paginator totalRecords={totalItems} rows={20}>
          <Column field="name" sortable header="Name" filterPlaceholder={"Search by name"}  filter body={nameColumnTemplate} style={{ width: '20%' }} />

          <Column header="Image"  body={(rowData) =>
            <img src={rowData.attachments[0]?.url} alt={rowData.attachments[0]?.name}  className="w-6rem shadow-2 border-round" /> } />

          <Column header="Edit"  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
    </div>
  );
};

export default MenuCategories;
