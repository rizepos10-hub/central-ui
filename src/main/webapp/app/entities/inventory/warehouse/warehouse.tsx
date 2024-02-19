import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './warehouse.reducer';
import {DataTable} from "primereact/datatable";
import {Column, ColumnFilterElementTemplateOptions} from "primereact/column";
import {Chip} from "primereact/chip";
import {FilterMatchMode} from "primereact/api";
import {classNames} from "primereact/utils";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {Dropdown} from "primereact/dropdown";

export const Warehouse = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const loading = useAppSelector(state => state.warehouse.loading);
  const totalItems = useAppSelector(state => state.warehouse.totalItems);
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    main: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    location: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
      dispatch(getEntities({
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


  const verifiedFilterTemplate = () => {
    const dropdownItems = [
      { label: 'All', value: null },
      { label: 'Main', value: true },
    ];

    const handleDropdownChange = (e) => {
      setFilters((prev :any) => ({
        ...prev,
          main: { value: e.value, matchMode: 'equals' }
      }));
    };

    return (
      <Dropdown
        options={dropdownItems}
        value={filters?.main?.value}
        onChange={handleDropdownChange}
        placeholder={translate("tempApp.warehouse.view.table.search.main")}
      />
    );
  };



  const verifiedBodyTemplate = (rowData: IWarehouse) => {
    return <i className={classNames('pi', { 'text-green-500 pi-check-circle': rowData.main, 'text-red-500 pi-times-circle': !rowData.main })}></i>;
  };



  const nameColumnTemplate = rowData => {
    const editUrl = `/inventory/warehouse/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/inventory/warehouse/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/warehouse/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/inventory/warehouse/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.warehouse.view.table.title'}>Warehouses</Translate></span>
      <div className="ms-auto">
        <Button label={translate("tempApp.warehouse.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.warehouse.view.table.buttons.createNewWarehouse")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  return (

      <div >
        <DataTable value={warehouseList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={totalItems}
                   rows={20} loading={loading}>
          <Column field="name" header={translate('tempApp.warehouse.view.table.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('tempApp.warehouse.view.table.search.name')}  sortable  />
          <Column field="location" header={translate('tempApp.warehouse.view.table.fields.location')} filter  filterPlaceholder={translate('tempApp.warehouse.view.table.search.location')}  sortable  />
          <Column header="Main" field={"main"} body={verifiedBodyTemplate} showFilterMatchModes={false}
                  dataType="boolean" bodyClassName="text-center" style={{width: '10%'}} filter filterElement={verifiedFilterTemplate}  />

          <Column header={translate('tempApp.warehouse.view.table.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('tempApp.warehouse.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        </DataTable>
      </div>
  );
};

export default Warehouse;
