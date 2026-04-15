// DynamicEndOfDayReportUI.tsx
import React, { useEffect, useState } from 'react';
import ReactToPrint from 'react-to-print';
import { translate } from 'react-jhipster';
import GenericSalesReport from 'app/shared/components/report/generic-sales-report';
import SummaryReportTotalReceived from 'app/shared/components/report/summary-report-total-received';
import TipSummary from 'app/shared/components/report/tip-summary';
import RelatedTills from 'app/modules/analytics/reports/end-of-day/related-tills';
import BillsSummary from 'app/shared/components/report/bills-summary';
import OrderChargeSummary from 'app/shared/components/report/order-charge-summary';
import { exportExcelSummaryReport } from 'app/shared/util/excel-utils';
import { EndOfDayReportSection } from 'app/shared/model/ENUMS/end-of-day-report-section.model';
import { Button } from '@/components/ui/button';
import { fetchFirstLastBills, fetchFirstLastBillsSummary } from '../../api';
import { useAppDispatch } from 'app/config/store';
import { getEntities as getBusiness } from 'app/entities/settings/business-details/business-detail.reducer';
import CategoryReport from './category-report';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, RefreshCw, FileSpreadsheet, Download, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';

interface DynamicEndOfDayReportUIProps {
  reportData: any;
  endOfDay: any;
  printWrapperRef: React.RefObject<HTMLDivElement>;
  loading: boolean;
  title: string;
  branchId?: string;
  fromDate?: string;
  toDate?: string;
  source?: string;
  handleExcelExport: any;
}

