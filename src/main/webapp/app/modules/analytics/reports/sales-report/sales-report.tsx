import React, { useEffect, useState, useRef } from 'react';
import { SalesReportsMeasures, SalesReportsTypes } from 'app/shared/model/ENUMS/sales-reports.models';
import { fetchSalesReport } from 'app/modules/analytics/api';
import DateCustomComponent from 'app/modules/analytics/reports/sales-report/custom-date-range';
import { format, getDayOfYear, startOfYear, sub, subYears } from 'date-fns';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { fetchSalesReportRedux } from 'app/modules/analytics/reports/sales-report/sales-report.reducer';
import { ICurrency } from 'app/shared/model/CURRENCY/currency.model';
import { getEntities as getCurrencies } from 'app/entities/settings/currency/currencies.reducer';
import { getEntity as getCurrencySettings } from 'app/entities/settings/currency/currency-settings.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { formatPrice } from 'app/shared/util/price-utils';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { useParams } from 'react-router-dom';
import { capitalizeFirstLetter, capitalizeString } from 'app/shared/util/string-utils';
import ReactToPrint from 'react-to-print';
import { saveAsExcelFile } from 'app/shared/util/excel-utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Printer, Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Slot = {
  order: number;
  value: number;
};

type RowRecord = {
  id: string;
  name: string;
  icon: string | null;
};

type HeaderSlot = {
  order: number | null;
  label: string | null;
};
type totalByDateRange = {
  amount: number | null;
  costOfGoods: number | null;
  grossProfit: number | null;
  margin: number | null;
  returned: boolean | null;
  revenue: number | null;
  tax: number | null;
  value: null | number;
};

type Row = {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  margin: number;
  tax: number;
  amount: number;
  returned: number;
  value: string | null;
  rowRecord: RowRecord;
  slots: Slot[];
};
type dateRange = {
  from: string;
  to: string;
  dateSlot: {
    period: string;
    slots: number;
  };
};

type SalesReport = {
  headerSlots: HeaderSlot[];
  rows: Row[];
  totalByDateRange: totalByDateRange;
};

type formRequest = {
  dateRange: dateRange;
  measure: string;
  type: string;
};

const reportTypesOptions = Object.entries(SalesReportsTypes).map(([key, val]) => ({ label: key, value: val }));
const reportMeasuresOptions = Object.entries(SalesReportsMeasures).map(([key, label]) => ({ label, value: key }));

