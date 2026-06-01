import type { IStoreCreditReportRow } from 'app/shared/model/store-credit-report.model';
import type { IHouseChargesReportRow } from 'app/shared/model/house-charges-report.model';
import type { ICommissionFeesReport } from 'app/shared/model/commission-fees-report.model';
import type { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import type {
  ICashierNegativeRow,
  ICollectedSalesTaxRow,
  IDiscountTypeRow,
  ISalesActivitySummaryReport,
  ITotalSalesSection,
  ITypeAmountQuantityRow,
} from 'app/shared/model/sales-activity-summary-report.model';
import type {
  ICashierByTerminalDiscountTypeRow,
  ICashierByTerminalFieldRow,
  ICashierByTerminalReport,
  ICashierByTerminalSection,
  ICashierByTerminalTerminal,
  ICashierByTerminalTypeRow,
} from 'app/shared/model/cashier-by-terminal-report.model';
import type { IOptimizedProductSalesReport, IOptimizedProductSalesRow } from 'app/shared/model/optimized-product-sales-report.model';
import { saveAsExcelFile } from './excel-utils';

export type ReportOrientation = 'portrait' | 'landscape';

export type ReportFilterInfo = {
  label: string;
  value: string | number | null | undefined;
};

export type InventoryWorkbookRow = {
  itemName: string;
  variantName: string;
  price: string;
  locationName: string;
  locationType: string;
  quantity: string;
  unitCost: string;
};

export type InventoryOnHandWorkbookRow = {
  itemNumber: string;
  description: string;
  costBase: string;
  costReal: string;
  onHandQuantity: string;
};

type PdfExportOptions = {
  fileName: string;
  orientation?: ReportOrientation;
  contentWidthPx?: number;
};

type CellValue = string | number | null | undefined;

type ExportSheet = {
  name: string;
  rows: CellValue[][];
  columnWidths?: number[];
  titleRowIndices?: number[];
  headerRowIndices?: number[];
  totalRowIndices?: number[];
};

type ExportWorkbook = {
  sheets: ExportSheet[];
};

type ExportWorkbookOptions = {
  title: string;
  filters?: ReportFilterInfo[];
};

type StoreCreditPageFetcher = (args: {
  fromDate?: string | null;
  toDate?: string | null;
  onAccountEnabled?: boolean | null;
  accountNumber?: string | null;
  page: number;
  size: number;
}) => Promise<IStoreCreditReportRow[]>;

type PaginatedExportResult<T> = {
  rows: T[];
  totalCount?: number | null;
};

type PaginatedExportRequest = Record<string, unknown>;

const DEFAULT_PAGE_SIZE = 250;
const DEFAULT_PORTRAIT_EXPORT_WIDTH = 720;
const DEFAULT_LANDSCAPE_EXPORT_WIDTH = 1040;

const formatAmount = (value?: number | null, emptyAsDash = false) => {
  if (value === null || value === undefined) {
    return emptyAsDash ? '-' : '0.00';
  }

  return value.toFixed(2);
};

const formatCount = (value?: number | null) => {
  const safeValue = value ?? 0;
  return Number.isInteger(safeValue) ? `${safeValue}` : `${safeValue}`;
};

const formatQuantity = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '0';
  }

  return Number.isInteger(value) ? `${value}` : `${value}`;
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '0.00';
  }

  return value.toFixed(2);
};

const compactCell = (value: CellValue) => (value === null || value === undefined ? '' : value);

const getWorkbookHeader = ({ title, filters = [] }: ExportWorkbookOptions) => {
  const rows: CellValue[][] = [[title]];
  const titleRowIndices = [0];

  filters.forEach(filter => {
    if (filter.value !== null && filter.value !== undefined && `${filter.value}`.trim() !== '') {
      rows.push([filter.label, filter.value]);
    }
  });

  if (rows.length > 1) {
    rows.push([]);
  }

  return { rows, titleRowIndices };
};

const slugify = (value: string | number) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

