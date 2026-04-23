import type { ISalesReport } from 'app/shared/model/sales-report.model';

export type SalesReportMetricKey = 'total' | 'revenue' | 'costOfGoods' | 'grossProfit' | 'margin' | 'tax' | 'taxes' | 'returns';

export type SalesReportCellValue = string | number | null | undefined;

export type SalesReportPeriodColumn = {
  key: string;
  label: string;
  order: number;
  index: number;
};

export type SalesReportMetricColumn = {
  key: SalesReportMetricKey;
  label: string;
  kind: 'selected-total' | 'currency' | 'text' | 'count';
};

export type SalesReportRowModel = {
  id: string;
  label: string;
  periodValues: Record<string, SalesReportCellValue>;
  metricValues: Partial<Record<SalesReportMetricKey, SalesReportCellValue>>;
};

export type SalesReportFooterRow = {
  key: string;
  label: string;
  periodValues: Record<string, SalesReportCellValue>;
};

export type SalesReportMetricSummaryRow = {
  id: string;
  label: string;
  metricValues: Partial<Record<SalesReportMetricKey, SalesReportCellValue>>;
};

export type SalesReportExportGroup = {
  key: string;
  title: string;
  periodColumns: SalesReportPeriodColumn[];
  periodTableRows: SalesReportRowModel[];
  periodFooterRows: SalesReportFooterRow[];
  metricSummaryColumns: SalesReportMetricColumn[];
  metricSummaryRows: SalesReportMetricSummaryRow[];
};

export type SalesReportViewModel = {
  labelColumnTitle: string;
  periodColumns: SalesReportPeriodColumn[];
  metricColumns: SalesReportMetricColumn[];
  rows: SalesReportRowModel[];
  footerRows: SalesReportFooterRow[];
  exportGroups: SalesReportExportGroup[];
  rowCount: number;
  periodCount: number;
};

type SalesReportSourceRow = {
  rowRecord?: {
    id?: string | null;
    name?: string | null;
  } | null;
  slots?: Array<{ order?: number | null; value?: number | null }> | null;
  value?: string | number | null;
  revenue?: number | null;
  costOfGoods?: number | null;
  grossProfit?: number | null;
  margin?: number | null;
  tax?: number | null;
  taxes?: string | null;
  returns?: number | null;
  returned?: number | null;
};

type SalesReportTotalsRecord = {
  value?: number | null;
  revenue?: number | null;
  costOfGoods?: number | null;
  grossProfit?: number | null;
  margin?: number | null;
  tax?: number | null;
  taxes?: string | null;
  returns?: number | null;
  returned?: number | null;
};

type SalesReportSource = Omit<ISalesReport, 'rows' | 'totalByDateRange' | 'headerSlots'> & {
  rows?: SalesReportSourceRow[] | null;
  headerSlots?: Array<{ order?: number | null; label?: string | null }> | null;
  totalByDateRange?: Record<string, SalesReportTotalsRecord> | SalesReportTotalsRecord[] | null;
};

const DEFAULT_EXPORT_GROUP_SIZE = 4;

const METRIC_COLUMNS: Array<{
  key: SalesReportMetricKey;
  label: string;
  kind: SalesReportMetricColumn['kind'];
  hiddenFor?: string[];
}> = [
  { key: 'total', label: 'Total', kind: 'selected-total' },
  { key: 'revenue', label: 'Revenue', kind: 'currency', hiddenFor: ['REVENUE'] },
  { key: 'costOfGoods', label: 'Cost Of Goods', kind: 'currency' },
  { key: 'grossProfit', label: 'Gross Profit', kind: 'currency' },
  { key: 'margin', label: 'Margin', kind: 'currency' },
  { key: 'tax', label: 'Tax', kind: 'currency', hiddenFor: ['TAX'] },
  { key: 'taxes', label: 'Taxes', kind: 'text' },
  { key: 'returns', label: 'Returns', kind: 'currency', hiddenFor: ['RETURNS'] },
];

const buildPeriodColumns = (headerSlots: SalesReportSource['headerSlots']): SalesReportPeriodColumn[] =>
  (headerSlots || [])
    .filter(slot => slot?.order !== null && slot?.order !== undefined && slot?.label)
    .sort((left, right) => (left?.order || 0) - (right?.order || 0))
    .map((slot, index) => ({
      key: `period-${slot.order}`,
      label: slot.label || `Period ${index + 1}`,
      order: slot.order || index,
      index,
    }));

