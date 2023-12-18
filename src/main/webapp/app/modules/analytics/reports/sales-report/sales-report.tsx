import React, {useEffect, useState} from "react"
import {Dropdown} from "primereact/dropdown";
import {
  SalesReportsMeasures,
  SalesReportsTypes
} from "app/shared/model/enumerations/sales-reports.models";

import {fetchSalesReport} from "app/modules/analytics/api";
import DateCustomComponent from "app/modules/analytics/reports/sales-report/custom-date-range";
import {format, getDayOfYear, startOfYear, sub, subYears} from "date-fns";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {ColumnGroup} from "primereact/columngroup";
import { Row as PrimeRow } from "primereact/row";
import {Tooltip} from "primereact/tooltip";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {fetchSalesReportRedux} from "app/modules/analytics/reports/sales-report/sales-report.reducer";
import {Spinner} from "reactstrap";


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
  const dispatch = useAppDispatch();
  const reportTypesOptions = Object.entries(SalesReportsTypes).map(([key,val]) => ({label: key, value: val}));
  console.log(reportTypesOptions, 'reportTypesOptions')
  const reportMeasuresOptions = Object.entries(SalesReportsMeasures).map(([key,val]) => ({label: key, value: val}));

  const [selectedType, setSelectedType] = useState(reportTypesOptions?.[0]?.value);
  const [selectedMeasure, setSelectedMeasure] = useState(reportMeasuresOptions?.[0]?.value);
  const [appliedDateRange, setAppliedDateRange] = useState<dateRange | null>();
  const salesReportData = useAppSelector(state => state.salesReportReducer.data);
  const salesReportLoading = useAppSelector(state => state.salesReportReducer.loading);
  const salesReportError = useAppSelector(state => state.salesReportReducer.error);
  console.log(salesReportData, 'datadatadatadata')

  const handleDateRangeApply = (selectedDateRange: dateRange) => {
    setAppliedDateRange(selectedDateRange);
  };
  const fetchReportData = async () => {

      const currentDate = new Date();
      const defaultDateRange = {
        from: format(startOfYear(currentDate), "yyyy-MM-dd'T'22:00:00.SSSxxx"),
        to: format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        dateSlot: {
          period: 'YEAR',
          slots: 1,
        },
      }


    const formRequest = {
      dateRange: appliedDateRange || defaultDateRange,
      measure: selectedMeasure,
      type: selectedType,
    };
   // const resp = await fetchSalesReport(formRequest);
   // setReportData(resp)
    dispatch(fetchSalesReportRedux(formRequest))
  };

  useEffect(() => {

    fetchReportData()

  }, [selectedMeasure, selectedType, appliedDateRange

  ])



  const handleTypeChange = (e) => {
    const type = e.value;
    setSelectedType(type)
  };


  const handleMeasureChange = (e) => {
    const measure = e.value;
    setSelectedMeasure(measure)
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const sortedHeaderSlots = salesReportData?.headerSlots?.sort((a, b) => a.order - b.order);
  const propertiesToDisplay = Object.keys(salesReportData?.rows[0] ?? {}).filter((property) =>
    property !== "rowRecord"
    && property !== "amount"
    && property !== "value"
    && property !== selectedMeasure.toLowerCase()
    && property !== "slots");
  const datatableRows = propertiesToDisplay.map((property) => (
    <Column key={property} field={property} body={(rowData) => {
      const value = rowData[property];
      return typeof value === 'number' ? value.toFixed(2) : value;
    }} />
  ));

  console.log(sortedHeaderSlots, 'sortedHeaderSlots')


  const datatableHeaders = propertiesToDisplay.map((property, index) => (
    <Column key={property} header={capitalizeFirstLetter(property)} />
  ));


  const headerGroup = (
    <ColumnGroup>
        <PrimeRow>
        <Column  header={selectedType} />
          {sortedHeaderSlots?.map((header) => (
            <Column key={header.order} header={header.label} colSpan={1}/>
          ))}
          {selectedMeasure ?
            <Column key={"value"} header={"Total"}/>
            : null}
        {datatableHeaders}
        </PrimeRow>
    </ColumnGroup>
  );


  const totalsRowForFooter = (Object.values(salesReportData?.totalByDateRange || {}));
  const measure = selectedMeasure.toLowerCase();




  const footerGroup = (
    <ColumnGroup>
      <PrimeRow >
        <Column className="bg-silver text-left " colSpan={totalsRowForFooter?.length + 1}  footer={"Total By Date Range"} />
        <Column  className="bg-white"  colSpan={10} />

      </PrimeRow>
      <PrimeRow>
        <Column  footer="Totals" className="bg-white text-left"   />
        {totalsRowForFooter.map((totalsRecord : any, index) => (
          <Column  className="bg-white"  key={index} footer={totalsRecord.value?.toFixed(2)} />
        ))}
        <Column  className="bg-white"  colSpan={10} />

      </PrimeRow>

      {/*  Display the selected measure always in the second row */}
      {selectedMeasure !== "SALE_COUNT" ?
        <PrimeRow>
        <Column footer={capitalizeFirstLetter(selectedMeasure.toLowerCase())} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord: any, index) => (
          <Column className="bg-white"   key={index} footer={totalsRecord[measure]?.toFixed(2)}/>
        ))}
          <Column  className="bg-white"  colSpan={10} />
      </PrimeRow> : null}

       {selectedMeasure !== "REVENUE" ?
         <PrimeRow>
         <Column footer={"Revenue"} className="bg-white text-left" />
         {totalsRowForFooter.map((totalsRecord: any, index) => (
           <Column className="bg-white"   key={index} footer={totalsRecord.revenue?.toFixed(2)}/>
         ))}
           <Column  className="bg-white"  colSpan={10} />
       </PrimeRow> : null }

       <PrimeRow>
         <Column footer={"Cost Of Goods"} className="bg-white text-left" />
         {totalsRowForFooter.map((totalsRecord: any, index) => (
           <Column className="bg-white"  key={index} footer={totalsRecord.costOfGoods?.toFixed(2)}/>
         ))}
         <Column  className="bg-white"  colSpan={10} />
       </PrimeRow>

     {selectedMeasure !== "RETURNS" ?
      <PrimeRow>
        <Column footer={"Returned"} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord : any, index) => (
          <Column  className="bg-white"  key={index} footer={totalsRecord.returns?.toFixed(2)} />
        ))}
        <Column  className="bg-white"  colSpan={10} />
      </PrimeRow> : null }

      <PrimeRow>
        <Column footer={"Margin"} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord : any, index) => (
          <Column className="bg-white"  key={index} footer={totalsRecord.margin?.toFixed(2)} />
        ))}
        <Column  className="bg-white"  colSpan={10} />
      </PrimeRow>

      <PrimeRow>
        <Column footer={"Gross Profit"} className="bg-white text-left" />
        {totalsRowForFooter.map((totalsRecord : any, index) => (
          <Column className="bg-white"  key={index} footer={totalsRecord.grossProfit?.toFixed(2)} />
        ))}
        <Column  className="bg-white"  colSpan={10} />
      </PrimeRow>

       {selectedMeasure !== "TAX" ?
         <PrimeRow>
         <Column footer={"Tax"} className="bg-white text-left" />
         {totalsRowForFooter.map((totalsRecord: any, index) => (
           <Column className="bg-white"  key={index} footer={totalsRecord.tax?.toFixed(2)}/>
         ))}
           <Column  className="bg-white"  colSpan={10} />
       </PrimeRow> : null}
    </ColumnGroup>
   );



  // const initialFooterRows = totalsRowForFooter.length > 0 ? Object.keys(totalsRowForFooter[0]) : [];

  // const footerGroup = (
  //   <ColumnGroup>
  //     <PrimeRow>
  //       <Column footer="Totals" footerStyle={{ textAlign: 'left' }} />
  //       {totalsRowForFooter.map((totalsRecord: any, rowIndex) => (
  //         <Column key={rowIndex} footer={totalsRecord.amount} />
  //       ))}
  //     </PrimeRow>
  //
  //     {initialFooterRows.map((columnName, index) => (
  //       columnName !== 'amount' && (
  //         <PrimeRow key={index}>
  //           <Column footer={capitalizeFirstLetter(columnName)} footerStyle={{ textAlign: 'left' }}/>
  //           {totalsRowForFooter.map((totalsRecord: any, rowIndex) => (
  //             <Column key={rowIndex} footer={totalsRecord[columnName]} />
  //           ))}
  //         </PrimeRow>)
  //     ))}
  //   </ColumnGroup>
  // );


  return (
    <>
      <h1>
        <strong>Sales Report</strong>
      </h1>

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
            <DateCustomComponent onApplyDateRange={handleDateRangeApply} />
          </div>
        </div>
      </div>
      <div className="my-3 card">
        <Tooltip target=".export-buttons>button" position="bottom" />
        <DataTable
          headerColumnGroup={headerGroup}
          footerColumnGroup={footerGroup}
          scrollable
          stripedRows
          showGridlines
          loading={salesReportLoading}
          size={"small"}
          tableStyle={{ minWidth: '50rem' }}
          scrollHeight="45rem"
          value={salesReportData?.rows}
        >
          <Column field={"rowRecord.name"}/>
          {sortedHeaderSlots?.map((header) => (
            header.order >= 0 && <Column key={header.order}
                                         body={(rowData) => {
                                         const slotIndex = rowData.slots.findIndex((s) => s.order === header.order);
                                         console.log(rowData.slots, `hello slots from`, rowData.rowRecord?.name)
                                         return slotIndex >= 0 ? rowData.slots[slotIndex].value?.toFixed(2) : null}} />
          ))}
            <Column
                   body={(rowData) => {
                     return rowData["value"].toFixed(2);
                   }}/>
          {datatableRows}
        </DataTable>
      </div>
    </>
  )
}
