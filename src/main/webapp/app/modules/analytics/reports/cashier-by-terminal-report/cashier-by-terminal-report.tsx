import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getBranchRegistries } from 'app/entities/settings/branch-registry/branch-registry.reducer';
import { getEntities as getTills } from 'app/entities/settings/branch-registry/till/till.reducer';
import { fetchCashierByTerminalReport } from 'app/modules/analytics/api';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { ITill } from 'app/shared/model/till.model';
import {
  ICashierByTerminalDiscountTypeRow,
  ICashierByTerminalFieldRow,
  ICashierByTerminalReport,
  ICashierByTerminalSection,
  ICashierByTerminalTerminal,
  ICashierByTerminalTypeRow,
} from 'app/shared/model/cashier-by-terminal-report.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import ReportSection, {
  reportCellClassName,
  reportHeadClassName,
  reportHeaderRowClassName,
  reportNumericCellClassName,
  reportTableBodyClassName,
  reportTableClassName,
  reportTotalRowClassName,
} from 'app/shared/components/report/report-ui';
import { useReactToPrint } from 'react-to-print';
import {
  analyticsReportPrintStyles,
  buildCashierByTerminalWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  saveWorkbookAsExcel,
} from 'app/shared/util/report-export-utils';
import { cn } from '@/src/main/webapp/app/lib/utils';

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  branch: string | null;
  source: string | null;
  registryId: string | null;
  tillId: string | null;
  username: string | null;
};

type SectionRow = {
  amount?: number | null;
  quantity?: number | null;
};

const formatAmount = (value?: number | null, emptyAsDash = false) => {
  if (value === null || value === undefined) {
    return emptyAsDash ? '-' : '0.00';
  }

  return value.toFixed(2);
};

const formatQuantity = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '0';
  }

  return Number.isInteger(value) ? `${value}` : `${value}`;
};

