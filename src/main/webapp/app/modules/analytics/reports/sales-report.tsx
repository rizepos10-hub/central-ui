import React, {useEffect, useState} from "react"
import {Dropdown} from "primereact/dropdown";
import {
  SalesReportsMeasures,
  SalesReportsTypes
} from "app/shared/model/enumerations/sales-reports.models";

import {fetchSalesReport} from "app/modules/analytics/api";
import DateCustomComponent from "app/modules/analytics/reports/custom-date-range";
import {format, startOfYear, subYears} from "date-fns";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";


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
}
type totalByDateRange = {
  amount: number | null ;
  costOfGoods: number | null;
  grossProfit: number | null;
  margin: number | null;
  returned: boolean | null ;
  revenue: number | null;
  tax: number | null;
  value: null | number
}

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
}

type SalesReport = {
  headerSlots: HeaderSlot[];
  rows: Row[];
  totalByDateRange: totalByDateRange;
}

type formRequest = {
  dateRange: dateRange;
  measure: string;
  type: string;
}

export const SalesReport = () => {

  const reportTypesOptions = Object.entries(SalesReportsTypes).map(([key,val]) => ({label: key, value: val}));
  console.log(reportTypesOptions, 'reportTypesOptions')
  const reportMeasuresOptions = Object.entries(SalesReportsMeasures).map(([key,val]) => ({label: key, value: val}));

  const [selectedType, setSelectedType] = useState(reportTypesOptions?.[0]?.value);
  const [selectedMeasure, setSelectedMeasure] = useState(reportMeasuresOptions?.[0]?.value);
  const [reportData, setReportData] = useState<SalesReport>();

  console.log(reportData, 'reportData')


  const fetchReportData = async (appliedDateRange = null) => {

    if (!appliedDateRange) {
      const currentDate = new Date();
      appliedDateRange = {
        from: format(subYears(startOfYear(currentDate), 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        to: format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        dateSlot: null
      };
    }

    const formRequest = {
      dateRange: appliedDateRange,
      measure: selectedMeasure,
      type: selectedType,
    };

   const resp = await fetchSalesReport(formRequest);

   setReportData(resp)

  };

  useEffect(() => {

    fetchReportData()

  }, [selectedMeasure, selectedType])




  const handleTypeChange = (e) => {
    const type = e.value;
    setSelectedType(type)
  };


  const handleMeasureChange = (e) => {
    const measure = e.value;
    setSelectedMeasure(measure)
  };






  return (
    <>
      <h1><strong>Sales Report</strong></h1>

      <div className="d-flex gap-3">
        <div className="d-flex flex-column gap-1">
          <label>Report Type</label>
          <Dropdown options={reportTypesOptions} onChange={handleTypeChange} value={selectedType} />
        </div>
        <div className="d-flex flex-column gap-1">
          <label>Measure Type</label>
          <Dropdown options={reportMeasuresOptions} onChange={handleMeasureChange} value={selectedMeasure} />
        </div>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex flex-column gap-1">
            <label>Date Range</label>
            <DateCustomComponent onApplyDateRange={fetchReportData} />
          </div>
        </div>
      </div>
      <div className="my-3 card">
        <DataTable stripedRows showGridlines size={"small"} resizableColumns value={reportData?.rows}>
          <Column field="revenue" header="Revenue" />
          <Column field="costOfGoods" header="Cost of Goods" />
          <Column field="grossProfit" header="Gross Profit" />
          <Column field="margin" header="Margin" />
          <Column field="tax" header="Tax" />
          <Column field="amount" header="Amount" />
          <Column field="returned" header="Returned" />
          <Column field="rowRecord.name" header="Row Record Name" />
        </DataTable>
      </div>
    </>
  )
}
