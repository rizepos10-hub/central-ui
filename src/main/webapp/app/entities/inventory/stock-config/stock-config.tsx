import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities } from './inventory-items.reducer';
import {DataTable, DataTableFilterEvent, DataTablePageEvent, DataTableSortEvent} from "primereact/datatable";
import {Column} from "primereact/column";
import {Chip} from "primereact/chip";
import {FilterMatchMode} from "primereact/api";
import {IQueryParams} from "app/shared/reducers/reducer.utils";
import _ from "lodash";

export const StockConfig = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const [queryParams, setQueryParams] = useState({
    size: 10,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null
  })

  const inventoryItemList = useAppSelector(state => state.inventoryItem.entities);
  const loading = useAppSelector(state => state.inventoryItem.loading);
  const totalItems = useAppSelector(state => state.inventoryItem.totalItems);

  console.log(inventoryItemList, 'inventoryItemList')
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    desc: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [expandedRows, setExpandedRows] = useState(null);


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
    console.log(event, 'eventevent')
    const {page, first} = event;

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
      const keys:any = Object.keys(event.filters);
      const newQuery = keys
        .map((key) => event.filters[key].value ? `${key}=${event.filters[key].value}` : null)
        .filter((queryPart) => queryPart !== null)
        .join('&');

      setQueryParams((prevState) => ({
        ...prevState,
        query: newQuery
      }));
    },200);


  const handleSyncList = () => {
    getAllEntities();
  };



  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/inventory/stock-config/${rowData.id}/delete?page=${queryParams.page}&sort=${queryParams.sort}&first=${queryParams.first},${queryParams.size}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/inventory/stock-config/new')
  };

  const quantityConfigBodyTemplate = (rowData) => {
    const {stockQuantities: quantity} = rowData;

    const editUrl = `/inventory/stock-config/stock-quantity/${rowData?.id}/edit?variantId=${rowData.id}&itemId=${rowData.itemId}&page=${queryParams.page}
    &sort=${queryParams.sort}&first=${queryParams.first},${queryParams.size}`;

    const icon = quantity?.length > 0 ? "pi pi-wallet" : "pi pi-ban";

    const handleClick = () => {
        navigate(editUrl)
    }

    return quantity.length > 0 ?  <Button icon={icon} onClick={handleClick} /> : <i className={icon} style={{ fontSize: '1.5rem'}} />;
  };



  const purchaseConfigBodyTemplate = (rowData) => {
    const {itemPurchasingConfig: config} = rowData;

    const createUrl = `/inventory/stock-config/purchase-config/new?variantId=${rowData.id}&itemId=${rowData.itemId}`
    const editUrl = `/inventory/stock-config/purchase-config/${config?.id}/edit?page=${queryParams.page}&sort=${queryParams.sort}&first=${queryParams.first},${queryParams.size}`;

    const icon = config ? "pi pi-spin pi-cog" : "pi pi-plus";

    const handleClick = () => {
      if(!config){
        navigate(createUrl);
      }else{
        navigate(editUrl)
      }
    }

    return <Button icon={icon} onClick={handleClick} />;
  };

  const rowExpansionTemplate = (data) => {
    const variantsWithItemId = data.variants.map(variant => ({
      ...variant,
      itemId: data.id
    }));
    return (
      <div className="p-3">
        <h4>{data.name} Variants</h4>
        <DataTable value={variantsWithItemId}>
          <Column field="name" header="Variant Name" sortable />
          <Column field="price" header="Price" sortable />
          <Column field="sku" header="Sku" sortable />
          <Column headerStyle={{ width: '9rem' }} header={"Quantity"} body={quantityConfigBodyTemplate} />
          <Column headerStyle={{ width: '9rem' }} header={"Purchase Config"} body={purchaseConfigBodyTemplate} />
        </DataTable>
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.stockConfig.view.table.title'}>StockConfigs</Translate></span>
      <div className="ms-auto">
        <div className="flex flex-wrap justify-content-end gap-2">
          <Button label={translate("tempApp.stockConfig.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
            &nbsp;
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
          </Button>

          <Button icon="pi pi-plus" label="Expand All" onClick={expandAll} text />
          <Button icon="pi pi-minus" label="Collapse All" onClick={collapseAll} text />
        </div>
        {/* <Button label={translate("tempApp.stockConfig.view.table.buttons.createNewStockConfig")} raised onClick={handleCreate} disabled={loading}> */}
        {/*   &nbsp; */}
        {/* </Button> */}
      </div>
    </div>
  );




  return (
    <div>
      <h2 >
        <Translate contentKey={'tempApp.stockConfig.view.title'}>Stock Configuration</Translate>

      </h2>

      <div >
        <DataTable value={inventoryItemList} lazy filterDisplay="row" dataKey="id" paginator
                   rowExpansionTemplate={rowExpansionTemplate} onRowToggle={(e) => setExpandedRows(e.data)}
                   expandedRows={expandedRows} onSort={onSort} header={header}
                   first={queryParams.first} rows={10} totalRecords={totalItems} onPage={onPage}
                   onFilter={onFilter} filters={filters} loading={loading} tableStyle={{ minWidth: '75rem' }} >
          <Column expander style={{ width: '5rem' }} />
          <Column field="name" header="Item Name" sortable filter filterPlaceholder="Search" />
          {/* <Column field="desc" header="Description"  /> */}

        </DataTable>
      </div>
    </div>
  );
};

export default StockConfig;
