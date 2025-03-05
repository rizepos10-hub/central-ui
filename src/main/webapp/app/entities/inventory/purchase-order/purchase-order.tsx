import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, filterEntities } from './purchase-order.reducer';
import { searchEntities as searchSuppliers, getEntities as getSuppliers } from '../supplier/supplier.reducer';
import { searchEntities as searchWarehouses, getEntities as getWarehouses } from '../warehouse/warehouse.reducer';
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";

import { IPurchaseOrder } from "app/shared/model/STOCK/purchase-order.model";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode } from "primereact/api";
import _ from "lodash";
import { InputText } from "primereact/inputtext";
import Select from "react-select";
import { Calendar } from "primereact/calendar";
import { toLocalISOString } from "app/shared/util/date-utils";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { Spinner } from "reactstrap";
import { FaHandshake } from 'react-icons/fa';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    "warehouse.id": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'supplier.id': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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

  const [searchTermSupplier, setSearchTermSupplier] = useState('');
  const [searchTermWarehouse, setSearchTermWarehouse] = useState('');
  const [searchParam, setSearchParams] = useSearchParams();

  const query = JSON.parse(searchParam.get("query")) || initialState;

  const purchaseOrderList: IPurchaseOrder[] = useAppSelector(state => state.purchaseOrder.entities);
  const supplierList = useAppSelector(state => state.supplier.entities);
  const warehouseList = useAppSelector(state => state.warehouse.entities);

  const loading = useAppSelector(state => state.purchaseOrder.loading);
  const totalItems = useAppSelector(state => state.purchaseOrder.totalItems);

  const searchParams = new URLSearchParams(location.search);
  const poAction = searchParams.get('poAction');

  // State for flashing effect
  const [flashReturn, setFlashReturn] = useState(false);
  const [flashHighlight, setFlashHighlight] = useState(false);

  useEffect(() => {
    if (poAction === 'true') {
      setFlashReturn(true);
      // Start with highlight on.
      setFlashHighlight(true);
      let count = 0;
      const interval = setInterval(() => {
        setFlashHighlight(prev => !prev);
        count++;
        if (count >= 6) {
          clearInterval(interval);
          setFlashReturn(false);
          setFlashHighlight(false);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [poAction]);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onFilter = (event: any) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true });
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

  const handleFilterDateChange = (e, field) => {
    const newQueryWithStatus = JSON.stringify({
      ...query,
      filters: {
        ...query.filters,
        [field]: { value: toLocalISOString(e.value), matchMode: 'startsWith' }
      }
    });
    setSearchParams({ query: newQueryWithStatus }, { replace: true });
  };

  const filterTemplate = (field) => {
    const statusDropdownItems = [
      { name: 'All', id: null },
      { name: 'Placed', id: "PLACED" },
      { name: 'Received', id: "RECEIVED" },
    ];

    const dropDownOptions = {
      "status": statusDropdownItems,
      "supplier": supplierList,
      "warehouse": warehouseList
    };

    useEffect(() => {
      const searchAction = () => {
        if (searchTermSupplier) {
          dispatch(searchSuppliers({
            query: searchTermSupplier
          }));
        } else {
          dispatch(getSuppliers({}));
        }

        if (searchTermWarehouse) {
          dispatch(searchWarehouses({
            query: searchTermWarehouse
          }));
        } else {
          dispatch(getWarehouses({}));
        }
      };

      const debouncedSearchAction = _.debounce(searchAction, 500);
      debouncedSearchAction();

      return () => {
        debouncedSearchAction.cancel();
      };
    }, [searchTermSupplier, searchTermWarehouse]);

    const handleDropdownChange = (e) => {
      const newQueryWithStatus = JSON.stringify({
        ...query,
        filters: {
          ...query.filters,
          [field !== 'status' ? `${field}.id` : field]: { value: e.target.value, matchMode: 'equals' }
        }
      });
      setSearchParams({ query: newQueryWithStatus }, { replace: true });
    };

    const filterElement = () => (
      <span className="p-input-icon-right">
        <InputText
          placeholder="Search" value={field === 'supplier' ? searchTermSupplier : searchTermWarehouse}
          onChange={e => field === 'supplier' ? setSearchTermSupplier(e.target.value) : setSearchTermWarehouse(e.target.value)} />
        <i className="pi pi-search" />
      </span>
    );

    return (
      <Dropdown
        options={dropDownOptions[field]}
        filter={field !== 'status'}
        showFilterClear={true}
        showClear
        filterTemplate={filterElement}
        optionLabel={"name"}
        optionValue={"id"}
        value={query?.filters?.[field !== 'status' ? `${field}.id` : field]?.value}
        onChange={handleDropdownChange}
        placeholder={translate("common.search.points")}
      />
    );
  };

  const idColumnTemplate = rowData => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?&query=${JSON.stringify(query)}`;
    return (
      <Link to={editUrl}>
        {rowData.id}
      </Link>
    );
  };

  const actionsColumnTemplate = (rowData) => {
    const editUrl = `/inventory/purchase-order/${rowData.id}/edit?&query=${JSON.stringify(query)}`;
    return (
      rowData?.status === "RECEIVED" ?
        <i className={"pi pi-eye"} onClick={() => navigate(editUrl)} style={{ cursor: 'pointer', fontSize: '1.25rem', marginLeft: '0.3rem' }} />
        :
        <Link to={editUrl}>
          <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
        </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/purchase-order/${rowData.id}/delete?&query=${JSON.stringify(query)}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const returnColumnTemplate = (rowData) => {
    const supplierReturnUrl = `/inventory/supplier-return/new?poId=${rowData.id}`;
    const highlightStyle = flashReturn && flashHighlight
      ? { backgroundColor: '#ffc107', transition: 'background-color 0.5s ease-in-out', padding: '0.2rem', borderRadius: '0.2rem' }
      : {};
    return (
      <Link to={supplierReturnUrl} style={highlightStyle}>
        <FaHandshake size={20} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate(`/inventory/purchase-order/new?query=${JSON.stringify(query)}`);
  };

  const header = (
    <div className="d-flex flex-wrap align-items-center justify-content-between">
      <span className="h4 font-weight-bold"><Translate contentKey={'tempApp.purchaseOrder.title'}>PurchaseOrders</Translate></span>
      <div className="ml-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="mr-3" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.purchaseOrder.addNew")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <DataTable
        value={purchaseOrderList} editMode="row" header={header} removableSort filters={query.filters} filterDisplay="row"
        paginator totalRecords={totalItems} rows={20} lazy first={query.first} onPage={onPage} onFilter={onFilter}
        onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder} showGridlines
      >
        <Column field="id" header={translate('common.id')} body={idColumnTemplate} filter
          filterPlaceholder={translate('common.search.id')} />

        <Column field="datePlaced" header={translate('common.datePlaced')} filter
          body={(rowData) => rowData?.datePlaced?.split("T")?.[0]} showFilterMenu={false}
          filterElement={<Calendar value={new Date(query?.filters?.datePlaced?.value)} onChange={(e) => handleFilterDateChange(e, 'datePlaced')} />}
          filterPlaceholder={translate('common.search.datePlaced')} />

        <Column field="dateDelivered" header={translate('common.dateDelivered')}
          body={(rowData) => rowData?.dateDelivered?.split("T")?.[0]} filter showFilterMenu={false}
          filterElement={<Calendar value={query?.filters?.dateDelivered?.value} onChange={(e) => handleFilterDateChange(e, 'dateDelivered')} />}
          filterPlaceholder={translate('common.search.dateDelivered')} />

        <Column field="warehouse.name" header={translate('tempApp.purchaseOrder.warehouse')} filter showFilterMenu={false}
          filterElement={() => filterTemplate("warehouse")} filterPlaceholder={translate('tempApp.purchaseOrder.search.warehouse')} />

        <Column field="supplier.name" header={translate('tempApp.purchaseOrder.supplier')} filter showFilterMenu={false}
          filterElement={() => filterTemplate("supplier")} filterPlaceholder={translate('tempApp.purchaseOrder.search.supplier')} />

        <Column field="status" header={translate('common.status')} filter showFilterMenu={false}
          filterElement={() => filterTemplate("status")} body={statusBodyTemplate} />

        <Column header={translate('common.return')} body={returnColumnTemplate} headerStyle={{ width: '1%', textAlign: 'center' }}
          bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />

        <Column header={translate('common.view')} body={actionsColumnTemplate} headerStyle={{ width: '1%', textAlign: 'center' }}
          bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />

        <Column header={translate('common.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', textAlign: 'center' }}
          bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />

      </DataTable>
    </div>
  );
};

export default PurchaseOrder;
