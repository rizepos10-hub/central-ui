import React, { useEffect, useMemo, useRef, useState } from 'react';
import { startOfYear } from 'date-fns';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getCurrencies } from 'app/entities/settings/currency/currencies.reducer';
import { getEntity as getCurrencySettings } from 'app/entities/settings/currency/currency-settings.reducer';
import { fetchSalesReportRedux } from 'app/modules/analytics/reports/sales-report/sales-report.reducer';
import DateCustomComponent from 'app/modules/analytics/reports/sales-report/custom-date-range';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportLabelCellClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
  reportTotalRowClassName,
} from 'app/shared/components/report/report-ui';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { SalesReportsMeasures, SalesReportsTypes } from 'app/shared/model/ENUMS/sales-reports.models';
import type { ICurrency } from 'app/shared/model/CURRENCY/currency.model';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { saveAsExcelFile } from 'app/shared/util/excel-utils';
import { formatPrice } from 'app/shared/util/price-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from 'app/shared/util/report-export-utils';

import {
  buildSalesReportViewModel,
  type SalesReportCellValue,
  type SalesReportFooterRow,
  type SalesReportMetricColumn,
  type SalesReportMetricSummaryRow,
  type SalesReportPeriodColumn,
  type SalesReportRowModel,
  type SalesReportViewModel,
} from './sales-report-view-model';

type DateRange = {
  from: string;
  to: string;
  dateSlot: {
    period: string;
    slots: number;
  };
};

const VISIBLE_SALES_REPORT_TYPES = new Set([
  SalesReportsTypes.Product,
  SalesReportsTypes.Category,
  SalesReportsTypes.Branch,
  SalesReportsTypes.User,
  SalesReportsTypes.Menu,
  SalesReportsTypes.Catalog,
]);

const reportTypesOptions = Object.entries(SalesReportsTypes)
  .filter(([, value]) => VISIBLE_SALES_REPORT_TYPES.has(value))
  .map(([label, value]) => ({ label, value }));
const reportMeasuresOptions = Object.entries(SalesReportsMeasures).map(([value, label]) => ({ label, value }));

