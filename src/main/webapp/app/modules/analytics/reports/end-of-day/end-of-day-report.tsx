import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SalesSection from 'app/modules/analytics/reports/SalesSections';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { Alert, Spinner } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { translate, Translate } from 'react-jhipster';
import GenericSalesReport from 'app/shared/components/report/generic-sales-report';
import TipSummary from 'app/shared/components/report/tip-summary';
import EndOfTillTotalReceived from 'app/shared/components/report/summary-report-total-received';
import RelatedTills from 'app/modules/analytics/reports/end-of-day/related-tills';
import ReactToPrint from 'react-to-print';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';
import { IEndOfDayReport } from 'app/shared/model/eod-report.model';
import { ISalesSummary } from 'app/shared/model/report-summary.model';
import { exportExcelSummaryReport, saveAsExcelFile } from 'app/shared/util/excel-utils';
import { getEntities as getBusiness } from 'app/entities/settings/business-details/business-detail.reducer';
import { IBusinessDetail } from 'app/shared/model/business-detail.model';
import { EndOfDayReportSection } from 'app/shared/model/ENUMS/end-of-day-report-section.model';
import BillsSummary from 'app/shared/components/report/bills-summary';
import { fetchFirstLastBills } from '../../api';

const EndOfDayReport = () => {
  const dispatch = useAppDispatch();
  const printWrapper = useRef(null);
  const { id } = useParams();

  const [endOfDay, setEndOfDay] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [endOfDayReportSection, setEndOfDayReportSection] = useState<EndOfDayReportSection[]>(null);
  const [billsSummary, setBillsSummary] = useState(null)


  const [businessDetailsState, setBusinessDetailsState] = useState<IBusinessDetail>({
    businessName: '',
    slogan: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      fullAddress: '',
      longitude: 0,
      latitude: 0,
    },
    branchDetails: []
  });

  const handleSubmit = async (event?) => {
    if (event) {
      event.preventDefault();
    }
    try {
      setLoading(true);
      const { data } = await axios.get<IEndOfDayReport>(`/api/end-of-day/${id}`);
      const reportData = JSON.parse(data.report);
      setEndOfDay(data);
      setSalesData(reportData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTodayData = async () => {
      await handleSubmit();
    };

    fetchTodayData();
    dispatch(getBusiness({})).then((res: any) => setBusinessDetailsState(res.payload.data[0]));
  }, [id]);


  useEffect(() => {
    const branchIdFromUrl = new URLSearchParams(window.location.search).get('branchId');
    if (branchIdFromUrl) {
      const selectedBranch = businessDetailsState.branchDetails.find(branch => branch?.branchId.toString() === branchIdFromUrl);
      console.log(selectedBranch, 'selectedBranch')
      setEndOfDayReportSection(selectedBranch?.endOfDayReportSection);
    }
  }, [businessDetailsState]);

  useEffect(() => {
    fetchFirstLastBills(id).then(result => {
      setBillsSummary(result.data)
    })
  }, [])

  if (!salesData) {
    return <div>No data available.</div>;
  }

  // if(!selectedBranch){
  //   return  (
  //       <div >
  //         <div className="text-center my-3">
  //           <h4>End OF Day Report</h4>
  //           <p>Location: Random Location</p>
  //
  //         </div>
  //       <div>
  //         <Alert variant={"warning"}>Please Select A Branch</Alert>
  //
  //       </div>
  //       <div className="d-flex justify-content-start align-items-start"  >
  //       <Dropdown
  //         style={{minWidth: '20rem'}}
  //         value={selectedBranch}
  //         options={filteredBranchOptions}
  //         onChange={(e) => setSelectedBranch(e.value)}
  //         placeholder="Select a branch"
  //       />
  //       </div>
  //
  //     </div>
  // )
  // }

  const sumOrderData = orderData => {
    return {
      orders: orderData.PickUp.orders + orderData.DineIn.orders + orderData.Delivery.orders,
      subTotal: orderData.PickUp.subTotal + orderData.DineIn.subTotal + orderData.Delivery.subTotal,
      discount: orderData.PickUp.discount + orderData.DineIn.discount + orderData.Delivery.discount,
      appliedCoupon: orderData.PickUp.appliedCoupon + '  |  ' + orderData.DineIn.appliedCoupon + '  |  ' + orderData.Delivery.appliedCoupon,
      deliveryCharge: orderData.PickUp.deliveryCharge + orderData.Delivery.deliveryCharge,
      deliveryTAX: orderData.PickUp.deliveryTAX + orderData.Delivery.deliveryTAX,
      refunds: orderData.PickUp.refunds + orderData.DineIn.refunds + orderData.Delivery.refunds,
      netSales: orderData.PickUp.netSales + orderData.DineIn.netSales + orderData.Delivery.netSales,
      totalTAX: orderData.PickUp.totalTAX + orderData.DineIn.totalTAX + orderData.Delivery.totalTAX,
      grossSales: orderData.PickUp.grossSales + orderData.DineIn.grossSales + orderData.Delivery.grossSales,
      totalTip: orderData.PickUp.totalTip + orderData.DineIn.totalTip + orderData.Delivery.totalTip,
      gst: orderData.PickUp.gst + orderData.DineIn.gst + orderData.Delivery.gst,
      hst: orderData.PickUp.hst + orderData.Delivery.hst,
    };
  };

  // const totalSalesData = sumOrderData(data.totalSales);

  const calculateTotal = values => {
    return values?.reduce((total, value) => total + value, 0);
  };

  if (loading) {
    return <Spinner />;
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
    <div ref={printWrapper}>
      <div className="bg-white p-1 mb-2">
        <div className='d-flex justify-content-between align-items-center'>
          <span></span>
          <span>
            <h4>
              <Translate contentKey={'analytics.endOfDay.report.title'}>
                End OF Day Report
              </Translate>
            </h4>
            {/* <p>
              <Translate contentKey={'analytics.report.location'} interpolate={{ location: 'Random Location' }}>
                Location: Random Location
              </Translate>
            </p> */}
          </span>
          <span>
            <span className="hide-on-print d-flex gap-2">
              <Button type="button" className='rounded-circle' icon="pi pi-file-excel" severity="success" rounded onClick={
                () => exportExcelSummaryReport(salesData)
              } data-pr-tooltip="XLS" />
              <ReactToPrint
                trigger={() => (
                  <Button
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
          </span>
        </div>
        <h5>
          First bill date:{" "}
          <span className="text-primary">{firstBillDate}</span>, Last bill date:{" "}
          <span className="text-primary">{lastBillDate}</span>
        </h5>
      </div>
      <div className="bg-white p-1 mb-2">
        {/* <div > */}
        {/*   <UnclosedOrders openedOrders={salesData.openedOrders} /> */}
        {/* </div> */}

        <GenericSalesReport title={translate('analytics.report.totalSales')} report={salesData?.totalSales} />

        <EndOfTillTotalReceived totalReceived={salesData.totalReceived} />

        {salesData.totalSalesByOrderOption?.DineIn?.orders > 0 && <GenericSalesReport title={translate('analytics.report.dineIn')} report={salesData.totalSalesByOrderOption?.DineIn} />}

        {salesData.totalSalesByOrderOption?.PickUp?.orders > 0 && <GenericSalesReport title={translate('analytics.report.pickUp')} report={salesData.totalSalesByOrderOption?.PickUp} />}

        {salesData.totalSalesByOrderOption?.Delivery?.orders > 0 && <GenericSalesReport title={translate('analytics.report.delivery')} report={salesData.totalSalesByOrderOption?.Delivery} />}

        {salesData.totalSalesByOrderOption?.WalkIn?.orders > 0 && <GenericSalesReport title={translate('analytics.report.walkIn')} report={salesData.totalSalesByOrderOption?.WalkIn} />}

        {endOfDayReportSection?.includes(EndOfDayReportSection.TIP_SUMMARY) && <TipSummary report={salesData.tipSummary} />}

        <BillsSummary eodId={id} />
      </div>

      {endOfDay?.fromDate && endOfDay?.toDate && endOfDayReportSection?.includes(EndOfDayReportSection.RELATED_TILLS) && (
        <div className="bg-white p-1 mb-2">
          <h3>Related Tills</h3>
          <RelatedTills fromDate={endOfDay?.fromDate} toDate={endOfDay?.toDate} />
        </div>
      )}
    </div>
  );
};

export default EndOfDayReport;
