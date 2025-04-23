import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getToppingGroups } from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import { filterEntities } from './pizza-topping.reducer';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import ImportButton from "app/shared/components/data-import/data-import";
import { ITopping } from 'app/shared/model/PIZZA/topping.model';
import { ITerm } from 'app/shared/model/term.model';
import { Dropdown } from 'primereact/dropdown';
import _ from 'lodash';
import { InputText } from 'primereact/inputtext';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

export const PizzaTopping = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [localNameFilter, setLocalNameFilter] = useState("");

  const pizzaToppingList: ITopping[] = useAppSelector(state => state.pizzaTopping.entities);
  const pizzaToppingGroups: ITerm[] = useAppSelector(state => state.toppingGroup.entities);
  const loading = useAppSelector(state => state.pizzaTopping.loading);
  const totalItems = useAppSelector(state => state.pizzaTopping.totalItems);
  const importSuccess = useAppSelector(state => state.dataImport.importSuccess);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || {
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {
      "group.id": { value: null, matchMode: FilterMatchMode.EQUALS },
      name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  };

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

  const onFilter = (event: DataTableFilterEvent) => {
    debouncedFilter(event);
  };

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(filterEntities({ query: updatedQuery }));
  };

  useEffect(() => {
    dispatch(getToppingGroups({}));
  }, [])

  useEffect(() => {
    getAllEntities();
  }, [searchParams]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/pizza-topping/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/pizza-topping/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pizza-topping/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/pizza-topping/new')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Pizza Toppings</span>
      <div className="ms-auto">
        <ImportButton type={"TOPPING"} />
        &nbsp;
        <Button label="Refresh List" severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label="Add New Topping" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  const groupFilterTemplate = (event) => {
    return (
      <Dropdown
        options={pizzaToppingGroups}
        showClear
        optionLabel='name'
        optionValue='id'
        value={query?.filters?.["group.id"]?.value}
        onChange={(e) => {
          const newQuery = {
            ...query,
            filters: {
              ...query.filters,
              "group.id": { value: e.value, matchMode: FilterMatchMode.EQUALS }
            }
          };
          setSearchParams({ query: JSON.stringify(newQuery) }, { replace: true })
        }}
      />
    );
  }

  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const nameFilterTemplate = () => {
    return (
      <InputText
        type="text"
        value={localNameFilter}
        onChange={(e) => {
          setLocalNameFilter(e.target.value);
          const newQuery = {
            ...query,
            filters: {
              ...query.filters,
              name: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
            }
          };
          debouncedFilter(newQuery);
        }}
        className="p-inputtext-sm"
        placeholder="Search by Name"
      />
    );
  };

  return (
    <div>
      <DataTable
        value={pizzaToppingList}
        loading={loading}
        editMode="row"
        header={header}
        removableSort
        filters={query.filters}
        filterDisplay="row"
        paginator
        totalRecords={totalItems}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        rows={query?.rows}
        lazy
        first={query.first}
        onPage={onPage}
        onFilter={onFilter}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
      >
        <Column
          field="name"
          header="Name"
          filter
          filterField="name"
          filterElement={nameFilterTemplate}
          body={nameColumnTemplate}
          filterPlaceholder={"Search by name"}
          sortable
        />

        <Column
          header="Image"
          body={(rowData) => rowData.image?.url ? <img src={rowData.image?.url}
            alt={rowData.name + "image"}
            className="w-6rem shadow-2 border-round" /> : ""}
        />

        <Column
          header="Icon"
          body={(rowData) => rowData.icon?.url ? <img src={rowData.icon?.url}
            alt={rowData.name + "icon"}
            className="w-6rem shadow-2 border-round" /> : ""}
        />

        <Column
          header="Weight"
          body={(rowData) => rowData.weight}
        />

        <Column
          header="Group"
          body={(rowData) => rowData.group?.name}
          filter
          filterElement={groupFilterTemplate}
        />

        <Column
          header="Edit"
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column
          header="Delete"
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
      </DataTable>
    </div>
  );
};

export default PizzaTopping;
