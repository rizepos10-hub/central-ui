import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from 'app/entities/inventory/stock-config/inventory-items.reducer';
import { DataTable, DataTableFilterEvent, DataTablePageEvent, DataTableSortEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chip } from "primereact/chip";
import { FilterMatchMode } from "primereact/api";
import { Card as PrimeCard } from 'primereact/card'
import { IQueryParams } from "app/shared/reducers/reducer.utils";
import _ from "lodash";
import { formatVariant } from 'app/shared/util/variant-utils';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { exportEntities } from "app/entities/item/retail/product/product.reducer";

export const InventoryReport = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const [selectedStockQuantities, setSelectedStockQuantities] = useState([]);
  const [stockDialogVisible, setStockDialogVisible] = useState(false);
  const [queryParams, setQueryParams] = useState({
    size: 10,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null
  })
  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const inventoryItemList = useAppSelector(state => state.inventoryItem.entities);
  const loading = useAppSelector(state => state.inventoryItem.loading);
  const totalItems = useAppSelector(state => state.inventoryItem.totalItems);

  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    desc: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [expandedRows, setExpandedRows] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const handleOpenStockDialog = (variant) => {
    setSelectedStockQuantities(variant.stockQuantities || []);
    setStockDialogVisible(true);
  };

  const getAllEntities = () => {
    if (queryParams?.query) {
      dispatch(searchEntities(queryParams));
    } else {
      dispatch(getEntities(queryParams));
    }
  };

  useEffect(() => {
    getAllEntities();
  }, [queryParams.page, queryParams.sort, queryParams.size, queryParams.query]);

  const expandAll = () => {
    const _expandedRows = {};

    inventoryItemList.forEach((p) => (_expandedRows[`${p.id}`] = true));

    setExpandedRows(_expandedRows);
  };

  const collapseAll = () => {
    setExpandedRows(null);
  };


  const onPage = (event: DataTablePageEvent) => {
    const { page, first } = event;

    setQueryParams(prevState => ({
      ...prevState,
      first,
      page
    }));
  };


  const onSort = (event: DataTableSortEvent) => {
    // setQueryParams();
  };

  const onFilter = _.debounce((event) => {
    const keys: any = Object.keys(event.filters);
    const newQuery = keys
      .map((key) => event.filters[key].value ? `${key}=${event.filters[key].value}` : null)
      .filter((queryPart) => queryPart !== null)
      .join('&');

    setQueryParams((prevState) => ({
      ...prevState,
      query: newQuery
    }));
  }, 200);


  const handleSyncList = () => {
    getAllEntities();
  };


  const quantityConfigBodyTemplate = (rowData) => {
    console.log(rowData);
    return (
        null
    );
  };

  const purchaseConfigBodyTemplate = (rowData) => {
    const { itemPurchasingConfig: config } = rowData;

    const createUrl = `/inventory/stock/purchase-config/new?variantId=${rowData.id}&itemId=${rowData.itemId}`
    const editUrl = `/inventory/stock/purchase-config/${config?.id}/edit?page=${queryParams.page}&sort=${queryParams.sort}&first=${queryParams.first},${queryParams.size}`;

    const icon = config ? "pi pi-spin pi-cog" : "pi pi-plus";

    const handleClick = () => {
      if (!config) {
        navigate(createUrl);
      } else {
        navigate(editUrl)
      }
    }

    return <Button icon={icon} onClick={handleClick} />;
  };

  const rowExpansionTemplate = (data, idx) => {
    const variantsWithItemId = data.variants.map(variant => ({
      ...variant,
      itemId: data.id
    }));

    return (
      <div className="p-3 bg-light">
        <h4>{data.name} Variants</h4>
        <DataTable value={variantsWithItemId} showGridlines>
          <Column className={'bg-light'} body={data => formatVariant(data?.name, data?.attributeValues)} header={translate("common.variantName")} sortable />
          <Column className={'bg-light'} field="price" header={translate("common.price")} sortable />

          <Column
            className="bg-light"
            header={translate("tempApp.stockConfig.title")}
            headerStyle={{ width: '6rem' }}
            body={(rowData) => (
                <Button
                label="View Stocks"
                onClick={() => handleOpenStockDialog(rowData)}
                size="small"
                />
            )}
            />

        </DataTable>

        <Dialog
            header="Stock Quantities"
            visible={stockDialogVisible}
            style={{ width: '50vw' }}
            onHide={() => setStockDialogVisible(false)}
            >
            <DataTable value={selectedStockQuantities} showGridlines>
                <Column field="location.name" header="Location" />
                <Column field="location.type" header="Type" />
                <Column field="quantity" header="Quantity" />
                <Column field="unitCost" header="Unit Cost" />
            </DataTable>
        </Dialog>

      </div>
    );
  };

  const confirm2 = () => {
    confirmDialog({
    message: 'Are you sure you want to proceed?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => handleExportItems(),
    reject: () => setSelectedActionOption(null)
    });
  };

  const handleExportItems = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities(inventoryItemList.map(product => product.id))).finally(() => setIsLoadingAction(false));
  };
  const header = (
        <div className="bg-dark bg-opacity-10 p-2 d-flex justify-content-between">
          <span className="text-xl d-flex align-items-center">
            <div className="ms-auto">
                <div className="flex flex-wrap justify-content-end gap-2">
                <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
                    &nbsp;
                    <FontAwesomeIcon icon="sync" spin={loading} />{' '}
                </Button>

                <Button icon="pi pi-plus" label={translate("common.expandAll")} onClick={expandAll} text />
                <Button icon="pi pi-minus" label={translate("common.collapseAll")} onClick={collapseAll} text />
                </div>
            </div>
          </span>
            <div className="flex align-items-center justify-content-end gap-3">
              <Button
                icon="pi pi-sync"
                raised severity="info"
                onClick={handleSyncList}
                disabled={loading}
                loading={loading}
                data-pr-position="top"
                tooltip={translate('items.view.actions.refreshList')}
              />
              <Button
                icon="pi pi-file-export"
                raised
                onClick={confirm2}
                tooltip="Export All"
                data-pr-position="top"
              />
             
            </div>
        </div>
  );

  return (
    <div >
      <DataTable value={inventoryItemList} lazy filterDisplay="row" dataKey="id" paginator showGridlines
        rowExpansionTemplate={rowExpansionTemplate} onRowToggle={(e) => setExpandedRows(e.data)}
        expandedRows={expandedRows} onSort={onSort} header={header}
        first={queryParams.first} rows={10} totalRecords={totalItems} onPage={onPage}
        onFilter={onFilter} filters={filters} loading={loading} tableStyle={{ minWidth: '75rem' }} >
        <Column expander style={{ width: '5rem' }} />
        <Column field="name" header="Item Name" sortable filter filterPlaceholder="Search" />
        {/* <Column field="desc" header="Description"  /> */}
      </DataTable>
    </div>
  );
};

export default InventoryReport;
