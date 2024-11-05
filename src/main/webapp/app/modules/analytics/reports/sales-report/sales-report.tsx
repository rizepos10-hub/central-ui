import React, { useEffect, useState, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SalesReportsMeasures, SalesReportsTypes } from 'app/shared/model/ENUMS/sales-reports.models';

import { fetchSalesReport } from 'app/modules/analytics/api';
import DateCustomComponent from 'app/modules/analytics/reports/sales-report/custom-date-range';
import { format, getDayOfYear, startOfYear, sub, subYears } from 'date-fns';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row as PrimeRow } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { fetchSalesReportRedux } from 'app/modules/analytics/reports/sales-report/sales-report.reducer';
import { Spinner } from 'reactstrap';
import Select from 'react-select';
import { ICurrency } from 'app/shared/model/CURRENCY/currency.model';
import { getEntities as getCurrencies } from 'app/entities/settings/currency/currencies.reducer';
import { getEntity as getCurrencySettings } from 'app/entities/settings/currency/currency-settings.reducer';
import { formatPrice } from 'app/shared/util/price-utils';
import { toLocalISOString } from 'app/shared/util/date-utils';
import { useParams } from 'react-router-dom';
import { capitalizeFirstLetter, capitalizeString } from 'app/shared/util/string-utils';
import { Button } from 'primereact/button';
import ReactToPrint from 'react-to-print';

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

  console.log(reportType, 'reportTypereportType');
  console.log(reportMeasuresOptions, 'reportMeasuresOptions');
  const currentDate = new Date();

  const initialSelectedType = reportTypesOptions?.[0]?.value;
  const initialSelectedMeasure = reportType
    ? Object.keys(SalesReportsMeasures).find(key => SalesReportsMeasures[key] === SalesReportsMeasures.REVENUE)
    : reportMeasuresOptions?.[0]?.value;

  const [selectedType, setSelectedType] = useState(initialSelectedType);
  const [selectedMeasure, setSelectedMeasure] = useState(initialSelectedMeasure);
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

    if (currencySettingsEntity?.displayCurrency) {
      setDisplayCurrency(currencySettingsEntity?.displayCurrency);
    } else {
      setDisplayCurrency(currencySettingsEntity?.defaultCurrency);
    }
  }, [currencySettingsEntity?.defaultCurrency?.code]);

  useEffect(() => {
    fetchReportData();
  }, [selectedMeasure, selectedType, dateRange, reportType]);

  const handleTypeChange = e => {
    const type = e.value;
    setSelectedType(type);
  };

  const handleMeasureChange = e => {
    console.log(e, 'hahahha');
    const measure = e.value;
    setSelectedMeasure(measure);
  };

  const sortedHeaderSlots = salesReportData?.headerSlots?.slice().sort((a, b) => a?.order - b?.order);

  const propertiesToDisplay = Object.keys(salesReportData?.rows[0] ?? {}).filter(
    property =>
      property !== 'rowRecord' &&
      property !== 'amount' &&
      property !== 'value' &&
      property !== selectedMeasure.toLowerCase() &&
      property !== 'slots'
  );
  const datatableRows = propertiesToDisplay.map(property => (
    <Column
      key={property}
      field={property}
      body={rowData => {
        const value = rowData[property];
        return selectedMeasure === "SALE_COUNT" && property === "returns" ? value : typeof value === 'number' ? `${formatPrice(value, exchange)} ` : value;
      }}
    />
  ));


  const datatableHeaders = propertiesToDisplay.map((property, index) => <Column key={property} header={capitalizeFirstLetter(property)} />);

  const headerGroup = (
    <ColumnGroup>
      <PrimeRow>
        <Column header={reportType ? capitalizeString(reportType) : selectedType} />
        {sortedHeaderSlots?.map(header => (
          <Column key={header.order} header={header.label} colSpan={1} />
        ))}
        <Column key={'value'} header={'Total'} />
        {datatableHeaders}
      </PrimeRow>
    </ColumnGroup>
  );

  const totalsRowForFooter = Object.values(salesReportData?.totalByDateRange || {});
  const measure = selectedMeasure.toLowerCase();

  const footerGroup = (
    <ColumnGroup>
      <PrimeRow>
        <Column className="bg-silver text-left " colSpan={totalsRowForFooter?.length + 1} footer={'Total By Date Range'} />
        <Column className="bg-white" colSpan={10} />
      </PrimeRow>
      <PrimeRow>
        <Column footer="Totals" className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord: any, index) => (
          <Column
            className="bg-white"
            key={index}
            footer={selectedMeasure !== 'SALE_COUNT' ? `${formatPrice(totalsRecord?.value, exchange)}` : totalsRecord?.value}
          />
        ))}
        <Column className="bg-white" colSpan={10} />
      </PrimeRow>

      {/*  Display the selected measure always in the second row */}
      {selectedMeasure !== 'SALE_COUNT' ? (
        <PrimeRow>
          <Column footer={capitalizeFirstLetter(selectedMeasure.toLowerCase())} className="bg-white text-left" />
          {totalsRowForFooter.map((totalsRecord: any, index) => (
            <Column className="bg-white" key={index} footer={`${formatPrice(totalsRecord[measure], exchange)}`} />
          ))}
          <Column className="bg-white" colSpan={10} />
        </PrimeRow>
      ) : null}

      {selectedMeasure !== 'REVENUE' ? (
        <PrimeRow>
          <Column footer={'Revenue'} className="bg-white text-left" />
          {totalsRowForFooter.map((totalsRecord: any, index) => (
            <Column className="bg-white" key={index} footer={`${formatPrice(totalsRecord.revenue, exchange)} `} />
          ))}
          <Column className="bg-white" colSpan={10} />
        </PrimeRow>
      ) : null}

      <PrimeRow>
        <Column footer={'Cost Of Goods'} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord: any, index) => (
          <Column className="bg-white" key={index} footer={`${formatPrice(totalsRecord.costOfGoods, exchange)} `} />
        ))}
        <Column className="bg-white" colSpan={10} />
      </PrimeRow>

      {selectedMeasure !== 'RETURNS' ? (
        <PrimeRow>
          <Column footer={'Returned'} className="bg-white text-left" />
          {totalsRowForFooter.map((totalsRecord: any, index) => (
            <Column
              className="bg-white"
              key={index}
              footer={selectedMeasure !== 'SALE_COUNT' ? `${formatPrice(totalsRecord?.returns, exchange)}` : totalsRecord?.returns}
            />
          ))}
          <Column className="bg-white" colSpan={10} />
        </PrimeRow>
      ) : null}

      <PrimeRow>
        <Column footer={'Margin'} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord: any, index) => (
          <Column className="bg-white" key={index} footer={`${formatPrice(totalsRecord.margin, exchange)}`} />
        ))}
        <Column className="bg-white" colSpan={10} />
      </PrimeRow>

      <PrimeRow>
        <Column footer={'Gross Profit'} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord: any, index) => (
          <Column className="bg-white" key={index} footer={`${formatPrice(totalsRecord.grossProfit, exchange)}`} />
        ))}
        <Column className="bg-white" colSpan={10} />
      </PrimeRow>

      {selectedMeasure !== 'TAX' ? (
        <PrimeRow>
          <Column footer={'Tax'} className="bg-white text-left" />
          {totalsRowForFooter.map((totalsRecord: any, index) => (
            <Column className="bg-white" key={index} footer={`${formatPrice(totalsRecord.tax, exchange)} `} />
          ))}
          <Column className="bg-white" colSpan={10} />
        </PrimeRow>
      ) : null}
    </ColumnGroup>
  );

  const exportExcel = () => {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(salesReportData?.rows.map(({ rowRecord, slots, ...rest }) => rest));
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      saveAsExcelFile(excelBuffer, 'products');
    });
  };

  const saveAsExcelFile = (buffer, fileName) => {
    import('file-saver').then((module) => {
      if (module && module.default) {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data = new Blob([buffer], {
          type: EXCEL_TYPE
        });

        module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
      }
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

  const header = (
    <div className="flex align-items-center justify-content-end gap-2">
      <Button type="button" className='rounded-circle' icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="XLS" />
      <ReactToPrint
        trigger={() => (
          <Button
            type="button"
            className="rounded-circle"
            icon="pi pi-print"
            severity="info"
            rounded
            data-pr-tooltip="PRINT"
          />
        )}
        content={() => dtWrapper.current}
        pageStyle={pageStyle}
      />
    </div>
  );

  return (
    <>
      <h1>
        <strong>Sales Report</strong>
      </h1>

      <div className="d-flex gap-3">
        {!reportType ? (
          <>
            <div className="d-flex flex-column gap-1">
              <label>Report Type</label>
              <Dropdown options={reportTypesOptions} onChange={handleTypeChange} value={selectedType} />
            </div>
            <div className="d-flex flex-column gap-1">
              <label>Measure Type</label>
              <Dropdown
                options={reportMeasuresOptions}
                optionLabel={'label'}
                optionValue={'value'}
                onChange={handleMeasureChange}
                value={selectedMeasure}
              />
            </div>
          </>
        ) : null}
        <div className="d-flex flex-column gap-1">
          <div className="d-flex flex-column gap-1">
            <label>Date Range</label>
            <DateCustomComponent onApplyDateRange={handleDateRangeApply} dateRange={dateRange} setDateRange={setDateRange} />
          </div>
        </div>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex flex-column gap-1">
            <label>Display Currency</label>
            <Dropdown
              ref={dt}
              value={displayCurrency}
              onChange={e => setDisplayCurrency(e.value)}
              options={filteredDisplayCurrencies}
              filter
              optionLabel={'name'}
              placeholder="Select a Currency"
            />
          </div>
        </div>
      </div>
      <div className="my-3 card">
        <Tooltip target=".export-buttons>button" position="bottom" />
        <div ref={dtWrapper}>

          <div
            className='gap-3 sales-report-print-header'
            style={{
              display: 'none',
            }}
          >
            <div className='fs-2 fw-bold text-center'>Sales Report</div>
            <div className='fs-5 fw-semibold d-flex flex-column gap-1'>
              <div>
                <span>Report Type : </span>
                <span>{reportType ? capitalizeString(reportType) : selectedType}</span>
              </div>
              <div>
                <span>Measure Type : </span>
                <span>{selectedMeasure ? capitalizeString(selectedMeasure) : selectedMeasure}</span>
              </div>
              {dateRange?.from && dateRange?.to && (
                <div>
                  <span>Date Range : </span>
                  <span>{format(new Date(dateRange?.from), "yyyy-MM-dd")} - {format(new Date(dateRange?.to), "yyyy-MM-dd")}</span>
                </div>
              )}
            </div>
          </div>

          <DataTable
            headerColumnGroup={headerGroup}
            footerColumnGroup={footerGroup}
            scrollable
            stripedRows
            showGridlines
            loading={salesReportLoading}
            size={'small'}
            tableStyle={{ minWidth: '50rem' }}
            scrollHeight="45rem"
            value={salesReportData?.rows}
            header={header}
          >
            <Column field={'rowRecord.name'} />
            {sortedHeaderSlots?.map(
              header =>
                header.order >= 0 && (
                  <Column
                    key={header.order}
                    body={rowData => {
                      const slotIndex = rowData.slots.findIndex(s => s.order === header.order);
                      return slotIndex >= 0
                        ? selectedMeasure !== 'SALE_COUNT'
                          ? `${formatPrice(rowData.slots[slotIndex].value, exchange)} `
                          : rowData.slots[slotIndex].value
                        : null;
                    }}
                  />
                )
            )}
            <Column
              body={rowData => {
                return selectedMeasure !== 'SALE_COUNT' ? `${formatPrice(rowData['value'], exchange)} ` : rowData['value'];
              }}
            />
            {datatableRows}
          </DataTable>
        </div>
      </div>
    </>
  );
};
