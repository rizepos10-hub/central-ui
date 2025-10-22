import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getSortState, translate } from 'react-jhipster';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createEntity, archiveEntities, exportEntities, filterEntities, updateEntities, purgeEntities, unArchiveEntities } from "./regular-item.reducer";
import { IRegularItem } from "app/shared/model/ITEM/restaurant/regular-item.model";
import ImageDisplay from "app/shared/components/image/image-display";
import { ITerm } from "app/shared/model/term.model";
import ImportButton from "app/shared/components/data-import/data-import";
import { applyMatchModeMap } from "app/shared/util/filter-match-model-util";
import DropDownFilter from "app/shared/components/filter/drop-down-filter";
import _ from "lodash";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { actionOptions, BulkEdit } from 'app/shared/components/item/bulk-edit';
import { FilterMatchMode } from 'primereact/api';
import { FaCog, FaCopy, FaTrash } from 'react-icons/fa';
import { SummarizeText } from 'app/shared/util/SummarizeText';
import axios from "axios";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Plus, Download, Upload, Settings, Trash2, Edit, Copy, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import Select from 'react-select';

export const RegularItem = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const LOCAL_STORAGE_KEY = 'regular-item-columns';
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [selectedActionOption, setSelectedActionOption] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState<IItem[]>([]);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const EXPORT_JOB_STORAGE_KEY = 'regular-item-export-job';

  const [exportJob, setExportJob] = useState<{
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    message: string;
    path: string | null;
    progress: number;
    errorMessage: string | null;
  } | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showExportAllDialog, setShowExportAllDialog] = useState(false);
  const [itemsToAction, setItemsToAction] = useState<IRegularItem[]>([]);

  const persistExportJob = (job: typeof exportJob) => {
    if (job) {
      localStorage.setItem(EXPORT_JOB_STORAGE_KEY, JSON.stringify(job));
    } else {
      localStorage.removeItem(EXPORT_JOB_STORAGE_KEY);
    }
  };

  const loadPersistedExportJob = () => {
    try {
      const stored = localStorage.getItem(EXPORT_JOB_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading persisted export job:', error);
      return null;
    }
  };
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

  const regularItemsList: IRegularItem[] = useAppSelector(state => state.regularItem.entities);
  const importSuccess = useAppSelector(state => state.dataImport.importSuccess);
  const categories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const loading = useAppSelector(state => state.regularItem.loading);
  const totalItems = useAppSelector(state => state.regularItem.totalItems);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(filterEntities({ query: updatedQuery }));
  };

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

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    getAllEntities();

    if (!exportJob) {
      const persistedJob = loadPersistedExportJob();
      if (persistedJob) {
        setExportJob(persistedJob);

        if (persistedJob.status === 'PENDING' || persistedJob.status === 'PROCESSING') {
          const interval = setInterval(() => {
            pollExportStatus(persistedJob.id);
          }, 2000);
          setPollingInterval(interval);
        }
      }
    }
  }, [searchParams]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const debouncedFilter = useRef(_.debounce((event) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  }, 300)).current

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

  const handleCreate = () => {
    navigate('/restaurant/regular/new')
  }

  const handleItemsDelete = async () => {
    setIsLoadingAction(true);
    const updatedQuery = applyMatchModeMap(query);
    await dispatch(archiveEntities({
      ids: itemsToAction.map(p => p.id),
      query: updatedQuery,
    })).finally(() => setIsLoadingAction(false));
    setSelectedProducts([]);
    setSelectedActionOption(null);
    setShowDeleteDialog(false);
  }

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
      setShowExportAllDialog(false);
    }
  };

  const handleExportItems = async () => {
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
      setShowExportDialog(false);
    }
  };

  const handlePurgeItems = async () => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(purgeEntities({
      ids: itemsToAction.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
    setShowPurgeDialog(false);
  }

  const handleUnArchiveItems = async () => {
    const updatedQuery = applyMatchModeMap(query)
    await dispatch(unArchiveEntities({
      ids: itemsToAction.map(product => product.id),
      query: updatedQuery
    }))
    setSelectedProducts([]);
    setSelectedActionOption(null);
    setShowRestoreDialog(false);
  }

  const duplicateItem = (rowData) => {
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
  };

  useEffect(() => {
    setLocalNameFilter(query?.filters?.name?.value ?? '');
  }, [query?.filters?.name?.value]);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storedData = JSON.parse(localStorage.getItem("visible_columns")) || {};
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
      localStorage.setItem("visible_columns", JSON.stringify(visibleColumnsData));

      return updatedColumns;
    });
  };

  const toCamelCaseWithSpace = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (match) => match.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  const columnOptions = Object.keys(visibleColumns)
    .map((field) => ({
      field,
      header: toCamelCaseWithSpace(field),
    }));

  const archivedActionOptions = [
    { name: 'Restore', code: 'RESTORE', disabled: false },
    { name: 'Permenant Delete', code: 'PURGE', disabled: false },
  ];

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
        case 'CANCELLED': return 'text-yellow-600';
        case 'PROCESSING': return 'text-blue-600';
        default: return 'text-blue-600';
      }
    };

    const getStatusIcon = () => {
      switch (exportJob.status) {
        case 'COMPLETED': return <CheckCircle2 className="h-5 w-5" />;
        case 'FAILED': return <XCircle className="h-5 w-5" />;
        case 'CANCELLED': return <AlertTriangle className="h-5 w-5" />;
        case 'PROCESSING': return <RefreshCw className="h-5 w-5 animate-spin" />;
        default: return <Clock className="h-5 w-5" />;
      }
    };

    return (
      <div className="bg-muted border p-3 mb-3 flex items-center justify-between rounded">
        <div className="flex items-center gap-3">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <div>
            <span className="font-semibold text-xs mr-2">Export Status: {exportJob.status}</span>
            <small className="text-muted-foreground text-xs">{exportJob.message}</small>
            {exportJob.status === 'PROCESSING' && (
              <div className="mt-1 flex items-center gap-2">
                <Progress value={exportJob.progress} className="w-48 h-2" />
                <small className="text-xs">{exportJob.progress}%</small>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {exportJob.status === 'COMPLETED' && exportJob.path && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => downloadFile(exportJob.path)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          )}

          {exportJob.status === 'FAILED' && exportJob.errorMessage && (
            <small className="text-destructive text-xs">{exportJob.errorMessage}</small>
          )}

          {(exportJob.status === 'COMPLETED' || exportJob.status === 'FAILED' || exportJob.status === 'CANCELLED') && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setExportJob(null);
                persistExportJob(null);
              }}
            >
              <XCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (selectedActionOption?.code === "MOVE_TO_TRASH") {
      setItemsToAction(selectedProducts);
      setShowDeleteDialog(true);
    } else if (selectedActionOption?.code === "EXPORT") {
      setShowExportDialog(true);
    } else if (selectedActionOption?.code === "PURGE") {
      setItemsToAction(selectedProducts);
      setShowPurgeDialog(true);
    } else if (selectedActionOption?.code === "RESTORE") {
      setItemsToAction(selectedProducts);
      setShowRestoreDialog(true);
    }
  }, [selectedActionOption]);

  const handlePageChange = (newPage: number) => {
    const queryParams = JSON.stringify({
      ...query,
      first: newPage * query.rows,
      page: newPage
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleRowsPerPageChange = (newRows: number) => {
    const queryParams = JSON.stringify({
      ...query,
      rows: newRows,
      first: 0,
      page: 0
    });
    setSearchParams({ query: queryParams }, { replace: true });
  };

  return (
    <PageWrapper>
      <ExportStatusHeader />

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

      <div className="bg-muted/50 p-2 flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Select
            key={`bulk-actions-${selectedProducts.length > 0 ? 'enabled' : 'disabled'}`}
            value={selectedActionOption}
            onChange={(option) => setSelectedActionOption(option)}
            options={query?.filters?.isArchived?.value ? archivedActionOptions : actionOptions}
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.code}
            placeholder="Bulk Actions"
            isDisabled={selectedProducts.length < 1}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '32px',
                fontSize: '0.75rem',
                minWidth: '140px',
              }),
              menu: (base) => ({
                ...base,
                fontSize: '0.75rem',
              }),
            }}
          />
        </div>

        {!query?.filters?.isArchived?.value ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleSyncList}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {translate('items.view.actions.refreshList')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowExportAllDialog(true)}
            >
              <Download className="h-3 w-3 mr-1" />
              Export All
            </Button>
            <ImportButton type={"REGULAR_RESTAURANT"} />
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleCreate}
            >
              <Plus className="h-3 w-3 mr-1" />
              {translate('items.view.actions.createRegular')}
            </Button>
          </div>
        ) : (
          <h4 className="text-center text-destructive text-sm font-semibold">
            Now viewing Recycle Bin
          </h4>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={query?.filters?.isArchived?.value ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => handleIsArchivedChange(!query?.filters?.isArchived?.value)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columnOptions.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.field}
                  checked={visibleColumns[col.field]}
                  onCheckedChange={() => onColumnToggle(col.field)}
                  className="text-xs"
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 p-2">
                <Checkbox
                  checked={selectedProducts.length === regularItemsList.length && regularItemsList.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts(regularItemsList);
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                />
              </TableHead>
              {visibleColumns.name && <TableHead className="text-xs h-8 font-semibold p-2">{translate('items.view.fields.name')}</TableHead>}
              {visibleColumns.categories && <TableHead className="text-xs h-8 font-semibold p-2">Category</TableHead>}
              {visibleColumns.image && <TableHead className="text-xs h-8 font-semibold p-2">{translate('items.view.fields.image')}</TableHead>}
              {visibleColumns.menus && <TableHead className="text-xs h-8 font-semibold p-2">{translate('items.view.fields.menus')}</TableHead>}
              {visibleColumns.desc && <TableHead className="text-xs h-8 font-semibold p-2">{translate("items.view.fields.description")}</TableHead>}
              {visibleColumns.productionCenter && <TableHead className="text-xs h-8 font-semibold p-2">{translate("items.view.fields.productionCenter")}</TableHead>}
              {visibleColumns.addonGroups && <TableHead className="text-xs h-8 font-semibold p-2">{translate("items.view.fields.addOnGroups")}</TableHead>}
              {visibleColumns.tags && <TableHead className="text-xs h-8 font-semibold p-2">{translate("items.view.fields.tags")}</TableHead>}
              {visibleColumns.discounts && <TableHead className="text-xs h-8 font-semibold p-2">{translate("items.view.fields.discounts")}</TableHead>}
              <TableHead className="text-xs h-8 font-semibold p-2">{translate('items.view.fields.actions')}</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="p-1"></TableHead>
              {visibleColumns.name && (
                <TableHead className="p-1">
                  <Input
                    placeholder={translate('items.view.filters.name')}
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
                    className="h-7 text-xs"
                  />
                </TableHead>
              )}
              {visibleColumns.categories && (
                <TableHead className="p-1">
                  <DropDownFilter
                    dropDownOptionType={"RESTAURANT_CATEGORY"}
                    selectedOption={query?.filters?.["categories.id"]?.value}
                    fieldName={"categories.id"}
                    handleDropdownChange={handleDropdownChange}
                  />
                </TableHead>
              )}
              {visibleColumns.image && <TableHead className="p-1"></TableHead>}
              {visibleColumns.menus && <TableHead className="p-1"></TableHead>}
              {visibleColumns.desc && <TableHead className="p-1"></TableHead>}
              {visibleColumns.productionCenter && <TableHead className="p-1"></TableHead>}
              {visibleColumns.addonGroups && (
                <TableHead className="p-1">
                  <DropDownFilter
                    dropDownOptionType={"ADDON_GROUP"}
                    selectedOption={query?.filters?.["addonGroups.addonGroup.id"]?.value}
                    fieldName={"addonGroups.addonGroup.id"}
                    handleDropdownChange={handleDropdownChange}
                  />
                </TableHead>
              )}
              {visibleColumns.tags && (
                <TableHead className="p-1">
                  <DropDownFilter
                    dropDownOptionType={"TAG"}
                    selectedOption={query?.filters?.["tags.id"]?.value}
                    fieldName={"tags.id"}
                    handleDropdownChange={handleDropdownChange}
                  />
                </TableHead>
              )}
              {visibleColumns.discounts && <TableHead className="p-1"></TableHead>}
              <TableHead className="p-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || isLoadingAction ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center p-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : regularItemsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center p-4 text-xs text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              regularItemsList.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="p-2">
                    <Checkbox
                      checked={selectedProducts.some(p => p.id === item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts([...selectedProducts, item]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(p => p.id !== item.id));
                        }
                      }}
                    />
                  </TableCell>
                  {visibleColumns.name && (
                    <TableCell className="text-xs p-2">
                      <Link to={`/restaurant/regular/${item.id}/edit`} className="text-primary hover:underline">
                        {item.name}
                        <br />
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-1">
                          #{item?.variants?.length}
                        </Badge>
                      </Link>
                    </TableCell>
                  )}
                  {visibleColumns.categories && (
                    <TableCell className="text-xs p-2">
                      {item?.categories?.map(cat => cat?.name).join(" | ")}
                    </TableCell>
                  )}
                  {visibleColumns.image && (
                    <TableCell className="text-xs p-2">
                      <ImageDisplay
                        imageType={"product"}
                        imageUrl={item?.attachments?.[0]?.url || item?.variants?.[0]?.attachments?.[0]?.url}
                        height={50}
                        width={50}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.menus && (
                    <TableCell className="text-xs p-2">
                      {item?.menus?.map((menu, idx) => (
                        <span key={idx}>
                          <Link to={`/menu/${menu.id}/${menu.type}/edit?page=1&sort=id,asc`} className="text-primary hover:underline">
                            {menu.name}
                          </Link>
                          {idx < item.menus.length - 1 ? ' | ' : ''}
                        </span>
                      ))}
                    </TableCell>
                  )}
                  {visibleColumns.desc && <TableCell className="text-xs p-2">{item.desc}</TableCell>}
                  {visibleColumns.productionCenter && (
                    <TableCell className="text-xs p-2">
                      <SummarizeText>{item?.productionCenter?.name}</SummarizeText>
                    </TableCell>
                  )}
                  {visibleColumns.addonGroups && (
                    <TableCell className="text-xs p-2">
                      {item?.addonGroups?.length === 0 ? "No Addons" : item?.addonGroups?.map((addon, index) => (
                        <span key={index}>
                          <Link to={`/addon-groups/${addon?.addonGroup?.id}/edit`} className="text-primary hover:underline">
                            {addon?.addonGroup?.name}
                          </Link>
                          {index < item.addonGroups.length - 1 && ' | '}
                        </span>
                      ))}
                    </TableCell>
                  )}
                  {visibleColumns.tags && (
                    <TableCell className="text-xs p-2">
                      {!item?.tags || item.tags.length === 0 ? "No Tags" : item?.tags?.map((tag, index) => (
                        <span key={index}>
                          <Link to={`/tag/${tag.id}/edit`} className="text-primary hover:underline">
                            {tag.name}
                          </Link>
                          {index < item.tags.length - 1 && ' | '}
                        </span>
                      ))}
                    </TableCell>
                  )}
                  {visibleColumns.discounts && (
                    <TableCell className="text-xs p-2">
                      {!item?.discounts || item.discounts.length === 0 ? "No Discounts" : item?.discounts?.map((discount, index) => (
                        <span key={index}>
                          <Link to={`/discount/${discount.id}/edit`} className="text-primary hover:underline">
                            {discount.value} {discount.type === "PERCENTAGE" ? "%" : "$"}
                          </Link>
                          {index < item.discounts.length - 1 && ' | '}
                        </span>
                      ))}
                    </TableCell>
                  )}
                  <TableCell className="text-xs p-2">
                    <div className="flex gap-1">
                      {!query?.filters?.isArchived?.value ? (
                        <>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => duplicateItem(item)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Link to={`/restaurant/regular/${item.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Link to={`/restaurant/regular/${item.id}/delete`}>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setItemsToAction([item]); setShowRestoreDialog(true); }}>
                            <RotateCcw className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setItemsToAction([item]); setShowPurgeDialog(true); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing {query.first + 1} to {Math.min(query.first + query.rows, totalItems)} of {totalItems} entries
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={{ label: query.rows.toString(), value: query.rows }}
              onChange={(option) => handleRowsPerPageChange(option.value)}
              options={[10, 20, 30, 40, 50, 100, 200].map(num => ({ label: num.toString(), value: num }))}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '28px',
                  fontSize: '0.75rem',
                  minWidth: '70px',
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: '0.75rem',
                }),
              }}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handlePageChange(query.page - 1)}
                disabled={query.page === 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handlePageChange(query.page + 1)}
                disabled={query.first + query.rows >= totalItems}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Move to Trash</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to move {itemsToAction.length} item(s) to trash?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleItemsDelete} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Permanent Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently delete {itemsToAction.length} item(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurgeItems} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Restore Items</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to restore {itemsToAction.length} item(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnArchiveItems} className="h-8 text-xs">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Export Selected Items</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to export {selectedProducts.length} selected items?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExportItems} className="h-8 text-xs">
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExportAllDialog} onOpenChange={setShowExportAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Export All Items</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to export all items?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExportAll} className="h-8 text-xs">
              Export All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default RegularItem;