export const createReportFileName = (
  reportName: string,
  details: Array<string | number | null | undefined> = [],
) => {
  const parts = [reportName, ...details]
    .map(part => (part !== null && part !== undefined && part !== '' ? slugify(part) : ''))
    .filter(Boolean);

  return parts.join('-') || 'report';
};

const reportExportLayoutStyles = `
  .report-export-root,
  .report-export-root .report-export-scroll,
  .report-export-root .report-section-card,
  .report-export-root .report-section-content,
  .report-export-root .report-data-table,
  .report-export-root .report-table-body {
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
  }

  .report-export-root table,
  .report-export-root .report-data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .report-export-root thead {
    display: table-header-group;
  }

  .report-export-root tbody {
    display: table-row-group;
  }

  .report-export-root tfoot {
    display: table-footer-group;
  }

  .report-export-root .report-export-header,
  .report-export-root .report-section-header,
  .report-export-root thead,
  .report-export-root tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .report-export-root .report-export-header,
  .report-export-root .report-section-title,
  .report-export-root .report-head-cell,
  .report-export-root .report-text-cell,
  .report-export-root .report-label-cell,
  .report-export-root .report-sub-label-cell,
  .report-export-root .report-muted-cell {
    white-space: normal !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    hyphens: none !important;
  }

  .report-export-root .report-numeric-cell {
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    hyphens: none !important;
  }
`;

export const analyticsReportPrintStyles = (orientation: ReportOrientation = 'portrait') => `
  @page {
    size: A4 ${orientation};
    margin: 10mm;
  }

  @media print {
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .report-export-actions,
    .report-filters-card {
      display: none !important;
    }

    .report-export-header {
      display: block !important;
    }

    .report-export-root {
      box-shadow: none !important;
      border: 0 !important;
    }

    ${reportExportLayoutStyles}
  }
`;

export const downloadElementAsPdf = async (
  element: HTMLElement,
  {
    fileName,
    orientation = 'portrait',
    contentWidthPx,
  }: PdfExportOptions
) => {
  type Html2PdfInstance = {
    set: (options: Record<string, unknown>) => Html2PdfInstance;
    from: (source: HTMLElement | string) => Html2PdfInstance;
    save: () => Promise<void>;
  };

  type Html2PdfFactory = () => Html2PdfInstance;

  const html2pdfModule = await import('html2pdf.js');
  const html2pdf =
    (html2pdfModule as { default?: Html2PdfFactory }).default ?? (html2pdfModule as unknown as Html2PdfFactory);
  const exportStyle = element.ownerDocument.createElement('style');
  exportStyle.setAttribute('data-report-export-pdf-style', 'true');
  exportStyle.textContent = reportExportLayoutStyles;
  element.prepend(exportStyle);
  const previousInlineWidth = element.style.width;
  const previousInlineMaxWidth = element.style.maxWidth;
  const previousInlineMinWidth = element.style.minWidth;
  const resolvedContentWidth = contentWidthPx ?? (orientation === 'landscape' ? DEFAULT_LANDSCAPE_EXPORT_WIDTH : DEFAULT_PORTRAIT_EXPORT_WIDTH);

  element.style.width = `${resolvedContentWidth}px`;
  element.style.maxWidth = `${resolvedContentWidth}px`;
  element.style.minWidth = '0';

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation,
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: [
            '.report-export-header',
            '.report-section-header',
            'thead',
            'tr',
          ],
        },
      })
      .from(element)
      .save();
  } finally {
    element.style.width = previousInlineWidth;
    element.style.maxWidth = previousInlineMaxWidth;
    element.style.minWidth = previousInlineMinWidth;
    exportStyle.remove();
  }
};

