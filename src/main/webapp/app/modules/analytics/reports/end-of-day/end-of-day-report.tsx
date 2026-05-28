// EndOfDayReportContainer.tsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from 'app/config/store';
import DynamicEndOfDayReportUI from './dynamic-end-of-day-report';
import { exportExcelEodSummaryReport } from 'app/shared/util/excel-utils';
import { IBranch } from 'app/shared/model/branch.model';
import { OrdersTab } from 'app/entities/end-of-day/orders-tab';
import { EodReportLayout } from 'app/shared/components/report/eod-report-layout';
import { useReactToPrint } from 'react-to-print';
import ReportActionBar from 'app/shared/components/report/report-action-bar';
import ReportErrorState from 'app/shared/components/report/report-error-state';
import ReportExportHeader from 'app/shared/components/report/report-export-header';
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from 'app/shared/util/report-export-utils';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { getReportApiErrorMessage } from 'app/shared/util/report-api-error-utils';

const EndOfDayReportContainer = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const reportContentRef = useRef<HTMLDivElement>(null);

  const [endOfDay, setEndOfDay] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [branch, setBranch] = useState<IBranch>();
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/end-of-day/${id}`);
      setEndOfDay(data);
      setSalesData(data);
      setBranch(data.branch);
    } catch (error) {
      setEndOfDay(null);
      setSalesData(null);
      setBranch(undefined);
      setError(getReportApiErrorMessage(error, 'Unable to load end of day report.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    exportExcelEodSummaryReport(
      [
        {
          branch,
          data: salesData,
        },
      ],
      endOfDay?.fromDate ?? null,
      endOfDay?.toDate ?? null,
      'End of Day Report',
    );
  };

  const handlePrint = useReactToPrint({
    content: () => reportContentRef.current,
    documentTitle: createReportFileName('End Of Day Report', [branch?.name || null, endOfDay?.number || null]),
    pageStyle: analyticsReportPrintStyles('portrait'),
    onBeforeGetContent: async () => {
      setBusyAction('print');
    },
    onAfterPrint: () => {
      setBusyAction(null);
    },
  });

  const handlePdfExport = async () => {
    if (!reportContentRef.current || !salesData) {
      return;
    }

    try {
      setBusyAction('pdf');
      await downloadElementAsPdf(reportContentRef.current, {
        fileName: createReportFileName('End Of Day Report', [branch?.name || null, endOfDay?.number || null]),
        orientation: 'portrait',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const ordersFromDate = endOfDay?.fromDate ?? endOfDay?.fromDateString ?? '';
  const ordersToDate = endOfDay?.toDate ?? endOfDay?.toDateString ?? null;
  const ordersBranchId = branch?.id ?? null;

  useEffect(() => {
    const fetchData = async () => {
      await handleSubmit();
    };
    fetchData();
  }, [id, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {error ? <ReportErrorState message={error} dataTestId="end-of-day-report-error" /> : null}
      <div className="flex justify-end gap-2">
        <ReportActionBar
          onExcel={handleExcelExport}
          onPdf={handlePdfExport}
          onPrint={handlePrint}
          disabled={!salesData || loading || busyAction !== null || !!error}
          busyAction={busyAction}
        />
      </div>
      {!error ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="lg:basis-[65%] lg:pr-4">
            <div className="min-h-[560px] h-full rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
              <OrdersTab
                branchId={ordersBranchId}
                fromDate={ordersFromDate}
                toDate={ordersToDate}
              />
            </div>
          </div>
          <div className="lg:basis-[35%] flex-1 min-w-0">
            <div ref={reportContentRef} className="report-export-root space-y-3 bg-white mb-2 rounded-md border p-3 min-h-[560px]">
              <ReportExportHeader
                reportTitle="End Of Day Report"
                hiddenOnScreen
                forceVisible={busyAction === 'pdf'}
                filters={[
                  { label: 'Branch', value: branch?.name || null },
                  { label: 'Register', value: endOfDay?.branchRegistry?.name || null },
                  { label: 'Report Number', value: endOfDay?.number || null },
                  {
                    label: 'Date Range',
                    value:
                      endOfDay?.fromDate && endOfDay?.toDate
                        ? `${formatDateForDisplay(endOfDay.fromDate, 'PP')} - ${formatDateForDisplay(endOfDay.toDate, 'PP')}`
                        : null,
                  },
                ]}
              />
              <EodReportLayout
                summary={salesData}
                isEndOfDay={true}
                branchTimezone={endOfDay?.branch?.timezone}
                hideBrandingHeader
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EndOfDayReportContainer;