const TerminalSection = <T extends SectionRow>({
  title,
  rows,
  totalAmount,
  totalQuantity,
  firstColumnLabel,
  getRowLabel,
}: {
  title: string;
  rows?: T[];
  totalAmount?: number | null;
  totalQuantity?: number | null;
  firstColumnLabel: string;
  getRowLabel: (row: T) => string;
}) => (
  <ReportSection title={title} contentClassName="p-0">
    <Table className={reportTableClassName}>
      <TableHeader>
        <TableRow className={reportHeaderRowClassName}>
          <TableHead className={reportHeadClassName}>{firstColumnLabel}</TableHead>
          <TableHead className={`${reportHeadClassName} text-right`}>Amount</TableHead>
          <TableHead className={`${reportHeadClassName} text-right`}>Quantity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={reportTableBodyClassName}>
        {!rows?.length ? (
          <TableRow>
            <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
              No data
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className={reportCellClassName}>{getRowLabel(row)}</TableCell>
              <TableCell className={reportNumericCellClassName}>{formatAmount(row.amount, true)}</TableCell>
              <TableCell className={reportNumericCellClassName}>{formatQuantity(row.quantity)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      <TableFooter>
        <TableRow className={reportTotalRowClassName}>
          <TableCell className={`${reportCellClassName} font-semibold`}>Totals</TableCell>
          <TableCell className={`${reportNumericCellClassName} font-semibold`}>{formatAmount(totalAmount)}</TableCell>
          <TableCell className={`${reportNumericCellClassName} font-semibold`}>{formatQuantity(totalQuantity)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </ReportSection>
);

const terminalSections: Array<{
  key: keyof ICashierByTerminalTerminal;
  title: string;
  firstColumnLabel: string;
  getRowLabel: (row: ICashierByTerminalTypeRow | ICashierByTerminalFieldRow | ICashierByTerminalDiscountTypeRow) => string;
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

const REPORT_TITLE = 'Cashier By Terminal Report';

const CashierByTerminalReport = () => {
  const dispatch = useAppDispatch();
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const branchRegistries: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const tills: ITill[] = useAppSelector(state => state.till.entities);
  const businessTimeZone = useAppSelector(state => state.businessTimeZone.timeZone);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null);
  const [selectedTillId, setSelectedTillId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ICashierByTerminalReport | null>(null);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
    dispatch(
      getBranchRegistries({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

  const availableRegistries = useMemo(() => {
    if (!selectedBranch) {
      return branchRegistries;
    }

    return branchRegistries.filter(registry => registry.branch?.id === selectedBranch);
  }, [branchRegistries, selectedBranch]);

  useEffect(() => {
    if (!selectedRegistryId) {
      setSelectedTillId(null);
      return;
    }

    dispatch(
      getTills({
        id: selectedRegistryId,
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch, selectedRegistryId]);

  useEffect(() => {
    if (selectedRegistryId && !availableRegistries.some(registry => registry.id === selectedRegistryId)) {
      setSelectedRegistryId(null);
      setSelectedTillId(null);
    }
  }, [availableRegistries, selectedRegistryId]);

  useEffect(() => {
    if (!selectedRegistryId) {
      return;
    }

    const hasSelectedTill = tills.some(till => till.id === selectedTillId);
    if (!hasSelectedTill) {
      setSelectedTillId(null);
    }
  }, [selectedRegistryId, selectedTillId, tills]);

  const formatBoundaryDate = (date: Date, boundary: 'start' | 'end', timeZone?: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = boundary === 'start' ? '00:00:00' : '23:59:59';

    if (!timeZone) {
      const localDate = new Date(date);
      if (boundary === 'start') {
        localDate.setHours(0, 0, 0, 0);
      } else {
        localDate.setHours(23, 59, 59, 0);
      }
      return localDate.toISOString();
    }

    return fromZonedTime(`${year}-${month}-${day} ${time}`, timeZone).toISOString();
  };

  const loadReport = async (filtersOverride?: AppliedFilters) => {
    const targetFilters = filtersOverride || appliedFilters;
    if (!targetFilters) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchCashierByTerminalReport({
        fromDate: targetFilters.fromDate,
        toDate: targetFilters.toDate,
        branch: targetFilters.branch,
        source: targetFilters.source,
        tillId: targetFilters.tillId,
        username: targetFilters.username,
      });
      setReportData({
        ...data,
        terminals: Array.isArray(data?.terminals) ? data.terminals : [],
      });
      setHasLoadedReport(true);
      setAppliedFilters(targetFilters);
    } catch (err) {
      setReportData(null);
      setHasLoadedReport(true);
      setError('Unable to load cashier by terminal report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select both from and to dates.');
      return;
    }

    const branchTimeZone = branchList.find(branch => branch.id === selectedBranch)?.timezone || businessTimeZone;
    const nextFilters = {
      fromDate: formatBoundaryDate(dateRange.from, 'start', branchTimeZone),
      toDate: formatBoundaryDate(dateRange.to, 'end', branchTimeZone),
      branch: selectedBranch,
      source: selectedSource,
      registryId: selectedRegistryId,
      tillId: selectedTillId,
      username: username.trim() ? username.trim() : null,
    };

    await loadReport(nextFilters);
  };

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) {
      return 'Pick a date range';
    }

    if (!dateRange.to) {
      return format(dateRange.from, 'PP');
    }

    return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
  }, [dateRange]);

  const appliedBranchName = useMemo(() => {
    return branchList.find(branch => branch.id === appliedFilters?.branch)?.name || null;
  }, [appliedFilters?.branch, branchList]);

  const branchLabel = reportData?.branchName || appliedBranchName || 'All branches';
  const intervalLabel =
    reportData?.fromDate && reportData?.toDate
      ? `${formatDateForDisplay(reportData.fromDate, 'PP')} - ${formatDateForDisplay(reportData.toDate, 'PP')}`
      : appliedFilters?.fromDate && appliedFilters?.toDate
        ? `${formatDateForDisplay(appliedFilters.fromDate, 'PP')} - ${formatDateForDisplay(appliedFilters.toDate, 'PP')}`
        : '-';
  const isEmpty = reportData !== null && (!reportData.terminals || reportData.terminals.length === 0);
  const selectedRegistryName = branchRegistries.find(registry => registry.id === appliedFilters?.registryId)?.name || 'All registries';
  const selectedTillName = tills.find(till => till.id === appliedFilters?.tillId)?.name || 'All tills';
  const fileName = createReportFileName(REPORT_TITLE, [branchLabel, appliedFilters?.source || 'all-sources', intervalLabel]);
  const exportDisabled = loading || busyAction !== null || isEmpty || !hasLoadedReport || !reportData;

  const handleExcelExport = async () => {
    if (!reportData) {
      return;
    }

    try {
      setBusyAction('excel');
      await saveWorkbookAsExcel(
        buildCashierByTerminalWorkbook(reportData, {
          title: REPORT_TITLE,
          filters: [
            { label: 'Branch', value: branchLabel },
            { label: 'Source', value: appliedFilters?.source || 'All sources' },
            { label: 'Registry', value: selectedRegistryName },
            { label: 'Till', value: selectedTillName },
            { label: 'Username', value: appliedFilters?.username || 'All users' },
            { label: 'Date Range', value: intervalLabel },
          ],
        }),
        fileName
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!reportContentRef.current) {
      return;
    }

    try {
      setBusyAction('pdf');
      await downloadElementAsPdf(reportContentRef.current, { fileName, orientation: 'portrait' });
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: fileName,
    pageStyle: analyticsReportPrintStyles('portrait'),
  });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="text-center">
          <h1 className="text-sm font-semibold">{REPORT_TITLE}</h1>
        </div>

        <Card className="report-filters-card p-3">
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('h-7 text-xs w-full justify-start', !dateRange?.from && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateRangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Branch</Label>
                <Select value={selectedBranch ?? 'null'} onValueChange={value => setSelectedBranch(value === 'null' ? null : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {branchList.map(branch => (
                      <SelectItem key={branch.id} value={branch.id} className="text-xs">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Source</Label>
                <Select value={selectedSource ?? 'null'} onValueChange={value => setSelectedSource(value === 'null' ? null : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {Object.values(SourceType).map(source => (
                      <SelectItem key={source} value={source} className="text-xs">
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Registry</Label>
                <Select
                  value={selectedRegistryId ?? 'null'}
                  onValueChange={value => setSelectedRegistryId(value === 'null' ? null : value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select registry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {availableRegistries.map(registry => (
                      <SelectItem key={registry.id} value={registry.id} className="text-xs">
                        {registry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Till</Label>
                <Select
                  value={selectedTillId ?? 'null'}
                  onValueChange={value => setSelectedTillId(value === 'null' ? null : value)}
                  disabled={!selectedRegistryId}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder={selectedRegistryId ? 'Select till' : 'Select registry first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null" className="text-xs">
                      All
                    </SelectItem>
                    {tills.map(till => (
                      <SelectItem key={till.id} value={till.id} className="text-xs">
                        {till.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cashier-by-terminal-username" className="text-xs font-semibold">
                  Username
                </Label>
                <Input
                  id="cashier-by-terminal-username"
                  className="h-7 text-xs"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {appliedFilters ? 'Filters applied' : 'Select filters to load the report'}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => loadReport()}
                  disabled={!appliedFilters || loading}
                >
                  <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button type="button" className="h-7 text-xs" onClick={handleGetReport} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Get Report'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <ReportActionBar
            onExcel={handleExcelExport}
            onPdf={handlePdfExport}
            onPrint={handlePrint}
            disabled={exportDisabled}
            busyAction={busyAction}
          />
        </div>

        <div ref={reportContentRef} className="report-export-root space-y-3">
          {appliedFilters && (
            <ReportExportHeader
              reportTitle={REPORT_TITLE}
              hiddenOnScreen
              forceVisible={busyAction === 'pdf'}
              filters={[
                { label: 'Branch', value: branchLabel },
                { label: 'Source', value: appliedFilters?.source || 'All sources' },
                { label: 'Registry', value: selectedRegistryName },
                { label: 'Till', value: selectedTillName },
                { label: 'Username', value: appliedFilters?.username || 'All users' },
                { label: 'Date Range', value: intervalLabel },
              ]}
            />
          )}

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : !hasLoadedReport ? (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted-foreground">Run the report to view results.</CardContent>
            </Card>
          ) : isEmpty ? (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted-foreground">No cashier by terminal data found.</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <ReportSection title="Report Summary" contentClassName="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Branch</div>
                    <div className="mt-1 text-sm font-semibold">{branchLabel}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Date Interval</div>
                    <div className="mt-1 text-sm font-semibold">{intervalLabel}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Terminals</div>
                    <div className="mt-1 text-sm font-semibold">{reportData?.terminals?.length ?? 0}</div>
                  </div>
                </div>
              </ReportSection>

              {reportData?.terminals?.map(terminal => (
                <ReportSection
                  key={terminal.registryId || terminal.registryName}
                  title={terminal.registryName || 'Unnamed Terminal'}
                  className="report-section-card overflow-hidden"
                  contentClassName="space-y-3 p-3"
                >
                  <div className="text-xs text-muted-foreground">
                    Registry ID: <span className="font-medium text-foreground">{terminal.registryId || '-'}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {terminalSections.map(section => {
                      const sectionData = terminal[section.key] as ICashierByTerminalSection<
                        ICashierByTerminalTypeRow | ICashierByTerminalFieldRow | ICashierByTerminalDiscountTypeRow
                      > | undefined;

                      return (
                        <TerminalSection
                          key={section.key}
                          title={section.title}
                          rows={sectionData?.rows}
                          totalAmount={sectionData?.totalAmount}
                          totalQuantity={sectionData?.totalQuantity}
                          firstColumnLabel={section.firstColumnLabel}
                          getRowLabel={section.getRowLabel}
                        />
                      );
                    })}
                  </div>
                </ReportSection>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default CashierByTerminalReport;
