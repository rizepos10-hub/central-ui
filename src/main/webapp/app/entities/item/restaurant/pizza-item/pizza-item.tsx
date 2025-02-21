import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createEntity, deleteEntities, filterEntities, getEntities } from './pizza-item.reducer';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
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
import { FaCog, FaCopy } from 'react-icons/fa';
import { Menu } from 'primereact/menu';
import { Checkbox } from 'primereact/checkbox';
import { SummarizeText } from 'app/shared/util/SummarizeText';

interface ColumnConfig extends Partial<ColumnProps> {
  field: string;
  header: string;
  key?: string;
  seq: number;
  visible: boolean
}

export const PizzaItem = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const menu: any = useRef(null);
  const LOCAL_STORAGE_KEY = 'pizza-item-columns';
  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const pizzaItemsList: IPizzaItem[] = useAppSelector(state => state.pizzaItem.entities);
  const loading = useAppSelector(state => state.pizzaItem.loading);
  const totalItems = useAppSelector(state => state.pizzaItem.totalItems);
  const [searchParams, setSearchParams] = useSearchParams();

  const [localNameFilter, setLocalNameFilter] = useState("");

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

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

  const onFilter = (event: DataTableFilterEvent) => {
    debouncedFilter(event);
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
      <Link className="font-normal" to={editUrl}>
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

      const AddonLinkTemplate = ({ rowData }) => {
        if (!rowData) return null; // If addonGroup is empty or undefined, return nothing
        return (
          <Link className="font-normal" to={`/addon-groups/${rowData.id}/edit`}>
            {rowData.name}
          </Link>
        );
      };
    
      const AddonGroupsBody =  rowData => {
        const addonGroups = rowData?.addonGroups;
      
        if (!addonGroups || addonGroups.length === 0) {
          return "No Addons"; // Display when no addons are available
        }
      
        // Map through addonGroups and render them as links separated by "|"
        return addonGroups.map((addon, index) => (
          <>
            <AddonLinkTemplate key={addon?.addonGroup?.id} rowData={addon?.addonGroup} />
            {index < addonGroups.length - 1 && ' | '}
          </>
        ));
      };
    
      const TagsBody =  rowData => {
        const tags = rowData?.tags;
      
        if (!tags || tags.length === 0) {
          return "No Tags"; // Display when no addons are available
        }
      
        // Map through addonGroups and render them as links separated by "|"
        return tags.map((tag, index) => (
          <>
          <Link className="font-normal" to={`/tag/${tag.id}/edit`}>
            {tag.name}
            {index < tags.length - 1 && ' | '}
          </Link>
          </>
        ));
      };
      
  const DiscountBody =  rowData => {
    const discounts = rowData?.discounts;
    if (!discounts || discounts.length === 0) {
      return "No Discounts"; // Display when no addons are available
    }
  
    // Map through addonGroups and render them as links separated by "|"
    return discounts.map((discount, index) => (
      <>

      <Link className="font-normal" to={`/discount/${discount.id}/edit`}>
      {discount.value} {discount.type === "PERCENTAGE" ? "%" : "$"}
        {index < discounts.length - 1 && ' | '}
      </Link>
      </>
    ));
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
      <Link className="font-normal" key={idx} to={`/menu/${menu.id}/${menu.type}/edit?page=1&sort=id,asc`}>
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
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(deleteEntities({
      ids: selectedProducts.map(p => p.id),
      query: updatedQuery,
    })).finally(() => setIsLoadingDelete(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  const duplicateColumnTemplate = (rowData) => {
    console.log(rowData)
    return (
      <Button
        className="d-flex justify-content-center w-100"
        onClick={() => confirmDialog({
          message: 'Are you sure you want to duplicate this product?',
          header: 'Duplicate Product',
          icon: 'pi pi-exclamation-triangle',
          accept() {
            const { id, ...entityWithoutId } = rowData;
            entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
              ...variantWithoutId,
            }));
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/restaurant/pizza/${newProductId}/edit`)
              }
            });
          }
        })}
        text
      >
        <FaCopy style={{ cursor: 'pointer', color: 'black', marginLeft: '0.3rem' }} />
      </Button>
    );
  };

  const columnsConfig: ColumnConfig[] = [
    {
      field: "name",
      header: translate("items.view.fields.name"),
      body: nameColumnTemplate,
      filterPlaceholder: translate("items.view.filters.name"),
      filter: true,
      filterField: "name",
      filterElement: nameFilterTemplate,
      sortable: true,
      key: "name",
      seq: 1,
      visible: true
    },
    {
      field: "categories",
      header: "Category",
      body: (rowData) => rowData?.categories?.map((cat) => cat?.name).join(" | "),
      sortable: true,
      filter: true,
      showFilterMatchModes: false,
      filterElement: (
        <DropDownFilter
          dropDownOptionType={"RESTAURANT_CATEGORY"}
          selectedOption={query?.filters?.["categories.id"]?.value}
          fieldName={"categories.id"}
          handleDropdownChange={handleDropdownChange}
        />
      ),
      key: "categories",
      seq: 2,
      visible: true
    },
    {
      field: "image",
      header: translate("items.view.fields.image"),
      body: (rowData) => (
        <ImageDisplay
          imageType={"product"}
          imageUrl={
            rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url
          }
          height={50}
          width={50}
        />
      ),
      key: "image",
      seq: 3,
      visible: true
    },
    {
      field: "menus",
      header: translate("items.view.fields.menus"),
      body: (rowData) => <MenusTemplate rowData={rowData} />,
      key: "menus",
      seq: 4,
      visible: true
    },
    {
      field: "desc",
      header: translate("items.view.fields.type"),
      body: (rowData) => rowData?.variants?.[0]?.pizzaVariantType,
      key: "desc",
      seq: 5,
      visible: true
    },
    {
      field: "Type",
      header: translate("items.view.fields.description"),
      key: "Type",
      seq: 6,
      visible: true
    },

    {
      field: "productionCenter",
      key: "productionCenter",
      header: translate("items.view.fields.productionCenter"),
      body: (rowData) => <SummarizeText>{rowData?.productionCenter?.name}</SummarizeText>,
      headerStyle: { width: "1%", alignItems: "center", alignSelf: "center" },
      bodyStyle: { textAlign: "left", overflow: "visible" },
      seq: 7,
      visible: true
    },

    {
      field: "addonGroups",
      header: "Addon Groups",
      body: AddonGroupsBody,
      key: "addonGroups",
      seq: 8,
      visible: true
    },

    {
      field: "tags",
      header: "Tags",
      body: TagsBody,
      key: "tags",
      seq: 9,
      visible: true
    },

    {
      field: "discounts",
      header: translate("items.view.fields.discount"),
      body: DiscountBody,
      sortable: true,
      key: "discounts",
      seq: 10,
      visible: true
    },

    {
      field: "actions",
      key: "actions",
      header: "Actions",
      body: (rowData) => (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {duplicateColumnTemplate(rowData)}
          {editColumnTemplate(rowData)}
          {deleteColumnTemplate(rowData)}
        </div>
      ),
      headerStyle: { width: "5%", textAlign: "center" },
      bodyStyle: { textAlign: "center", overflow: "visible" },
      seq: 11,
      visible: true
    }
  ];
  
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
    const storedFields = storedData[LOCAL_STORAGE_KEY];
  
    if (storedFields) {
      return columnsConfig.filter(col => storedFields.includes(col.field) || col.field === "actions");
    }
  
    return columnsConfig; // Default to all columns
  });


  const onColumnToggle = (field) => {
    let updatedColumns;
  
    if (visibleColumns.some((col) => col.field === field && col.field !== "actions")) {
      updatedColumns = visibleColumns.filter((col) => col.field !== field);
    } else {
      const columnToAdd = columnsConfig.find((col) => col.field === field);
      if (columnToAdd) {
        updatedColumns = [...visibleColumns, columnToAdd].sort((a, b) => a.seq - b.seq);
      }
    }
  
    // Ensure "actions" is always included
    updatedColumns = updatedColumns.filter(col => col.field === "actions" || columnsConfig.some(config => config.field === col.field));
  
    // Get existing stored items
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
    storedData[LOCAL_STORAGE_KEY] = updatedColumns.map(col => col.field); // Store only field names
  
    localStorage.setItem("visible_columns", JSON.stringify(storedData));
  
    setVisibleColumns(updatedColumns || []);
  };
  
  const columnOptions = columnsConfig.filter(( { field } ) => field !== 'actions').map(({ field, header }) => ({ field, header }));

  const header = (
    <div className="bg-dark bg-opacity-10 p-2 d-flex justify-content-between">
      <span className="text-xl d-flex align-items-center">
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
          icon="pi pi-plus" 
          raised 
          onClick={handleCreate} 
          disabled={loading} 
          data-pr-position="top"
          tooltip={translate('items.view.actions.createPizza')} 
        />
      </div>

      <div className="flex justify-between items-center">
          <div className="relative d-flex justify-end mr-auto">
            <Menu
              model={[
                {
                  label: "Select Columns",
                  items: columnOptions.map((col) => ({
                    template: () => (
                      <div className="p-menuitem mt-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          inputId={col.field}
                          checked={visibleColumns.some((c) => c.field === col.field)}
                          onChange={() => onColumnToggle(col.field)}
                        />
                        <label className="ml-2" htmlFor={col.field} >{col.header}</label>
                      </div>
                    ),
                  })),
                },
              ]}
              popup
              ref={menu}
            />
            <Button
              icon={<FaCog className="text-xl" />}
              className="p-button-text mr-auto"
              onClick={(event) => menu.current.toggle(event)}
            />
          </div>
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
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          {visibleColumns.map((col) => (
          <Column key={col.key} {...col} />
        ))}
      </DataTable>
    </div>
  );
};

export default PizzaItem;
