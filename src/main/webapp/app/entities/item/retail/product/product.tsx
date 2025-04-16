import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable, DataTableFilterEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { ISimpleItem } from "app/shared/model/ITEM/retail/simple-item.model";
import { SummarizeText } from "app/shared/util/SummarizeText";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap, updateTableFilters } from "app/shared/util/filter-match-model-util";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import SharedFilter from "app/shared/components/item/shared-filter";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import AttributeFilter from "app/shared/components/filter/attribute-filter";
import { exportEntities, filterEntities, getEntities, updateEntities, purgeEntities, archiveEntities, unArchiveEntities } from "app/entities/item/retail/product/product.reducer";
import { IProduct } from "app/shared/model/ITEM/retail/product.model";
import { Accordion, AccordionTab } from "primereact/accordion";
import ImportButton from "app/shared/components/data-import/data-import";
import { Dropdown } from "primereact/dropdown";
import { Col, Container, Row, Spinner, Tooltip } from "reactstrap";
import { IoMdCloseCircle } from "react-icons/io";
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { Sidebar } from 'primereact/sidebar';
import { IItem } from "app/shared/model/ITEM/item.model";
import { actionOptions, BulkEdit } from "app/shared/components/item/bulk-edit";
import { confirmDialog } from "primereact/confirmdialog";
import { FaCog, FaCopy, FaTrash } from "react-icons/fa";
import { createEntity } from './product.reducer';
import { ColumnProps } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { Menu } from "primereact/menu";
import { Checkbox } from "primereact/checkbox";
import { FilterMatchMode } from "primereact/api";
import { ToggleButton } from "primereact/togglebutton";
interface ColumnConfig extends Partial<ColumnProps> {
  field: string;
  header: string;
  key?: string;
  seq: number;
  visible: boolean;
}
export const Product = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const LOCAL_STORAGE_KEY = 'retail-item-columns';
  const menu: any = useRef(null);
  const products: IProduct[] = useAppSelector(state => state.product.entities)
  const loading = useAppSelector(state => state.product.loading);
  const totalItems = useAppSelector(state => state.product.totalItems);
  const [visibleRight, setVisibleRight] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const storedQuery = searchParams.get("query");
  const query = storedQuery && storedQuery.trim() ? JSON.parse(storedQuery) : initialItemFilterState;
  const [localFilters, setLocalFilters] = useState(query?.filters);
  const filteredAttributes = localFilters?.["attributes.attributeTerms.id"]?.constraints || [];

  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    console.log(updatedQuery, 'updatedQuery')
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    dispatch(
      getCategories({
        page: 0,
        size: 1000,
        sort: `id,desc`,
      })
    );
  }, [])

  useEffect(() => {
    getAllEntities();
    return () => {
      searchParams.set("query", "")
    }
  }, [query?.first, query?.page, query?.rows]);

  useEffect(() => {
    onFilter(localFilters)
  }, [localFilters?.isArchived?.value])

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const onFilter = (newFilters) => {
    const newFilters1 = updateTableFilters(newFilters);
    setLocalFilters(newFilters1);
    query['first'] = 0;
    query['page'] = 0;
    query.filters = updateTableFilters({ ...localFilters });
    const queryParams = JSON.stringify(query);
    setSearchParams({ query: queryParams }, { replace: true });
    getAllEntities();
  };


  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const handleFilterValueChange = useCallback((field, value) => {
    console.log(field, value)
    const updatedFilters = {
      ...localFilters,
      [field]: value
    };

    console.log(updatedFilters)

    const cleanedFilters = updateTableFilters(updatedFilters);
    console.log(cleanedFilters)
    setLocalFilters(cleanedFilters)
  }, [query.filters, localFilters]);

  const handleClear = () => {
    setLocalFilters({});
    const newQuery = JSON.stringify({ ...initialItemFilterState });
    setSearchParams({ query: newQuery }, { replace: true });
    dispatch(getEntities({}))
  };

  const nameColumnTemplate = rowData => {
    const editUrl = `/product/${rowData.id}/edit`;
    return (
      <Link className="font-normal" to={editUrl}>
        {rowData.name}<br />
        <span className="text-xs">#{rowData?.variants?.length}</span>
      </Link>
    );
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
              sku: null,
            }));
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/product/${newProductId}/edit`)
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

  const editColumnTemplate = (rowData) => {
    const editUrl = `/product/${rowData.id}/edit`;

    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const archiveColumnTemplate = (rowData: IProduct) => {
    const deleteUrl = `/product/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const unArchiveColumnTemplate = (rowData: IProduct) => {
    return (
      <Button outlined text onClick={() => confirmUnArchiveItems([rowData])}>
        <FontAwesomeIcon icon="trash-restore" style={{ cursor: 'pointer', color: 'green', marginLeft: '1rem' }} />
      </Button>
    );
  };

  const purgeColumnTemplate = (rowData: IProduct) => {
    return (
      <Button outlined text onClick={() => confirmPurgeItems([rowData])}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Button>
    );
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


  const handleCreate = () => {
    navigate(`/product/new`)
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
      accept: () => handleItemsArchive(),
      reject: () => setSelectedActionOption(null)
    });
  };

  const handleItemsArchive = async () => {
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

  useEffect(() => {
    if (selectedActionOption?.code === "PURGE") {
      confirmPurgeItems(selectedProducts);
    }
  }, [selectedActionOption])

  const confirmPurgeItems = (products: IProduct[]) => {
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

  const handlePurgeItems = async (products: IProduct[]) => {
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

  const confirmUnArchiveItems = (products: IProduct[]) => {
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

  const handleUnArchiveItems = async (products: IProduct[]) => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(unArchiveEntities({
      ids: products.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
  }

  const columnsConfig = useMemo<ColumnConfig[]>(
    () => [
      {
        field: "name",
        header: translate("items.view.fields.name"),
        body: nameColumnTemplate,
        filterPlaceholder: translate("items.view.filters.name"),
        sortable: true,
        key: "name",
        seq: 1,
        visible: true,
      },
      {
        field: "categories",
        key: "categories",
        header: "Category",
        body: (rowData) =>
          rowData?.categories?.map((cat) => cat?.name).join(" | "),
        sortable: true,
        seq: 2,
        visible: true,
      },
      {
        field: "image",
        key: "image",
        header: translate("items.view.fields.image"),
        body: (rowData) => (
          <ImageDisplay
            imageType={"product"}
            imageUrl={
              rowData?.attachments?.[0]?.url ||
              rowData?.variants?.[0]?.attachments?.[0]?.url
            }
            height={50}
            width={50}
          />
        ),
        seq: 3,
        visible: true,
      },
      {
        field: "desc",
        key: "desc",
        header: translate("items.view.fields.description"),
        body: (rowData) => <SummarizeText>{rowData.desc}</SummarizeText>,
        seq: 4,
        visible: true,
      },
      {
        field: "stock",
        key: "stock",
        header: translate("items.view.fields.inStock"),
        sortable: true,
        seq: 5,
        visible: true,
      },
      {
        field: "productionCenter",
        key: "productionCenter",
        header: translate("items.view.fields.productionCenter"),
        body: (rowData) => (
          <SummarizeText>{rowData?.productionCenter?.name}</SummarizeText>
        ),
        headerStyle: { width: "1%", alignItems: "center", alignSelf: "center" },
        bodyStyle: { textAlign: "left", overflow: "visible" },
        seq: 7,
        visible: true,
      },
      {
        field: "tags",
        header: "Tags",
        body: TagsBody,
        key: "tags",
        seq: 8,
        visible: true,
      },
      {
        field: "discounts",
        header: translate("items.view.fields.discount"),
        body: DiscountBody,
        sortable: true,
        key: "discounts",
        seq: 9,
        visible: true,
      },
      {
        field: "actions",
        key: "actions",
        header: "Actions",
        body: (rowData) => (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {!localFilters?.isArchived?.value ? (
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
        ),
        headerStyle: { width: "5%", textAlign: "center" },
        bodyStyle: { textAlign: "center", overflow: "visible" },
        seq: 10,
        visible: true,
      },
    ],
    [localFilters]
  );

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
    const storedFields = storedData[LOCAL_STORAGE_KEY];
    if (storedFields) {
      return columnsConfig.filter(
        (col) => storedFields.includes(col.field) || col.field === "actions"
      );
    }
    return columnsConfig;
  });

  useEffect(() => {
    // Update visibleColumns when columnsConfig changes to capture updated localFilters
    setVisibleColumns((prev) =>
      columnsConfig.filter(
        (col) =>
          col.field === "actions" ||
          prev.some((p) => p.field === col.field)
      )
    );
  }, [columnsConfig]);


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

  //localstorage options
  const columnOptions = columnsConfig.filter(({ field }) => field !== 'actions').map(({ field, header }) => ({ field, header }));


  const archivedActionOptions = [
    { name: 'Restore', code: 'RESTORE', disabled: false },
    { name: 'Permenant Delete', code: 'PURGE', disabled: false },
  ];
  console.log(localFilters?.isArchived?.value, 'localFilters?.isArchived?.value')
  const header = (
    <div className="bg-dark bg-opacity-10 p-2 d-flex justify-content-between">
      <span className="text-xl d-flex align-items-center">
        <Dropdown
          value={selectedActionOption}
          onChange={(e) => setSelectedActionOption(e.value)}
          options={localFilters?.isArchived?.value ? archivedActionOptions : actionOptions}
          optionLabel="name"
          placeholder="Bulk Actions"
          className="w-full md:w-14rem"
          disabled={selectedProducts.length < 1}
          optionDisabled={(option) => option.disabled}
        />
      </span>
      {!localFilters?.isArchived?.value ? (
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

          <ImportButton type="RETAIL" data-pr-position="top" />

          <Button
            icon="pi pi-plus"
            raised
            onClick={handleCreate}
            disabled={loading}
            data-pr-position="top"
            tooltip={translate('items.view.actions.createItem')}
          />
        </div>
      ) : (
        <h4 className="text-center text-danger">
          Now viewing Recycle Bin
        </h4>
      )}

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
          <ToggleButton
            tooltip="Recycle Bin"
            data-pr-position="top"
            checked={localFilters?.isArchived?.value}
            onChange={(e) => {
              if (localFilters?.isArchived?.value) {
                handleFilterValueChange('isArchived', { value: false, matchMode: FilterMatchMode.EQUALS })
              } else {
                handleFilterValueChange('isArchived', { value: true, matchMode: FilterMatchMode.EQUALS })
              }
            }}
            onIcon={<FaTrash className="text-xl" />}
            offIcon={<FaTrash className="text-xl" />}
            onLabel=""
            offLabel=""
            className="p-button-text mr-auto"
          />


          <Button
            tooltip="Select Columns"
            data-pr-position="top"
            icon={<FaCog className="text-xl" />}
            className="p-button-text mr-auto"
            onClick={(event) => menu.current.toggle(event)}
          />
        </div>
        <Button data-pr-position="top" tooltip="Filter" className="p-button-text mr-auto" icon="pi pi-filter" onClick={() => setVisibleRight(true)} />


      </div>

    </div>
  );

  return (
    <div>
      {selectedActionOption?.code === "EDIT" && selectedProducts.length > 0 && (
        <BulkEdit
          products={products}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setSelectedActionOption={setSelectedActionOption}
          refetchEntities={getAllEntities}
          loading={loading}
          updateEntities={updateEntities}
          isRetail={true}
        />
      )}
      <Sidebar visible={visibleRight} position="right" onHide={() => setVisibleRight(false)}>
        <div className="d-flex gap-3">
          <SharedFilter filteredAttributes={filteredAttributes} onFilterValueChange={handleFilterValueChange} filters={localFilters} itemType={'RETAIL'} handleSearch={onFilter} />
        </div>
        <div className={'d-flex gap-2 justify-content-center mt-3'}>
          <Button type={'button'} severity={"info"} label={'Clear Filters'} onClick={handleClear} />
          <Button type={'submit'} label={'Search'} onClick={() => onFilter(localFilters)} />
        </div>
      </Sidebar>

      <DataTable
        value={products}
        header={header}
        lazy
        dataKey="id"
        paginator
        first={query.first}
        rows={query?.rows}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        totalRecords={totalItems}
        onPage={onPage}
        onSort={onSort}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        onFilter={onFilter}
        filters={query.filters}
        loading={loading || isLoadingAction}
        tableStyle={{ minWidth: '75rem' }}
        removableSort
        showGridlines
        className={"mt-3 header-opacity-0"}
        selectionMode={'checkbox'}
        selection={selectedProducts}
        onSelectionChange={(e) => setSelectedProducts(e.value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        {visibleColumns.map((col) => (
          <Column key={col.field} field={col.field} header={col.header} body={col.body} />
        ))}
      </DataTable>
    </div>
  );
};

export default Product;

function useRef(initialValue: any) {
  const ref = React.useRef(initialValue);
  return ref;
}