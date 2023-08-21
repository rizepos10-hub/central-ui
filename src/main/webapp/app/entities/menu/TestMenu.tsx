import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, TextFormat, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IMenu } from 'app/shared/model/menu.model';
import { searchEntities, getEntities } from './menu.reducer';
import { DataTable } from 'primereact/datatable';
import {Column} from "primereact/column";
import {format} from "date-fns";

export const Menu = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const menuList = useAppSelector(state => state.menu.entities);
  const loading = useAppSelector(state => state.menu.loading);
  const totalItems = useAppSelector(state => state.menu.totalItems);

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

  const handleCreate = () => {
    navigate("/menu/new")
  }

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



  const handleSyncList = () => {
    sortEntities();
  };


  const editColumnTemplate = (rowData) => {
    const editUrl = `/menu/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver', marginLeft: '0.5rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/menu/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red' ,  marginLeft: '-0.6rem'}} />
      </Link>
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Menus</span>
      <div className="ms-auto">
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Create new Menu" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <h2 id="menu-heading" data-cy="MenuHeading">
       Menus View

      </h2>

        <DataTable value={menuList} header={header} editMode="row"
                   loading={loading}
                   paginator totalRecords={totalItems} rows={5}>

          <Column
            header="Name"
            body={(rowData) => (
              <Link to={`/menu/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>{rowData.name}</Link>)}
            style={{ width: '20%' }}
          />
          <Column
            field="createdDate"
            header="Created At"
            body={(rowData) => format(new Date(rowData.createdDate), 'yyyy-MM-dd HH:mm:ss')}
          />
          <Column
            field="lastModifiedDate"
            header="Updated At"
            body={(rowData) => format(new Date(rowData.lastModifiedDate), 'yyyy-MM-dd HH:mm:ss')}
          />
          <Column
            field="category"
            header="Category"
            body={(rowData) => (rowData.category ? <span>{rowData.category.name}</span> : null)}
          ></Column>
          <Column header="Edit" body={editColumnTemplate} headerStyle={{ width: '5%' }} bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />
          <Column header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '5%' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />


        </DataTable>

    </div>
  );
};

export default Menu;
