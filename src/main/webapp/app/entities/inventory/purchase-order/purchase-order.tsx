import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './purchase-order.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Chip} from "primereact/chip";
import {FilterMatchMode} from "primereact/api";
import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {Tag} from "primereact/tag";
import {Dropdown} from "primereact/dropdown";

export const PurchaseOrder = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const purchaseOrderList :IPurchaseOrder[]= useAppSelector(state => state.purchaseOrder.entities);
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const totalItems = useAppSelector(state => state.purchaseOrder.totalItems);
  const [filters, setFilters] = useState({
    "warehouse.name": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
   'supplier.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    dateDelivered: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    datePlaced: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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

  const statusBodyTemplate = (item) => {
    const getSeverity = (order: IPurchaseOrder) => {
      switch (order.status) {
        case 'PLACED':
          return 'warning';

        case 'COMPLETED':
          return 'success';

        default:
          return null;
      }
    };
    return <Tag value={item.status} severity={getSeverity(item)}></Tag>;
  };



  const statusFilterTemplate = () => {
    const dropdownItems = [
      { label: 'All', value: null },
      { label: 'Placed', value: "PLACED" },
      { label: 'Completed', value: "COMPLETED" },
    ];

    const handleDropdownChange = (e) => {
      setFilters((prev :any) => ({
        ...prev,
        status: { value: e.value, matchMode: 'equals' }
      }));
    };

    return (
      <Dropdown
        options={dropdownItems}
        value={filters?.status?.value}
        onChange={handleDropdownChange}
        placeholder={translate("tempApp.purchaseOrder.view.table.search.status")}
      />
    );
  };


  const idColumnTemplate = rowData => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.id}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/purchase-order/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/inventory/purchase-order/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.purchaseOrder.view.table.title'}>PurchaseOrders</Translate></span>
      <div className="ms-auto">
        <Button label={translate("tempApp.purchaseOrder.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.purchaseOrder.view.table.buttons.createNewPurchaseOrder")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  return (
    <div>
      <h2 >
        <Translate contentKey={'tempApp.purchaseOrder.view.title'}>PurchaseOrders View</Translate>

      </h2>

      <div >
        <DataTable value={purchaseOrderList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"  paginator totalRecords={totalItems}
                   rows={20}>
          <Column field="id" header={translate('tempApp.purchaseOrder.view.table.fields.id')} body={idColumnTemplate} filter
                  filterPlaceholder={translate('tempApp.purchaseOrder.view.table.search.id')}  sortable  />

          <Column field="datePlaced" header={translate('tempApp.purchaseOrder.view.table.fields.datePlaced')} filter
                  body={(rowData) => rowData?.datePlaced?.split("T")?.[0]}
                  filterPlaceholder={translate('tempApp.purchaseOrder.view.table.search.datePlaced')}  sortable  />

          <Column field="dateDelivered" header={translate('tempApp.purchaseOrder.view.table.fields.dateDelivered')} filter
                  body={(rowData) => rowData?.datePlaced?.split("T")?.[0]}
                  filterPlaceholder={translate('tempApp.purchaseOrder.view.table.search.dateDelivered')}  sortable  />

          <Column field="warehouse.name" header={translate('tempApp.purchaseOrder.view.table.fields.warehouse')} filter
                  filterPlaceholder={translate('tempApp.purchaseOrder.view.table.search.warehouse')}  sortable  />

          <Column field="supplier.name" header={translate('tempApp.purchaseOrder.view.table.fields.supplier')} filter
                  filterPlaceholder={translate('tempApp.purchaseOrder.view.table.search.supplier')}  sortable  />

          <Column field="status" header={translate('tempApp.purchaseOrder.view.table.fields.status')} filter
                  filterElement={statusFilterTemplate}  body={statusBodyTemplate}  sortable  />

          <Column header={translate('tempApp.purchaseOrder.view.table.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('tempApp.purchaseOrder.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
    </div>
  );
};

export default PurchaseOrder;
