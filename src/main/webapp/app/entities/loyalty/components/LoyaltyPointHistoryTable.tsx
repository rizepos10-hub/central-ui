import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

import type { ILoyaltyPointHistory, LoyaltyPointHistoryEventType } from 'app/shared/model/CUSTOMER/loyalty-point-history.model';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import {
  analyticsReportPrintStyles,
  buildLoyaltyPointHistoryWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  fetchAllPaginatedRows,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';

interface LoyaltyPointHistoryTableProps {
  customerId?: string;
  reloadKey?: number;
  title?: string;
}

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 250;

const incrementIntegerString = (value: string) => {
  let carry = 1;
  const digits = value.split('');

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const nextDigit = Number(digits[index]) + carry;
    if (nextDigit >= 10) {
      digits[index] = '0';
      carry = 1;
    } else {
      digits[index] = String(nextDigit);
      carry = 0;
      break;
    }
  }

  return carry > 0 ? `1${digits.join('')}` : digits.join('');
};

const toPlainDecimalString = (value: number) => {
  const absoluteValue = Math.abs(value);
  const asString = absoluteValue.toString();

  if (!asString.includes('e') && !asString.includes('E')) {
    return asString;
  }

  return absoluteValue.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
};

const scaleValue = (value?: number | null) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return 0;
  }

  const sign = numericValue < 0 ? -1 : 1;
  const absoluteString = toPlainDecimalString(numericValue);
  const [wholePart = '0', decimalPart = ''] = absoluteString.split('.');
  let cents = decimalPart.slice(0, 2).padEnd(2, '0');
  const guardDigit = Number(decimalPart.charAt(2) || '0');

  if (guardDigit >= 5) {
    const incremented = incrementIntegerString(`${wholePart}${cents}`);
    cents = incremented.slice(-2).padStart(2, '0');
    const nextWholePart = incremented.slice(0, -2);
    return sign * Number(`${nextWholePart || '0'}.${cents}`);
  }

  return sign * Number(`${wholePart}.${cents}`);
};

const eventTypeLabels: Record<LoyaltyPointHistoryEventType, string> = {
  CREATED: 'Created',
  ORDER_EARNED: 'Order Earned',
  ORDER_REVERSED: 'Order Reversed',
  LOYALTY_REDEEMED: 'Loyalty Redeemed',
  MANUAL_SET: 'Manual Set',
  MANUAL_INCREMENT: 'Manual Increment',
  MANUAL_DECREMENT: 'Manual Decrement',
};

