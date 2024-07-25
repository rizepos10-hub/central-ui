import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './transfer-request.reducer';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { ITransferRequest } from "app/shared/model/STOCK/transfer-request.model";

export const TransferRequest = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const transferRequestList: ITransferRequest[] = useAppSelector(state => state.transferRequest.entities);
  const loading = useAppSelector(state => state.transferRequest.loading);
  const totalItems = useAppSelector(state => state.transferRequest.totalItems);
  const [filters, setFilters] = useState({
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "source.name": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "destination.name": { value: null, matchMode: FilterMatchMode.CONTAINS },
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
    const getSeverity = (transferRequest: ITransferRequest) => {
      switch (transferRequest.status) {
        case 'PLACED':
          return 'warning';

        case 'CONFIRMED':
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
      setFilters((prev: any) => ({
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


  const nameColumnTemplate = rowData => {
    const editUrl = `/inventory/transfer-request/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData?.source?.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/inventory/transfer-request/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/transfer-request/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/inventory/transfer-request/new')
  }
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.transferRequest.view.table.title'}>Transfer Requests</Translate></span>
      <div className="ms-auto">
        <Button label={translate("tempApp.transferRequest.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.transferRequest.view.table.buttons.createNewTransferRequest")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );


  return (
    <div>
      <DataTable
        showGridlines
        value={transferRequestList}
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
        <Column field="source.name" header={translate('tempApp.transferRequest.view.table.fields.source')} filter body={nameColumnTemplate}
          filterPlaceholder={translate('tempApp.transferRequest.view.table.search.source')} sortable />
        <Column field="destination.name" header={translate('tempApp.transferRequest.view.table.fields.destination')}
          filter filterPlaceholder={translate('tempApp.transferRequest.view.table.search.destination')} sortable />

        <Column field="status" header={translate('tempApp.purchaseOrder.view.table.fields.status')} filter
          filterElement={statusFilterTemplate} body={statusBodyTemplate} sortable />


        <Column header={translate('tempApp.transferRequest.view.table.fields.edit')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('tempApp.transferRequest.view.table.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

      </DataTable>
    </div>
  );
};

export default TransferRequest;
