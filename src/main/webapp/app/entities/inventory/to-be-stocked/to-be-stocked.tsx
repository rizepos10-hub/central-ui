import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getToBeStockedEntities } from '../stock-config/stock-quantity.reducer';
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {FilterMatchMode} from "primereact/api";
import { IStockQuantity } from 'app/shared/model/STOCK/stock-quantity.model';
import { Dropdown } from 'primereact';
import {  getEntities as getSuppliers, searchEntities as searchSuppliers } from '../supplier/supplier.reducer';

export const ToBeStocked = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<IStockQuantity[]>([]);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [supplierId, setSupplierId] = useState(null);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const toBeStockedList = useAppSelector(state => state.stockQuantity.entities);

  const supplierList = useAppSelector(state => state.supplier.entities);
  const loading = useAppSelector(state => state.stockQuantity.loading);
  const totalItems = useAppSelector(state => state.stockQuantity.totalItems);
  const [filters, setFilters] = useState({
    itemName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "location.name": { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplierName: { value: null, matchMode: FilterMatchMode.CONTAINS  },
  });
  
  const getAllEntities = () => {
      dispatch(
        getToBeStockedEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
          supplierId: supplierId || null
        })
      );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  const getAllSuppliers = () => {
    if(searchSupplier) {
      dispatch(
        searchSuppliers({
          query: searchSupplier,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getSuppliers({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`
        })
      );
    }

  };

  useEffect(() => {
    sortEntities();
    
  }, [paginationState.activePage, paginationState.order, paginationState.sort, supplierId]);

  useEffect(() => {
    getAllSuppliers()
  }, [searchSupplier]);

  const handleSyncList = () => {
    sortEntities();
  };


  const idColumnTemplate = rowData => {
    const editUrl = `/product/${rowData.itemId}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData?.itemName}
      </Link>
    );
  };

  const handleCreatePurchaseOrder = () => {
    const serializedItems = encodeURIComponent(JSON.stringify(selectedItems));
    const navigateUrl = `/inventory/purchase-order/new?items=${serializedItems}`;
    navigate(navigateUrl)
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.stockConfig.toBeStocked'}>To Be Stocked</Translate></span>
      <div className="ms-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        {
          selectedItems.length > 0 && 
          <Button label={translate("tempApp.purchaseOrder.addNew")} raised onClick={handleCreatePurchaseOrder} disabled={loading}>
          &nbsp;
        </Button>
        }
      </div>
    </div>
  );

  
  const statusBodyTemplate = (item) => {
    return (
      item?.supplierConfigurations
        ?.map((config) => config.supplier?.name)
        .join(' | ') || 'No Suppliers'
    );
  };

  const statusFilterTemplate = () => {
    // Extract unique supplier names
    const dropdownItems = [
      { label: 'All Suppliers', value: null },
      ...supplierList.map(supplier => ({
        label: supplier.name,
        value: supplier.id,
      })),
    ];
  
    const handleDropdownChange = (e) => {
      setSupplierId(e.value);
    };

    const handleFilterChange = (e) => {
      const query = e.filter;
      setSearchSupplier(query);
    };


    return (
      <Dropdown
        filter
        options={dropdownItems}
        onFilter={handleFilterChange}
        value={supplierId}
        onChange={handleDropdownChange}
        placeholder="Select Supplier"
      />
    );
  };

  return (
      <div>
        <DataTable
          showGridlines
          value={toBeStockedList}
          editMode="row"
          header={header}
          removableSort
          filters={filters}
          onFilter={(e:any) => setFilters(e.filters)}
          filterDisplay="row"
          paginator
          loading={loading}
          totalRecords={totalItems}
          selectionMode="checkbox"
          selection={selectedItems}
          onSelectionChange={(e) => setSelectedItems(e.value)}
          rows={20}
        >
          
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
          <Column
            field="itemName"
            header={translate('common.search.name')}
            filter
            body={idColumnTemplate}
            filterPlaceholder={translate('common.search.name')}
            sortable
          />
          <Column
            field="location.name"
            header={translate('tempApp.stockConfig.view.table.search.location')}
            filter
            sortable
          />
          
          <Column
            field="supplierConfigurations"
            header={translate('tempApp.supplierReturn.supplier')}
            filter
            filterElement={statusFilterTemplate} 
            body={statusBodyTemplate}
            sortable
          />
        </DataTable>
    </div>
  );
};

export default ToBeStocked;