export const SalesReport = () => {
  const dispatch = useAppDispatch();
  const { reportType } = useParams();

  const dt = useRef(null);
  const dtWrapper = useRef(null);

  const currentDate = new Date();

  const initialSelectedType = reportTypesOptions?.[0]?.value;
  const initialSelectedMeasure = reportType
    ? Object.keys(SalesReportsMeasures).find(key => SalesReportsMeasures[key] === SalesReportsMeasures.REVENUE)
    : reportMeasuresOptions?.[0]?.value;

  const [selectedType, setSelectedType] = useState(initialSelectedType);
  const [selectedMeasure, setSelectedMeasure] = useState(initialSelectedMeasure);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<any | null>({
    from: toLocalISOString(startOfYear(currentDate)),
    to: toLocalISOString(currentDate),
    dateSlot: {
      period: 'YEAR',
      slots: 1,
    },
  });
  const salesReportData = useAppSelector(state => state.salesReportReducer.data);
  const salesReportLoading = useAppSelector(state => state.salesReportReducer.loading);
  const salesReportError = useAppSelector(state => state.salesReportReducer.error);
  const branchList = useAppSelector(state => state.branch.entities);

  const [displayCurrency, setDisplayCurrency] = useState<ICurrency>();
  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);
  const currencySettingsLoading = useAppSelector(state => state.currencySettings.loading);
  const currencies = useAppSelector(state => state.currencies.entities);
  const exchangeRatesArray = currencySettingsEntity?.exchangeRates || [];
  const currenciesSet = new Set(exchangeRatesArray.map(option => option?.currency?.code));
  const filteredDisplayCurrencies: ICurrency[] = currencies?.filter(option => currenciesSet.has(option?.code));

  const exchange =
    exchangeRatesArray?.find(exRate => {
      return exRate?.currency?.code === displayCurrency?.code;
    }) || currencySettingsEntity.defaultCurrency;

  const handleDateRangeApply = (selectedDateRange: dateRange) => {
    setDateRange(selectedDateRange);
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  const fetchReportData = async () => {
    const currentDate = new Date();
    const defaultDateRange = {
      from: toLocalISOString(startOfYear(currentDate)),
      to: toLocalISOString(currentDate),
      dateSlot: {
        period: 'YEAR',
        slots: 1,
      },
    };

    const formRequest = {
      dateRange: dateRange || defaultDateRange,
      measure: selectedMeasure,
      type: reportType ? capitalizeString(reportType) : selectedType,
      branchId: selectedBranchId,
    };
    // const resp = await fetchSalesReport(formRequest);
    // setReportData(resp)
    dispatch(fetchSalesReportRedux(formRequest));
  };

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

    if (currencySettingsEntity?.displayCurrency) {
      setDisplayCurrency(currencySettingsEntity?.displayCurrency);
    } else {
      setDisplayCurrency(currencySettingsEntity?.defaultCurrency);
    }
  }, [currencySettingsEntity?.defaultCurrency?.code]);

  useEffect(() => {
    fetchReportData();
  }, [selectedMeasure, selectedType, dateRange, reportType, selectedBranchId]);


  const sortedHeaderSlots = salesReportData?.headerSlots?.slice().sort((a, b) => a?.order - b?.order);

  const propertiesToDisplay = Object.keys(salesReportData?.rows[0] ?? {}).filter(
    property =>
      property !== 'rowRecord' &&
      property !== 'amount' &&
      property !== 'value' &&
      property !== selectedMeasure.toLowerCase() &&
      property !== 'slots'
  );

  const totalsRowForFooter = Object.values(salesReportData?.totalByDateRange || {});
  const measure = selectedMeasure.toLowerCase();

  const exportExcel = () => {
    const structuredExcelData = salesReportData?.rows?.map(row => {
      // Use an array to keep track of property insertion order
      const entries = [];

      // Add Product
      entries.push(['Product', row?.rowRecord?.name]);

      // Add date properties
      sortedHeaderSlots.forEach(header => {
        const slot = row.slots.find(s => s.order === header.order);
        entries.push([header.label, selectedMeasure !== 'SALE_COUNT'
          ? `${formatPrice(slot?.value || 0, exchange)} `
          : slot?.value || 0]);
      });

      // Add remaining properties in the desired order
      entries.push(['Total', formatPrice(row.value, exchange)]);
      selectedMeasure !== 'REVENUE' && entries.push(['Revenue', formatPrice(row.revenue, exchange)]);
      entries.push(['Cost Of Goods', formatPrice(row.costOfGoods, exchange)]);
      entries.push(['Gross Profit', formatPrice(row.grossProfit, exchange)]);
      entries.push(['Margin', formatPrice(row.margin, exchange)]);
      selectedMeasure !== 'TAX' && entries.push(['Tax', formatPrice(row.tax, exchange)]);
      selectedMeasure !== 'Returns' && entries.push(['Returns', formatPrice(row.returns, exchange)]);

      // Convert entries to an object
      const rowData = Object.fromEntries(entries);

      return rowData;
    });

    // Create the worksheet with specified headers
    const headers = [
      'Product',
      ...sortedHeaderSlots.map(header => header.label),
      'Total',
      selectedMeasure !== 'REVENUE' ? 'Revenue' : '',
      'Cost Of Goods',
      'Gross Profit',
      'Margin',
      selectedMeasure !== 'TAX' ? 'Tax' : '',
      selectedMeasure !== 'RETURNS' ? 'Returns' : '',
    ].filter(header => header !== '');


    // Initialize totals
    const totals = {};
    headers.forEach(header => {
      if (header !== 'Product') {
        totals[header] = 0;
      }
    });

    // Compute totals
    structuredExcelData.forEach(rowData => {
      headers.forEach(header => {
        if (header !== 'Product') {
          // Remove currency symbols and whitespace, then parse to float
          const value = parseFloat(rowData[header].replace(/[^\d.-]/g, '')) || 0;
          totals[header] += value;
        }
      });
    });

    // Create additional data
    const additionalData = [
      [], // Empty row for readability
    ];

    const excelFooterData = Object.values(salesReportData?.totalByDateRange || {});


    // unshifting an empty object to be able to catch index 0 without ruining the calcs of the values
    excelFooterData.unshift({});
    // Totals row
    const totalsRow = excelFooterData.map((header: any, index) => {
      if (index === 0) {
        return 'Totals';
      } else {
        return formatPrice(header?.value, exchange);
      }
    });
    additionalData.push(totalsRow);

    if (selectedMeasure !== 'SALE_COUNT') {
      const selectedMesaureRow = excelFooterData.map((header: any, index) => {
        if (index === 0) {
          return capitalizeFirstLetter(selectedMeasure.toLowerCase());
        } else {
          return formatPrice(header[selectedMeasure.toLowerCase()], exchange)
        }
      });
      additionalData.push(selectedMesaureRow);
    }

    if (selectedMeasure !== 'REVENUE') {
      const revenueRow = excelFooterData.map((header: any, index) => {
        if (index === 0) {
          return 'Revenue';
        } else {
          return formatPrice(header?.revenue, exchange);
        }
      });
      additionalData.push(revenueRow);
    }

    const costOfGoodsRow = excelFooterData.map((header: any, index) => {
      if (index === 0) {
        return 'Cost Of Goods';
      } else {
        return formatPrice(header?.costOfGoods, exchange);
      }
    });
    additionalData.push(costOfGoodsRow);

    if (selectedMeasure !== 'RETURNS') {
      const returnsRow = excelFooterData.map((header: any, index) => {
        if (index === 0) {
          return 'Returns';
        } else {
          return formatPrice(header?.returns, exchange);
        }
      });
      additionalData.push(returnsRow);
    }

    const marginRow = excelFooterData.map((header: any, index) => {
      if (index === 0) {
        return 'Margin';
      } else {
        return formatPrice(header?.margin, exchange);
      }
    });
    additionalData.push(marginRow);

    const grossProfitRow = excelFooterData.map((header: any, index) => {
      if (index === 0) {
        return 'Gross Profit';
      } else {
        return formatPrice(header?.grossProfit, exchange);
      }
    });
    additionalData.push(grossProfitRow);

    if (selectedMeasure !== 'TAX') {
      const taxRow = excelFooterData.map((header: any, index) => {
        if (index === 0) {
          return 'Tax';
        } else {
          return formatPrice(header?.tax, exchange);
        }
      });
      additionalData.push(taxRow);
    }

    import('xlsx-js-style').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(structuredExcelData, { header: headers });

      // Add additional data to worksheet
      xlsx.utils.sheet_add_aoa(worksheet, additionalData, { origin: -1 });

      // Apply bold styling to the first row (headers)
      headers.forEach((_, index) => {
        const cellAddress = xlsx.utils.encode_cell({ r: 0, c: index });
        if (!worksheet[cellAddress]) return;
        worksheet[cellAddress].s = {
          font: {
            bold: true,
          },
        };
      });

      // Apply bold styling to the first column (Product column)
      structuredExcelData.forEach((_, rowIndex) => {
        const cellAddress = xlsx.utils.encode_cell({ r: rowIndex + 1, c: 0 }); // +1 because headers are at r=0
        if (!worksheet[cellAddress]) return;
        worksheet[cellAddress].s = {
          font: {
            bold: true,
          },
        };
      });

      // Apply bold styling to the first column (totals per year column)
      additionalData.forEach((rowData, index) => {
        if (index === 0) return; // Skip the empty array

        const rowIndex = structuredExcelData.length + 1 + index; // Calculate the correct row index

        // Get the cell address for the first cell in this row
        const cellAddress = xlsx.utils.encode_cell({ r: rowIndex, c: 0 });
        // Apply bold styling to the first cell
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: {
              bold: true,
            },
          };
        }
      });


      worksheet['!cols'] = headers.map(() => ({
        wpx: 144,
      }));

      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      saveAsExcelFile(excelBuffer, 'products');
    });
  };

  const pageStyle = `
  @media print {
    /* Remove scrollbars and display all content */
    .p-datatable-wrapper, .p-datatable-scrollable-body {
      overflow: visible !important;
      max-height: none !important;
    }

    tr {
      border-bottom: 0.1px solid gray !important; 
    }

    .p-datatable tfoot {
      position: relative !important;
    }

    /* Optional: Hide the header during print */
    .p-datatable-header {
      display: none !important;
    }

    .sales-report-print-header {
      display: flex !important;
      flex-direction: column !important;
    }

    /* Set page size to A4 and remove margins */
    @page {
      size: A4;
    }

  }
`;

  const headerButtons = (
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-8 w-8 p-0 rounded-full"
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Export to Excel</p>
          </TooltipContent>
        </Tooltip>
        <ReactToPrint
          trigger={() => (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Print Report</p>
              </TooltipContent>
            </Tooltip>
          )}
          content={() => dtWrapper.current}
          pageStyle={pageStyle}
        />
      </div>
  );

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Sales Report</h1>

        <div className="flex gap-3 flex-wrap">
          {!reportType ? (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Report Type</Label>
                <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                  <SelectTrigger className="h-8 text-xs w-[180px]">
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
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Measure Type</Label>
                <Select value={selectedMeasure} onValueChange={(value) => setSelectedMeasure(value as any)}>
                  <SelectTrigger className="h-8 text-xs w-[180px]">
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
            </>
          ) : null}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Date Range</Label>
          <DateCustomComponent onApplyDateRange={handleDateRangeApply} dateRange={dateRange} setDateRange={setDateRange} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Display Currency</Label>
          <Select
            value={displayCurrency?.code}
            onValueChange={(code) => setDisplayCurrency(filteredDisplayCurrencies.find(c => c.code === code))}
          >
            <SelectTrigger className="h-8 text-xs w-[180px]">
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
          <Label className="text-xs">Branch (Optional)</Label>
          <Select
            value={selectedBranchId || 'all'}
            onValueChange={(value) => setSelectedBranchId(value === 'all' ? null : value)}
          >
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Branches</SelectItem>
              {branchList.map(branch => (
                <SelectItem key={branch.id} value={branch.id} className="text-xs">
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card className="my-3">
        <CardContent className="p-0">
          <div ref={dtWrapper}>
            <div className="p-4">
              {headerButtons}
            </div>

            <div
              className='gap-3 sales-report-print-header hidden print:flex print:flex-col'
            >
              <div className='text-2xl font-bold text-center'>Sales Report</div>
              <div className='text-lg font-semibold flex flex-col gap-1'>
                <div>
                  <span>Report Type: </span>
                  <span>{reportType ? capitalizeString(reportType) : selectedType}</span>
                </div>
                <div>
                  <span>Measure Type: </span>
                  <span>{selectedMeasure ? capitalizeString(selectedMeasure) : selectedMeasure}</span>
                </div>
                {dateRange?.from && dateRange?.to && (
                  <div>
                    <span>Date Range: </span>
                    <span>{formatDateForDisplay(dateRange?.from, "yyyy-MM-dd")} - {formatDateForDisplay(dateRange?.to, "yyyy-MM-dd")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative border rounded-md overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
              {salesReportLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="overflow-x-auto border-b bg-muted">
                    <Table className="w-full" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                      <colgroup>
                        <col style={{ width: '200px' }} />
                        {sortedHeaderSlots?.map(header => (
                          <col key={`col-${header.order}`} style={{ width: '120px' }} />
                        ))}
                        <col style={{ width: '120px' }} />
                        {propertiesToDisplay.map(property => (
                          <col key={`col-${property}`} style={{ width: '120px' }} />
                        ))}
                      </colgroup>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs h-8 font-semibold bg-muted">{reportType ? capitalizeString(reportType) : selectedType}</TableHead>
                          {sortedHeaderSlots?.map(header => (
                            <TableHead key={header.order} className="text-xs h-8 font-semibold bg-muted whitespace-nowrap">{header.label}</TableHead>
                          ))}
                          <TableHead className="text-xs h-8 font-semibold bg-muted">Total</TableHead>
                          {propertiesToDisplay.map(property => (
                            <TableHead key={property} className="text-xs h-8 font-semibold bg-muted whitespace-nowrap">{capitalizeFirstLetter(property)}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </div>

                  <div className="flex-1 overflow-auto">
                    <Table className="w-full" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                      <colgroup>
                        <col style={{ width: '200px' }} />
                        {sortedHeaderSlots?.map(header => (
                          <col key={`col-body-${header.order}`} style={{ width: '120px' }} />
                        ))}
                        <col style={{ width: '120px' }} />
                        {propertiesToDisplay.map(property => (
                          <col key={`col-body-${property}`} style={{ width: '120px' }} />
                        ))}
                      </colgroup>
                      <TableBody>
                        {salesReportData?.rows?.map((row, rowIndex) => (
                          <TableRow key={rowIndex} className="text-xs hover:bg-muted/50">
                            <TableCell className="text-xs font-medium">{row.rowRecord.name}</TableCell>
                            {sortedHeaderSlots?.map(header => {
                              const slotIndex = row.slots.findIndex(s => s.order === header.order);
                              return (
                                <TableCell key={header.order} className="text-xs whitespace-nowrap">
                                  {slotIndex >= 0
                                    ? selectedMeasure !== 'SALE_COUNT'
                                      ? `${formatPrice(row.slots[slotIndex].value, exchange)} `
                                      : row.slots[slotIndex].value
                                    : null}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-xs whitespace-nowrap">
                              {selectedMeasure !== 'SALE_COUNT' ? `${formatPrice(row['value'], exchange)} ` : row['value']}
                            </TableCell>
                            {propertiesToDisplay.map(property => {
                              const value = row[property];
                              return (
                                <TableCell key={property} className="text-xs whitespace-nowrap">
                                  {selectedMeasure === "SALE_COUNT" && property === "returns"
                                    ? value
                                    : typeof value === 'number'
                                      ? `${formatPrice(value, exchange)} `
                                      : value}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t bg-muted shadow-lg overflow-x-auto">
                    <Table className="w-full" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                      <colgroup>
                        <col style={{ width: '200px' }} />
                        {sortedHeaderSlots?.map(header => (
                          <col key={`col-footer-${header.order}`} style={{ width: '120px' }} />
                        ))}
                        <col style={{ width: '120px' }} />
                        {propertiesToDisplay.map(property => (
                          <col key={`col-footer-${property}`} style={{ width: '120px' }} />
                        ))}
                      </colgroup>
                      <TableFooter>
                        <TableRow className="bg-muted">
                          <TableCell colSpan={totalsRowForFooter?.length + 1} className="text-left text-xs font-bold py-3">
                            Total By Date Range
                          </TableCell>
                          <TableCell colSpan={10} />
                        </TableRow>
                        <TableRow className="bg-muted/80">
                          <TableCell className="text-xs font-bold">Totals</TableCell>
                      {totalsRowForFooter.map((totalsRecord: any, index) => (
                        <TableCell key={index} className="text-xs">
                          {selectedMeasure !== 'SALE_COUNT' ? `${formatPrice(totalsRecord?.value, exchange)}` : totalsRecord?.value}
                        </TableCell>
                      ))}
                      <TableCell colSpan={10} />
                    </TableRow>
                    {selectedMeasure !== 'SALE_COUNT' && (
                      <TableRow className="bg-muted/70">
                        <TableCell className="text-xs font-bold">{capitalizeFirstLetter(selectedMeasure.toLowerCase())}</TableCell>
                        {totalsRowForFooter.map((totalsRecord: any, index) => (
                          <TableCell key={index} className="text-xs font-medium">
                            {`${formatPrice(totalsRecord[measure], exchange)}`}
                          </TableCell>
                        ))}
                        <TableCell colSpan={10} />
                      </TableRow>
                    )}
                    {selectedMeasure !== 'REVENUE' && (
                      <TableRow className="bg-muted/60">
                        <TableCell className="text-xs font-bold">Revenue</TableCell>
                        {totalsRowForFooter.map((totalsRecord: any, index) => (
                          <TableCell key={index} className="text-xs font-medium">
                            {`${formatPrice(totalsRecord.revenue, exchange)} `}
                          </TableCell>
                        ))}
                        <TableCell colSpan={10} />
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/50">
                      <TableCell className="text-xs font-bold">Cost Of Goods</TableCell>
                      {totalsRowForFooter.map((totalsRecord: any, index) => (
                        <TableCell key={index} className="text-xs font-medium">
                          {`${formatPrice(totalsRecord.costOfGoods, exchange)} `}
                        </TableCell>
                      ))}
                      <TableCell colSpan={10} />
                    </TableRow>
                    {selectedMeasure !== 'RETURNS' && (
                      <TableRow className="bg-muted/40">
                        <TableCell className="text-xs font-bold">Returned</TableCell>
                        {totalsRowForFooter.map((totalsRecord: any, index) => (
                          <TableCell key={index} className="text-xs font-medium">
                            {selectedMeasure !== 'SALE_COUNT' ? `${formatPrice(totalsRecord?.returns, exchange)}` : totalsRecord?.returns}
                          </TableCell>
                        ))}
                        <TableCell colSpan={10} />
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/30">
                      <TableCell className="text-xs font-bold">Margin</TableCell>
                      {totalsRowForFooter.map((totalsRecord: any, index) => (
                        <TableCell key={index} className="text-xs font-medium">
                          {`${formatPrice(totalsRecord.margin, exchange)}`}
                        </TableCell>
                      ))}
                      <TableCell colSpan={10} />
                    </TableRow>
                    <TableRow className="bg-muted/20">
                      <TableCell className="text-xs font-bold">Gross Profit</TableCell>
                      {totalsRowForFooter.map((totalsRecord: any, index) => (
                        <TableCell key={index} className="text-xs font-medium">
                          {`${formatPrice(totalsRecord.grossProfit, exchange)}`}
                        </TableCell>
                      ))}
                      <TableCell colSpan={10} />
                    </TableRow>
                    {selectedMeasure !== 'TAX' && (
                      <TableRow className="bg-muted/10">
                        <TableCell className="text-xs font-bold">Tax</TableCell>
                        {totalsRowForFooter.map((totalsRecord: any, index) => (
                          <TableCell key={index} className="text-xs font-medium">
                            {`${formatPrice(totalsRecord.tax, exchange)} `}
                          </TableCell>
                        ))}
                        <TableCell colSpan={10} />
                      </TableRow>
                    )}
                      </TableFooter>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageWrapper>
  );
};
