import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SalesSection from 'app/modules/analytics/reports/SalesSections';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { Alert, Spinner } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { translate, Translate } from 'react-jhipster';
import GenericSalesReport from 'app/shared/components/report/generic-sales-report';
import EndOfTillTotalReceived from 'app/shared/components/report/summary-report-total-received';
import RelatedTills from 'app/modules/analytics/reports/end-of-day/related-tills';

const EndOfDayReport = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams();

  const [endOfDay, setEndOfDay] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event?) => {
    if (event) {
      event.preventDefault();
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/end-of-day/${id}`);
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
  }, [id]);

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


  return (
    <>
      <div className="container my-5">
        <div className="text-center">
          <h4>
            <Translate contentKey={'analytics.endOfDay.report.title'}>End OF Day Report</Translate>
          </h4>
          <p>
            <Translate contentKey={'analytics.report.location'} interpolate={{ location: 'Random Location' }}>
              Location: Random Location
            </Translate>
          </p>
        </div>
      </div>
      <div className="container mt-5 bg-white">
        {/* <div > */}
        {/*   <UnclosedOrders openedOrders={salesData.openedOrders} /> */}
        {/* </div> */}

        <GenericSalesReport title={translate('analytics.report.totalSales')} report={salesData?.totalSales} />

        <EndOfTillTotalReceived totalReceived={salesData.totalReceived} />
        <GenericSalesReport title={translate('analytics.report.dineIn')} report={salesData.totalSalesByOrderOption?.DineIn} />
        <GenericSalesReport title={translate('analytics.report.pickUp')} report={salesData.totalSalesByOrderOption?.PickUp} />
        <GenericSalesReport title={translate('analytics.report.delivery')} report={salesData.totalSalesByOrderOption?.Delivery} />
        <GenericSalesReport title={translate('analytics.report.walkIn')} report={salesData.totalSalesByOrderOption?.WalkIn} />
      </div>

      {endOfDay?.fromDate && endOfDay?.toDate && (
        <div className="container py-3 mt-3 bg-white">
          <h3>Related Tills</h3>
          <RelatedTills fromDate={endOfDay?.fromDate} toDate={endOfDay?.toDate} />
        </div>
      )}
    </>
  );
};

export default EndOfDayReport;
