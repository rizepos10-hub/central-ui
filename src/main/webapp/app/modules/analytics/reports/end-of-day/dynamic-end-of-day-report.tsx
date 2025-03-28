// DynamicEndOfDayReportUI.tsx
import React from 'react';
import { Spinner } from 'reactstrap';
import ReactToPrint from 'react-to-print';
import { Translate, translate } from 'react-jhipster';
import GenericSalesReport from 'app/shared/components/report/generic-sales-report';
import EndOfTillTotalReceived from 'app/shared/components/report/summary-report-total-received';
import TipSummary from 'app/shared/components/report/tip-summary';
import RelatedTills from 'app/modules/analytics/reports/end-of-day/related-tills';
import BillsSummary from 'app/shared/components/report/bills-summary';
import { exportExcelSummaryReport } from 'app/shared/util/excel-utils';
import { EndOfDayReportSection } from 'app/shared/model/ENUMS/end-of-day-report-section.model';
import { Button } from 'primereact/button';
import CatalogSection from './catalog-section';

interface DynamicEndOfDayReportUIProps {
    reportData: any;
    endOfDay: any;
    billsSummary: any;
    endOfDayReportSection: EndOfDayReportSection[] | null;
    printWrapperRef: React.RefObject<HTMLDivElement>;
    loading: boolean;
    title: string;
    branchId?: string;
    fromDate?: string;
    toDate?: string;
    source?: string;
}

const DynamicEndOfDayReportUI = ({
    reportData,
    endOfDay,
    billsSummary,
    endOfDayReportSection,
    printWrapperRef,
    loading,
    title,
    branchId,
    fromDate,
    toDate,
    source
}: DynamicEndOfDayReportUIProps) => {
    if (loading) {
        return <Spinner />;
    }

    if (!reportData) {
        return <div>No data available.</div>;
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

    const firstBillDate = new Date(
        billsSummary?.firstBill?.createdDate
    ).toLocaleString();
    const lastBillDate = new Date(
        billsSummary?.lastBill?.createdDate
    ).toLocaleString();

    return (
        <div ref={printWrapperRef}>
            <div className="bg-white p-1 mb-2">
                <div className="d-flex justify-content-between align-items-center">
                    <span />
                    <span>
                        <h4>
                            {title}
                        </h4>
                    </span>
                    <span>
                        <div className="hide-on-print d-flex gap-2">
                            <Button
                                type="button"
                                className="rounded-circle"
                                icon="pi pi-file-excel"
                                severity="success"
                                onClick={() => exportExcelSummaryReport(reportData)}
                                data-pr-tooltip="XLS"
                            />
                            <ReactToPrint
                                trigger={() => (
                                    <Button
                                        type="button"
                                        className="rounded-circle"
                                        icon="pi pi-print"
                                        severity="info"
                                        data-pr-tooltip="PRINT"
                                    />
                                )}
                                content={() => printWrapperRef.current}
                                pageStyle={pageStyle}
                            />
                        </div>
                    </span>
                </div>
                <h5>
                    First bill date:{' '}
                    <span className="text-primary">{firstBillDate}</span>, Last bill date:{' '}
                    <span className="text-primary">{lastBillDate}</span>
                </h5>
            </div>
            <div className="bg-white p-1 mb-2">
                <GenericSalesReport
                    title={translate('analytics.report.totalSales')}
                    report={reportData.totalSales}
                />
                <EndOfTillTotalReceived totalReceived={reportData.totalReceived} />
                {reportData.totalSalesByOrderOption?.DineIn?.orders > 0 && (
                    <GenericSalesReport
                        title={translate('analytics.report.dineIn')}
                        report={reportData.totalSalesByOrderOption.DineIn}
                    />
                )}
                {reportData.totalSalesByOrderOption?.PickUp?.orders > 0 && (
                    <GenericSalesReport
                        title={translate('analytics.report.pickUp')}
                        report={reportData.totalSalesByOrderOption.PickUp}
                    />
                )}
                {reportData.totalSalesByOrderOption?.Delivery?.orders > 0 && (
                    <GenericSalesReport
                        title={translate('analytics.report.delivery')}
                        report={reportData.totalSalesByOrderOption.Delivery}
                    />
                )}
                {reportData.totalSalesByOrderOption?.WalkIn?.orders > 0 && (
                    <GenericSalesReport
                        title={translate('analytics.report.walkIn')}
                        report={reportData.totalSalesByOrderOption.WalkIn}
                    />
                )}
                {endOfDayReportSection?.includes(EndOfDayReportSection.TIP_SUMMARY) && (
                    <TipSummary report={reportData.tipSummary} />
                )}

                <div className='mb-2'>
                    <CatalogSection catalogRecords={reportData?.catalogSection?.catalogRecords} />
                </div>

                <BillsSummary
                    branchId={branchId}
                    fromDate={fromDate}
                    toDate={toDate}
                    eodId={endOfDay?.id}
                    source={source}
                />
            </div>
            {endOfDay?.fromDate &&
                endOfDay?.toDate &&
                endOfDayReportSection?.includes(EndOfDayReportSection.RELATED_TILLS) && (
                    <div className="bg-white p-1 mb-2">
                        <h3>Related Tills</h3>
                        <RelatedTills fromDate={endOfDay.fromDate} toDate={endOfDay.toDate} />
                    </div>
                )}
        </div>
    );
};

export default DynamicEndOfDayReportUI;
