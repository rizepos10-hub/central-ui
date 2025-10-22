import React, { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import {
  getEntity,
  getEntityAReport
} from "app/entities/settings/branch-registry/till/till.reducer";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer, Loader2 } from "lucide-react";
import TillDetails from "app/modules/analytics/reports/end-of-till/till-details";
import GenericSalesReport from "app/shared/components/report/generic-sales-report";
import { ISalesSummary, ISummaryReport } from "app/shared/model/report-summary.model";
import EndOfTillTotalReceived from "app/shared/components/report/summary-report-total-received";
import ReactToPrint from "react-to-print";
import { exportExcelSummaryReport, saveAsExcelFile } from "app/shared/util/excel-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";

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
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageWrapper>
    )
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
    <PageWrapper>
      <div ref={printWrapper}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">End of Till Report</h1>
          <div className="hide-on-print flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => exportExcelSummaryReport(summaryReport)}
            >
              <FileSpreadsheet className="h-3 w-3" />
            </Button>
            <ReactToPrint
              trigger={() => (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                >
                  <Printer className="h-3 w-3" />
                </Button>
              )}
              content={() => printWrapper.current}
              pageStyle={pageStyle}
            />
          </div>
        </div>

        <div className="p-2 rounded-lg border bg-muted/50 mb-2 hide-on-print">
          <Button
            asChild
            size="sm"
            className="h-7 text-xs"
          >
            <Link to={`/analytics/register-closure/${id}/${tillId}/orders?registry=${till?.registry?.name}&from=${till.startDate}&to=${till.endDate}`}>
              View full details
            </Link>
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
    </PageWrapper>
  );
}
export default EndOfTillReport;
