import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './supplier-return.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {Tag} from "primereact/tag";
import {Dropdown} from "primereact/dropdown";

export const SupplierReturn = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const supplierReturnList = useAppSelector(state => state.supplierReturn.entities);
  const loading = useAppSelector(state => state.supplierReturn.loading);
  const totalItems = useAppSelector(state => state.supplierReturn.totalItems);
  const [filters, setFilters] = useState({
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "purchaseOrder.id": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "purchaseOrder.supplier.name": { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },
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

        case 'RECEIVED':
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
      { label: 'Parked', value: "PARKED" },
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
        placeholder={translate("common.search.points")}
      />
    );
  };



  const idColumnTemplate = rowData => {
    const editUrl = `/inventory/supplier-return/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData?.id}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/inventory/supplier-return/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/supplier-return/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/inventory/supplier-return/new')
  }
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.supplierReturn.title'}>Supplier Returns</Translate></span>
      <div className="ms-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.supplierReturn.createNew")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );




  return (
      <div >
        <DataTable
          showGridlines
          value={supplierReturnList}
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
          <Column field="id" header={translate('common.id')} filter body={idColumnTemplate}
                  filterPlaceholder={translate('common.search.id')}  sortable  />
          <Column field="purchaseOrder.id" header={translate('tempApp.supplierReturn.purchaseOrder')}
                  filter filterPlaceholder={translate('tempApp.supplierReturn.search.purchaseOrder')} sortable />

          <Column field="purchaseOrder.supplier.name" header={translate('tempApp.supplierReturn.supplier')}
                  filter filterPlaceholder={translate('tempApp.supplierReturn.search.supplier')} sortable />

          <Column field="status" header={translate('common.status')} filter
                  filterElement={statusFilterTemplate}  body={statusBodyTemplate}  sortable  />

          <Column header={translate('common.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('common.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        </DataTable>
    </div>
  );
};

export default SupplierReturn;
