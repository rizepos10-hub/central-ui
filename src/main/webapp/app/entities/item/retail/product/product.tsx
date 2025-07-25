import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link,  useNavigate, useSearchParams } from "react-router-dom";
import { Button } from 'primereact/button';
import { getSortState, Translate, translate} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { SummarizeText } from "app/shared/util/SummarizeText";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap, updateTableFilters } from "app/shared/util/filter-match-model-util";
import SharedFilter from "app/shared/components/item/shared-filter";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { exportEntities, filterEntities, getEntities, updateEntities, purgeEntities, archiveEntities, unArchiveEntities, updateEntity } from "app/entities/item/retail/product/product.reducer";
import { IProduct } from "app/shared/model/ITEM/retail/product.model";
import ImportButton from "app/shared/components/data-import/data-import";
import { Dropdown } from "primereact/dropdown";
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { Sidebar } from 'primereact/sidebar';
import { IItem } from "app/shared/model/ITEM/item.model";
import { actionOptions, BulkEdit } from "app/shared/components/item/bulk-edit";
import { confirmDialog } from "primereact/confirmdialog";
import { FaCog, FaCopy, FaTrash } from "react-icons/fa";
import { createEntity } from './product.reducer';
import { ColumnProps } from "primereact/column";
import { Menu } from "primereact/menu";
import { Checkbox } from "primereact/checkbox";
import { FilterMatchMode } from "primereact/api";
import { ToggleButton } from "primereact/togglebutton";
import { Dialog } from "primereact/dialog";
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { formatVariant } from "app/shared/util/variant-utils";
import { getEntities as getWarehouses } from "app/entities/inventory/warehouse/warehouse.reducer";
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { TabView, TabPanel } from 'primereact/tabview';
import { SourceType } from "app/shared/model/ENUMS/source-type.model";
import { Spinner } from "reactstrap";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import AttributeFilter from "app/shared/components/filter/attribute-filter";
interface ColumnConfig extends Partial<ColumnProps> {
  field: string;
  header: string;
  key?: string;
  seq: number;
  visible: boolean;
  width?: string;
}
export const Product = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const LOCAL_STORAGE_KEY = 'retail-item-columns';
  const menu: any = useRef(null);
  const products: IProduct[] = useAppSelector(state => state.product.entities)
  const loading = useAppSelector(state => state.product.loading);
  const totalItems = useAppSelector(state => state.product.totalItems);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const storedQuery = searchParams.get("query");
  const query = storedQuery && storedQuery.trim() ? JSON.parse(storedQuery) : initialItemFilterState;
  const [localFilters, setLocalFilters] = useState(query?.filters);
  const filteredAttributes = localFilters?.["attributes.attributeTerms.id"]?.constraints || [];

  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const wareHouses = useAppSelector((state) => state.warehouse.entities);
  const salesLocations = useAppSelector((state) => state.salesLocation.entities);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, "id"), location.search)
  );
    
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

    dispatch(getWarehouses({}));
    dispatch(
      getSalesLocations({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
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
    const cleanedFilters = updateTableFilters({ ...newFilters });
    query['first'] = 0;
    query['page'] = 0;
    query.filters = cleanedFilters;
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

    // Don't clean filters here to preserve matchMode when value is empty
    setLocalFilters(updatedFilters)
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

  const TaxBody = rowData => {
    const taxes = rowData?.accountingGroups;
    
    if (!taxes || taxes.length === 0) { 
      return "No Taxes";
    }

    return taxes.map((tax, index) => (
      <span key={tax.id}>{tax.name} {index < taxes.length - 1 && ' | '}</span>
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

  const rowExpansionTemplate = (rowData: IProduct) => {
    if (!rowData.variants || rowData.variants.length <= 1) {
      return null;
    }

    return (
      <div className="p-3">
        <h5>Variants Stock Details</h5>
        <DataTable value={rowData.variants} responsiveLayout="scroll">
          <Column 
            field="name" 
            header="Variant Name" 
            body={(variant) => formatVariant(variant?.name, variant?.attributeValues)}
          />
          <Column 
            field="sku" 
            header="SKU" 
            body={(variant) => variant.sku || 'N/A'}
          />
          <Column 
            field="stockQuantities" 
            header="Stock Quantities" 
            body={(variant) => (
              Object.entries(variant?.stockQuantities || {}).map(([key, stock]: [string, IStockQuantity]) => (
                <span key={stock?.location?.id} className="d-flex flex-row">
                  <span className="col-6 p-0 fs-6">{stock?.location?.name}</span>
                  <span className="col-6 p-0 fs-6 fw-bold">{stock?.quantity}</span>
                </span>
              ))
            )}
          />
        </DataTable>
      </div>
    );
  };

  const StockStatusDialog = ({
    dialogVisible,
    onHide,
    variants,
    wareHouses,
    salesLocations,
  }: {
    dialogVisible: boolean;
    onHide: () => void;
    variants: any[];
    wareHouses: any[];
    salesLocations: any[];
  }) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [tabStateMap, setTabStateMap] = useState<Record<string, "WAREHOUSE" | "SALES_LOCATION">>({});
  
    useEffect(() => {
      const defaultTabs = variants.reduce((acc, v) => {
        acc[v.id] = "WAREHOUSE";
        return acc;
      }, {});
      setTabStateMap(defaultTabs);
    }, [variants]);
  
    return (
      <Dialog
        header="Stock Details"
        visible={dialogVisible}
        style={{ width: "60vw" }}
        onHide={onHide}
      >
        <DataTable
          value={variants}
          responsiveLayout="scroll"
          rowExpansionTemplate={(rowData) => (
            <VariantStockTabs
              variant={rowData}
              tabState={tabStateMap}
              setTabState={setTabStateMap}
              wareHouses={wareHouses}
              salesLocations={salesLocations}
            />
          )}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          dataKey="id"
        >
          <Column expander style={{ width: "3em" }} />
          <Column
            field="variants"
            header="Variant Name"
            body={(data) => formatVariant(data?.name, data?.attributeValues)}
          />
        </DataTable>
      </Dialog>
    );
  };

  const VariantStockTabs = ({
    variant,
    tabState,
    setTabState,
    wareHouses,
    salesLocations,
  }: {
    variant: any;
    tabState: Record<string, "WAREHOUSE" | "SALES_LOCATION">;
    setTabState: React.Dispatch<React.SetStateAction<Record<string, "WAREHOUSE" | "SALES_LOCATION">>>;
    wareHouses: any[];
    salesLocations: any[];
  }) => {
    const renderStockByType = (type: "WAREHOUSE" | "SALES_LOCATION") => {
      const relevantLocations = type === "WAREHOUSE" ? wareHouses : salesLocations;
      const locationSet = new Set(relevantLocations.map((l) => l.name));
  
      const filteredStocks = Object.entries(variant.stockQuantities || {})
        .filter(([_, stock]: [string, IStockQuantity]) => locationSet.has(stock?.location?.name))
        .map(([key, stock]) => ({ key, stock }));
  
      return (
        <div className="p-3">
          <StockRowTable stockEntries={filteredStocks} />
        </div>
      );
    };
  
    return (
      <TabView
        activeIndex={tabState[variant.id] === "SALES_LOCATION" ? 1 : 0}
        onTabChange={(e) =>
          setTabState((prev) => ({
            ...prev,
            [variant.id]: e.index === 0 ? "WAREHOUSE" : "SALES_LOCATION",
          }))
        }
      >
        <TabPanel header="Warehouses">{renderStockByType("WAREHOUSE")}</TabPanel>
        <TabPanel header="Sales Locations">{renderStockByType("SALES_LOCATION")}</TabPanel>
      </TabView>
    );
  };

  const handleChangeIsVisible = (rowData, application: SourceType, value: boolean) => {
    const visibility = rowData.visibility ?? [];

    const hasApplication = visibility.some(v => v.application === application);

    const updatedVisibility = hasApplication
      ? visibility.map(v =>
        v.application === application ? { ...v, visible: value } : v
      )
      : [
        ...visibility,
        {
        application,
        visible: value,
        schedule: {},
        },
      ];

    const newRowData = { ...rowData, visibility: updatedVisibility };

    dispatch(updateEntity(newRowData as IProduct)).then(() => {
      getAllEntities();
    });
  };
    
  

  const StockRowTable = ({
    stockEntries,
  }: {
    stockEntries: { key: string; stock: IStockQuantity }[];
  }) => {
    return (
      <DataTable
        value={stockEntries}
        responsiveLayout="scroll"
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <Column
          field="stock.location.name"
          header={translate("common.location")}
          body={(data) => (
            <span className="font-bold">{data.stock?.location?.name || "Unknown"}</span>
          )}
          style={{ width: "25%" }}
        />
        <Column
          field="stock.quantity"
          header={translate("common.quantity")}
          body={(data) => <span className="font-medium">{data.stock.quantity}</span>}
          style={{ width: "25%" }}
        />
        <Column
          field="stock.minimumStockLevel"
          header={translate("common.minimumStockLevel")}
          body={(data) => <span className="font-medium">{data.stock.minimumStockLevel}</span>}
          style={{ width: "25%" }}
        />
        <Column
          field="status"
          header={translate("common.status")}
          body={(data) => (
            <span>
              {data.stock.quantity > data.stock.minimumStockLevel ? (
                <i className="pi pi-check-circle" style={{ color: "green", fontSize: "1.2rem" }}></i>
              ) : (
                <i className="pi pi-times-circle" style={{ color: "red", fontSize: "1.2rem" }}></i>
              )}
            </span>
          )}
          style={{ width: "25%" }}
        />
      </DataTable>
    );
  };

  const columnsConfig = useMemo<ColumnConfig[]>(
    () => [
      {
        field: "name",
        header: translate("items.view.fields.name"),
        style: { width: "100px" },
        body: nameColumnTemplate,
        filterPlaceholder: translate("items.view.filters.name"),
        sortable: true,
        key: "name",
        seq: 1,
        visible: true,
        width: "100px",
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
        width: "100px",
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
        width: "100px",
      },
      {
        field: "stockQuantities",
        key: "stock",
        header: translate("items.view.fields.inStock"),
        body(rowData) {
          const variants = rowData.variants || [];
          const [dialogVisible, setDialogVisible] = useState(false);
        
          let totalBelowMin = 0;
          let totalVariants = 0;
        
          variants.forEach((variant) => {
            const stockMap = variant.stockQuantities || {};
            Object.values(stockMap).forEach((stock: IStockQuantity) => {
              if (stock.quantity <= stock.minimumStockLevel) totalBelowMin++;
              totalVariants++;
            });
          });
        
          const color =
            totalVariants === 0
              ? "red"
              : totalBelowMin === totalVariants
              ? "red"
              : totalBelowMin > 0
              ? "orange"
              : "green";
        
          return (
            <>
              <div
                style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                onClick={() => setDialogVisible(true)}
              >
                <div className="p-d-flex p-ai-center p-jc-center" style={{ marginRight: "8px" }}>
                  <i
                    className="pi pi-circle-fill"
                    style={{
                      fontSize: "10px",
                      color,
                      fill: color,
                    }}
                  ></i>
                </div>
              </div>
        
              <StockStatusDialog
                dialogVisible={dialogVisible}
                onHide={() => setDialogVisible(false)}
                variants={variants}
                wareHouses={wareHouses}
                salesLocations={salesLocations}
              />
            </>
          );
        },
        sortable: true,
        seq: 5,
        visible: true,
      },
      {
        field: "stockQnantity",
        key: "stockQnantity",
        header: translate("items.view.fields.stockQnantity"),
        body: (rowData: IProduct) => (
          <>
            {rowData?.variants?.length === 1 ? (
              <span className="d-flex gap-0 flex-column">
                {Object.entries(rowData?.variants?.[0]?.stockQuantities || {}).map(([key, stock]: [string, IStockQuantity]) => (
                  <div key={stock?.location?.id} className="d-flex gap-2 flex-row border-bottom">
                    <span className="col-9 p-0 fs-6">{stock?.location?.name}</span>
                    <span className="col-3 p-0 fs-6 fw-bold">{stock?.quantity}</span>
                  </div>
                ))}
              </span>
            ) : (
              <span className="d-flex gap-0 flex-column">
                <span className="fw-bold">{rowData?.variants?.length} variants</span>
                <span className="text-xs text-500">Expand to view details</span>
              </span>
            )}
          </>
        ),
        headerStyle: { width: "1%", alignItems: "center", alignSelf: "center" },
        bodyStyle: { textAlign: "left", overflow: "visible" },
        seq: 6,
        visible: true,
        width: "300px",
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
        width: "100px",
      },
      {
        field: "accountingGroups",
        header: "Taxes",
        body: TaxBody,
        key: "accountingGroups",
        seq: 8,
        visible: true,
        width: "100px",
      },
      {
        field: "tags",
        header: "Tags",
        body: TagsBody,
        key: "tags",
        seq: 8,
        visible: true,
        width: "100px",
      },
      {
        field: "discounts",
        header: translate("items.view.fields.discount"),
        body: DiscountBody,
        sortable: true,
        key: "discounts",
        seq: 9,
        visible: true,
        width: "50px",
      },
      {
        field: "branchPosVisibility",
        key: "branchPosVisible",
        header: translate("items.view.fields.pos_visibility"),
        body(rowData: IProduct) {
          const visible =
            rowData.visibility?.find(v => v.application === SourceType.BRANCH_POS)?.visible ?? true;
      
          return (
            <Checkbox
              inputId={`isVisible-BRANCH_POS-${rowData.id}`}
              onChange={(e) => handleChangeIsVisible(rowData, SourceType.BRANCH_POS, e.checked)}
              checked={visible}
            />
          );
        },
        headerStyle: { width: "1%", alignItems: "center", alignSelf: "center" },
        bodyStyle: { textAlign: "left", overflow: "visible" },
        seq: 10,
        visible: true,
        width: "50px",
      },
      {
        field: "onlineOrderingVisibility",
        key: "onlineOrderingVisible",
        header: translate("items.view.fields.website_visibility"),
        body(rowData: IProduct) {
          const visible =
            rowData.visibility?.find(v => v.application === SourceType.ONLINE_ORDERING)?.visible ?? true;
      
          return (
            <Checkbox
              inputId={`isVisible-ONLINE_ORDERING-${rowData.id}`}
              onChange={(e) => handleChangeIsVisible(rowData, SourceType.ONLINE_ORDERING, e.checked)}
              checked={visible}
            />
          );
        },
        headerStyle: { width: "1%", alignItems: "center", alignSelf: "center" },
        bodyStyle: { textAlign: "left", overflow: "visible" },
        seq: 11,
        visible: true,
        width: "50px",
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
        seq: 12,
        visible: true,
        width: "100px",
      },
    ],
    [localFilters, wareHouses, salesLocations, products]
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
      
      {/* Header moved outside of DataTable */}
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
              // disabled={loading}
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
          <Button data-pr-position="top" tooltip="Toggle Filters" className="p-button-text mr-auto" icon="pi pi-filter" onClick={() => setFiltersVisible(!filtersVisible)} />
        </div>
      </div>

      {/* Inline Filters Section */}
      {filtersVisible && (
        <div className="bg-light p-3 border-top">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Name</label>
              <div className="d-flex gap-1">
                <select 
                  className="form-select" 
                  style={{ maxWidth: '120px' }}
                  value={localFilters?.name?.matchMode || FilterMatchMode.CONTAINS}
                  onChange={(e) => {
                    const currentValue = localFilters?.name?.value || '';
                    handleFilterValueChange('name', { value: currentValue, matchMode: e.target.value });
                  }}
                >
                  <option value={FilterMatchMode.CONTAINS}>Contains</option>
                  <option value={FilterMatchMode.STARTS_WITH}>Starts with</option>
                  <option value={FilterMatchMode.ENDS_WITH}>Ends with</option>
                  <option value={FilterMatchMode.EQUALS}>Equals</option>
                  <option value={FilterMatchMode.NOT_EQUALS}>Not equals</option>
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by name"
                  value={localFilters?.name?.value || ''}
                  onChange={(e) => {
                    const currentMatchMode = localFilters?.name?.matchMode || FilterMatchMode.CONTAINS;
                    handleFilterValueChange('name', { value: e.target.value, matchMode: currentMatchMode });
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onFilter(localFilters)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-semibold">SKU</label>
              <div className="d-flex gap-1">
                <select 
                  className="form-select" 
                  style={{ maxWidth: '120px' }}
                  value={localFilters?.['variants.sku']?.matchMode || FilterMatchMode.CONTAINS}
                  onChange={(e) => {
                    const currentValue = localFilters?.['variants.sku']?.value || '';
                    handleFilterValueChange('variants.sku', { value: currentValue, matchMode: e.target.value });
                  }}
                >
                  <option value={FilterMatchMode.CONTAINS}>Contains</option>
                  <option value={FilterMatchMode.STARTS_WITH}>Starts with</option>
                  <option value={FilterMatchMode.ENDS_WITH}>Ends with</option>
                  <option value={FilterMatchMode.EQUALS}>Equals</option>
                  <option value={FilterMatchMode.NOT_EQUALS}>Not equals</option>
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by SKU"
                  value={localFilters?.['variants.sku']?.value || ''}
                  onChange={(e) => {
                    const currentMatchMode = localFilters?.['variants.sku']?.matchMode || FilterMatchMode.CONTAINS;
                    handleFilterValueChange('variants.sku', { value: e.target.value, matchMode: currentMatchMode });
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onFilter(localFilters)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Tax</label>
              <DropDownFilter
                classname={'w-100'}
                placeholder={'Select Tax'}
                dropDownOptionType={'PROFILE_GROUP'}
                selectedOption={localFilters?.['accountingGroups.id']?.value}
                fieldName={'accountingGroups.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Category</label>  
              <DropDownFilter
                classname={'w-100'}
                placeholder={'Select Category'}
                dropDownOptionType={'RETAIL_CATEGORY'}
                selectedOption={localFilters?.['categories.id']?.value}
                fieldName={'categories.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Base Measure</label>
              <DropDownFilter
                classname={'w-100'}
                dropDownOptionType={'MEASURE'}
                placeholder={'Select Measure'}
                selectedOption={localFilters?.['baseMeasure.id']?.value}
                fieldName={'baseMeasure.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <Checkbox
                  inputId="showImages"
                  checked={localFilters?.['attachments']?.matchMode === FilterMatchMode.NOT_EQUALS}
                  onChange={(e) => {
                    if (e.checked) {
                      handleFilterValueChange('attachments', { value: [] as any, matchMode: FilterMatchMode.NOT_EQUALS });
                    } else {
                      handleFilterValueChange('attachments', { value: null as any, matchMode: FilterMatchMode.CUSTOM });
                    }
                  }}
                />
                <label className="form-check-label ms-2 fw-semibold" htmlFor="showImages">
                  Only Items With Images
                </label>
              </div>
            </div>
          </div>

          {/* Separate row for Attributes */}
          <div className="row g-3 mt-2">
            <div className="col-md-3">
              <AttributeFilter filteredAttributes={filteredAttributes} onFilterValueChange={handleFilterValueChange} />
            </div>

            <div className="col-12 d-flex gap-2 justify-content-end mt-3">
              <Button 
                type="button" 
                severity="secondary" 
                label="Clear Filters" 
                onClick={handleClear}
                outlined
              />
              <Button 
                type="button" 
                label="Apply Filters" 
                onClick={() => onFilter(localFilters)}
              />
            </div>
          </div>
        </div>
      )}

      <DataTable
        value={products}
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
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column 
          expander={(rowData: IProduct) => rowData.variants && rowData.variants.length > 1} 
          style={{ width: "3rem" }} 
        />
        {visibleColumns.map((col) => (
          <Column key={col.field} field={col.field} header={col.header} body={col.body} style={{ width: col.width }} />
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