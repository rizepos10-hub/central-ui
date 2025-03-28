// DynamicEndOfDayReportUI.tsx
import React, { useEffect, useState } from 'react';
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
import { fetchFirstLastBills, fetchFirstLastBillsSummary } from '../../api';
import { useAppDispatch } from 'app/config/store';
import { getEntities as getBusiness } from 'app/entities/settings/business-details/business-detail.reducer';
import { SplitButton } from 'primereact/splitbutton';

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
    handleExcelExport
}: DynamicEndOfDayReportUIProps) => {
    const dispatch = useAppDispatch();

    const [billsSummary, setBillsSummary] = useState<any>(null);
    const [visibleSections, setVisibleSections] = useState({
        orderMethod: true,
        tipSummary: true,
        retailCatalog: true,
        restaurantCatalog: true,
        billsSummary: true,
        relatedTills: true
    });
    const [endOfDayReportSection, setEndOfDayReportSection] = useState<any>(null);
    const [businessDetailsState, setBusinessDetailsState] = useState<any>(null);

    const toggleSection = (section: keyof typeof visibleSections) => {
        setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
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
        console.log(businessDetailsState)
        if (businessDetailsState) {
            console.log(branchId)
            if (branchId) {
                const selectedBranch = businessDetailsState.branchDetails.find(
                    (branch: any) => branch?.branchId.toString() === branchId
                );
                console.log(selectedBranch, 'selectedBranch')
                setEndOfDayReportSection(selectedBranch?.endOfDayReportSection);
            } else {
                setEndOfDayReportSection(Object.values(EndOfDayReportSection));
            }
        }
    }, [businessDetailsState, branchId]);

    console.log(endOfDayReportSection, 'endOfDayReportSection')

    useEffect(() => {
        if (endOfDay?.id) {
            fetchFirstLastBills(endOfDay?.id).then((result) => {
                setBillsSummary(result.data);
            });
        } else {
            fetchFirstLastBillsSummary(branchId, source, fromDate, toDate).then((result) => {
                setBillsSummary(result.data);
            });
        }
    }, [endOfDay?.id, branchId, fromDate, toDate, source]);

    const firstBillDate = new Date(billsSummary?.firstBill?.createdDate).toLocaleString();
    const lastBillDate = new Date(billsSummary?.lastBill?.createdDate).toLocaleString();

    if (loading) {
        return <Spinner />;
    }

    if (!reportData) {
        return <div>No data available.</div>;
    }

    return (
        <div ref={printWrapperRef} className="mt-2">
            <div className="hide-on-print bg-white p-2 mb-2">
                <h5>Sections</h5>
                <div className="flex gap-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-1"
                            checked={visibleSections.orderMethod}
                            onChange={() => toggleSection('orderMethod')}
                        />
                        Order Method
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-1"
                            checked={visibleSections.tipSummary}
                            onChange={() => toggleSection('tipSummary')}
                        />
                        Tip Summary
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-1"
                            checked={visibleSections.retailCatalog}
                            onChange={() => toggleSection('retailCatalog')}
                        />
                        Retail Catalog
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-1"
                            checked={visibleSections.restaurantCatalog}
                            onChange={() => toggleSection('restaurantCatalog')}
                        />
                        Restaurant Catalog
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-1"
                            checked={visibleSections.billsSummary}
                            onChange={() => toggleSection('billsSummary')}
                        />
                        Bills Summary
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-1"
                            checked={visibleSections.relatedTills}
                            onChange={() => toggleSection('relatedTills')}
                        />
                        Related Tills
                    </label>
                </div>
            </div>
            <div className="bg-white p-1 mb-2">
                <div className="d-flex justify-content-between align-items-center">
                    <span />
                    <span>
                        <h4>{title}</h4>
                    </span>
                    <span>
                        <div className="hide-on-print d-flex gap-2">
                            <SplitButton
                                label="Export"
                                icon="pi pi-file-excel"
                                model={[
                                    {
                                        label: 'Summary Report',
                                        icon: 'pi pi-file-excel',
                                        command: () => handleExcelExport()
                                    },
                                    {
                                        label: 'Report',
                                        icon: 'pi pi-download',
                                        command: () => exportExcelSummaryReport(
                                            reportData,
                                            new Date(fromDate).toLocaleString(),
                                            new Date(toDate).toLocaleString(),
                                            'Sales Summary Report',
                                            visibleSections
                                        )
                                    }
                                ]}
                                className="rounded-circle p-button-success"
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
                {firstBillDate !== 'Invalid Date' && lastBillDate !== 'Invalid Date' && (
                    <h5>
                        First bill date:{' '}
                        <span className="text-primary">{firstBillDate}</span>, Last bill date:{' '}
                        <span className="text-primary">{lastBillDate}</span>
                    </h5>
                )}
            </div>
            <div className="bg-white p-1 mb-2 section-totalSales">
                <GenericSalesReport
                    title={translate('analytics.report.totalSales')}
                    report={reportData.totalSales}
                />
                <EndOfTillTotalReceived totalReceived={reportData.totalReceived} />
            </div>

            {visibleSections.orderMethod && (
                <div className="bg-white p-1 mb-2 section-orderMethod">
                    <h3>Order Method</h3>
                    <div className="ps-3">
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
                    </div>
                    <hr className="p-2" style={{ backgroundColor: 'gray' }} />
                </div>
            )}

            {/* {visibleSections.catalogSection && (
                <div className="bg-white p-1 mb-2 section-catalogRecords">
                    <GenericSalesReport
                        title={'Retail Catalog'}
                        report={reportData?.catalogSection?.catalogRecords?.find(record => record.name === 'RETAIL')}
                    />
                    <GenericSalesReport
                        title={'Restaurant Catalog'}
                        report={reportData?.catalogSection?.catalogRecords?.find(record => record.name === 'RESTAURANT')}
                    />
                </div>
            )} */}

            <div className="bg-white p-1 mb-2 section-catalogRecords">
                {visibleSections.retailCatalog && (
                    <GenericSalesReport
                        title={'Retail Catalog'}
                        report={reportData?.catalogSection?.catalogRecords?.find(record => record.name === 'RETAIL')}
                    />
                )}

                {visibleSections.restaurantCatalog && (
                    <GenericSalesReport
                        title={'Restaurant Catalog'}
                        report={reportData?.catalogSection?.catalogRecords?.find(record => record.name === 'RESTAURANT')}
                    />
                )}
            </div>

            {visibleSections.tipSummary &&
                endOfDayReportSection?.includes(EndOfDayReportSection.TIP_SUMMARY) && (
                    <div className="bg-white p-1 mb-2 section-tipSummary">
                        <TipSummary report={reportData.tipSummary} />
                        <hr className="p-2" style={{ backgroundColor: 'gray' }} />
                    </div>
                )}
            {visibleSections.billsSummary && (
                <div className="bg-white p-1 mb-2 section-billsSummary">
                    <BillsSummary
                        branchId={branchId}
                        fromDate={fromDate}
                        toDate={toDate}
                        eodId={endOfDay?.id}
                        source={source}
                    />
                </div>
            )}
            {visibleSections.relatedTills &&
                endOfDay?.fromDate &&
                endOfDay?.toDate && (
                    <div className="bg-white p-1 mb-2 section-relatedTills">
                        <h3>Related Tills</h3>
                        <RelatedTills fromDate={endOfDay.fromDate} toDate={endOfDay.toDate} />
                    </div>
                )}
        </div>
    );
};

export default DynamicEndOfDayReportUI;
