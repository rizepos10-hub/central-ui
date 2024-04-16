import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import {getSortState, translate, Translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {  ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterEntities, getEntities } from './pizza-item.reducer';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import {Column} from "primereact/column";
import {IPizzaItem} from "app/shared/model/ITEM/restaurant/pizza-item.model";
import ImageDisplay from "app/shared/layout/image/image-display";
import { initialItemFilterState } from "app/shared/components/filter/initial-item-filter-state.model";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import _ from "lodash";

export const PizzaItem = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const pizzaItemsList:IPizzaItem[] = useAppSelector(state => state.pizzaItem.entities);
  const loading = useAppSelector(state => state.pizzaItem.loading);
  const totalItems = useAppSelector(state => state.pizzaItem.totalItems);


  const [searchParams, setSearchParams]=  useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;




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
  }, [searchParams]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const onFilter = (event: DataTableFilterEvent) => {
    const debouncedSearchAction = _.debounce(() => {
      event['first'] = 0;
      event['page'] = 0;
      const queryParams = JSON.stringify(event);
      setSearchParams({query: queryParams}, {replace: true})
    }, 300);
    debouncedSearchAction();
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };


  const handleDropdownChange = (field, value) => {
    const newQuery = JSON.stringify(  {
      ...query,
      filters: {
        ...query.filters,
        [field] : value
      }
    });
    setSearchParams({query: newQuery}, {replace: true});
  };


  const nameColumnTemplate = rowData => {
    const editUrl = `/restaurant/pizza/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/restaurant/pizza/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer' , color: 'silver' , marginLeft: '0.3rem'}} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/pizza/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/restaurant/pizza/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'items.view.titles.tableTitle.pizza'}>Pizza Items</Translate></span>
      <div className="ms-auto">
        <Button label={translate('items.view.actions.refreshList')} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate('items.view.actions.createPizza')} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );


  return (

      <div >
        <DataTable
          value={pizzaItemsList} loading={loading} editMode="row" header={header} removableSort  filters={query.filters} filterDisplay="row"
          paginator totalRecords={totalItems} rows={20} lazy  first={query.first}  onPage={onPage} onFilter={onFilter}
          onSort={onSort} sortField={query.sortField} sortOrder={query.sortOrder} showGridlines
        >

          <Column field="name" header={translate('items.view.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('items.view.filters.name')}  sortable  />

          <Column
            header="Category"
            field="categories"
            body={rowData => rowData?.categories?.map(cat => cat?.name).join(" | ")}
            sortable
            filter
            showFilterMatchModes={false}
            filterElement={
              <DropDownFilter
                dropDownOptionType={"RESTAURANT_CATEGORY"}
                selectedOption={query?.filters?.["categories.id"]?.value}
                fieldName={"categories.id"}
                handleDropdownChange={handleDropdownChange}
              />
            }
          />

          <Column header={translate('items.view.fields.image')}  body={(rowData) =>
            <ImageDisplay
              imageType={"product"}
              imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url }
              height={50}
              width={50}
            />} />
          <Column field="desc" header={translate('items.view.fields.description')} />

          <Column field="stock" sortable header={translate('items.view.fields.inStock')} />

          <Column header={translate('items.view.fields.edit')}  body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center'}}
                  bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible'  }} />

          <Column  header={translate('items.view.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%',  }}
                   bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


        </DataTable>
      </div>
  );
};

export default PizzaItem;