export const sanitizeWorksheetName = (name: string, usedNames = new Set<string>()) => {
  const fallbackName = 'Sheet';
  const cleanBase =
    (name || fallbackName)
      .replace(/[\\/*?:[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 31) || fallbackName;

  let candidate = cleanBase;
  let counter = 1;

  while (usedNames.has(candidate)) {
    const suffix = ` ${counter}`;
    candidate = `${cleanBase.slice(0, Math.max(0, 31 - suffix.length))}${suffix}`;
    counter += 1;
  }

  usedNames.add(candidate);
  return candidate;
};

export const fetchAllPaginatedRows = async <T, TArgs extends PaginatedExportRequest>(
  fetchPage: (args: TArgs & { page: number; size: number }) => Promise<PaginatedExportResult<T>>,
  {
    requestArgs,
    size = DEFAULT_PAGE_SIZE,
    getRowSignature,
  }: {
    requestArgs: TArgs;
    size?: number;
    getRowSignature: (row: T) => string;
  }
) => {
  const rows: T[] = [];
  const seenPageSignatures = new Set<string>();
  const seenRowSignatures = new Set<string>();
  let page = 0;
  let totalCount: number | null = null;

  while (true) {
    const result = await fetchPage({
      ...requestArgs,
      page,
      size,
    });
    const nextPageRows = Array.isArray(result?.rows) ? result.rows : [];
    const pageSignature = nextPageRows.map(getRowSignature).join('||');

    if (nextPageRows.length === 0 || seenPageSignatures.has(pageSignature)) {
      break;
    }

    seenPageSignatures.add(pageSignature);

    const uniqueRows = nextPageRows.filter(row => {
      const rowSignature = getRowSignature(row);

      if (seenRowSignatures.has(rowSignature)) {
        return false;
      }

      seenRowSignatures.add(rowSignature);
      return true;
    });

    if (uniqueRows.length === 0) {
      break;
    }

    rows.push(...uniqueRows);

    if (typeof result?.totalCount === 'number' && Number.isFinite(result.totalCount)) {
      totalCount = result.totalCount;
    }

    if (nextPageRows.length < size || (totalCount !== null && rows.length >= totalCount)) {
      break;
    }

    page += 1;
  }

  return rows;
};

export const fetchAllStoreCreditRows = async (
  fetchPage: StoreCreditPageFetcher,
  {
    fromDate = null,
    toDate = null,
    onAccountEnabled = null,
    accountNumber = null,
    size = DEFAULT_PAGE_SIZE,
  }: {
    fromDate?: string | null;
    toDate?: string | null;
    onAccountEnabled?: boolean | null;
    accountNumber?: string | null;
    size?: number;
  } = {}
) => {
  return fetchAllPaginatedRows<
    IStoreCreditReportRow,
    {
      fromDate?: string | null;
      toDate?: string | null;
      onAccountEnabled?: boolean | null;
      accountNumber?: string | null;
    }
  >(
    async ({ page, size, fromDate, toDate, onAccountEnabled, accountNumber }) => ({
      rows: await fetchPage({
        fromDate,
        toDate,
        onAccountEnabled,
        accountNumber,
        page,
        size,
      }),
    }),
    {
      requestArgs: {
        fromDate,
        toDate,
        onAccountEnabled,
        accountNumber,
      },
      size,
      getRowSignature: row => `${row.customerId}|${row.customerName}|${row.creditLimit}|${row.balance}`,
    }
  );
};

const pushSectionTable = (
  rows: CellValue[][],
  title: string,
  headers: string[],
  bodyRows: CellValue[][],
  totalsRow?: CellValue[]
) => {
  const titleRowIndex = rows.length;
  rows.push([title]);

  const headerRowIndex = rows.length;
  rows.push(headers);

  if (bodyRows.length === 0) {
    rows.push(['No data']);
  } else {
    rows.push(...bodyRows);
  }

  let totalRowIndex: number | undefined;

  if (totalsRow) {
    totalRowIndex = rows.length;
    rows.push(totalsRow);
  }

  rows.push([]);

  return {
    titleRowIndex,
    headerRowIndex,
    totalRowIndex,
  };
};

const buildSummarySheet = (options: ExportWorkbookOptions, totalSalesSection?: ITotalSalesSection | null): ExportSheet => {
  const workbookHeader = getWorkbookHeader(options);
  const rows: CellValue[][] = [...workbookHeader.rows, ['Metric', 'Value']];

  const metrics: Array<[string, number | null | undefined]> = [
    ['Gross Sales With Tax', totalSalesSection?.grossSalesWithTax],
    ['Gross Sales With Tax Quantity', totalSalesSection?.grossSalesWithTaxQuantity],
    ['Negative Total', totalSalesSection?.negativeTotal],
    ['Item Discount Total', totalSalesSection?.itemDiscountTotal],
    ['Item Discount Total Quantity', totalSalesSection?.itemDiscountTotalQuantity],
    ['Subtotal Discount Total', totalSalesSection?.subtotalDiscountTotal],
    ['Subtotal Discount Total Quantity', totalSalesSection?.subtotalDiscountTotalQuantity],
    ['Net Sales With Tax', totalSalesSection?.netSalesWithTax],
    ['Total Tax Collected', totalSalesSection?.totalTaxCollected],
    ['Net Sales No Tax', totalSalesSection?.netSalesNoTax],
    ['Average Sale', totalSalesSection?.averageSale],
  ];

  metrics.forEach(([label, value]) => rows.push([label, value ?? '']));

  return {
    name: 'Summary',
    rows,
    columnWidths: [36, 16],
    titleRowIndices: workbookHeader.titleRowIndices,
    headerRowIndices: [workbookHeader.rows.length],
  };
};

const buildAmountQuantitySectionSheet = <T,>(
  title: string,
  rows: T[] | undefined,
  columns: Array<{ key: string; label: string; render: (row: T) => CellValue }>,
  totals: Record<string, CellValue>,
  options: ExportWorkbookOptions
): ExportSheet => {
  const workbookHeader = getWorkbookHeader(options);
  const sheetRows = [...workbookHeader.rows];
  const section = pushSectionTable(
    sheetRows,
    title,
    columns.map(column => column.label),
    (rows || []).map(row => columns.map(column => column.render(row))),
    columns.map((column, index) => {
      if (index === 0) {
        return 'Totals';
      }

      return totals[column.key] ?? '';
    })
  );

  return {
    name: title,
    rows: sheetRows,
    columnWidths: columns.map((_, index) => (index === 0 ? 26 : 16)),
    titleRowIndices: [...workbookHeader.titleRowIndices, section.titleRowIndex],
    headerRowIndices: [section.headerRowIndex],
    totalRowIndices: section.totalRowIndex !== undefined ? [section.totalRowIndex] : [],
  };
};

export const buildStoreCreditWorkbook = (rows: IStoreCreditReportRow[], options: ExportWorkbookOptions): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const totalLimit = rows.reduce((sum, row) => sum + (row.creditLimit || 0), 0);
  const totalBalance = rows.reduce((sum, row) => sum + (row.balance || 0), 0);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push(['Customer Name', 'Customer ID', 'Limit', 'Balance']);
  rows.forEach(row => {
    sheetRows.push([row.customerName, row.customerId, formatAmount(row.creditLimit), formatAmount(row.balance)]);
  });

  const totalRowIndex = sheetRows.length;
  sheetRows.push(['Totals', '', formatAmount(totalLimit), formatAmount(totalBalance)]);

  return {
    sheets: [
      {
        name: 'Customer Balance',
        rows: sheetRows,
        columnWidths: [30, 24, 14, 14],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
        totalRowIndices: [totalRowIndex],
      },
    ],
  };
};

export const buildCustomerWorkbook = (rows: ICustomer[], options: ExportWorkbookOptions): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const totalDebitLimit = rows.reduce((sum, row) => sum + (row.onAccountDebitLimit || 0), 0);
  const totalDebitUsed = rows.reduce((sum, row) => sum + (row.onAccountDebitUsed || 0), 0);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push(['Name', 'Email', 'Phone', 'Account Number', 'Business Name', 'On Account', 'Debit Limit', 'Debit Used']);

  rows.forEach(row => {
    const displayName = [row.firstName, row.lastName]
      .filter(part => typeof part === 'string' && part.trim().length > 0)
      .join(' ')
      .trim();

    sheetRows.push([
      displayName || '-',
      row.email || '-',
      row.phone || '-',
      row.accountNumber || '-',
      row.businessDetails?.businessName || '-',
      row.onAccountEnabled ? 'Active' : 'Inactive',
      formatAmount(row.onAccountDebitLimit),
      formatAmount(row.onAccountDebitUsed),
    ]);
  });

  const totalRowIndex = sheetRows.length;
  sheetRows.push(['Totals', '', '', '', '', '', formatAmount(totalDebitLimit), formatAmount(totalDebitUsed)]);

  return {
    sheets: [
      {
        name: 'Customers',
        rows: sheetRows,
        columnWidths: [28, 28, 18, 18, 24, 14, 14, 14],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
        totalRowIndices: [totalRowIndex],
      },
    ],
  };
};

export const buildInventoryWorkbook = (rows: InventoryWorkbookRow[], options: ExportWorkbookOptions): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push(['Item', 'Variant', 'Price', 'Location', 'Location Type', 'Quantity', 'Unit Cost']);

  if (rows.length === 0) {
    sheetRows.push(['No inventory records found']);
  } else {
    rows.forEach(row => {
      sheetRows.push([
        row.itemName,
        row.variantName,
        row.price,
        row.locationName,
        row.locationType,
        row.quantity,
        row.unitCost,
      ]);
    });
  }

  return {
    sheets: [
      {
        name: 'Inventory Report',
        rows: sheetRows,
        columnWidths: [28, 24, 12, 20, 18, 12, 12],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
      },
    ],
  };
};

export const buildInventoryOnHandWorkbook = (rows: InventoryOnHandWorkbookRow[], options: ExportWorkbookOptions): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push([
    'Item Number',
    'Description',
    'Cost Base',
    'Cost Real',
    'On Hand Quantity',
  ]);

  if (rows.length === 0) {
    sheetRows.push(['No on hand records found']);
  } else {
    rows.forEach(row => {
      sheetRows.push([
        row.itemNumber,
        row.description,
        row.costBase,
        row.costReal,
        row.onHandQuantity,
      ]);
    });

    const totals = rows.reduce(
      (acc, row) => ({
        costBase: acc.costBase + (Number(row.costBase) || 0),
        costReal: acc.costReal + (Number(row.costReal) || 0),
        onHandQuantity: acc.onHandQuantity + (Number(row.onHandQuantity) || 0),
      }),
      {
        costBase: 0,
        costReal: 0,
        onHandQuantity: 0,
      }
    );

    const totalRowIndex = sheetRows.length;
    sheetRows.push([
      'Totals',
      '',
      formatAmount(totals.costBase),
      formatAmount(totals.costReal),
      formatAmount(totals.onHandQuantity),
    ]);

    return {
      sheets: [
        {
          name: 'On Hand Report',
          rows: sheetRows,
          columnWidths: [18, 32, 14, 14, 16],
          titleRowIndices: workbookHeader.titleRowIndices,
          headerRowIndices: [headerRowIndex],
          totalRowIndices: [totalRowIndex],
        },
      ],
    };
  }

  return {
    sheets: [
      {
        name: 'On Hand Report',
        rows: sheetRows,
        columnWidths: [18, 32, 14, 14, 16],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
      },
    ],
  };
};

export const buildHouseChargesWorkbook = (rows: IHouseChargesReportRow[], options: ExportWorkbookOptions): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push(['Terminal', 'Receipt', 'Timestamp', 'Account Number', 'Customer Name', 'Amount']);
  rows.forEach(row => {
    sheetRows.push([
      row.terminal || '-',
      row.receipt || '-',
      row.timestamp || '-',
      row.accountNumber || '-',
      row.customerName || '-',
      formatAmount(row.amount),
    ]);
  });

  const totalRowIndex = sheetRows.length;
  sheetRows.push(['Totals', '', '', '', '', formatAmount(totalAmount)]);

  return {
    sheets: [
      {
        name: 'House Charges',
        rows: sheetRows,
        columnWidths: [18, 16, 24, 18, 24, 14],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
        totalRowIndices: [totalRowIndex],
      },
    ],
  };
};

export const buildCommissionFeesWorkbook = (reportData: ICommissionFeesReport, options: ExportWorkbookOptions): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push(['Metric', 'Value']);
  sheetRows.push(['Orders Count', formatCount(reportData.ordersCount)]);
  sheetRows.push(['Subtotal Sum', formatAmount(reportData.subtotalSum)]);
  sheetRows.push(['Commission Rate', `${formatPercent(reportData.commissionRate)}%`]);
  sheetRows.push(['Commission Amount', formatAmount(reportData.commissionAmount)]);

  return {
    sheets: [
      {
        name: 'Commission Fees',
        rows: sheetRows,
        columnWidths: [28, 18],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
      },
    ],
  };
};

export const buildOptimizedProductSalesWorkbook = (
  reportData: IOptimizedProductSalesReport,
  options: ExportWorkbookOptions
): ExportWorkbook => {
  const workbookHeader = getWorkbookHeader(options);
  const sheetRows = [...workbookHeader.rows];
  const headerRowIndex = sheetRows.length;

  sheetRows.push(['Receipt Alias', 'Quantity', 'Quantity %', 'Ext Cost', 'Sales', 'Margin', 'Margin %']);

  (reportData.items || []).forEach((item: IOptimizedProductSalesRow) => {
    sheetRows.push([
      item.receiptAlias || '-',
      formatQuantity(item.quantity),
      formatPercent(item.quantityPercent),
      formatAmount(item.extCost),
      formatAmount(item.sales),
      formatAmount(item.margin),
      formatPercent(item.marginPercent),
    ]);
  });

  const totalRowIndex = sheetRows.length;
  sheetRows.push([
    'Totals',
    formatQuantity(reportData.totalQuantity),
    '-',
    formatAmount(reportData.totalExtCost),
    formatAmount(reportData.totalSales),
    formatAmount(reportData.totalMargin),
    '-',
  ]);

  return {
    sheets: [
      {
        name: 'Optimized Product Sales',
        rows: sheetRows,
        columnWidths: [28, 12, 12, 14, 14, 14, 12],
        titleRowIndices: workbookHeader.titleRowIndices,
        headerRowIndices: [headerRowIndex],
        totalRowIndices: [totalRowIndex],
      },
    ],
  };
};

export const buildSalesActivitySummaryWorkbook = (
  reportData: ISalesActivitySummaryReport,
  options: ExportWorkbookOptions
): ExportWorkbook => {
  const sheets: ExportSheet[] = [buildSummarySheet(options, reportData.totalSalesSection)];

  sheets.push(
    buildAmountQuantitySectionSheet<ICashierNegativeRow>(
      'Cashier Negative',
      reportData.cashierNegative?.rows,
      [
        { key: 'field', label: 'Field', render: row => row.field || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.cashierNegative?.totalAmount),
        quantity: formatQuantity(reportData.cashierNegative?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<IDiscountTypeRow>(
      'Line Item Discount',
      reportData.lineItemDiscount?.rows,
      [
        { key: 'discountType', label: 'Discount Type', render: row => row.discountType || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.lineItemDiscount?.totalAmount),
        quantity: formatQuantity(reportData.lineItemDiscount?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<IDiscountTypeRow>(
      'Subtotal Discount',
      reportData.subtotalDiscount?.rows,
      [
        { key: 'discountType', label: 'Discount Type', render: row => row.discountType || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.subtotalDiscount?.totalAmount),
        quantity: formatQuantity(reportData.subtotalDiscount?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ICollectedSalesTaxRow>(
      'Collected Sales Tax',
      reportData.collectedSalesTax?.rows,
      [
        { key: 'taxCode', label: 'Tax Code', render: row => row.taxCode || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'taxableSales', label: 'Taxable Sales', render: row => formatAmount(row.taxableSales) },
      ],
      {
        amount: formatAmount(reportData.collectedSalesTax?.totalAmount),
      },
      options
    ),
    buildAmountQuantitySectionSheet(
      'Exempted Sales Tax',
      reportData.exemptedSalesTax?.rows,
      [{ key: 'value', label: 'Tax Exempt Sales', render: () => '-' }],
      {
        value: formatAmount(reportData.exemptedSalesTax?.totalTaxExemptSales),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ITypeAmountQuantityRow>(
      'Credit Card Breakdown',
      reportData.creditCardBreakdown?.rows,
      [
        { key: 'type', label: 'Type', render: row => row.type || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.creditCardBreakdown?.totalAmount),
        quantity: formatQuantity(reportData.creditCardBreakdown?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ITypeAmountQuantityRow>(
      'House Charge',
      reportData.houseCharge?.rows,
      [
        { key: 'type', label: 'Type', render: row => row.type || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.houseCharge?.totalAmount),
        quantity: formatQuantity(reportData.houseCharge?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ITypeAmountQuantityRow>(
      'Department Net Sales',
      reportData.departmentNetSales?.rows,
      [
        { key: 'type', label: 'Type', render: row => row.type || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.departmentNetSales?.totalAmount),
        quantity: formatQuantity(reportData.departmentNetSales?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ITypeAmountQuantityRow>(
      'Paid Out',
      reportData.paidOut?.rows,
      [
        { key: 'type', label: 'Type', render: row => row.type || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.paidOut?.totalAmount),
        quantity: formatQuantity(reportData.paidOut?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ITypeAmountQuantityRow>(
      'Paid In',
      reportData.paidIn?.rows,
      [
        { key: 'type', label: 'Type', render: row => row.type || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.paidIn?.totalAmount),
        quantity: formatQuantity(reportData.paidIn?.totalQuantity),
      },
      options
    ),
    buildAmountQuantitySectionSheet<ITypeAmountQuantityRow>(
      'Gift Card',
      reportData.giftCard?.rows,
      [
        { key: 'type', label: 'Type', render: row => row.type || '-' },
        { key: 'amount', label: 'Amount', render: row => formatAmount(row.amount, true) },
        { key: 'quantity', label: 'Quantity', render: row => formatQuantity(row.quantity) },
      ],
      {
        amount: formatAmount(reportData.giftCard?.totalAmount),
        quantity: formatQuantity(reportData.giftCard?.totalQuantity),
      },
      options
    )
  );

  return { sheets };
};

const cashierByTerminalSectionConfigs: Array<{
  key: keyof ICashierByTerminalTerminal;
  title: string;
  firstColumnLabel: string;
  getRowLabel: (
    row: ICashierByTerminalTypeRow | ICashierByTerminalFieldRow | ICashierByTerminalDiscountTypeRow
  ) => string;
}> = [
  {
    key: 'houseCharge',
    title: 'House Charge',
    firstColumnLabel: 'Type',
    getRowLabel: row => ('type' in row ? row.type || '-' : '-'),
  },
  {
    key: 'tendersInDrawer',
    title: 'Tenders In Drawer',
    firstColumnLabel: 'Type',
    getRowLabel: row => ('type' in row ? row.type || '-' : '-'),
  },
  {
    key: 'cashierNegative',
    title: 'Cashier Negative',
    firstColumnLabel: 'Field',
    getRowLabel: row => ('field' in row ? row.field || '-' : '-'),
  },
  {
    key: 'lineItemDiscount',
    title: 'Line Item Discount',
    firstColumnLabel: 'Discount Type',
    getRowLabel: row => ('discountType' in row ? row.discountType || '-' : '-'),
  },
  {
    key: 'subtotalDiscount',
    title: 'Subtotal Discount',
    firstColumnLabel: 'Discount Type',
    getRowLabel: row => ('discountType' in row ? row.discountType || '-' : '-'),
  },
  {
    key: 'paidOut',
    title: 'Paid Out',
    firstColumnLabel: 'Type',
    getRowLabel: row => ('type' in row ? row.type || '-' : '-'),
  },
  {
    key: 'paidIn',
    title: 'Paid In',
    firstColumnLabel: 'Type',
    getRowLabel: row => ('type' in row ? row.type || '-' : '-'),
  },
  {
    key: 'giftCard',
    title: 'Gift Card',
    firstColumnLabel: 'Type',
    getRowLabel: row => ('type' in row ? row.type || '-' : '-'),
  },
];

export const buildCashierByTerminalWorkbook = (
  reportData: ICashierByTerminalReport,
  options: ExportWorkbookOptions
): ExportWorkbook => {
  const usedNames = new Set<string>();
  const sheets = (reportData.terminals || []).map(terminal => {
    const workbookHeader = getWorkbookHeader(options);
    const rows: CellValue[][] = [...workbookHeader.rows];
    const titleRowIndices = [...workbookHeader.titleRowIndices];
    const headerRowIndices: number[] = [];
    const totalRowIndices: number[] = [];

    rows.push(['Registry Name', terminal.registryName || 'Unnamed Terminal']);
    rows.push(['Registry ID', terminal.registryId || '-']);
    rows.push([]);

    cashierByTerminalSectionConfigs.forEach(sectionConfig => {
      const sectionData = terminal[sectionConfig.key] as ICashierByTerminalSection<
        ICashierByTerminalTypeRow | ICashierByTerminalFieldRow | ICashierByTerminalDiscountTypeRow
      > | undefined;

      const section = pushSectionTable(
        rows,
        sectionConfig.title,
        [sectionConfig.firstColumnLabel, 'Amount', 'Quantity'],
        (sectionData?.rows || []).map(row => [
          sectionConfig.getRowLabel(row),
          formatAmount(row.amount, true),
          formatQuantity(row.quantity),
        ]),
        ['Totals', formatAmount(sectionData?.totalAmount), formatQuantity(sectionData?.totalQuantity)]
      );

      titleRowIndices.push(section.titleRowIndex);
      headerRowIndices.push(section.headerRowIndex);

      if (section.totalRowIndex !== undefined) {
        totalRowIndices.push(section.totalRowIndex);
      }
    });

    return {
      name: sanitizeWorksheetName(terminal.registryName || terminal.registryId || 'Terminal', usedNames),
      rows,
      columnWidths: [28, 14, 14],
      titleRowIndices,
      headerRowIndices,
      totalRowIndices,
    };
  });

  return {
    sheets:
      sheets.length > 0
        ? sheets
        : [
            {
              name: 'Terminals',
              rows: [[options.title], ['No terminal data available']],
              titleRowIndices: [0],
            },
          ],
  };
};

export const saveWorkbookAsExcel = async (workbook: ExportWorkbook, fileName: string) => {
  const xlsx = await import('xlsx-js-style');
  const sheets: Record<string, unknown> = {};
  const sheetNames: string[] = [];

  workbook.sheets.forEach(sheet => {
    const worksheet = xlsx.utils.aoa_to_sheet(sheet.rows.map(row => row.map(compactCell)));

    if (sheet.columnWidths?.length) {
      worksheet['!cols'] = sheet.columnWidths.map(width => ({ wch: width }));
    }

    const boldRows = new Set([...(sheet.titleRowIndices || []), ...(sheet.headerRowIndices || []), ...(sheet.totalRowIndices || [])]);

    boldRows.forEach(rowIndex => {
      const row = sheet.rows[rowIndex] || [];
      row.forEach((_, columnIndex) => {
        const cellAddress = xlsx.utils.encode_cell({ r: rowIndex, c: columnIndex });
        if (!worksheet[cellAddress]) {
          return;
        }

        worksheet[cellAddress].s = {
          font: {
            bold: true,
            sz: sheet.titleRowIndices?.includes(rowIndex) ? 14 : 11,
          },
        };
      });
    });

    sheets[sheet.name] = worksheet;
    sheetNames.push(sheet.name);
  });

  const excelBuffer = xlsx.write(
    {
      Sheets: sheets,
      SheetNames: sheetNames,
    },
    {
      bookType: 'xlsx',
      type: 'array',
    }
  );

  saveAsExcelFile(excelBuffer, fileName);
};
