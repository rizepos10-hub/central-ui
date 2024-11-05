import React, { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import {
  getEntity,
  getEntityAReport
} from "app/entities/settings/branch-registry/till/till.reducer";
import { Button, Spinner } from "reactstrap";
import { Button as PrimeButton } from "primereact/button";
import TillDetails from "app/modules/analytics/reports/end-of-till/till-details";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
;
import { ISummaryReport } from "app/shared/model/report-summary.model";
import EndOfTillTotalReceived from "app/shared/components/report/summary-report-total-received";
import ReactToPrint from "react-to-print";

const EndOfTillReport = () => {
  const { id, tillId } = useParams();
  const printWrapper = useRef(null);
  const dispatch = useAppDispatch();
  const till = useAppSelector(state => state.till.entity);
  const summaryReport: ISummaryReport = useAppSelector(state => state.till.report);
  const loading: ISummaryReport = useAppSelector(state => state.till.loading);

  useEffect(() => {
    dispatch(getEntity(tillId));
    dispatch(getEntityAReport(tillId));
  }, []);

  if (loading) {
    return <Spinner />
  }

  const pageStyle = `
    @media print {
      .hide-on-print {
        display: none !important;
      }

      @page {
        size: A4;
        margin: 0;
      }
    }
  `;

  return (
    <div ref={printWrapper}>
      <div className={'bg-white p-5'}>
        <div className="w-100 flex justify-content-between align-items-center">
          <h1>End of Till Report</h1>
          <span className="hide-on-print">
            <ReactToPrint
              trigger={() => (
                <PrimeButton
                  type="button"
                  className="rounded-circle"
                  icon="pi pi-print"
                  severity="info"
                  rounded
                  data-pr-tooltip="PRINT"
                />
              )}
              content={() => printWrapper.current}
              pageStyle={pageStyle}
            />
          </span>
        </div>
        <div className="p-3 rounded-3 border bg-gray-300 border-2 border-gray-300 shadow-sm bg-gradient hide-on-print">
          <Button
            tag={Link}
            to={`/analytics/register-closure/${id}/${tillId}/orders?registry=${till?.registry?.name}&from=${till.startDate}&to=${till.endDate}`}
            className="btn btn--pill btn--well"
          >
            View full details
          </Button>
        </div>

        <div>
          <TillDetails till={till} />
        </div>


        <GenericSalesReport title={'Total Sales'} report={summaryReport?.totalSales} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["DineIn"]} title={"Dine In Sales"} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["Delivery"]} title={"Delivery Sales"} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["PickUp"]} title={"Pick Up Sales"} />

        <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["WalkIn"]} title={"Walk In Sales"} />

        {summaryReport?.totalReceived && <EndOfTillTotalReceived totalReceived={summaryReport.totalReceived} />}
      </div>
    </div>
  );
}
export default EndOfTillReport;
