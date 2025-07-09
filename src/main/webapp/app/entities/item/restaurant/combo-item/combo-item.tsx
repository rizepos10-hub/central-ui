import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import { IComboItem } from "app/shared/model/ITEM/restaurant/combo-item.model";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import { archiveEntities, exportEntities, filterEntities, updateEntities, createEntity, purgeEntities, unArchiveEntities } from "./combo-item.reducer";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Dropdown } from 'primereact/dropdown';
import { actionOptions, BulkEdit } from 'app/shared/components/item/bulk-edit';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { FaCog, FaCopy, FaTrash } from 'react-icons/fa';
import _ from 'lodash';
import { Menu } from 'primereact/menu';
import { Checkbox } from 'primereact/checkbox';
import { SummarizeText } from 'app/shared/util/SummarizeText';
import { ToggleButton } from 'primereact/togglebutton';

export const ComboItem = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const menu: any = useRef(null);
  const LOCAL_STORAGE_KEY = 'combo-item-columns';
  const comboItemsList: IComboItem[] = useAppSelector(state => state.comboItem.entities);
  const loading = useAppSelector(state => state.comboItem.loading);
  const totalItems = useAppSelector(state => state.comboItem.totalItems);
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
      "isArchived": { value: false, matchMode: FilterMatchMode.EQUALS },
    }
  };

  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

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

  const handleIsArchivedChange = (value) => {
    const queryParams = JSON.stringify({
      ...query,
      page: 0,
      first: 0,
      filters: {
        ...query.filters,
        ["isArchived"]: { value, matchMode: FilterMatchMode.EQUALS }
      }
    })
    setSearchParams({ query: queryParams }, { replace: true })
  }

  useEffect(() => {
    setLocalNameFilter(query?.filters?.name?.value ?? '');
  }, [query?.filters?.name?.value]);

  const nameColumnTemplate = rowData => {
    const editUrl = `/restaurant/combo/${rowData.id}/edit`;
    return (
      <Link className="font-normal" to={editUrl}>
        {rowData.name} <br />
        <span className="text-xs">
          #{rowData?.variants?.reduce((total, variant) => {
            return total + (variant?.comboPackages?.length || 0);
          }, 0)}
        </span>
      </Link>
    );
  };
  const editColumnTemplate = (rowData) => {
    const editUrl = `/restaurant/combo/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
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

  const archiveColumnTemplate = (rowData) => {
    const deleteUrl = `/restaurant/combo/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };


  const unArchiveColumnTemplate = (rowData) => {
    return (
      <Button outlined text onClick={() => confirmUnArchiveItems([rowData])}>
        <FontAwesomeIcon icon="trash-restore" style={{ cursor: 'pointer', color: 'green', marginLeft: '1rem' }} />
      </Button>
    );
  };

  const purgeColumnTemplate = (rowData) => {
    return (
      <Button outlined text onClick={() => confirmPurgeItems([rowData])}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Button>
    );
  };

  useEffect(() => {
    if (selectedActionOption?.code === "PURGE") {
      confirmPurgeItems(selectedProducts);
    }
  }, [selectedActionOption])

  const confirmPurgeItems = (products: IComboItem[]) => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handlePurgeItems(products),
      // reject: () => setSelectedActionOption(null)
    });
  };

  const handlePurgeItems = async (products: IComboItem[]) => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(purgeEntities({
      ids: products.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  useEffect(() => {
    if (selectedActionOption?.code === "RESTORE") {
      confirmUnArchiveItems(selectedProducts);
    }
  }, [selectedActionOption])

  const confirmUnArchiveItems = (products: IComboItem[]) => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handleUnArchiveItems(products),
      // reject: () => setSelectedActionOption(null)
    });
  };

  const handleUnArchiveItems = async (products: IComboItem[]) => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(unArchiveEntities({
      ids: products.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }



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
    navigate('/restaurant/combo/new')
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
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handleItemsDelete(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsDelete = async () => {
    setIsLoadingAction(true);
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(archiveEntities({
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
        style={{ width: '150px' }}
        className="p-inputtext-sm"
        placeholder="Search by Name"
      />
    );
  };

  const confirm2 = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      accept: () => handleItemsExport(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsExport = async () => {
    setIsLoadingAction(true);
    await dispatch(exportEntities(selectedProducts.map(product => product.id))).finally(() => setIsLoadingAction(false));
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
                navigate(`/restaurant/combo/${newProductId}/edit`)
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

  const archivedActionOptions = [
    { name: 'Restore', code: 'RESTORE', disabled: false },
    { name: 'Permenant Delete', code: 'PURGE', disabled: false },
  ];
  
  return (
    <div>
      {selectedActionOption?.code === "EDIT" && selectedProducts.length > 0 && (
        <BulkEdit
          products={comboItemsList}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setSelectedActionOption={setSelectedActionOption}
          refetchEntities={getAllEntities}
          loading={loading}
          updateEntities={updateEntities}
          isRetail={false}
        />
      )}
      
      {/* Header moved outside of DataTable */}
      <div className="bg-dark bg-opacity-10 p-2 d-flex justify-content-between">
        <span className="text-xl d-flex align-items-center">
          <Dropdown
            value={selectedActionOption}
            onChange={(e) => setSelectedActionOption(e.value)}
            options={query?.filters?.isArchived?.value ? archivedActionOptions : actionOptions}
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

          <Button
            icon="pi pi-plus"
            raised
            onClick={handleCreate}
            // disabled={loading}
            data-pr-position="top"
            tooltip={translate('items.view.actions.createCombo')}
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

            <ToggleButton
              tooltip="Recycle Bin"
              data-pr-position="top"
              checked={query?.filters?.isArchived?.value}
              onChange={(e) => {
                if (query?.filters?.isArchived?.value) {
                  handleIsArchivedChange(false)
                } else {
                  handleIsArchivedChange(true)
                }
              }}
              onIcon={<FaTrash className="text-xl" />}
              offIcon={<FaTrash className="text-xl" />}
              onLabel=""
              offLabel=""
              className="p-button-text mr-auto"
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

      <DataTable
        value={comboItemsList}
        loading={loading || isLoadingAction}
        editMode="row"
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

        {visibleColumns.name &&
          <Column
            field="name"
            header={translate('items.view.fields.name')}
            filter
            filterField="name"
            filterElement={nameFilterTemplate}
            body={nameColumnTemplate}
            filterPlaceholder={translate('items.view.filters.name')}
            sortable
            headerStyle={{ width: '300px' }}
            style={{ width: '300px' }}
          />
        }


        {visibleColumns.categories &&
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
            headerStyle={{ width: '150px' }}
            style={{ width: '150px' }}
          />
        }


        {visibleColumns.image &&
          <Column header={translate('items.view.fields.image')} body={(rowData) =>
            <ImageDisplay
              imageType={"product"}
              imageUrl={rowData?.attachments?.[0]?.url || rowData?.variants?.[0]?.attachments?.[0]?.url}
              height={50}
              width={50}
            />} />
        }

        {visibleColumns.menus &&
          <Column header={translate('items.view.fields.menus')} body={(rowData) =>
            <MenusTemplate rowData={rowData} />}
          />
        }

        {visibleColumns.desc &&
          <Column header={translate("items.view.fields.description")} field='description' />
        }

        {visibleColumns.productionCenter &&
          <Column header={translate("items.view.fields.productionCenter")} body={(rowData) => <SummarizeText>{rowData?.productionCenter?.name}</SummarizeText>} field='productionCenter' />
        }

        {visibleColumns.addonGroups &&
          <Column
            header={translate("items.view.fields.addOnGroups")}
            body={AddonGroupsBody}
            field='addonGroups'
            filter
            filterElement={
              <DropDownFilter
                dropDownOptionType={"ADDON_GROUP"}
                selectedOption={query?.filters?.["addonGroups.addonGroup.id"]?.value}
                fieldName={"addonGroups.addonGroup.id"}
                handleDropdownChange={handleDropdownChange}
              />
            }
            headerStyle={{ width: '150px' }}
            style={{ width: '150px' }}
          />
        }

        {visibleColumns.tags &&
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

        {visibleColumns.discounts &&
          <Column sortable={true} header={translate("items.view.fields.discounts")} body={DiscountBody} field='discounts' />
        }

        {
          <Column header={translate('items.view.fields.actions')} body={(rowData) =>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {!query?.filters?.isArchived?.value ? (
                <>
                  {duplicateColumnTemplate(rowData)}
                  {editColumnTemplate(rowData)}
                  {archiveColumnTemplate(rowData)}
                </>
              ) : (
                <>
                  {unArchiveColumnTemplate(rowData)}
                  {purgeColumnTemplate(rowData)}
                </>
              )}
            </div>

          }
          />
        }

      </DataTable>
    </div>
  );
};

export default ComboItem;
