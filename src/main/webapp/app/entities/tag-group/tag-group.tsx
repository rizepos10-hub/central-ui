import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {getSortState, translate, Translate,} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './tag-group.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {Col, Row} from 'reactstrap';
import { Button } from "primereact/button";

export const TagGroup = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const tagGroupList = useAppSelector(state => state.tagGroup.entities);
  const loading = useAppSelector(state => state.tagGroup.loading);
  const totalItems = useAppSelector(state => state.tagGroup.totalItems);

  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
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

  const handleCreate = () => {
    navigate('/tag-group/new')
  }
  const nameColumnTemplate = rowData => {
    const editUrl = `/tag-group/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/tag-group/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/tag-group/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>

        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };



  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tagGroup.view.table.title'}>Addon Groups</Translate></span>
      <div className="ms-auto">
        <Button label={translate('tagGroup.view.table.buttons.refreshList')} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate('tagGroup.view.table.buttons.createNewAddonGroup')} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );


  return (
    <div>
     
      <Row>
        <Col md={"12"}>
        <DataTable value={tagGroupList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={totalItems}
                   rows={20}>
          <Column field="name" header={translate('retailAttributes.view.table.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('retailAttributes.view.table.search.name')}  sortable  />


          <Column header={translate('retailAttributes.view.table.fields.configure')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('retailAttributes.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        </DataTable>
        </Col>
      </Row>
    </div>
  );
};

export default TagGroup;
