import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getSummaryForBranch } from './end-of-day-summary.reducer';
import { Translate } from 'react-jhipster';
import { EndOfDaySection } from 'app/shared/model/end-of-day-config.model';
import { EodReportLayout } from 'app/shared/components/report/eod-report-layout';
import { useReactToPrint } from 'react-to-print';

interface PreviewTabProps {
  branchId: string | null;
  toDate: string | null;
  sections: EndOfDaySection[];
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ branchId, toDate, sections }) => {
  const dispatch = useAppDispatch();
  const { loading, summary } = useAppSelector(state => state.endOfDaySummary);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchSummary = () => {
    if (branchId) {
      dispatch(getSummaryForBranch({
        branchId,
        toDate,
        sections
      }));
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [branchId, toDate, sections, dispatch]);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
      }
    `,
  });

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          <Translate contentKey="endOfDay.selectBranchFirst">Please select a branch first</Translate>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading preview...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <i className="pi pi-refresh"></i>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        <button
          onClick={handlePrint}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
        >
          <i className="pi pi-print"></i>
          Print
        </button>
      </div>
      <div ref={reportRef}>
        <EodReportLayout summary={summary} />
      </div>
    </div>
  );
};