const DynamicEndOfDayReportUI = ({
  reportData,
  endOfDay,
  printWrapperRef,
  loading,
  title,
  branchId,
  fromDate,
  toDate,
  source,
  handleExcelExport,
}: DynamicEndOfDayReportUIProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [billsSummary, setBillsSummary] = useState<any>(null);
  
  // Default visible sections
  const defaultVisibleSections = {
    orderMethod: true,
    tipSummary: true,
    retailCatalog: true,
    restaurantCatalog: true,
    billsSummary: true,
    relatedTills: true,
    categorySalesSummary: true,
    chargesSummary: true,
  };

  // Load persisted sections from localStorage on mount
  const [visibleSections, setVisibleSections] = useState(() => {
    const storageKey = 'eod-report-visible-sections';
    const savedSections = localStorage.getItem(storageKey);
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        // Merge with defaults to handle any new sections that might be added
        return { ...defaultVisibleSections, ...parsed };
      } catch (e) {
        console.warn('Failed to parse visible sections from localStorage', e);
        return defaultVisibleSections;
      }
    }
    return defaultVisibleSections;
  });

  const [endOfDayReportSection, setEndOfDayReportSection] = useState<any>(null);
  const [businessDetailsState, setBusinessDetailsState] = useState<any>(null);

  // Persist sections to localStorage whenever they change
  useEffect(() => {
    const storageKey = 'eod-report-visible-sections';
    localStorage.setItem(storageKey, JSON.stringify(visibleSections));
  }, [visibleSections]);

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    // Refetch business details
    dispatch(getBusiness({})).then((res: any) => {
      setBusinessDetailsState(res.payload.data[0]);
    });

    // Refetch bills summary
    if (endOfDay?.id) {
      fetchFirstLastBills(endOfDay?.id).then(result => {
        setBillsSummary(result.data);
      });
    } else {
      fetchFirstLastBillsSummary(branchId, source, fromDate, toDate).then(result => {
        setBillsSummary(result.data);
      });
    }

    // // Trigger a page reload to refetch all data
    navigate(0);
    // window.location.reload();
  };

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

  useEffect(() => {
    const fetchData = () => {
      dispatch(getBusiness({})).then((res: any) => {
        setBusinessDetailsState(res.payload.data[0]);
      });
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (businessDetailsState) {
      if (branchId) {
        const selectedBranch = businessDetailsState.branchDetails.find((branch: any) => branch?.branchId.toString() === branchId);
        setEndOfDayReportSection(selectedBranch?.endOfDayReportSection);
      } else {
        setEndOfDayReportSection(Object.values(EndOfDayReportSection));
      }
    }
  }, [businessDetailsState, branchId]);

  useEffect(() => {
    if (endOfDay?.id) {
      fetchFirstLastBills(endOfDay?.id).then(result => {
        setBillsSummary(result.data);
      });
    } else {
      fetchFirstLastBillsSummary(branchId, source, fromDate, toDate).then(result => {
        setBillsSummary(result.data);
      });
    }
  }, [endOfDay?.id, branchId, fromDate, toDate, source]);

  const firstBillDate = formatDateForDisplay(billsSummary?.firstBill?.createdDate);
  const lastBillDate = formatDateForDisplay(billsSummary?.lastBill?.createdDate);

  const showOrderMethod =
    reportData?.totalSalesByOrderOption?.DineIn?.orders > 0 ||
    reportData?.totalSalesByOrderOption?.PickUp?.orders > 0 ||
    reportData?.totalSalesByOrderOption?.Delivery?.orders > 0 ||
    reportData?.totalSalesByOrderOption?.WalkIn?.orders > 0;

  return (
    <div ref={printWrapperRef} className="mt-2">
      <div className="hide-on-print bg-white p-3 mb-2 rounded-md border">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-sm font-semibold">Sections</h5>
          <div className="flex gap-2">
            <Button variant="outline" className="h-7 text-xs" onClick={handleBack}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
            <Button variant="outline" className="h-7 text-xs" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="orderMethod" checked={visibleSections.orderMethod} onCheckedChange={() => toggleSection('orderMethod')} />
            <Label htmlFor="orderMethod" className="text-xs font-normal cursor-pointer">
              Order Type
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="tipSummary" checked={visibleSections.tipSummary} onCheckedChange={() => toggleSection('tipSummary')} />
            <Label htmlFor="tipSummary" className="text-xs font-normal cursor-pointer">
              Tip Summary
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="retailCatalog" checked={visibleSections.retailCatalog} onCheckedChange={() => toggleSection('retailCatalog')} />
            <Label htmlFor="retailCatalog" className="text-xs font-normal cursor-pointer">
              Retail Catalog
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="restaurantCatalog"
              checked={visibleSections.restaurantCatalog}
              onCheckedChange={() => toggleSection('restaurantCatalog')}
            />
            <Label htmlFor="restaurantCatalog" className="text-xs font-normal cursor-pointer">
              Restaurant Catalog
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="billsSummary" checked={visibleSections.billsSummary} onCheckedChange={() => toggleSection('billsSummary')} />
            <Label htmlFor="billsSummary" className="text-xs font-normal cursor-pointer">
              Bills Summary
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="relatedTills" checked={visibleSections.relatedTills} onCheckedChange={() => toggleSection('relatedTills')} />
            <Label htmlFor="relatedTills" className="text-xs font-normal cursor-pointer">
              Related Tills
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="categorySalesSummary"
              checked={visibleSections.categorySalesSummary}
              onCheckedChange={() => toggleSection('categorySalesSummary')}
            />
            <Label htmlFor="categorySalesSummary" className="text-xs font-normal cursor-pointer">
              Category Sales Summary
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="chargesSummary"
              checked={visibleSections.chargesSummary}
              onCheckedChange={() => toggleSection('chargesSummary')}
            />
            <Label htmlFor="chargesSummary" className="text-xs font-normal cursor-pointer">
              Order Charge Summary
            </Label>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !reportData ? (
        <div>No data available.</div>
      ) : (
        <>
          <div className="bg-white p-3 mb-2 rounded-md border">
            <div className="flex justify-between items-center">
              <span />
              <h4 className="text-lg font-semibold">{title}</h4>
              <div className="hide-on-print flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="h-7 text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExcelExport()}>
                      <FileSpreadsheet className="h-3 w-3 mr-2" />
                      Summary Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        exportExcelSummaryReport(
                          reportData,
                          formatDateForDisplay(fromDate),
                          formatDateForDisplay(toDate),
                          'Sales Summary Report',
                          visibleSections
                        )
                      }
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ReactToPrint
                  trigger={() => (
                    <Button variant="outline" className="h-7 text-xs">
                      <Printer className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                  )}
                  content={() => printWrapperRef.current}
                  pageStyle={pageStyle}
                />
              </div>
            </div>
            {firstBillDate !== 'Invalid Date' && lastBillDate !== 'Invalid Date' && (
              <h5 className="text-sm mt-2">
                First bill date: <span className="text-primary font-semibold">{firstBillDate}</span>, Last bill date:{' '}
                <span className="text-primary font-semibold">{lastBillDate}</span>
              </h5>
            )}
          </div>

          {/* New EOD Report Layout */}
          {/* <div className="bg-white mb-2 rounded-md border">
                <EodReportLayout summary={endOfDay} />
            </div> */}

          <div className="space-y-3">
            <GenericSalesReport title={translate('analytics.report.totalSales')} report={reportData.totalSales} />

            {reportData.totalReceived && <SummaryReportTotalReceived totalReceived={reportData.totalReceived} />}

            {visibleSections.orderMethod && showOrderMethod && (
              <>
                {reportData.totalSalesByOrderOption?.DineIn?.orders > 0 && (
                  <GenericSalesReport title={translate('analytics.report.dineIn')} report={reportData.totalSalesByOrderOption.DineIn} />
                )}
                {reportData.totalSalesByOrderOption?.PickUp?.orders > 0 && (
                  <GenericSalesReport title={translate('analytics.report.pickUp')} report={reportData.totalSalesByOrderOption.PickUp} />
                )}
                {reportData.totalSalesByOrderOption?.Delivery?.orders > 0 && (
                  <GenericSalesReport title={translate('analytics.report.delivery')} report={reportData.totalSalesByOrderOption.Delivery} />
                )}
                {reportData.totalSalesByOrderOption?.WalkIn?.orders > 0 && (
                  <GenericSalesReport title={translate('analytics.report.walkIn')} report={reportData.totalSalesByOrderOption.WalkIn} />
                )}
              </>
            )}

            {visibleSections.retailCatalog && (
              <GenericSalesReport
                title="Retail Catalog"
                report={reportData?.catalogSection?.catalogRecords?.find(record => record.name === 'RETAIL')}
              />
            )}

            {visibleSections.restaurantCatalog && (
              <GenericSalesReport
                title="Restaurant Catalog"
                report={reportData?.catalogSection?.catalogRecords?.find(record => record.name === 'RESTAURANT')}
              />
            )}

            {visibleSections.categorySalesSummary && reportData?.categorySaleSummary?.categories?.length > 0 && (
              <CategoryReport categorySaleSummary={reportData?.categorySaleSummary} />
            )}

            {visibleSections.chargesSummary && reportData?.chargesSummary?.charges?.length > 0 && (
              <OrderChargeSummary chargesSummary={reportData.chargesSummary} />
            )}

            {visibleSections.tipSummary && endOfDayReportSection?.includes(EndOfDayReportSection.TIP_SUMMARY) && (
              <TipSummary report={reportData.tipSummary} />
            )}

            {visibleSections.billsSummary && (
              <BillsSummary branchId={branchId} fromDate={fromDate} toDate={toDate} eodId={endOfDay?.id} source={source} />
            )}

            {visibleSections.relatedTills && endOfDay?.fromDate && endOfDay?.toDate && (
              <RelatedTills fromDate={endOfDay.fromDate} toDate={endOfDay.toDate} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DynamicEndOfDayReportUI;