const toTitleCase = (value?: string | null) =>
  (value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const getDisplayValue = (value: SalesReportCellValue) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${value}`;
};

const chunkDescription = (groupIndex: number, groupsCount: number) =>
  groupsCount > 1 ? `Columns ${groupIndex + 1} of ${groupsCount}` : 'All periods';

const SALES_REPORT_EXPORT_METRIC_GROUP_SIZE = 4;

const getMeasureLabel = (selectedMeasure?: string | null) =>
  reportMeasuresOptions.find(option => option.value === selectedMeasure)?.label || toTitleCase(selectedMeasure);

const getReportTypeLabel = (selectedType?: string | null, reportType?: string | null) =>
  reportType ? toTitleCase(reportType) : reportTypesOptions.find(option => option.value === selectedType)?.label || toTitleCase(selectedType);

const formatNumericValue = (value: SalesReportCellValue) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const chunkMetricColumns = (metricColumns: SalesReportMetricColumn[], chunkSize = SALES_REPORT_EXPORT_METRIC_GROUP_SIZE) => {
  const groups: SalesReportMetricColumn[][] = [];

  for (let index = 0; index < metricColumns.length; index += chunkSize) {
    groups.push(metricColumns.slice(index, index + chunkSize));
  }

  return groups;
};

const buildExcelRows = ({
  model,
  selectedMeasure,
  exchange,
}: {
  model: SalesReportViewModel;
  selectedMeasure: string;
  exchange: any;
}) => {
  const headers = [model.labelColumnTitle, ...model.periodColumns.map(column => column.label), ...model.metricColumns.map(column => column.label)];
  const formatPeriodValue = (value: SalesReportCellValue) => {
    const numericValue = formatNumericValue(value);
    if (numericValue === null) {
      return '';
    }

    return selectedMeasure === 'SALE_COUNT' ? numericValue : formatPrice(numericValue, exchange) || '';
  };

  const formatMetricValue = (column: SalesReportMetricColumn, value: SalesReportCellValue) => {
    if (column.kind === 'text') {
      return value ?? '';
    }

    const numericValue = formatNumericValue(value);
    if (numericValue === null) {
      return '';
    }

    if (column.kind === 'selected-total' && selectedMeasure === 'SALE_COUNT') {
      return numericValue;
    }

    if (column.key === 'returns' && selectedMeasure === 'SALE_COUNT') {
      return numericValue;
    }

    return formatPrice(numericValue, exchange) || '';
  };

  const bodyRows = model.rows.map(row => [
    row.label,
    ...model.periodColumns.map(column => formatPeriodValue(row.periodValues[column.key])),
    ...model.metricColumns.map(column => formatMetricValue(column, row.metricValues[column.key])),
  ]);

  const footerRows = model.footerRows.map(row => [
    row.label,
    ...model.periodColumns.map(column => {
      if (row.key === 'taxes') {
        return row.periodValues[column.key] || '';
      }

      const numericValue = formatNumericValue(row.periodValues[column.key]);
      if (numericValue === null) {
        return '';
      }

      if (row.key === 'selected-measure' && selectedMeasure === 'SALE_COUNT') {
        return numericValue;
      }

      if (row.key === 'returns' && selectedMeasure === 'SALE_COUNT') {
        return numericValue;
      }

      return formatPrice(numericValue, exchange) || '';
    }),
    ...model.metricColumns.map(() => ''),
  ]);

  return { headers, bodyRows, footerRows };
};

const SalesReportDataTable = ({
  dataTestId,
  footerRows,
  labelColumnTitle,
  metricColumns,
  periodColumns,
  rows,
  selectedMeasure,
  exchange,
}: {
  dataTestId?: string;
  labelColumnTitle: string;
  periodColumns: SalesReportPeriodColumn[];
  metricColumns: SalesReportMetricColumn[];
  rows: SalesReportRowModel[];
  footerRows: SalesReportFooterRow[];
  selectedMeasure: string;
  exchange: any;
}) => {
  const formatPeriodValue = (value: SalesReportCellValue) => {
    const numericValue = formatNumericValue(value);
    if (numericValue === null) {
      return '-';
    }

    return selectedMeasure === 'SALE_COUNT' ? `${numericValue}` : getDisplayValue(formatPrice(numericValue, exchange));
  };

  const formatMetricValue = (column: SalesReportMetricColumn, value: SalesReportCellValue) => {
    if (column.kind === 'text') {
      return getDisplayValue(value);
    }

    const numericValue = formatNumericValue(value);
    if (numericValue === null) {
      return '-';
    }

    if (column.kind === 'selected-total' && selectedMeasure === 'SALE_COUNT') {
      return `${numericValue}`;
    }

    if (column.key === 'returns' && selectedMeasure === 'SALE_COUNT') {
      return `${numericValue}`;
    }

    return getDisplayValue(formatPrice(numericValue, exchange));
  };

  const formatFooterValue = (row: SalesReportFooterRow, value: SalesReportCellValue) => {
    if (row.key === 'taxes') {
      return value || '';
    }

    const numericValue = formatNumericValue(value);
    if (numericValue === null) {
      return '';
    }

    if (row.key === 'selected-measure' && selectedMeasure === 'SALE_COUNT') {
      return `${numericValue}`;
    }

    if (row.key === 'returns' && selectedMeasure === 'SALE_COUNT') {
      return `${numericValue}`;
    }

    return getDisplayValue(formatPrice(numericValue, exchange));
  };

  const minimumWidth = Math.max(960, 240 + periodColumns.length * 118 + metricColumns.length * 132);

  return (
    <div className="overflow-x-auto" data-testid={dataTestId ? `${dataTestId}-wrapper` : undefined}>
      <Table
        data-testid={dataTestId}
        className={cn(reportTableClassName, 'min-w-full')}
        style={{ minWidth: `${minimumWidth}px` }}
      >
        <colgroup>
          <col style={{ width: '240px' }} />
          {periodColumns.map(column => (
            <col key={column.key} style={{ width: '118px' }} />
          ))}
          {metricColumns.map(column => (
            <col key={column.key} style={{ width: '132px' }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className={cn(reportHeaderRowClassName, 'bg-slate-100 hover:bg-slate-100')}>
            <TableHead className={cn(reportHeadClassName, 'bg-slate-100 text-foreground')}>{labelColumnTitle}</TableHead>
            {periodColumns.map(column => (
              <TableHead key={column.key} className={cn(reportHeadClassName, 'bg-slate-100 text-right text-foreground')}>
                {column.label}
              </TableHead>
            ))}
            {metricColumns.map(column => (
              <TableHead key={column.key} className={cn(reportHeadClassName, 'bg-slate-100 text-right text-foreground')}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={reportTableBodyClassName}>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell className={cn(reportLabelCellClassName, 'align-top')}>{row.label}</TableCell>
              {periodColumns.map(column => (
                <TableCell key={`${row.id}-${column.key}`} className={reportNumericCellClassName}>
                  {formatPeriodValue(row.periodValues[column.key])}
                </TableCell>
              ))}
              {metricColumns.map(column => (
                <TableCell key={`${row.id}-${column.key}`} className={column.kind === 'text' ? reportCellClassName : reportNumericCellClassName}>
                  {formatMetricValue(column, row.metricValues[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          {footerRows.map((row, rowIndex) => (
            <TableRow
              key={row.key}
              className={cn(reportTotalRowClassName, rowIndex === 0 ? 'border-t-2 border-slate-300' : 'border-t border-slate-200')}
            >
              <TableCell className={cn(reportLabelCellClassName, 'bg-slate-100/70')}>{row.label}</TableCell>
              {periodColumns.map(column => (
                <TableCell key={`${row.key}-${column.key}`} className={cn(reportNumericCellClassName, 'bg-slate-100/70')}>
                  {formatFooterValue(row, row.periodValues[column.key])}
                </TableCell>
              ))}
              {metricColumns.map(column => (
                <TableCell key={`${row.key}-${column.key}-blank`} className="bg-slate-100/70" />
              ))}
            </TableRow>
          ))}
        </TableFooter>
      </Table>
    </div>
  );
};

const SalesReportMetricSummaryTable = ({
  dataTestId,
  labelColumnTitle,
  metricColumns,
  rows,
  selectedMeasure,
  exchange,
}: {
  dataTestId?: string;
  labelColumnTitle: string;
  metricColumns: SalesReportMetricColumn[];
  rows: SalesReportMetricSummaryRow[];
  selectedMeasure: string;
  exchange: any;
}) => {
  const formatMetricValue = (column: SalesReportMetricColumn, value: SalesReportCellValue) => {
    if (column.kind === 'text') {
      return getDisplayValue(value);
    }

    const numericValue = formatNumericValue(value);
    if (numericValue === null) {
      return '-';
    }

    if (column.kind === 'selected-total' && selectedMeasure === 'SALE_COUNT') {
      return `${numericValue}`;
    }

    if (column.key === 'returns' && selectedMeasure === 'SALE_COUNT') {
      return `${numericValue}`;
    }

    return getDisplayValue(formatPrice(numericValue, exchange));
  };

  const minimumWidth = Math.max(680, 240 + metricColumns.length * 132);

  return (
    <div className="overflow-x-auto" data-testid={dataTestId ? `${dataTestId}-wrapper` : undefined}>
      <Table
        data-testid={dataTestId}
        className={cn(reportTableClassName, 'min-w-full')}
        style={{ minWidth: `${minimumWidth}px` }}
      >
        <colgroup>
          <col style={{ width: '240px' }} />
          {metricColumns.map(column => (
            <col key={column.key} style={{ width: '132px' }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className={cn(reportHeaderRowClassName, 'bg-slate-100 hover:bg-slate-100')}>
            <TableHead className={cn(reportHeadClassName, 'bg-slate-100 text-foreground')}>{labelColumnTitle}</TableHead>
            {metricColumns.map(column => (
              <TableHead key={column.key} className={cn(reportHeadClassName, 'bg-slate-100 text-right text-foreground')}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={reportTableBodyClassName}>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell className={cn(reportLabelCellClassName, 'align-top')}>{row.label}</TableCell>
              {metricColumns.map(column => (
                <TableCell key={`${row.id}-${column.key}`} className={column.kind === 'text' ? reportCellClassName : reportNumericCellClassName}>
                  {formatMetricValue(column, row.metricValues[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ExportSummaryBlock = ({
  branchLabel,
  displayCurrencyLabel,
  intervalLabel,
  measureLabel,
  periodCount,
  reportTypeLabel,
  rowCount,
}: {
  reportTypeLabel: string;
  measureLabel: string;
  intervalLabel: string | null;
  branchLabel: string;
  displayCurrencyLabel: string;
  rowCount: number;
  periodCount: number;
}) => (
  <div className="report-section-card rounded-md border bg-slate-50 p-4">
    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Report</div>
        <div className="mt-1 font-medium">{reportTypeLabel}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Measure</div>
        <div className="mt-1 font-medium">{measureLabel}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date Range</div>
        <div className="mt-1 font-medium">{intervalLabel || 'Not selected'}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Branch</div>
        <div className="mt-1 font-medium">{branchLabel}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Currency</div>
        <div className="mt-1 font-medium">{displayCurrencyLabel}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rows / Periods</div>
        <div className="mt-1 font-medium">
          {rowCount} rows / {periodCount} periods
        </div>
      </div>
    </div>
  </div>
);

export const SalesReport = () => {
  const dispatch = useAppDispatch();
  const { reportType } = useParams();

  const exportContentRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date();

  const initialSelectedType = reportTypesOptions[0]?.value || SalesReportsTypes.Product;
  const initialSelectedMeasure = reportMeasuresOptions[0]?.value || 'REVENUE';

  const [selectedType, setSelectedType] = useState<string>(initialSelectedType);
  const [selectedMeasure, setSelectedMeasure] = useState<string>(initialSelectedMeasure);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: toLocalISOString(startOfYear(currentDate)),
    to: toLocalISOString(currentDate),
    dateSlot: {
      period: 'YEAR',
      slots: 1,
    },
  });
  const [displayCurrency, setDisplayCurrency] = useState<ICurrency>();

  const salesReportData = useAppSelector(state => state.salesReportReducer.data);
  const salesReportLoading = useAppSelector(state => state.salesReportReducer.loading);
  const salesReportError = useAppSelector(state => state.salesReportReducer.error);
  const branchList = useAppSelector(state => state.branch.entities);
  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);
  const currencies = useAppSelector(state => state.currencies.entities);

  const exchangeRatesArray = currencySettingsEntity?.exchangeRates || [];
  const currenciesSet = new Set(exchangeRatesArray.map(option => option?.currency?.code));
  const filteredDisplayCurrencies: ICurrency[] = (currencies || []).filter(option => currenciesSet.has(option?.code));
  const exchange =
    exchangeRatesArray.find(exRate => exRate?.currency?.code === displayCurrency?.code) || currencySettingsEntity?.defaultCurrency;

  useEffect(() => {
    dispatch(
      getCurrencies({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
    dispatch(getCurrencySettings());
    dispatch(
      getBranches({
        page: 0,
        size: 100,
        sort: 'id,desc',
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (currencySettingsEntity?.displayCurrency) {
      setDisplayCurrency(currencySettingsEntity.displayCurrency);
      return;
    }

    if (currencySettingsEntity?.defaultCurrency) {
      setDisplayCurrency(currencySettingsEntity.defaultCurrency);
    }
  }, [currencySettingsEntity?.defaultCurrency?.code, currencySettingsEntity?.displayCurrency?.code]);

  useEffect(() => {
    dispatch(
      fetchSalesReportRedux({
        dateRange,
        measure: selectedMeasure,
        type: reportType ? reportType.toUpperCase() : selectedType,
        branchId: selectedBranchId,
      })
    );
  }, [dateRange, dispatch, reportType, selectedBranchId, selectedMeasure, selectedType]);

  const reportTitle = 'Sales Report';
  const reportTypeLabel = getReportTypeLabel(selectedType, reportType);
  const measureLabel = getMeasureLabel(selectedMeasure);
  const branchLabel = branchList.find(branch => branch.id === selectedBranchId)?.name || 'All branches';
  const intervalLabel =
    dateRange?.from && dateRange?.to
      ? `${formatDateForDisplay(dateRange.from, 'yyyy-MM-dd')} - ${formatDateForDisplay(dateRange.to, 'yyyy-MM-dd')}`
      : null;
  const displayCurrencyLabel = displayCurrency?.name || displayCurrency?.code || 'Default currency';

  const viewModel = useMemo(
    () =>
      buildSalesReportViewModel({
        report: salesReportData,
        labelColumnTitle: reportTypeLabel,
        selectedMeasure,
        selectedMeasureLabel: measureLabel,
      }),
    [measureLabel, reportTypeLabel, salesReportData, selectedMeasure]
  );

  const fileName = createReportFileName(reportTitle, [reportTypeLabel, measureLabel, branchLabel, intervalLabel]);
  const hasExportData = viewModel.rows.length > 0;
  const shouldRenderExportContent = busyAction === 'pdf' || busyAction === 'print';

  const handleDateRangeApply = (selectedDateRange: DateRange) => {
    setDateRange(selectedDateRange);
  };

  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');

      const { headers, bodyRows, footerRows } = buildExcelRows({
        model: viewModel,
        selectedMeasure,
        exchange,
      });

      const xlsx = await import('xlsx-js-style');
      const worksheet = xlsx.utils.aoa_to_sheet([headers, ...bodyRows, [], ...footerRows]);

      headers.forEach((_, index) => {
        const address = xlsx.utils.encode_cell({ r: 0, c: index });
        if (worksheet[address]) {
          worksheet[address].s = { font: { bold: true } };
        }
      });

      [...bodyRows, ...footerRows].forEach((row, index) => {
        const address = xlsx.utils.encode_cell({ r: index + 1, c: 0 });
        if (worksheet[address]) {
          worksheet[address].s = { font: { bold: true } };
        }
      });

      worksheet['!cols'] = headers.map((header, index) => ({
        wpx: index === 0 ? 220 : header === 'Taxes' ? 150 : 120,
      }));

      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

      saveAsExcelFile(excelBuffer, fileName);
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!hasExportData) {
      return;
    }

    try {
      setBusyAction('pdf');
      await new Promise(resolve => setTimeout(resolve, 0));
      if (exportContentRef.current) {
        await downloadElementAsPdf(exportContentRef.current, { fileName, orientation: 'landscape' });
      }
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
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  return (
    <PageWrapper>
      <div className="space-y-4">
        <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">Sales Report</h1>
                  <Badge variant="outline" className="bg-white text-xs font-semibold">
                    {reportType ? `Sales by ${reportTypeLabel}` : 'General Report'}
                  </Badge>
                </div>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Review period-based sales performance in a cleaner report layout with aligned totals and a PDF export that splits wide date ranges into readable sections.
                </p>
              </div>
              <ReportActionBar
                onExcel={handleExcelExport}
                onPdf={handlePdfExport}
                onPrint={handlePrint}
                disabled={!hasExportData || salesReportLoading || busyAction !== null}
                busyAction={busyAction}
                className="justify-end"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {!reportType ? (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-muted-foreground">Report Type</Label>
                  <Select value={selectedType} onValueChange={value => setSelectedType(value)}>
                    <SelectTrigger className="h-9 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypesOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-muted-foreground">Measure Type</Label>
                <Select value={selectedMeasure} onValueChange={value => setSelectedMeasure(value)}>
                  <SelectTrigger className="h-9 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportMeasuresOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-muted-foreground">Date Range</Label>
                <DateCustomComponent onApplyDateRange={handleDateRangeApply} dateRange={dateRange} setDateRange={setDateRange} />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-muted-foreground">Display Currency</Label>
                <Select
                  value={displayCurrency?.code}
                  onValueChange={code => setDisplayCurrency(filteredDisplayCurrencies.find(currency => currency.code === code))}
                >
                  <SelectTrigger className="h-9 bg-white text-xs">
                    <SelectValue placeholder="Select a Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDisplayCurrencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code} className="text-xs">
                        {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-muted-foreground">Branch</Label>
                <Select value={selectedBranchId || 'all'} onValueChange={value => setSelectedBranchId(value === 'all' ? null : value)}>
                  <SelectTrigger className="h-9 bg-white text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Branches
                    </SelectItem>
                    {branchList.map(branch => (
                      <SelectItem key={branch.id} value={branch.id} className="text-xs">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" data-testid="sales-report-screen-shell">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{reportType ? `Sales by ${reportTypeLabel}` : 'General Sales Report'}</h2>
                <p className="text-sm text-muted-foreground">
                  Period totals stay aligned under each {viewModel.periodCount === 1 ? 'period' : 'period column'} while summary metrics remain visible on the right.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {viewModel.rowCount} rows
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {viewModel.periodCount} periods
                </Badge>
              </div>
            </div>

            {salesReportLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : salesReportError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
                {salesReportError}
              </div>
            ) : viewModel.rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center text-sm text-muted-foreground">
                No sales report data found for the selected filters.
              </div>
            ) : (
              <SalesReportDataTable
                dataTestId="sales-report-screen-table"
                labelColumnTitle={viewModel.labelColumnTitle}
                periodColumns={viewModel.periodColumns}
                metricColumns={viewModel.metricColumns}
                rows={viewModel.rows}
                footerRows={viewModel.footerRows}
                selectedMeasure={selectedMeasure}
                exchange={exchange}
              />
            )}
          </CardContent>
        </Card>

        {shouldRenderExportContent ? (
          <div className="pointer-events-none fixed -left-[10000px] top-0 w-fit max-w-none bg-white p-6" aria-hidden="true">
            <div ref={exportContentRef} className="report-export-root space-y-4" data-testid="sales-report-export-root">
              <ReportExportHeader
                reportTitle={reportTitle}
                forceVisible={busyAction === 'pdf'}
                filters={[
                  { label: 'Report Type', value: reportTypeLabel },
                  { label: 'Measure Type', value: measureLabel },
                  { label: 'Date Range', value: intervalLabel },
                  { label: 'Branch', value: branchLabel },
                  { label: 'Display Currency', value: displayCurrencyLabel },
                ]}
              />

              <ExportSummaryBlock
                reportTypeLabel={reportTypeLabel}
                measureLabel={measureLabel}
                intervalLabel={intervalLabel}
                branchLabel={branchLabel}
                displayCurrencyLabel={displayCurrencyLabel}
                rowCount={viewModel.rowCount}
                periodCount={viewModel.periodCount}
              />

              {viewModel.exportGroups.map((group, groupIndex) => (
                <section key={group.key} className="report-section-card rounded-md border bg-white" data-testid="sales-report-export-group">
                  <div className="report-section-header flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                    <div>
                      <h3 className="report-section-title text-sm font-semibold text-slate-900">{group.title}</h3>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {chunkDescription(groupIndex, viewModel.exportGroups.length)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white text-[11px]">
                      {group.periodColumns.length} {group.periodColumns.length === 1 ? 'period' : 'periods'}
                    </Badge>
                  </div>
                  <div className="report-section-content space-y-4 p-4">
                    <div className="space-y-2">
                      <div className="report-section-header rounded-md border bg-slate-50 px-3 py-2">
                        <h4 className="report-section-title text-sm font-semibold text-slate-900">Period Totals</h4>
                      </div>
                      <SalesReportDataTable
                        labelColumnTitle={viewModel.labelColumnTitle}
                        periodColumns={group.periodColumns}
                        metricColumns={[]}
                        rows={group.periodTableRows}
                        footerRows={group.periodFooterRows}
                        selectedMeasure={selectedMeasure}
                        exchange={exchange}
                      />
                    </div>
                    {chunkMetricColumns(group.metricSummaryColumns).map((metricColumns, metricGroupIndex, metricGroups) => (
                      <div key={`${group.key}-metrics-${metricGroupIndex}`} className="space-y-2">
                        <div className="report-section-header rounded-md border bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="report-section-title text-sm font-semibold text-slate-900">Summary Metrics</h4>
                            {metricGroups.length > 1 ? (
                              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Columns {metricGroupIndex + 1} of {metricGroups.length}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <SalesReportMetricSummaryTable
                          dataTestId="sales-report-export-metric-table"
                          labelColumnTitle={viewModel.labelColumnTitle}
                          metricColumns={metricColumns}
                          rows={group.metricSummaryRows}
                          selectedMeasure={selectedMeasure}
                          exchange={exchange}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageWrapper>
  );
};
