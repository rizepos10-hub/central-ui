import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IAddon } from 'app/shared/model/addon.model';
import { searchEntities, getEntities } from './addon.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Chip} from "primereact/chip";
import {FilterMatchMode} from "primereact/api";

export const Addon = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const addonList = useAppSelector(state => state.addon.entities);
  const loading = useAppSelector(state => state.addon.loading);
  const totalItems = useAppSelector(state => state.addon.totalItems);
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };


  const priceBodyTemplate = (item) => {
    const price = item.price
    return formatCurrency(price);
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/addon/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/addon/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/addon/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/addon/new')
  }
  console.log(addonList, 'addonlist')
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'addons.view.table.title'}>Addons</Translate></span>
      <div className="ms-auto">
        <Button label={translate("addons.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("addons.view.table.buttons.createNewAddon")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );
  const renderDiscounts = rowData => {
    const discounts = rowData.discounts || [];
    return discounts.map((discount, index) => (
      <>
      <Chip
        key={index}
        label={discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}
        className="p-mr-2 p-mb-2"
      />
      </>

    ));
  };



  return (
    <div>
      <h2 >
        <Translate contentKey={'addons.view.title'}>Addons View</Translate>

      </h2>

      <div >
        <DataTable value={addonList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={totalItems}
                   rows={20}>
          <Column field="name" header={translate('addons.view.table.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('addons.view.table.search.name')}  sortable  />
          <Column field="price" header={translate('addons.view.table.fields.price')} sortable body={priceBodyTemplate} />
          <Column
            field="discounts"
            header={translate('addons.view.table.fields.discounts')}
            body={renderDiscounts}
            sortable
          />

          <Column header={translate('addons.view.table.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('addons.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
    </div>
  );
};

export default Addon;