export const LoyaltyPointHistoryTable = ({ customerId, reloadKey = 0, title = 'Loyalty Points History' }: LoyaltyPointHistoryTableProps) => {
  const [history, setHistory] = useState<ILoyaltyPointHistory[]>([]);
  const [exportRows, setExportRows] = useState<ILoyaltyPointHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);

  const fileName = createReportFileName(title, [customerId || 'all-customers']);

  const fetchHistoryPage = async ({ page: nextPage, size }: { page: number; size: number }) => {
    const response = await axios.get<ILoyaltyPointHistory[]>(`api/customer-points/${customerId}/history`, {
      params: {
        page: nextPage,
        size,
        sort: 'createdDate,desc',
      },
    });

    return {
      rows: Array.isArray(response.data) ? response.data : [],
      totalCount: Number(response.headers['x-total-count']) || null,
    };
  };

  const loadHistory = (nextPage = page) => {
    if (!customerId) {
      setHistory([]);
      setTotalItems(0);
      setError(null);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return axios
      .get<ILoyaltyPointHistory[]>(`api/customer-points/${customerId}/history`, {
        params: {
          page: nextPage,
          size: PAGE_SIZE,
          sort: 'createdDate,desc',
        },
      })
      .then(response => {
        setHistory(Array.isArray(response.data) ? response.data : []);
        setTotalItems(Number(response.headers['x-total-count'] || 0));
      })
      .catch(() => {
        setHistory([]);
        setTotalItems(0);
        setError('Unable to load loyalty points history.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setPage(0);
  }, [customerId]);

  useEffect(() => {
    setExportRows([]);
    setExportError(null);
  }, [customerId, reloadKey]);

  useEffect(() => {
    loadHistory(page);
  }, [customerId, page, reloadKey]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const getPageNumbers = useMemo(() => {
    const pages: Array<number | 'ellipsis'> = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (page < 3) {
      pages.push(0, 1, 2, 'ellipsis', totalPages - 1);
      return pages;
    }

    if (page > totalPages - 4) {
      pages.push(0, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1);
      return pages;
    }

    pages.push(0, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages - 1);
    return pages;
  }, [page, totalPages]);

  const formatDelta = (value?: number | null) => {
    if (typeof value !== 'number') {
      return '-';
    }
    const scaledValue = scaleValue(value);
    return `${scaledValue > 0 ? '+' : ''}${scaledValue.toFixed(2)}`;
  };

  const formatAmount = (value?: number | null) => {
    return typeof value === 'number' ? scaleValue(value).toFixed(2) : '-';
  };

  const formatEventType = (eventType?: LoyaltyPointHistoryEventType) => {
    return eventType ? eventTypeLabels[eventType] : '-';
  };

  const ensureExportRows = async () => {
    if (!customerId) {
      setExportRows([]);
      return [];
    }

    const allRows = await fetchAllPaginatedRows<ILoyaltyPointHistory, Record<string, never>>(fetchHistoryPage, {
      requestArgs: {},
      size: EXPORT_PAGE_SIZE,
      getRowSignature: row =>
        `${row.id || ''}|${row.createdDate || ''}|${row.eventType || ''}|${row.orderId || ''}|${row.pointsDelta ?? ''}|${row.balanceAfter ?? ''}|${row.createdBy || ''}|${row.note || ''}`,
    });

    setExportRows(allRows);
    await new Promise(resolve => setTimeout(resolve, 0));
    return allRows;
  };

  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      setExportError(null);
      const allRows = await ensureExportRows();
      await saveWorkbookAsExcel(
        buildLoyaltyPointHistoryWorkbook(allRows, {
          title,
          filters: [
            { label: 'Customer ID', value: customerId || 'Unknown' },
            { label: 'Total Records', value: allRows.length },
          ],
        }),
        fileName
      );
    } catch (err) {
      setExportError(getReportApiErrorMessage(err, 'Unable to export loyalty points history.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!exportContentRef.current || !customerId) {
      return;
    }

    try {
      setBusyAction('pdf');
      setExportError(null);
      await ensureExportRows();
      if (exportContentRef.current) {
        await downloadElementAsPdf(exportContentRef.current, { fileName, orientation: 'landscape' });
      }
    } catch (err) {
      setExportError(getReportApiErrorMessage(err, 'Unable to export loyalty points history.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => exportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('landscape'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
      setExportError(null);
      try {
        await ensureExportRows();
      } catch (err) {
        setExportError(getReportApiErrorMessage(err, 'Unable to export loyalty points history.'));
        setBusyAction(null);
        throw err;
      }
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  const visibleError = exportError || error;
  const hasExportData = Boolean(customerId) && totalItems > 0 && history.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={!hasExportData || loading || busyAction !== null}
            busyAction={busyAction}
          />
          <Button type="button" variant="outline" className="h-7 text-xs" onClick={() => loadHistory(page)} disabled={loading}>
            <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {visibleError ? (
        <div className="text-xs text-destructive">{visibleError}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs text-right">Points Change</TableHead>
                <TableHead className="text-xs text-right">Balance After</TableHead>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Created By</TableHead>
                <TableHead className="text-xs">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-xs text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-xs text-center text-muted-foreground">
                    No loyalty points history found.
                  </TableCell>
                </TableRow>
              ) : (
                history.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs whitespace-nowrap">{entry.createdDate ? formatDateForDisplay(entry.createdDate) : '-'}</TableCell>
                    <TableCell className="text-xs">{formatEventType(entry.eventType)}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{formatDelta(entry.pointsDelta)}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{formatAmount(entry.balanceAfter)}</TableCell>
                    <TableCell className="text-xs">
                      {entry.orderId ? (
                        <Link to={`/order/${entry.orderId}`} className="text-blue-600 hover:underline">
                          {entry.orderId}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{entry.createdBy || '-'}</TableCell>
                    <TableCell className="text-xs">{entry.note || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={event => {
                  event.preventDefault();
                  if (page > 0) {
                    setPage(page - 1);
                  }
                }}
                className={page === 0 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {getPageNumbers.map((pageNumber, index) =>
              pageNumber === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={page === pageNumber}
                    onClick={event => {
                      event.preventDefault();
                      setPage(pageNumber);
                    }}
                  >
                    {pageNumber + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={event => {
                  event.preventDefault();
                  if (page < totalPages - 1) {
                    setPage(page + 1);
                  }
                }}
                className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="pointer-events-none fixed -left-[10000px] top-0 w-fit max-w-none bg-white p-6" aria-hidden="true">
        <div ref={exportContentRef} className="report-export-root space-y-4">
          <ReportExportHeader
            reportTitle={title}
            hiddenOnScreen
            forceVisible={busyAction === 'pdf'}
            meta={[{ label: 'Dataset', value: 'Full export dataset' }]}
            filters={[
              { label: 'Customer ID', value: customerId || 'Unknown' },
              { label: 'Total Records', value: exportRows.length },
            ]}
          />

          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs text-right">Points Change</TableHead>
                  <TableHead className="text-xs text-right">Balance After</TableHead>
                  <TableHead className="text-xs">Order</TableHead>
                  <TableHead className="text-xs">Created By</TableHead>
                  <TableHead className="text-xs">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRows.map(entry => (
                  <TableRow key={`export-${entry.id || `${entry.createdDate}-${entry.orderId}-${entry.eventType}`}`}>
                    <TableCell className="text-xs whitespace-nowrap">{entry.createdDate ? formatDateForDisplay(entry.createdDate) : '-'}</TableCell>
                    <TableCell className="text-xs">{formatEventType(entry.eventType)}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{formatDelta(entry.pointsDelta)}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{formatAmount(entry.balanceAfter)}</TableCell>
                    <TableCell className="text-xs">{entry.orderId || '-'}</TableCell>
                    <TableCell className="text-xs">{entry.createdBy || '-'}</TableCell>
                    <TableCell className="text-xs">{entry.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPointHistoryTable;