const buildMetricColumns = (selectedMeasure: string): SalesReportMetricColumn[] =>
  METRIC_COLUMNS.filter(column => !column.hiddenFor?.includes(selectedMeasure)).map(column => ({
    key: column.key,
    label: column.label,
    kind: column.kind,
  }));

const getReturnsValue = (value?: { returns?: number | null; returned?: number | null } | null) =>
  value?.returns ?? value?.returned ?? null;

const getMetricValue = (row: SalesReportSourceRow | null | undefined, key: SalesReportMetricKey): SalesReportCellValue => {
  switch (key) {
    case 'total':
      return row?.value ?? null;
    case 'returns':
      return getReturnsValue(row);
    case 'revenue':
      return row?.revenue ?? null;
    case 'costOfGoods':
      return row?.costOfGoods ?? null;
    case 'grossProfit':
      return row?.grossProfit ?? null;
    case 'margin':
      return row?.margin ?? null;
    case 'tax':
      return row?.tax ?? null;
    case 'taxes':
      return row?.taxes ?? null;
    default:
      return null;
  }
};

const buildRows = (rows: SalesReportSource['rows'], periodColumns: SalesReportPeriodColumn[], metricColumns: SalesReportMetricColumn[]) =>
  (rows || []).map((row, rowIndex) => {
    const slotMap = new Map<number, number | null | undefined>();
    (row?.slots || []).forEach(slot => {
      if (slot?.order !== null && slot?.order !== undefined) {
        slotMap.set(slot.order, slot?.value);
      }
    });

    const periodValues = Object.fromEntries(periodColumns.map(column => [column.key, slotMap.get(column.order) ?? null]));
    const metricValues = metricColumns.reduce<Partial<Record<SalesReportMetricKey, SalesReportCellValue>>>((accumulator, column) => {
      accumulator[column.key] = getMetricValue(row, column.key);
      return accumulator;
    }, {});

    return {
      id: row?.rowRecord?.id || `${row?.rowRecord?.name || 'row'}-${rowIndex}`,
      label: row?.rowRecord?.name || 'Unnamed',
      periodValues,
      metricValues,
    };
  });

const getPeriodTotals = (totalsByDateRange: SalesReportSource['totalByDateRange']) => {
  if (Array.isArray(totalsByDateRange)) {
    return totalsByDateRange;
  }

  if (!totalsByDateRange || typeof totalsByDateRange !== 'object') {
    return [];
  }

  return Object.values(totalsByDateRange);
};

const getSelectedMeasureFooterValue = (totals: SalesReportTotalsRecord | undefined, selectedMeasure: string) => {
  if (selectedMeasure === 'RETURNS') {
    return getReturnsValue(totals);
  }

  return totals?.[selectedMeasure.toLowerCase() as keyof SalesReportTotalsRecord] ?? null;
};

const buildFooterRows = (
  periodColumns: SalesReportPeriodColumn[],
  totalsByDateRange: SalesReportSource['totalByDateRange'],
  selectedMeasure: string,
  selectedMeasureLabel: string
): SalesReportFooterRow[] => {
  const periodTotals = getPeriodTotals(totalsByDateRange);
  const periodValueMap = (resolver: (totals: SalesReportTotalsRecord | undefined) => SalesReportCellValue) =>
    Object.fromEntries(periodColumns.map((column, index) => [column.key, resolver(periodTotals[index])]));

  return [
    {
      key: 'totals',
      label: 'Totals',
      periodValues: periodValueMap(totals => totals?.value ?? null),
    },
    ...(selectedMeasure !== 'SALE_COUNT'
      ? [
          {
            key: 'selected-measure',
            label: selectedMeasureLabel,
            periodValues: periodValueMap(totals => getSelectedMeasureFooterValue(totals, selectedMeasure)),
          },
        ]
      : []),
    ...(selectedMeasure !== 'REVENUE'
      ? [
          {
            key: 'revenue',
            label: 'Revenue',
            periodValues: periodValueMap(totals => totals?.revenue ?? null),
          },
        ]
      : []),
    {
      key: 'costOfGoods',
      label: 'Cost Of Goods',
      periodValues: periodValueMap(totals => totals?.costOfGoods ?? null),
    },
    {
      key: 'grossProfit',
      label: 'Gross Profit',
      periodValues: periodValueMap(totals => totals?.grossProfit ?? null),
    },
    {
      key: 'margin',
      label: 'Margin',
      periodValues: periodValueMap(totals => totals?.margin ?? null),
    },
    ...(selectedMeasure !== 'TAX'
      ? [
          {
            key: 'tax',
            label: 'Tax',
            periodValues: periodValueMap(totals => totals?.tax ?? null),
          },
        ]
      : []),
    {
      key: 'taxes',
      label: 'Taxes',
      periodValues: periodValueMap(totals => totals?.taxes ?? ''),
    },
    ...(selectedMeasure !== 'RETURNS'
      ? [
          {
            key: 'returns',
            label: 'Returns',
            periodValues: periodValueMap(totals => getReturnsValue(totals)),
          },
        ]
      : []),
  ];
};

