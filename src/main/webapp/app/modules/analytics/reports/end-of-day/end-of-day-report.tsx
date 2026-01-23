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
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const EndOfDayReportContainer = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const printWrapperRef = useRef(null);

  const [endOfDay, setEndOfDay] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [branch, setBranch] = useState<IBranch>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/end-of-day/${id}`);
      setEndOfDay(data);
      setSalesData(data);
      setBranch(data.branch);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    exportExcelEodSummaryReport([{
      branch,
      data: salesData,
    }], null, null, 'End of Day Report');
  };

  const handlePrint = useReactToPrint({
    content: () => printWrapperRef.current,
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
      <div className="flex justify-end gap-2">
        <Button
          onClick={handlePrint}
          disabled={loading}
          variant="outline"
          className="h-8 text-xs"
        >
          <Printer className="h-3 w-3 mr-1" />
          Print
        </Button>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-[420px] flex-shrink-0">
          <div className="min-h-[520px] h-full rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
            <OrdersTab
              branchId={ordersBranchId}
              fromDate={ordersFromDate}
              toDate={ordersToDate}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div ref={printWrapperRef} className="bg-white mb-2 rounded-md border">
            <EodReportLayout summary={salesData} isEndOfDay={true} branchTimezone={endOfDay?.branch?.timezone} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndOfDayReportContainer;
