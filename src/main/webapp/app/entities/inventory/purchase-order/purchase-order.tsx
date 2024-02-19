import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './purchase-order.reducer';
import {DataTable, DataTablePageEvent} from "primereact/datatable";
import {Column} from "primereact/column";
import {Chip} from "primereact/chip";
import {FilterMatchMode} from "primereact/api";
import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {Tag} from "primereact/tag";
import {Dropdown} from "primereact/dropdown";
import _ from "lodash";

export const PurchaseOrder = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  const [queryParams, setQueryParams] = useState({
    size: 20,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null
  })

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
      dispatch(getEntities({
          page: queryParams.page,
          size: queryParams.size,
          sort: queryParams.sort,
        }));
  };





  // const sortEntities = () => {
  //   getAllEntities();
  //   const endURL = `?page=${queryParams.page}&sort=${queryParams.sort},${paginationState.order}`;
  //   if (location.search !== endURL) {
  //     navigate(`${location.pathname}${endURL}`);
  //   }
  // };

  useEffect(() => {
    getAllEntities();
  }, [queryParams.page, queryParams.size, queryParams.sort]);


  const handleSyncList = () => {
    getAllEntities();
  };

  const onFilter = _.debounce((event) => {

    console.log(event, 'event')
  });

  const onPage = (event: DataTablePageEvent) => {
    const {page, first} = event;

    setQueryParams(prevState => ({
      ...prevState,
      first,
      page
    }));
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
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?page=${queryParams.page}&sort=${queryParams.sort}`;
    return (
      <Link to={editUrl}>
        {rowData.id}
      </Link>
    );
  };
  const actionsColumnTemplate = (rowData) => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?page=${queryParams.page}&sort=${queryParams.sort}`;
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
    const deleteUrl = `/inventory/purchase-order/${rowData.id}/delete?page=${queryParams.page}&sort=${queryParams.sort}`;
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
        <DataTable
          value={purchaseOrderList} editMode="row" header={header} removableSort   filters={filters} filterDisplay="row"
          paginator totalRecords={totalItems} rows={20} lazy  first={queryParams.first}  onPage={onPage} onFilter={onFilter}
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
