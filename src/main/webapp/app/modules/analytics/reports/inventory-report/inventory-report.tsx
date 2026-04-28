import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from 'app/entities/inventory/stock-config/inventory-items.reducer';
import { formatVariant } from 'app/shared/util/variant-utils';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportErrorState from 'app/shared/components/report/report-error-state';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import {
  analyticsReportPrintStyles,
  buildInventoryWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  fetchAllPaginatedRows,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';
import { IInventoryItem } from 'app/shared/model/STOCK/inventory-item.model';

const EXPORT_PAGE_SIZE = 100;

type InventoryExportRow = {
  itemName: string;
  variantName: string;
  price: string;
  locationName: string;
  locationType: string;
  quantity: string;
  unitCost: string;
};

const flattenInventoryExportRows = (items: IInventoryItem[]): InventoryExportRow[] =>
  items.flatMap(item => {
    const variants = item.variants || [];

    if (variants.length === 0) {
      return [
        {
          itemName: item.name || '-',
          variantName: '-',
          price: '-',
          locationName: '-',
          locationType: '-',
          quantity: '-',
          unitCost: '-',
        },
      ];
    }

    return variants.flatMap(variant => {
      const stockQuantities = (variant as any).stockQuantities || [];
      const variantName = formatVariant(variant?.name, variant?.attributeValues) || variant?.name || '-';

      if (stockQuantities.length === 0) {
        return [
          {
            itemName: item.name || '-',
            variantName,
            price: variant.price?.toString() || '-',
            locationName: '-',
            locationType: '-',
            quantity: '-',
            unitCost: '-',
          },
        ];
      }

      return stockQuantities.map(stock => ({
        itemName: item.name || '-',
        variantName,
        price: variant.price?.toString() || '-',
        locationName: stock.location?.name || '-',
        locationType: stock.location?.type || '-',
        quantity: stock.quantity?.toString() || '0',
        unitCost: stock.unitCost?.toString() || '0',
      }));
    });
  });

export const InventoryReport = () => {
  const dispatch = useAppDispatch();
  const reportContentRef = useRef<HTMLDivElement>(null);

  const [selectedStockQuantities, setSelectedStockQuantities] = useState([]);
  const [stockDialogVisible, setStockDialogVisible] = useState(false);
  const [exportItems, setExportItems] = useState<IInventoryItem[]>([]);
  const [queryParams, setQueryParams] = useState({
    size: 10,
    page: 0,
    sort: 'asc',
    first: 0,
    query: null as string | null,
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const inventoryItemList = useAppSelector(state => state.inventoryItem.entities);
  const loading = useAppSelector(state => state.inventoryItem.loading);
  const totalItems = useAppSelector(state => state.inventoryItem.totalItems);
  const inventoryErrorMessage = useAppSelector(state => state.inventoryItem.errorMessage);

  const handleOpenStockDialog = (variant: any) => {
    setSelectedStockQuantities(variant.stockQuantities || []);
    setStockDialogVisible(true);
  };

  const getAllEntities = () => {
    if (queryParams.query) {
      dispatch(searchEntities(queryParams));
    } else {
      dispatch(getEntities(queryParams));
    }
  };

  useEffect(() => {
    getAllEntities();
  }, [queryParams.page, queryParams.query, queryParams.size, queryParams.sort]);

  useEffect(() => {
    setExportItems([]);
    setExportError(null);
  }, [queryParams.query, queryParams.sort]);

  const expandAll = () => {
    const nextExpandedRows: Record<string, boolean> = {};
    inventoryItemList.forEach(item => {
      nextExpandedRows[`${item.id}`] = true;
    });
    setExpandedRows(nextExpandedRows);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  const onFilter = useMemo(
    () =>
      ((field, value) => {
        const newQuery = `${field}=${value}`;
        setQueryParams(prevState => ({
          ...prevState,
          page: 0,
          first: 0,
          query: value ? newQuery : null,
        }));
      }) as (field: string, value: string) => void,
    []
  );

  const handleSyncList = () => {
    setExportError(null);
    getAllEntities();
  };

  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      setExportError(null);
      const allItems = await ensureExportItems();
      await saveWorkbookAsExcel(
        buildInventoryWorkbook(flattenInventoryExportRows(allItems), {
          title: 'Inventory Report',
          filters: [
            { label: 'Search Query', value: queryParams.query || 'All items' },
            { label: 'Sort', value: queryParams.sort || 'Default' },
            { label: 'Total Items', value: allItems.length },
          ],
        }),
        fileName
      );
    } catch (error) {
      setExportError(getReportApiErrorMessage(error, 'Unable to export inventory report.'));
    } finally {
      setBusyAction(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchInventoryExportPage = async ({
    page,
    size,
    query,
    sort,
  }: {
    page: number;
    size: number;
    query: string | null;
    sort: string;
  }) => {
    if (query) {
      const requestUrl = `api/inventory/_search/items?${query}&page=${page}&size=${size}&sort=${sort}`;
      const response = await axios.get<IInventoryItem[]>(requestUrl);
      return {
        rows: Array.isArray(response.data) ? response.data : [],
        totalCount: Number(response.headers['x-total-count']) || null,
      };
    }

    const requestUrl = `api/inventory/items?page=${page}&size=${size}&sort=${sort}&cacheBuster=${new Date().getTime()}`;
    const response = await axios.get<IInventoryItem[]>(requestUrl);
    return {
      rows: Array.isArray(response.data) ? response.data : [],
      totalCount: Number(response.headers['x-total-count']) || null,
    };
  };

  const ensureExportItems = async () => {
    if (exportItems.length > 0) {
      return exportItems;
    }

    const rows = await fetchAllPaginatedRows<IInventoryItem, { query: string | null; sort: string }>(fetchInventoryExportPage, {
      requestArgs: {
        query: queryParams.query,
        sort: queryParams.sort,
      },
      size: EXPORT_PAGE_SIZE,
      getRowSignature: row => `${row.id}`,
    });

    setExportItems(rows);
    await new Promise(resolve => setTimeout(resolve, 0));
    return rows;
  };

  const exportRows = useMemo(() => flattenInventoryExportRows(exportItems), [exportItems]);
  const fileName = createReportFileName('Inventory Report', [queryParams.query || 'all-items']);
  const pageError = inventoryErrorMessage
    ? getReportApiErrorMessage(inventoryErrorMessage, 'Unable to load inventory report.')
    : null;
  const visibleError = exportError || pageError;
  const hasExportData = !pageError && inventoryItemList.length > 0;

  const handlePdfExport = async () => {
    if (!hasExportData || !reportContentRef.current) {
      return;
    }

    try {
      setBusyAction('pdf');
      setExportError(null);
      await ensureExportItems();
      if (reportContentRef.current) {
        await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'portrait' });
      }
    } catch (error) {
      setExportError(getReportApiErrorMessage(error, 'Unable to export inventory report.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('portrait'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
      setExportError(null);
      try {
        await ensureExportItems();
      } catch (error) {
        setExportError(getReportApiErrorMessage(error, 'Unable to export inventory report.'));
        setBusyAction(null);
        throw error;
      }
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold">Inventory Report</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handleSyncList} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={!hasExportData || busyAction !== null}
            busyAction={busyAction}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={expandAll}>
          Expand All
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      {visibleError ? <ReportErrorState message={visibleError} dataTestId="inventory-report-error" /> : null}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-12"></TableHead>
              <TableHead className="text-xs">
                <div className="flex flex-col gap-1">
                  <span>Item Name</span>
                  <Input
                    type="text"
                    placeholder="Search"
                    className="h-6 text-xs"
                    onChange={event => onFilter('name', event.target.value)}
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : pageError ? (
              <TableRow>
                <TableCell colSpan={2} className="p-3">
                  <ReportErrorState message={pageError} compact dataTestId="inventory-report-table-error" />
                </TableCell>
              </TableRow>
            ) : inventoryItemList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-xs py-8 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              inventoryItemList.map(item => (
                <React.Fragment key={item.id}>
                  <TableRow>
                    <TableCell className="text-xs">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toggleRow(item.id)}>
                        {expandedRows[item.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs">{item.name}</TableCell>
                  </TableRow>
                  {expandedRows[item.id] && (
                    <TableRow>
                      <TableCell colSpan={2} className="bg-muted/30 p-3">
                        <div className="mb-2 font-semibold text-xs">{item.name} Variants</div>
                        <div className="rounded-lg border bg-background">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Variant Name</TableHead>
                                <TableHead className="text-xs text-right">Price</TableHead>
                                <TableHead className="text-xs w-32">Stock Config</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.variants?.map(variant => (
                                <TableRow key={variant.id}>
                                  <TableCell className="text-xs">{formatVariant(variant?.name, variant?.attributeValues)}</TableCell>
                                  <TableCell className="text-xs text-right">{variant.price}</TableCell>
                                  <TableCell className="text-xs">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs"
                                      onClick={() => handleOpenStockDialog(variant)}
                                    >
                                      View Stocks
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="text-muted-foreground">
          Showing {Math.min(queryParams.page * queryParams.size + 1, totalItems)} to{' '}
          {Math.min((queryParams.page + 1) * queryParams.size, totalItems)} of {totalItems} items
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setQueryParams(prev => ({ ...prev, page: prev.page - 1, first: (prev.page - 1) * prev.size }))}
            disabled={queryParams.page === 0}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setQueryParams(prev => ({ ...prev, page: prev.page + 1, first: (prev.page + 1) * prev.size }))}
            disabled={(queryParams.page + 1) * queryParams.size >= totalItems}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="pointer-events-none fixed -left-[10000px] top-0 w-fit max-w-none bg-white p-6" aria-hidden="true">
        <div ref={reportContentRef} className="report-export-root space-y-4">
          <ReportExportHeader
            reportTitle="Inventory Report"
            hiddenOnScreen
            forceVisible={busyAction === 'pdf'}
            filters={[
              { label: 'Search Query', value: queryParams.query || 'All items' },
              { label: 'Total Items', value: exportItems.length },
            ]}
          />

          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Variant</TableHead>
                  <TableHead className="text-xs text-right">Price</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Location Type</TableHead>
                  <TableHead className="text-xs text-right">Quantity</TableHead>
                  <TableHead className="text-xs text-right">Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRows.map((row, index) => (
                  <TableRow key={`${row.itemName}-${row.variantName}-${row.locationName}-${index}`}>
                    <TableCell className="text-xs">{row.itemName}</TableCell>
                    <TableCell className="text-xs">{row.variantName}</TableCell>
                    <TableCell className="text-xs text-right">{row.price}</TableCell>
                    <TableCell className="text-xs">{row.locationName}</TableCell>
                    <TableCell className="text-xs">{row.locationType}</TableCell>
                    <TableCell className="text-xs text-right">{row.quantity}</TableCell>
                    <TableCell className="text-xs text-right">{row.unitCost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={stockDialogVisible} onOpenChange={setStockDialogVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Stock Quantities</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Quantity</TableHead>
                  <TableHead className="text-xs text-right">Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStockQuantities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs py-4 text-muted-foreground">
                      No stock quantities available
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedStockQuantities.map((stock, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs">{stock.location?.name}</TableCell>
                      <TableCell className="text-xs">{stock.location?.type}</TableCell>
                      <TableCell className="text-xs text-right">{stock.quantity}</TableCell>
                      <TableCell className="text-xs text-right">{stock.unitCost}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default InventoryReport;
