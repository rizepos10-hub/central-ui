import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createEntity, deleteEntities, deleteEntity, exportEntities, filterEntities, updateEntities } from "./regular-item.reducer";
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import { IRegularItem } from "app/shared/model/ITEM/restaurant/regular-item.model";
import ImageDisplay from "app/shared/components/image/image-display";
import { ITerm } from "app/shared/model/term.model";
import ImportButton from "app/shared/components/data-import/data-import";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import _ from "lodash";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { confirmDialog } from 'primereact/confirmdialog';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Dropdown } from 'primereact/dropdown';
import { actionOptions, BulkEdit } from 'app/shared/components/item/bulk-edit';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { FaCog, FaCopy } from 'react-icons/fa';
import { Menu } from 'primereact/menu';
import { Checkbox } from 'primereact/checkbox';
import { SummarizeText } from 'app/shared/util/SummarizeText';

export const RegularItem = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const LOCAL_STORAGE_KEY = 'regular-item-columns';
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const menu: any = useRef(null);
  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [localNameFilter, setLocalNameFilter] = useState("");

  const query = JSON.parse(searchParams.get("query")) || {
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

  const regularItemsList: IRegularItem[] = useAppSelector(state => state.regularItem.entities);
  const importSuccess = useAppSelector(state => state.dataImport.importSuccess);
  const categories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const loading = useAppSelector(state => state.regularItem.loading);
  const totalItems = useAppSelector(state => state.regularItem.totalItems);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(filterEntities({ query: updatedQuery }));
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
    const editUrl = `/restaurant/regular/${rowData.id}/edit`;
    return (
      <Link className="font-normal" to={editUrl}>
        {rowData.name} <br />
        <span className="text-xs">#{rowData?.variants?.length}</span>
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

  const AddonGroupsBody = rowData => {
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

  const TagsBody = rowData => {
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

  const DiscountBody = rowData => {
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

  const editColumnTemplate = (rowData) => {
    const editUrl = `/restaurant/regular/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/regular/${rowData.id}/delete`;
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
      <Link className="font-normal" key={idx} to={`/menu/${menu.id}/${menu.type}/edit?page=1&sort=id,asc`}>
        {menu.name} {idx === menus.length - 1 ? '' : ' | '}
      </Link>
    ))}</div>
  };

  const handleCreate = () => {
    navigate('/restaurant/regular/new')
  }

  useEffect(() => {
    if (selectedActionOption?.code === "MOVE_TO_TRASH") {
      confirm1()
    }
  }, [selectedActionOption])

  const confirm1 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleItemsDelete(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsDelete = async () => {
    setIsLoadingAction(true);
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(deleteEntities({
      ids: selectedProducts.map(p => p.id),
      query: updatedQuery,
    })).finally(() => setIsLoadingAction(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  useEffect(() => {
    if (selectedActionOption?.code === "EXPORT") {
      confirm2()
    }
  }, [selectedActionOption])

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
    await dispatch(exportEntities(selectedProducts.map(product => product.id))).finally(() => setIsLoadingAction(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
  };

  const duplicateColumnTemplate = (rowData) => {
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
                navigate(`/restaurant/regular/${newProductId}/edit`)
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


  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
    // Check if 'orderToday' exists in the stored data, otherwise initialize it with default visibility
    const storedFields = storedData[LOCAL_STORAGE_KEY] || {
      name: true,
      categories: true,
      image: true,
      menus: true,
      desc: true,
      productionCenter: true,
      addonGroups: true,
      tags: true,
      discounts: true
    };

    return storedFields;
  });

  const onColumnToggle = (columnKey) => {
    setVisibleColumns((prevState) => {
      const updatedColumns = {
        ...prevState,
        [columnKey]: !prevState[columnKey],
      };

      const visibleColumnsData = JSON.parse(localStorage.getItem("visible_columns")) || {};

      visibleColumnsData[LOCAL_STORAGE_KEY] = updatedColumns;

      console.log(visibleColumnsData);
      localStorage.setItem("visible_columns", JSON.stringify(visibleColumnsData));

      return updatedColumns;
    });
  };

  //localstorage options

  const toCamelCaseWithSpace = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')  // Add space before uppercase letters
      .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
      .replace(/\s+/g, ' ')         // Remove any extra spaces
      .trim(); // Remove leading and trailing spaces
  };

  const columnOptions = Object.keys(visibleColumns)
    .map((field) => ({
      field,
      header: toCamelCaseWithSpace(field), // Convert the field name to a human-readable header
    }));

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
          icon="pi pi-file-export"
          raised
          onClick={confirm2}
          tooltip="Export All"
          data-pr-position="top"
        />

        <ImportButton type={"REGULAR_RESTAURANT"} />



        <Button
          icon="pi pi-plus"
          raised
          onClick={handleCreate}
          disabled={loading}
          data-pr-position="top"
          tooltip={translate('items.view.actions.createRegular')}
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
                        checked={visibleColumns[col.field]}
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
            data-pr-position="top"
            icon={<FaCog className="text-xl" />}
            tooltip='Select Columns'
            className="border-0 p-button-text mr-auto bg-transparent hover:bg-transparent focus:bg-transparent flex items-center"
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
          products={regularItemsList}
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
        value={regularItemsList}
        loading={loading || isLoadingAction}
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

        {
          visibleColumns.name &&
          <Column
            field="name"
            header={translate('items.view.fields.name')}
            filter
            filterField="name"
            filterElement={nameFilterTemplate}
            body={nameColumnTemplate}
            filterPlaceholder={translate('items.view.filters.name')}
            sortable
          />
        }


        {
          visibleColumns.categories &&
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
        }


        {
          visibleColumns.image &&
          <Column header={translate('items.view.fields.image')} body={(rowData) =>
            <ImageDisplay
              imageType={"product"}
              imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url}
              height={50}
              width={50}
            />} />
        }

        {
          visibleColumns.menus &&
          <Column header={translate('items.view.fields.menus')} body={(rowData) =>
            <MenusTemplate rowData={rowData} />}
          />
        }

        {
          visibleColumns.desc &&
          <Column header={translate("items.view.fields.description")} field='desc' />
        }

        {
          visibleColumns.productionCenter &&
          <Column header={translate("items.view.fields.productionCenter")} body={(rowData) => <SummarizeText>{rowData?.productionCenter?.name}</SummarizeText>} field='productionCenter' />
        }

        {
          visibleColumns.addonGroups &&
          <Column
            header={translate("items.view.fields.addOnGroups")}
            body={AddonGroupsBody}
            field='addOnGroups'
            filter
            filterElement={
              <DropDownFilter
                dropDownOptionType={"ADDON_GROUP"}
                selectedOption={query?.filters?.["addonGroups.addonGroup.id"]?.value}
                fieldName={"addonGroups.addonGroup.id"}
                handleDropdownChange={handleDropdownChange}
              />
            }
          />
        }

        {
          visibleColumns.tags &&
          <Column
            header={translate("items.view.fields.tags")}
            body={TagsBody}
            field='tags'
            filter
            filterElement={
              <DropDownFilter
                dropDownOptionType={"TAG"}
                selectedOption={query?.filters?.["tags.id"]?.value}
                fieldName={"tags.id"}
                handleDropdownChange={handleDropdownChange}
              />
            }
          />
        }

        {
          visibleColumns.discounts &&
          <Column sortable={true} header={translate("items.view.fields.discounts")} body={DiscountBody} field='discounts' />
        }

        {
          <Column header={translate('items.view.fields.actions')} body={(rowData) =>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {duplicateColumnTemplate(rowData)}
              {editColumnTemplate(rowData)}
              {deleteColumnTemplate(rowData)}
            </div>

          }
          />
        }
      </DataTable>
    </div>
  );
};

export default RegularItem;
