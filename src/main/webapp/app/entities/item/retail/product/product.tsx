import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { getSortState, Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SummarizeText } from "app/shared/util/SummarizeText";
import ImageDisplay from "app/shared/components/image/image-display";
import { applyMatchModeMap, updateTableFilters } from "app/shared/util/filter-match-model-util";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { exportEntities, filterEntities, getEntities, updateEntities, purgeEntities, archiveEntities, unArchiveEntities, updateEntity } from "app/entities/item/retail/product/product.reducer";
import { IProduct } from "app/shared/model/ITEM/retail/product.model";
import ImportButton from "app/shared/components/data-import/data-import";
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { IItem } from "app/shared/model/ITEM/item.model";
import { actionOptions, BulkEdit } from "app/shared/components/item/bulk-edit";
import { createEntity } from './product.reducer';
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { formatVariant } from "app/shared/util/variant-utils";
import { getEntities as getWarehouses } from "app/entities/inventory/warehouse/warehouse.reducer";
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { SourceType } from "app/shared/model/ENUMS/source-type.model";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import AttributeFilter from "app/shared/components/filter/attribute-filter";
import axios from "axios";
import {
  Copy,
  Pencil,
  Trash2,
  Settings,
  RefreshCw,
  FileDown,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Loader2,
  Download,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle as CircleIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import Select from 'app/shared/components/select/select';
import { FilterMatchMode } from "primereact/api";
import { PageWrapper } from "app/shared/layout/page-wrapper";

interface ColumnConfig {
  field: string;
  header: string;
  key?: string;
  seq: number;
  visible: boolean;
  width?: string;
  body?: (rowData: any) => React.ReactNode;
  sortable?: boolean;
}

export const Product = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = window.location;
  const LOCAL_STORAGE_KEY = 'retail-item-columns';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const wareHouses = useAppSelector((state) => state.warehouse.entities);
  const salesLocations = useAppSelector((state) => state.salesLocation.entities);

  // Export job tracking state
  const EXPORT_JOB_STORAGE_KEY = 'product-export-job';

  const [exportJob, setExportJob] = useState<{
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    message: string;
    path: string | null;
    progress: number;
    errorMessage: string | null;
  } | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  // Alert dialogs state
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ open: boolean; product: IProduct | null }>({ open: false, product: null });
  const [archiveConfirm, setArchiveConfirm] = useState<{ open: boolean; products: IProduct[] }>({ open: false, products: [] });
  const [purgeConfirm, setPurgeConfirm] = useState<{ open: boolean; products: IProduct[] }>({ open: false, products: [] });
  const [unArchiveConfirm, setUnArchiveConfirm] = useState<{ open: boolean; products: IProduct[] }>({ open: false, products: [] });
  const [exportConfirm, setExportConfirm] = useState<{ open: boolean; type: 'all' | 'selected' }>({ open: false, type: 'all' });

  // Persist export job to localStorage
  const persistExportJob = (job: typeof exportJob) => {
    if (job) {
      localStorage.setItem(EXPORT_JOB_STORAGE_KEY, JSON.stringify(job));
    } else {
      localStorage.removeItem(EXPORT_JOB_STORAGE_KEY);
    }
  };

  // Load export job from localStorage
  const loadPersistedExportJob = () => {
    try {
      const stored = localStorage.getItem(EXPORT_JOB_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading persisted export job:', error);
      return null;
    }
  };

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

  // Export job polling function
  const pollExportStatus = async (jobId: string) => {
    try {
      const response = await axios.get(`/api/export-data/status/${jobId}`);
      const jobData = response.data;

      setExportJob(jobData);
      persistExportJob(jobData);

      if (jobData.status === 'COMPLETED' || jobData.status === 'FAILED' || jobData.status === 'CANCELLED') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (error) {
      console.error('Error polling export status:', error);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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

    // Restore persisted export job on component mount
    const persistedJob = loadPersistedExportJob();
    if (persistedJob) {
      setExportJob(persistedJob);

      // Resume polling if job is still in progress
      if (persistedJob.status === 'PENDING' || persistedJob.status === 'PROCESSING') {
        const interval = setInterval(() => {
          pollExportStatus(persistedJob.id);
        }, 2000);
        setPollingInterval(interval);
      }
    }

  }, [])

  useEffect(() => {
    getAllEntities();
    return () => {
      searchParams.set("query", "")
    }
  }, [query?.first, query?.page, query?.rows, query?.sortField, query?.sortOrder]);

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
      <Link className="font-normal text-xs" to={editUrl}>
        {rowData.name}<br />
        <span className="text-xs">#{rowData?.variants?.length}</span>
      </Link>
    );
  };

  const duplicateColumnTemplate = (rowData) => {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setDuplicateConfirm({ open: true, product: rowData })}
      >
        <Copy className="h-3 w-3" />
      </Button>
    );
  };

  const handleDuplicate = () => {
    if (!duplicateConfirm.product) return;

    const { id, ...entityWithoutId } = duplicateConfirm.product;
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
    setDuplicateConfirm({ open: false, product: null });
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/product/${rowData.id}/edit`;

    return (
      <Link to={editUrl}>
        <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </Link>
    );
  };

  const archiveColumnTemplate = (rowData: IProduct) => {
    const deleteUrl = `/product/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Link>
    );
  };

  const unArchiveColumnTemplate = (rowData: IProduct) => {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setUnArchiveConfirm({ open: true, products: [rowData] })}
      >
        <RotateCcw className="h-3 w-3 text-green-600" />
      </Button>
    );
  };

  const purgeColumnTemplate = (rowData: IProduct) => {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setPurgeConfirm({ open: true, products: [rowData] })}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    );
  };

  const TagsBody = rowData => {
    const tags = rowData?.tags;

    if (!tags || tags.length === 0) {
      return <span className="text-xs">No Tags</span>;
    }

    return tags.map((tag, index) => (
      <React.Fragment key={tag.id}>
        <Link className="font-normal text-xs" to={`/tag/${tag.id}/edit`}>
          {tag.name}
          {index < tags.length - 1 && ' | '}
        </Link>
      </React.Fragment>
    ));
  };

  const TaxBody = rowData => {
    const taxes = rowData?.accountingGroups;

    if (!taxes || taxes.length === 0) {
      return <span className="text-xs">No Taxes</span>;
    }

    return taxes.map((tax, index) => (
      <span key={tax.id} className="text-xs">{tax.name} {index < taxes.length - 1 && ' | '}</span>
    ));
  };

  const DiscountBody = rowData => {
    const discounts = rowData?.discounts;
    if (!discounts || discounts.length === 0) {
      return <span className="text-xs">No Discounts</span>;
    }

    return discounts.map((discount, index) => (
      <React.Fragment key={discount.id}>
        <Link className="font-normal text-xs" to={`/discount/${discount.id}/edit`}>
          {discount.value} {discount.type === "PERCENTAGE" ? "%" : "$"}
          {index < discounts.length - 1 && ' | '}
        </Link>
      </React.Fragment>
    ));
  };

  const handleCreate = () => {
    navigate(`/product/new`)
  }

  useEffect(() => {
    if (selectedActionOption?.code === "MOVE_TO_TRASH") {
      setArchiveConfirm({ open: true, products: selectedProducts });
    }
  }, [selectedActionOption])

  const handleItemsArchive = async () => {
    setIsLoadingAction(true);
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(archiveEntities({
      ids: selectedProducts.map(p => p.id),
      query: updatedQuery,
    })).finally(() => setIsLoadingAction(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
    setArchiveConfirm({ open: false, products: [] });
  }

  useEffect(() => {
    if (selectedActionOption?.code === "EXPORT") {
      setExportConfirm({ open: true, type: 'selected' });
    }
  }, [selectedActionOption])

  const handleExportAll = async () => {
    setIsLoadingAction(true);
    try {
      const result = await dispatch(exportEntities([]));
      const payload = result.payload as any;

      if (payload?.data) {
        const jobData = payload.data;
        setExportJob(jobData);
        persistExportJob(jobData);

        const interval = setInterval(() => {
          pollExportStatus(jobData.id);
        }, 2000);

        setPollingInterval(interval);
      }
    } catch (error) {
      console.error('Export all failed:', error);
    } finally {
      setIsLoadingAction(false);
    }
    setExportConfirm({ open: false, type: 'all' });
  };

  const handleItemsExport = async () => {
    setIsLoadingAction(true);
    try {
      const result = await dispatch(exportEntities(selectedProducts.map(product => product.id)));
      const payload = result.payload as any;

      if (payload?.data) {
        const jobData = payload.data;
        setExportJob(jobData);
        persistExportJob(jobData);

        const interval = setInterval(() => {
          pollExportStatus(jobData.id);
        }, 2000);

        setPollingInterval(interval);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoadingAction(false);
      setSelectedProducts([]);
      setSelectedActionOption(null);
    }
    setExportConfirm({ open: false, type: 'selected' });
  }

  useEffect(() => {
    if (selectedActionOption?.code === "PURGE") {
      setPurgeConfirm({ open: true, products: selectedProducts });
    }
  }, [selectedActionOption])

  const handlePurgeItems = async (products: IProduct[]) => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(purgeEntities({
      ids: products.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
    setPurgeConfirm({ open: false, products: [] });
  }

  useEffect(() => {
    if (selectedActionOption?.code === "RESTORE") {
      setUnArchiveConfirm({ open: true, products: selectedProducts });
    }
  }, [selectedActionOption])

  const handleUnArchiveItems = async (products: IProduct[]) => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(unArchiveEntities({
      ids: products.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
    setUnArchiveConfirm({ open: false, products: [] });
  }

  const rowExpansionTemplate = (rowData: IProduct) => {
    if (!rowData.variants || rowData.variants.length <= 1) {
      return null;
    }

    return (
      <div className="p-3 bg-muted/30">
        <h5 className="text-sm font-semibold mb-2">Variants Stock Details</h5>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Variant Name</TableHead>
              <TableHead className="text-xs">SKU</TableHead>
              <TableHead className="text-xs">Stock Quantities</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowData.variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="text-xs">
                  {formatVariant(variant?.name, variant?.attributeValues)}
                </TableCell>
                <TableCell className="text-xs">{variant.sku || 'N/A'}</TableCell>
                <TableCell className="text-xs">
                  {Object.entries(variant?.stockQuantities || {}).map(([key, stock]: [string, IStockQuantity]) => (
                    <div key={stock?.location?.id} className="flex flex-row gap-2">
                      <span className="w-1/2 text-xs">{stock?.location?.name}</span>
                      <span className="w-1/2 text-xs font-bold">{stock?.quantity}</span>
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
    const [expandedRowsDialog, setExpandedRowsDialog] = useState<Set<string>>(new Set());
    const [tabStateMap, setTabStateMap] = useState<Record<string, "WAREHOUSE" | "SALES_LOCATION">>({});

    useEffect(() => {
      const defaultTabs = variants.reduce((acc, v) => {
        acc[v.id] = "WAREHOUSE";
        return acc;
      }, {});
      setTabStateMap(defaultTabs);
    }, [variants]);

    return (
      <Dialog open={dialogVisible} onOpenChange={onHide}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base">Stock Details</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-10"></TableHead>
                  <TableHead className="text-xs">Variant Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <React.Fragment key={variant.id}>
                    <TableRow>
                      <TableCell className="text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const newExpanded = new Set(expandedRowsDialog);
                            if (newExpanded.has(variant.id)) {
                              newExpanded.delete(variant.id);
                            } else {
                              newExpanded.add(variant.id);
                            }
                            setExpandedRowsDialog(newExpanded);
                          }}
                        >
                          {expandedRowsDialog.has(variant.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatVariant(variant?.name, variant?.attributeValues)}
                      </TableCell>
                    </TableRow>
                    {expandedRowsDialog.has(variant.id) && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <VariantStockTabs
                            variant={variant}
                            tabState={tabStateMap}
                            setTabState={setTabStateMap}
                            wareHouses={wareHouses}
                            salesLocations={salesLocations}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
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
      <Tabs
        value={tabState[variant.id]}
        onValueChange={(value) => setTabState((prev) => ({ ...prev, [variant.id]: value as "WAREHOUSE" | "SALES_LOCATION" }))}
      >
        <TabsList className="h-8">
          <TabsTrigger value="WAREHOUSE" className="h-7 text-xs">Warehouses</TabsTrigger>
          <TabsTrigger value="SALES_LOCATION" className="h-7 text-xs">Sales Locations</TabsTrigger>
        </TabsList>
        <TabsContent value="WAREHOUSE">{renderStockByType("WAREHOUSE")}</TabsContent>
        <TabsContent value="SALES_LOCATION">{renderStockByType("SALES_LOCATION")}</TabsContent>
      </Tabs>
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">{translate("common.location")}</TableHead>
            <TableHead className="text-xs">{translate("common.quantity")}</TableHead>
            <TableHead className="text-xs">{translate("common.minimumStockLevel")}</TableHead>
            <TableHead className="text-xs">{translate("common.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockEntries.map((data) => (
            <TableRow key={data.key}>
              <TableCell className="text-xs font-bold">{data.stock?.location?.name || "Unknown"}</TableCell>
              <TableCell className="text-xs font-medium">{data.stock.quantity}</TableCell>
              <TableCell className="text-xs font-medium">{data.stock.minimumStockLevel}</TableCell>
              <TableCell className="text-xs">
                {data.stock.quantity > data.stock.minimumStockLevel ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Separate component for stock status cell to handle its own state
  const StockStatusCell = ({ rowData, wareHouses, salesLocations }: { rowData: IProduct; wareHouses: any[]; salesLocations: any[] }) => {
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
        ? "text-destructive"
        : totalBelowMin === totalVariants
        ? "text-destructive"
        : totalBelowMin > 0
        ? "text-orange-500"
        : "text-green-600";

    return (
      <>
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setDialogVisible(true)}
        >
          <CircleIcon className={`h-2 w-2 fill-current ${color}`} />
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
  };

  const columnsConfig = useMemo<ColumnConfig[]>(
    () => [
      {
        field: "name",
        header: translate("items.view.fields.name"),
        body: nameColumnTemplate,
        sortable: true,
        key: "name",
        seq: 1,
        visible: true,
        width: "100px",
      },
      {
        field: "categories.id",
        key: "categories",
        header: "Category",
        body: (rowData) => (
          <span className="text-xs">{rowData?.categories?.map((cat) => cat?.name).join(" | ")}</span>
        ),
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
        body: (rowData) => <div className="text-xs"><SummarizeText>{rowData.desc}</SummarizeText></div>,
        seq: 4,
        visible: true,
        width: "100px",
      },
      {
        field: "stockQuantities",
        key: "stock",
        header: translate("items.view.fields.inStock"),
        body: (rowData) => (
          <StockStatusCell
            rowData={rowData}
            wareHouses={wareHouses}
            salesLocations={salesLocations}
          />
        ),
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
              <div className="flex flex-col gap-0">
                {Object.entries(rowData?.variants?.[0]?.stockQuantities || {}).map(([key, stock]: [string, IStockQuantity]) => (
                  <div key={stock?.location?.id} className="flex gap-2 border-b">
                    <span className="flex-1 text-xs">{stock?.location?.name}</span>
                    <span className="w-12 text-xs font-bold">{stock?.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                <span className="font-bold text-xs">{rowData?.variants?.length} variants</span>
                <span className="text-xs text-muted-foreground">Expand to view details</span>
              </div>
            )}
          </>
        ),
        seq: 6,
        visible: true,
        width: "300px",
      },
      {
        field: "productionCenter.id",
        key: "productionCenter",
        header: translate("items.view.fields.productionCenter"),
        body: (rowData) => (
          <div className="text-xs"><SummarizeText>{rowData?.productionCenter?.name}</SummarizeText></div>
        ),
        sortable: true,
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
              checked={visible === true}
              onCheckedChange={(checked) => handleChangeIsVisible(rowData, SourceType.BRANCH_POS, checked as boolean)}
            />
          );
        },
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
              checked={visible === true}
              onCheckedChange={(checked) => handleChangeIsVisible(rowData, SourceType.ONLINE_ORDERING, checked as boolean)}
            />
          );
        },
        seq: 11,
        visible: true,
        width: "50px",
      },
      {
        field: "actions",
        key: "actions",
        header: "Actions",
        body: (rowData) => (
          <div className="flex gap-2 items-center">
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

    updatedColumns = updatedColumns.filter(col => col.field === "actions" || columnsConfig.some(config => config.field === col.field));

    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
    storedData[LOCAL_STORAGE_KEY] = updatedColumns.map(col => col.field);

    localStorage.setItem("visible_columns", JSON.stringify(storedData));

    setVisibleColumns(updatedColumns || []);
  };

  const columnOptions = columnsConfig.filter(({ field }) => field !== 'actions').map(({ field, header }) => ({ field, header }));

  const archivedActionOptions = [
    { name: 'Restore', code: 'RESTORE', disabled: false },
    { name: 'Permenant Delete', code: 'PURGE', disabled: false },
  ];

  const handleSort = (field: string) => {
    let newSortOrder = 1;
    if (query.sortField === field) {
      newSortOrder = query.sortOrder === 1 ? -1 : query.sortOrder === -1 ? null : 1;
    }

    const newQuery = {
      ...query,
      sortField: newSortOrder === null ? null : field,
      sortOrder: newSortOrder
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const getSortIcon = (field: string) => {
    if (query.sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    }
    if (query.sortOrder === 1) {
      return <ArrowUp className="h-3 w-3 ml-1 inline" />;
    }
    if (query.sortOrder === -1) {
      return <ArrowDown className="h-3 w-3 ml-1 inline" />;
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
  };

  const downloadFile = (filePath: string) => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.split('/').pop() || 'export.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ExportStatusHeader = () => {
    if (!exportJob) return null;

    const getStatusColor = () => {
      switch (exportJob.status) {
        case 'COMPLETED': return 'text-green-600';
        case 'FAILED': return 'text-destructive';
        case 'CANCELLED': return 'text-orange-500';
        case 'PROCESSING': return 'text-blue-600';
        default: return 'text-blue-600';
      }
    };

    const getStatusIcon = () => {
      switch (exportJob.status) {
        case 'COMPLETED': return <CheckCircle2 className="h-5 w-5" />;
        case 'FAILED': return <XCircle className="h-5 w-5" />;
        case 'CANCELLED': return <AlertTriangle className="h-5 w-5" />;
        case 'PROCESSING': return <Loader2 className="h-5 w-5 animate-spin" />;
        default: return <Loader2 className="h-5 w-5" />;
      }
    };

    return (
      <div className="bg-muted/50 border p-3 mb-3 flex items-center justify-between rounded-md">
        <div className="flex items-center gap-2">
          <div className={getStatusColor()}>{getStatusIcon()}</div>
          <div>
            <span className="font-bold text-xs mr-2">Export Status: {exportJob.status}</span>
            <small className="text-xs text-muted-foreground">{exportJob.message}</small>
            {exportJob.status === 'PROCESSING' && (
              <div className="mt-1">
                <Progress value={exportJob.progress} className="h-2 w-48" />
                <small className="text-xs">{exportJob.progress}%</small>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {exportJob.status === 'COMPLETED' && exportJob.path && (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => downloadFile(exportJob.path)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}

          {exportJob.status === 'FAILED' && exportJob.errorMessage && (
            <small className="text-xs text-destructive">{exportJob.errorMessage}</small>
          )}

          {(exportJob.status === 'COMPLETED' || exportJob.status === 'FAILED' || exportJob.status === 'CANCELLED') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setExportJob(null);
                persistExportJob(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Custom pagination component
  const PaginationControls = () => {
    const totalPages = Math.ceil(totalItems / query.rows);
    const currentPage = Math.floor(query.first / query.rows) + 1;

    const handlePageChange = (newPage: number) => {
      const newFirst = (newPage - 1) * query.rows;
      onPage({ ...query, first: newFirst, page: newPage - 1 });
    };

    const handleRowsPerPageChange = (newRows: number) => {
      onPage({ ...query, rows: newRows, first: 0, page: 0 });
    };

    return (
      <div className="flex items-center justify-between px-2 py-2 border-t">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <Select
            value={{ value: query.rows, label: query.rows.toString() }}
            onChange={(option) => handleRowsPerPageChange(option.value)}
            options={[10, 20, 30, 40, 50, 100, 200].map(val => ({ value: val, label: val.toString() }))}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {query.first + 1} - {Math.min(query.first + query.rows, totalItems)} of {totalItems}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageWrapper>
      <ExportStatusHeader />

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

      {/* Header */}
      <div className="bg-muted/50 p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Select
            key={`bulk-actions-${selectedProducts.length > 0 ? 'enabled' : 'disabled'}`}
            value={selectedActionOption}
            onChange={(option) => setSelectedActionOption(option)}
            options={localFilters?.isArchived?.value ? archivedActionOptions : actionOptions}
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.code}
            placeholder="Bulk Actions"
            isDisabled={selectedProducts.length < 1}
            isOptionDisabled={(option) => option.disabled}
          />
        </div>

        {!localFilters?.isArchived?.value ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSyncList}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              {translate('items.view.actions.refreshList')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setExportConfirm({ open: true, type: 'all' })}
            >
              <FileDown className="h-4 w-4 mr-1" />
              Export All
            </Button>
            <ImportButton type="RETAIL" />
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-1" />
              {translate('items.view.actions.createItem')}
            </Button>
          </div>
        ) : (
          <h4 className="text-sm font-semibold text-destructive">
            Now viewing Recycle Bin
          </h4>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant={localFilters?.isArchived?.value ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              if (localFilters?.isArchived?.value) {
                handleFilterValueChange('isArchived', { value: false, matchMode: FilterMatchMode.EQUALS })
              } else {
                handleFilterValueChange('isArchived', { value: true, matchMode: FilterMatchMode.EQUALS })
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Recycle Bin
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Settings className="h-4 w-4 mr-1" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {columnOptions.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.field}
                  checked={visibleColumns.some((c) => c.field === col.field)}
                  onCheckedChange={() => onColumnToggle(col.field)}
                  className="text-xs"
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Inline Filters Section */}
      {filtersVisible && (
        <div className="bg-muted/30 p-3 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Name</label>
              <div className="flex gap-1">
                <select
                  className="h-8 text-xs border border-input rounded-md px-2 bg-background"
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
                  className="h-8 text-xs flex-1 border border-input rounded-md px-2 bg-background"
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

            <div>
              <label className="block text-xs font-semibold mb-1">SKU</label>
              <div className="flex gap-1">
                <select
                  className="h-8 text-xs border border-input rounded-md px-2 bg-background"
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
                  className="h-8 text-xs flex-1 border border-input rounded-md px-2 bg-background"
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

            <div>
              <label className="block text-xs font-semibold mb-1">Tax</label>
              <DropDownFilter
                classname={'w-full'}
                placeholder={'Select Tax'}
                dropDownOptionType={'PROFILE_GROUP'}
                selectedOption={localFilters?.['accountingGroups.id']?.value}
                fieldName={'accountingGroups.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <DropDownFilter
                classname={'w-full'}
                placeholder={'Select Category'}
                dropDownOptionType={'RETAIL_CATEGORY'}
                selectedOption={localFilters?.['categories.id']?.value}
                fieldName={'categories.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Base Measure</label>
              <DropDownFilter
                classname={'w-full'}
                dropDownOptionType={'MEASURE'}
                placeholder={'Select Measure'}
                selectedOption={localFilters?.['baseMeasure.id']?.value}
                fieldName={'baseMeasure.id'}
                handleDropdownChange={(field, value) => handleFilterValueChange(field, value)}
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showImages"
                  checked={localFilters?.['attachments']?.matchMode === FilterMatchMode.NOT_EQUALS}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleFilterValueChange('attachments', { value: [] as any, matchMode: FilterMatchMode.NOT_EQUALS });
                    } else {
                      handleFilterValueChange('attachments', { value: null as any, matchMode: FilterMatchMode.CUSTOM });
                    }
                  }}
                />
                <label htmlFor="showImages" className="text-xs font-semibold cursor-pointer">
                  Only Items With Images
                </label>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <AttributeFilter filteredAttributes={filteredAttributes} onFilterValueChange={handleFilterValueChange} />
          </div>

          <div className="flex gap-2 justify-end mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleClear}
            >
              Clear Filters
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => onFilter(localFilters)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts(products);
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-xs w-10"></TableHead>
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.field}
                  className={`text-xs ${col.sortable ? 'cursor-pointer' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && col.field && handleSort(col.field)}
                >
                  {col.header}
                  {col.sortable && col.field && getSortIcon(col.field)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || isLoadingAction ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center text-xs py-8">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <React.Fragment key={product.id}>
                  <TableRow>
                    <TableCell className="text-xs">
                      <Checkbox
                        checked={selectedProducts.some(p => p.id === product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...selectedProducts, product]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      {product.variants && product.variants.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const newExpanded = new Set(expandedRows);
                            if (newExpanded.has(product.id)) {
                              newExpanded.delete(product.id);
                            } else {
                              newExpanded.add(product.id);
                            }
                            setExpandedRows(newExpanded);
                          }}
                        >
                          {expandedRows.has(product.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.field} className="text-xs">
                        {col.body ? col.body(product) : product[col.field]}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has(product.id) && (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + 2}>
                        {rowExpansionTemplate(product)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls />
      </div>

      {/* Alert Dialogs */}
      <AlertDialog open={duplicateConfirm.open} onOpenChange={(open) => !open && setDuplicateConfirm({ open: false, product: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Duplicate Product</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to duplicate this product?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={handleDuplicate}>
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveConfirm.open} onOpenChange={(open) => !open && setArchiveConfirm({ open: false, products: [] })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirm Archive</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={handleItemsArchive}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeConfirm.open} onOpenChange={(open) => !open && setPurgeConfirm({ open: false, products: [] })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirm Permanent Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to proceed? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={() => handlePurgeItems(purgeConfirm.products)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unArchiveConfirm.open} onOpenChange={(open) => !open && setUnArchiveConfirm({ open: false, products: [] })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={() => handleUnArchiveItems(unArchiveConfirm.products)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={exportConfirm.open} onOpenChange={(open) => !open && setExportConfirm({ open: false, type: 'all' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              {exportConfirm.type === 'all' ? 'Export All Items' : 'Export Selected Items'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {exportConfirm.type === 'all'
                ? 'Are you sure you want to export all items?'
                : `Are you sure you want to export ${selectedProducts.length} selected items?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs"
              onClick={exportConfirm.type === 'all' ? handleExportAll : handleItemsExport}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default Product;
