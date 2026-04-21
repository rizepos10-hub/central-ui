import React, { useEffect, useRef, useState } from "react";
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
import { useReactToPrint } from "react-to-print";
import { exportExcelSummaryReport } from "app/shared/util/excel-utils";
import { PageWrapper } from "app/shared/layout/page-wrapper";
import ReportActionBar from "app/shared/components/report/report-action-bar";
import ReportExportHeader from "app/shared/components/report/report-export-header";
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from "app/shared/util/report-export-utils";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";

const EndOfTillReport = () => {
  const { id, tillId } = useParams();
  const reportContentRef = useRef(null);
  const dispatch = useAppDispatch();
  const till = useAppSelector(state => state.till.entity);
  const summaryReport: ISummaryReport = useAppSelector(state => state.till.report);
  const loading: ISummaryReport = useAppSelector(state => state.till.loading);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);

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

  const fileName = createReportFileName('End Of Till Report', [till?.registry?.name || null, till?.name || tillId || null]);
  const handleExcelExport = async () => {
    try {
      setBusyAction('excel');
      await exportExcelSummaryReport(summaryReport);
    } finally {
      setBusyAction(null);
    }
  };

  const handlePdfExport = async () => {
    if (!reportContentRef.current || !summaryReport) {
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
    pageStyle: `${analyticsReportPrintStyles('portrait')}
      @media print {
        .hide-on-print {
          display: none !important;
        }
      }
    `,
    onBeforeGetContent: async () => {
      setBusyAction('print');
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  return (
    <PageWrapper>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">End of Till Report</h1>
          <div className="hide-on-print flex gap-1">
            <ReportActionBar
              onExcel={handleExcelExport}
              onPdf={handlePdfExport}
              onPrint={handlePrint}
              disabled={!summaryReport || busyAction !== null}
              busyAction={busyAction}
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

        <div ref={reportContentRef} className="report-export-root space-y-3">
          <ReportExportHeader
            reportTitle="End Of Till Report"
            hiddenOnScreen
            forceVisible={busyAction === 'pdf'}
            filters={[
              { label: 'Register', value: till?.registry?.name || null },
              { label: 'Till', value: till?.name || till?.id || tillId || null },
              {
                label: 'Date Range',
                value:
                  till?.startDate && till?.endDate
                    ? `${formatDateForDisplay(till.startDate, 'PP')} - ${formatDateForDisplay(till.endDate, 'PP')}`
                    : null,
              },
            ]}
          />

          <div>
            <TillDetails till={till} />
          </div>

          <div className="mt-3 space-y-3">
            <GenericSalesReport title={'Total Sales'} report={summaryReport?.totalSales} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["DineIn"]} title={"Dine In Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["Delivery"]} title={"Delivery Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["PickUp"]} title={"Pick Up Sales"} />

            <GenericSalesReport report={summaryReport.totalSalesByOrderOption?.["WalkIn"]} title={"Walk In Sales"} />

            {summaryReport?.totalReceived && <EndOfTillTotalReceived totalReceived={summaryReport.totalReceived} />}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
export default EndOfTillReport;
