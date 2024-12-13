import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { deleteEntities, filterEntities, getEntities } from './pizza-item.reducer';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { IPizzaItem } from "app/shared/model/ITEM/restaurant/pizza-item.model";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import _ from "lodash";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Dropdown } from 'primereact/dropdown';
import { actionOptions, BulkEdit } from 'app/shared/components/item/bulk-edit';
import { updateEntities } from './pizza-item.reducer';
import { confirmDialog } from 'primereact/confirmdialog';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';

export const PizzaItem = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const pizzaItemsList: IPizzaItem[] = useAppSelector(state => state.pizzaItem.entities);
  const loading = useAppSelector(state => state.pizzaItem.loading);
  const totalItems = useAppSelector(state => state.pizzaItem.totalItems);


  const [searchParams, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || JSON.parse(searchParams.get("query")) || {
    first: 0,
    rows: 20,
    page: 0,
    sortField: null,
    sortOrder: null,
    query: '',
    filters: {
      "categories.id": { value: null, matchMode: FilterMatchMode.EQUALS },
      "attributes": { value: null, matchMode: FilterMatchMode.EQUALS },
      name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  };

  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);



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
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const onFilter = (event: DataTableFilterEvent) => {
    const debouncedSearchAction = _.debounce(() => {
      event['first'] = 0;
      event['page'] = 0;
      const queryParams = JSON.stringify(event);
      setSearchParams({ query: queryParams }, { replace: true })
    }, 300);
    debouncedSearchAction();
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };


  const handleDropdownChange = (field, value) => {
    const newQuery = JSON.stringify({
      ...query,
      filters: {
        ...query.filters,
        [field]: value
      }
    });
    setSearchParams({ query: newQuery }, { replace: true });
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
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/pizza/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const MenusTemplate = (rowData) => {
    const menus = []
    rowData?.rowData?.menus?.forEach(menu => {
      menus.push({
        name: menu.name,
        id: menu.id,
        type: menu.type,
      })
    })

    return <div>{menus.map((menu, idx) => (
      <Link key={idx} to={`/menu/${menu.id}/${menu.type}/edit?page=1&sort=id,asc`}>
        {menu.name} {idx === menus.length - 1 ? '' : ' | '}
      </Link>
    ))}</div>
  };

  const handleCreate = () => {
    navigate('/restaurant/pizza/new')
  }

  useEffect(() => {
    if (selectedActionOption?.code === "MOVE_TO_TRASH") {
      confirm1()
    }
  }, [selectedActionOption])

  const nameFilterTemplate = () => {
    const [name, setName] = useState('');

    return (
      <form onSubmit={(e) => {
        e.preventDefault()
        const newQuery = {
          ...query,
          filters: {
            ...query.filters,
            name: {
              ...query.filters?.name,
              value: name,
              matchMode: query.filters?.name?.matchMode || FilterMatchMode.CONTAINS,
            },
          }
        }

        const updatedQuery = applyMatchModeMap(newQuery);


        dispatch(filterEntities({
          query: updatedQuery,
        }));
      }}>
        <InputText
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-inputtext-sm"
          placeholder="Search by Name"
        />
      </form>
    );
  };

  const confirm1 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handleItemsDelete(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsDelete = async () => {
    setIsLoadingDelete(true);
    await dispatch(deleteEntities(selectedProducts.map(product => product.id))).finally(() => setIsLoadingDelete(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl">
        <Dropdown
          value={selectedActionOption}
          onChange={(e) => setSelectedActionOption(e.value)}
          options={actionOptions}
          optionLabel="name"
          placeholder="Bulk Actions"
          className="w-full md:w-14rem"
          disabled={selectedProducts.length < 1}
          optionDisabled={(option) => option.disabled}
        />
      </span>
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
    <div>
      {selectedActionOption?.code === "EDIT" && selectedProducts.length > 0 && (
        <BulkEdit
          products={pizzaItemsList}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setSelectedActionOption={setSelectedActionOption}
          refetchEntities={getAllEntities}
          loading={loading}
          updateEntities={updateEntities}
          isRetail={false}
        />
      )}
      <DataTable
        value={pizzaItemsList}
        loading={loading || isLoadingDelete}
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
        showGridlines
        selectionMode='checkbox'
        selection={selectedProducts}
        onSelectionChange={(e) => setSelectedProducts(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column filterElement={nameFilterTemplate} field="name" header={translate('items.view.fields.name')} filter body={nameColumnTemplate} filterPlaceholder={translate('items.view.filters.name')} sortable />

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

        <Column header={translate('items.view.fields.image')} body={(rowData) =>
          <ImageDisplay
            imageType={"product"}
            imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url}
            height={50}
            width={50}
          />} />

        <Column header={translate('items.view.fields.menus')} body={(rowData) =>
          <MenusTemplate rowData={rowData} />}
        />

        <Column field="desc" header={translate('items.view.fields.type')} body={(rowData) =>
          rowData?.variants?.[0]?.pizzaVariantType
        }
        />

        <Column field="Type" header={translate('items.view.fields.description')} />

        <Column field="stock" sortable header={translate('items.view.fields.inStock')} />

        <Column header={translate('items.view.fields.edit')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('items.view.fields.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


      </DataTable>
    </div>
  );
};

export default PizzaItem;
