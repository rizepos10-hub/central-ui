import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './purchase-order.reducer';
import {DataTable, DataTablePageEvent} from "primereact/datatable";
import {Column} from "primereact/column";

import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {Tag} from "primereact/tag";
import {Dropdown} from "primereact/dropdown";
import {FilterMatchMode} from "primereact/api";
import {stringify} from "ts-jest";

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    "warehouse.name": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'supplier.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    dateDelivered: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    datePlaced: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  }
};

export const PurchaseOrder = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [searchParam, setSearchParams]=  useSearchParams();

  const query = JSON.parse(searchParam.get("query")) || initialState;

  const purchaseOrderList :IPurchaseOrder[]= useAppSelector(state => state.purchaseOrder.entities);
  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const totalItems = useAppSelector(state => state.purchaseOrder.totalItems);



  const getAllEntities = () => {
      dispatch(getEntities({
          query
        }));
  };


  useEffect(() => {
    getAllEntities();
  }, [searchParam]);


  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    console.log(event,'event')
    const queryParams = JSON.stringify(event);

    setSearchParams({query: queryParams}, {replace: true})
  };

  const onFilter = (event: any) => {
    event['first'] = 0;
    event['page'] = 0;

    const queryParams = JSON.stringify(event);
    console.log(queryParams, 'queryParams')
    setSearchParams({query: queryParams}, {replace: true})

  };



  const onPage = (event) => {
    const queryParams = JSON.stringify(event);

    setSearchParams({query: queryParams}, {replace: true})
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
      const newQueryWithStatus = JSON.stringify(  {
        ...query,
        filters: {
          ...query.filters,
          status: {value: e.target.value, matchMode: 'equals'}
        }
      });
      setSearchParams({query: newQueryWithStatus}, {replace: true})
    };


    console.log(query, 'vquery')

    return (
      <Dropdown
        options={dropdownItems}
        value={query?.filters?.status?.value}
        onChange={handleDropdownChange}
        placeholder={translate("tempApp.purchaseOrder.view.table.search.status")}
      />
    );
  };


  const idColumnTemplate = rowData => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?&query=${query}`;
    return (
      <Link to={editUrl}>
        {rowData.id}
      </Link>
    );
  };
  const actionsColumnTemplate = (rowData) => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?&query=${query}`;
    return (
      rowData?.status === "COMPLETED" ?
      <i className={"pi pi-eye"} onClick={() => navigate(editUrl)} style={{ cursor: 'pointer' , fontSize: '1.25rem' , marginLeft: '0.3rem'}} />
        :
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/purchase-order/${rowData.id}/delete?&query=${query}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate(`/inventory/purchase-order/new?query=${query}`)
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
        <DataTable
          value={purchaseOrderList} editMode="row" header={header} removableSort  filters={query.filters} filterDisplay="row"
          paginator totalRecords={totalItems} rows={20} lazy  first={query.first}  onPage={onPage} onFilter={onFilter}
          onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder}
                 >
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

          <Column header={translate('tempApp.purchaseOrder.view.table.fields.actions')}  body={actionsColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('tempApp.purchaseOrder.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        </DataTable>
    </div>
  );
};

export default PurchaseOrder;