const buildMetricSummaryRows = (rows: SalesReportRowModel[]): SalesReportMetricSummaryRow[] =>
  rows.map(row => ({
    id: row.id,
    label: row.label,
    metricValues: row.metricValues,
  }));

const selectPeriodValues = (
  periodValues: Record<string, SalesReportCellValue>,
  periodColumns: SalesReportPeriodColumn[]
) => Object.fromEntries(periodColumns.map(column => [column.key, periodValues[column.key] ?? null]));

const chunkPeriodColumns = (
  periodColumns: SalesReportPeriodColumn[],
  rows: SalesReportRowModel[],
  footerRows: SalesReportFooterRow[],
  metricColumns: SalesReportMetricColumn[],
  exportGroupSize: number
) => {
  if (periodColumns.length === 0) {
    return [
      {
        key: 'group-empty',
        title: 'Report Data',
        periodColumns: [],
        periodTableRows: rows.map(row => ({
          ...row,
          periodValues: {},
        })),
        periodFooterRows: footerRows.map(row => ({
          ...row,
          periodValues: {},
        })),
        metricSummaryColumns: metricColumns,
        metricSummaryRows: buildMetricSummaryRows(rows),
      },
    ];
  }

  const groups: SalesReportExportGroup[] = [];

  for (let index = 0; index < periodColumns.length; index += exportGroupSize) {
    const groupColumns = periodColumns.slice(index, index + exportGroupSize);
    const firstLabel = groupColumns[0]?.label || `Period ${index + 1}`;
    const lastLabel = groupColumns[groupColumns.length - 1]?.label || firstLabel;

    groups.push({
      key: `group-${index}`,
      title: groupColumns.length === 1 ? firstLabel : `${firstLabel} - ${lastLabel}`,
      periodColumns: groupColumns,
      periodTableRows: rows.map(row => ({
        ...row,
        periodValues: selectPeriodValues(row.periodValues, groupColumns),
      })),
      periodFooterRows: footerRows.map(row => ({
        ...row,
        periodValues: selectPeriodValues(row.periodValues, groupColumns),
      })),
      metricSummaryColumns: metricColumns,
      metricSummaryRows: buildMetricSummaryRows(rows),
    });
  }

  return groups;
};

export const buildSalesReportViewModel = ({
  report,
  labelColumnTitle,
  selectedMeasure,
  selectedMeasureLabel,
  exportGroupSize = DEFAULT_EXPORT_GROUP_SIZE,
}: {
  report?: SalesReportSource | null;
  labelColumnTitle: string;
  selectedMeasure: string;
  selectedMeasureLabel: string;
  exportGroupSize?: number;
}): SalesReportViewModel => {
  const periodColumns = buildPeriodColumns(report?.headerSlots);
  const metricColumns = buildMetricColumns(selectedMeasure);
  const rows = buildRows(report?.rows, periodColumns, metricColumns);
  const footerRows = buildFooterRows(periodColumns, report?.totalByDateRange, selectedMeasure, selectedMeasureLabel);
  const exportGroups = chunkPeriodColumns(periodColumns, rows, footerRows, metricColumns, exportGroupSize);

  return {
    labelColumnTitle,
    periodColumns,
    metricColumns,
    rows,
    footerRows,
    exportGroups,
    rowCount: rows.length,
    periodCount: periodColumns.length,
  };
};
