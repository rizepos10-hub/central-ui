import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { searchEntities as searchSuppliers } from 'app/entities/inventory/supplier/supplier.reducer';
import { searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportErrorState from 'app/shared/components/report/report-error-state';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { IInventoryItemVariant } from 'app/shared/model/STOCK/inventory-item.model';
import { IBranch } from 'app/shared/model/branch.model';
import {
  analyticsReportPrintStyles,
  buildInventoryOnHandWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  fetchAllPaginatedRows,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { formatVariant } from 'app/shared/util/variant-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterMatchMode } from 'primereact/api';
import SelectInput from 'app/shared/components/select/select';
import PaginationFilterStateVals from 'app/shared/components/pagination/pagination-filter-state-vals';

type OnHandReportRow = IInventoryItemVariant & {
  itemName?: string;
  itemNumber?: string;
  description?: string;
  costBase?: number | string | null;
  onHandQuantity?: number | string | null;
};

type DisplayRow = {
  id: string;
  itemNumber: string;
  description: string;
  costBase: number;
  costReal: number;
  onHandQuantity: number;
};

const REPORT_TITLE = 'On Hand Report';
const REPORT_API_URL = 'api/inventory/_search/variants';
const SUPPLIER_PAGE_SIZE = 20;
const CATEGORY_PAGE_SIZE = 20;
const REPORT_PAGE_SIZE = 50;

type SelectOption = {
  value: string;
  label: string;
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatDecimal = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const buildDescription = (row: OnHandReportRow) =>
  row.description || row.itemName || formatVariant(row.name, row.attributeValues) || row.name || '-';

const getRelevantStockQuantities = (row: OnHandReportRow, selectedBranchId: string) => {
  const stockQuantities = row.stockQuantities || [];
  const branchStockQuantities = stockQuantities.filter(stock => (stock.location as any)?.branch?.id === selectedBranchId);

  return branchStockQuantities.length > 0 ? branchStockQuantities : stockQuantities;
};

const buildDisplayRow = (row: OnHandReportRow, selectedBranchId: string): DisplayRow => {
  const relevantStockQuantities = getRelevantStockQuantities(row, selectedBranchId);
  const onHandQuantity = relevantStockQuantities.reduce((sum, stock) => sum + toNumber(stock.quantity), 0);
  const costBase = toNumber(relevantStockQuantities[0]?.unitCost);
  const costReal = costBase * onHandQuantity;

  return {
    id: row.id || row.sku || row.itemNumber || buildDescription(row),
    itemNumber: row.itemNumber || row.sku || '-',
    description: buildDescription(row),
    costBase,
    costReal,
    onHandQuantity,
  };
};

const buildWorkbookRows = (rows: DisplayRow[]) =>
  rows.map(row => ({
    itemNumber: row.itemNumber,
    description: row.description,
    costBase: row.costBase.toString(),
    onHandQuantity: row.onHandQuantity.toString(),
    costReal: row.costReal.toString(),
  }));

const OnHandReport = () => {
  const dispatch = useAppDispatch();
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const businessName = useAppSelector(state => state.businessDetail.entities?.[0]?.businessName) || '';

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedSupplierOption, setSelectedSupplierOption] = useState<SelectOption | null>(null);
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<SelectOption | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [rows, setRows] = useState<OnHandReportRow[]>([]);
  const [exportRows, setExportRows] = useState<OnHandReportRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierHasMore, setSupplierHasMore] = useState(true);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryHasMore, setCategoryHasMore] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const reportContentRef = useRef<HTMLDivElement>(null);

  const fetchReportPage = async (page: number, size: number) => {
    const response = await axios.get<OnHandReportRow[]>(REPORT_API_URL, {
      params: {
        branchId: selectedBranchId,
        ...(selectedSupplierOption?.value ? { supplierId: selectedSupplierOption.value } : {}),
        ...(selectedCategoryOption?.value ? { categoryId: selectedCategoryOption.value } : {}),
        name: nameFilter.trim(),
        page,
        size,
        sort: 'id,asc',
      },
    });

    return {
      rows: Array.isArray(response.data) ? response.data : [],
      totalCount: Number(response.headers?.['x-total-count']),
    };
  };

  useEffect(() => {
    dispatch(getBranches({ page: 0, size: 500, sort: 'name,asc' }));
  }, [dispatch]);

  useEffect(() => {
    let ignore = false;

    const loadInitialPage = async () => {
      try {
        setSupplierLoading(true);
        const response = await dispatch(
          searchSuppliers({
            query: applyMatchModeMap({
              page: 0,
              size: SUPPLIER_PAGE_SIZE,
              sortField: 'name',
              sortOrder: 1,
              filters: {
                name: {
                  value: supplierSearch.trim() || null,
                  matchMode: FilterMatchMode.CONTAINS,
                },
              },
            }),
          })
        ).unwrap();

        if (ignore) {
          return;
        }

        const nextOptions = (Array.isArray(response.data) ? response.data : []).map(supplier => ({
          value: supplier.id || '',
          label: supplier.name || '',
        }));
        const totalCount = Number(response.headers?.['x-total-count']);

        setSupplierOptions(nextOptions.filter(option => option.value));
        setSupplierPage(0);
        setSupplierHasMore(Number.isFinite(totalCount) ? nextOptions.length < totalCount : nextOptions.length === SUPPLIER_PAGE_SIZE);
      } catch (_error) {
        if (!ignore) {
          setSupplierOptions([]);
          setSupplierPage(0);
          setSupplierHasMore(false);
        }
      } finally {
        if (!ignore) {
          setSupplierLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      loadInitialPage();
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [supplierSearch, dispatch]);

  const loadMoreSuppliers = async () => {
    if (supplierLoading || !supplierHasMore) {
      return;
    }

    const nextPage = supplierPage + 1;

    try {
      setSupplierLoading(true);
      const previousCount = supplierOptions.length;
      const response = await dispatch(
        searchSuppliers({
          query: applyMatchModeMap({
            page: nextPage,
            size: SUPPLIER_PAGE_SIZE,
            sortField: 'name',
            sortOrder: 1,
            filters: {
              name: {
                value: supplierSearch.trim() || null,
                matchMode: FilterMatchMode.CONTAINS,
              },
            },
          }),
        })
      ).unwrap();

      const nextOptions = (Array.isArray(response.data) ? response.data : []).map(supplier => ({
        value: supplier.id || '',
        label: supplier.name || '',
      }));
      const totalCount = Number(response.headers?.['x-total-count']);

      setSupplierOptions(prevOptions => {
        const optionMap = new Map(prevOptions.map(option => [option.value, option]));
        nextOptions.forEach(option => {
          if (option.value) {
            optionMap.set(option.value, option);
          }
        });
        return Array.from(optionMap.values());
      });
      setSupplierPage(nextPage);
      setSupplierHasMore(Number.isFinite(totalCount) ? previousCount + nextOptions.length < totalCount : nextOptions.length === SUPPLIER_PAGE_SIZE);
    } catch (_error) {
      setSupplierHasMore(false);
    } finally {
      setSupplierLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialPage = async () => {
      try {
        setCategoryLoading(true);
        const response = await dispatch(
          searchRetailCategories({
            query: categorySearch.trim(),
            page: 0,
            size: CATEGORY_PAGE_SIZE,
            sort: 'name,asc',
          })
        ).unwrap();

        if (ignore) {
          return;
        }

        const nextOptions = (Array.isArray(response.data) ? response.data : []).map(category => ({
          value: category.id || '',
          label: category.name || '',
        }));
        const totalCount = Number(response.headers?.['x-total-count']);

        setCategoryOptions(nextOptions.filter(option => option.value));
        setCategoryPage(0);
        setCategoryHasMore(Number.isFinite(totalCount) ? nextOptions.length < totalCount : nextOptions.length === CATEGORY_PAGE_SIZE);
      } catch (_error) {
        if (!ignore) {
          setCategoryOptions([]);
          setCategoryPage(0);
          setCategoryHasMore(false);
        }
      } finally {
        if (!ignore) {
          setCategoryLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      loadInitialPage();
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [categorySearch, dispatch]);

  const loadMoreCategories = async () => {
    if (categoryLoading || !categoryHasMore) {
      return;
    }

    const nextPage = categoryPage + 1;

    try {
      setCategoryLoading(true);
      const previousCount = categoryOptions.length;
      const response = await dispatch(
        searchRetailCategories({
          query: categorySearch.trim(),
          page: nextPage,
          size: CATEGORY_PAGE_SIZE,
          sort: 'name,asc',
        })
      ).unwrap();

      const nextOptions = (Array.isArray(response.data) ? response.data : []).map(category => ({
        value: category.id || '',
        label: category.name || '',
      }));
      const totalCount = Number(response.headers?.['x-total-count']);

      setCategoryOptions(prevOptions => {
        const optionMap = new Map(prevOptions.map(option => [option.value, option]));
        nextOptions.forEach(option => {
          if (option.value) {
            optionMap.set(option.value, option);
          }
        });
        return Array.from(optionMap.values());
      });
      setCategoryPage(nextPage);
      setCategoryHasMore(Number.isFinite(totalCount) ? previousCount + nextOptions.length < totalCount : nextOptions.length === CATEGORY_PAGE_SIZE);
    } catch (_error) {
      setCategoryHasMore(false);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedBranchId) {
      setRows([]);
      setExportRows(null);
      setLoading(false);
      setError(null);
      setTotalItems(0);
      return;
    }

    let ignore = false;

    const loadRows = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchReportPage(currentPage - 1, REPORT_PAGE_SIZE);

        if (ignore) {
          return;
        }

        setRows(response.rows);
        setExportRows(null);
        setTotalItems(Number.isFinite(response.totalCount) ? response.totalCount : response.rows.length);
        setLastLoadedAt(new Date());
      } catch (_error) {
        if (ignore) {
          return;
        }

        setRows([]);
        setExportRows(null);
        setTotalItems(0);
        setError('Unable to load on hand report.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      ignore = true;
    };
  }, [currentPage, selectedBranchId, selectedSupplierOption?.value, selectedCategoryOption?.value, nameFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, selectedSupplierOption?.value, selectedCategoryOption?.value, nameFilter]);

  const sourceRows = exportRows || rows;
  const displayRows = useMemo(() => sourceRows.map(row => buildDisplayRow(row, selectedBranchId)), [sourceRows, selectedBranchId]);

  const totals = useMemo(
    () =>
      displayRows.reduce(
        (acc, row) => ({
          costReal: acc.costReal + row.costReal,
          onHandQuantity: acc.onHandQuantity + row.onHandQuantity,
        }),
        {
          costReal: 0,
          onHandQuantity: 0,
        }
      ),
    [displayRows]
  );

  const selectedBranchName = branchList.find(branch => branch.id === selectedBranchId)?.name || '';
  const selectedSupplierName = selectedSupplierOption?.label || 'All suppliers';
  const selectedCategoryName = selectedCategoryOption?.label || 'All categories';
  const selectedNameLabel = nameFilter.trim() || 'All names';
  const exportedAt = lastLoadedAt || new Date();
  const fileName = createReportFileName(REPORT_TITLE, [selectedBranchName, selectedSupplierName, selectedCategoryName, selectedNameLabel]);
  const exportDisabled = loading || busyAction !== null || displayRows.length === 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / REPORT_PAGE_SIZE));

  const loadAllReportRows = async () =>
    fetchAllPaginatedRows(
      async ({ page, size }) => fetchReportPage(page, size),
      {
        requestArgs: {},
        size: REPORT_PAGE_SIZE,
        getRowSignature: row => row.id || `${row.sku || ''}|${row.name || ''}|${row.itemNumber || ''}`,
      }
    );

  const handleExcelExport = async () => {
    if (displayRows.length === 0) {
      return;
    }

    try {
      setBusyAction('excel');
      const allRows = await loadAllReportRows();
      const allDisplayRows = allRows.map(row => buildDisplayRow(row, selectedBranchId));
      await saveWorkbookAsExcel(
        buildInventoryOnHandWorkbook(buildWorkbookRows(allDisplayRows), {
          title: REPORT_TITLE,
          filters: [
            { label: 'Branch', value: selectedBranchName },
            { label: 'Supplier', value: selectedSupplierName },
            { label: 'Category', value: selectedCategoryName },
            { label: 'Name', value: selectedNameLabel },
          ],
        }),
        fileName
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!reportContentRef.current || displayRows.length === 0) {
      return;
    }

    try {
      setBusyAction('pdf');
      const allRows = await loadAllReportRows();
      setExportRows(allRows);
      await new Promise(resolve => window.setTimeout(resolve, 0));
      await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'landscape' });
    } finally {
      setExportRows(null);
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('landscape'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
      const allRows = await loadAllReportRows();
      setExportRows(allRows);
      await new Promise(resolve => window.setTimeout(resolve, 0));
    },
    onAfterPrint: () => {
      setExportRows(null);
      setBusyAction(null);
    },
  });

  const renderReportTable = () => (
    <div className="rounded-sm border border-black bg-white">
      <Table className="min-w-full border-collapse">
        <TableHeader>
            <TableRow className="border-black hover:bg-transparent">
              <TableHead className="border-r border-black px-2 py-1 text-center text-[11px] font-normal text-black">Item Number</TableHead>
              <TableHead className="border-r border-black px-2 py-1 text-center text-[11px] font-normal text-black">Description</TableHead>
              <TableHead className="border-r border-black px-2 py-1 text-center text-[11px] font-normal text-black">Cost: Base</TableHead>
              <TableHead className="border-r border-black px-2 py-1 text-center text-[11px] font-normal text-black">On Hand Quantity</TableHead>
              <TableHead className="px-2 py-1 text-center text-[11px] font-normal text-black">Cost: Real</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.map(row => (
            <TableRow key={row.id} className="border-black hover:bg-transparent">
              <TableCell className="border-r border-black px-2 py-1 text-[11px] text-black">{row.itemNumber}</TableCell>
              <TableCell className="border-r border-black px-2 py-1 text-[11px] text-black">{row.description}</TableCell>
              <TableCell className="border-r border-black px-2 py-1 text-right text-[11px] text-black">{formatDecimal(row.costBase)}</TableCell>
              <TableCell className="border-r border-black px-2 py-1 text-right text-[11px] text-black">{formatDecimal(row.onHandQuantity)}</TableCell>
              <TableCell className="px-2 py-1 text-right text-[11px] text-black">{formatDecimal(row.costReal)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-black bg-slate-50 hover:bg-slate-50">
            <TableCell className="border-r border-t border-black px-2 py-1 text-[11px] font-semibold text-black">Totals:</TableCell>
            <TableCell className="border-r border-t border-black px-2 py-1 text-[11px] text-black" />
            <TableCell className="border-r border-t border-black px-2 py-1 text-right text-[11px] font-semibold text-black">
              -
            </TableCell>
            <TableCell className="border-r border-t border-black px-2 py-1 text-right text-[11px] font-semibold text-black">
              {formatDecimal(totals.onHandQuantity)}
            </TableCell>
            <TableCell className="border-t border-black px-2 py-1 text-right text-[11px] font-semibold text-black">
              {formatDecimal(totals.costReal)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">On Hand Report</h1>
            <p className="text-sm text-muted-foreground">Review branch-specific inventory balances with optional supplier and category filters.</p>
          </div>
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={exportDisabled}
            busyAction={busyAction}
          />
        </div>

        <Card className="report-filters-card border-slate-200 shadow-sm">
          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Branch</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branchList.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="text-xs">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Supplier</Label>
              <SelectInput
                value={selectedSupplierOption}
                options={supplierOptions}
                onChange={(selected: SelectOption | null) => setSelectedSupplierOption(selected)}
                onInputChange={(inputValue, actionMeta) => {
                  if (actionMeta.action === 'input-change') {
                    setSupplierSearch(inputValue);
                  }
                }}
                onMenuScrollToBottom={loadMoreSuppliers}
                isClearable
                isLoading={supplierLoading}
                placeholder="All suppliers"
                noOptionsMessage={() => (supplierLoading ? 'Loading suppliers...' : 'No suppliers found')}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <SelectInput
                value={selectedCategoryOption}
                options={categoryOptions}
                onChange={(selected: SelectOption | null) => setSelectedCategoryOption(selected)}
                onInputChange={(inputValue, actionMeta) => {
                  if (actionMeta.action === 'input-change') {
                    setCategorySearch(inputValue);
                  }
                }}
                onMenuScrollToBottom={loadMoreCategories}
                isClearable
                isLoading={categoryLoading}
                placeholder="All categories"
                noOptionsMessage={() => (categoryLoading ? 'Loading categories...' : 'No categories found')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Name</Label>
              <Input
                value={nameFilter}
                onChange={event => setNameFilter(event.target.value)}
                placeholder="Search by name"
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {!selectedBranchId ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Select a branch to load the on hand report.
            </CardContent>
          </Card>
        ) : null}

        {error ? <ReportErrorState message={error} dataTestId="on-hand-report-error" /> : null}

        {selectedBranchId ? (
          <div ref={reportContentRef} className="report-export-root space-y-4">
            <ReportExportHeader
              reportTitle={REPORT_TITLE}
              hiddenOnScreen
              forceVisible={busyAction === 'pdf'}
              filters={[
                { label: 'Branch', value: selectedBranchName },
                { label: 'Supplier', value: selectedSupplierName },
                { label: 'Category', value: selectedCategoryName },
                { label: 'Name', value: selectedNameLabel },
              ]}
            />

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="space-y-1 border-b pb-4 text-[12px] text-black">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div>Date: {format(exportedAt, 'MM/dd/yy')}</div>
                      <div>Time: {format(exportedAt, 'hh:mm aa')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-semibold">{businessName || 'Business Report'}</div>
                      <div>Report Name: Inventory On Hand Report</div>
                    </div>
                    <div>Page: 1</div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-[11px]">
                    <div>Supplier: {selectedSupplierName}</div>
                    <div>Category: {selectedCategoryName}</div>
                    <div>Name: {selectedNameLabel}</div>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </div>
                ) : displayRows.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground">No on hand inventory found for the selected filters.</div>
                ) : (
                  <>
                    {renderReportTable()}
                    {!exportRows && totalPages > 1 ? (
                      <div className="pt-2">
                        <PaginationFilterStateVals totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

      </div>
    </PageWrapper>
  );
};

export default OnHandReport;
