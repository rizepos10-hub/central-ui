import React, {useEffect, useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SalesSection from "app/modules/analytics/reports/SalesSections";
import axios from "axios";
import { format, addDays } from 'date-fns';
const EndOFDayReport = () => {



  const [salesData, setSalesData]:any[] = useState([]);
  const [loading, setLoading] = useState(false);

  const defaultFromDate = addDays(new Date(), -1);
  const defaultToDate = addDays(new Date(), 0);

  const [fromDate, setFromDate] = useState(format(defaultFromDate, "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(defaultToDate, "yyyy-MM-dd"));



  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event) => {
    setToDate(event.target.value);
  };


  const handleSubmit = async (event?) => {
    if (event) {
      event.preventDefault();
    }

    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    if (fromDateObj > toDateObj) {
      alert("From date cannot be later than To date.");
      return;
    }
    try {
      setLoading(true)
      const formattedFromDate = `${fromDate}T00:00:00.000Z`;
      const formattedToDate = `${toDate}T00:00:00.000Z`;

      const formData = new FormData();
      formData.append('fromDate', formattedFromDate);
      formData.append('toDate', formattedToDate);

      const { data } = await axios.post(`/api/report/sales-summary`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSalesData(data);
      setLoading(false)
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
  }, []);


  if (!salesData) {
    return <div>No data available.</div>;
  }




  const sumOrderData = (orderData) => {
    return {
      orders: orderData.PickUp.orders + orderData.DineIn.orders + orderData.Delivery.orders,
      subTotal: orderData.PickUp.subTotal + orderData.DineIn.subTotal + orderData.Delivery.subTotal,
      discount: orderData.PickUp.discount + orderData.DineIn.discount + orderData.Delivery.discount,
      appliedCoupon: orderData.PickUp.appliedCoupon    + '  |  ' +  orderData.DineIn.appliedCoupon +   '  |  ' + orderData.Delivery.appliedCoupon,
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

  const calculateTotal = (values) => {
    return values?.reduce((total, value) => total + value, 0);
  };


  console.log(salesData,'salesDta')

  return (

    <div className="container mt-5">
      <div className="text-center">
        <h2>Pos Business 10</h2>
        <h4>Sales Summary Report</h4>
        <p>Location: Random Location</p>
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="fromDate" className="form-label fw-bold">From Date</label>
              <input
                type="date"
                id="fromDate"
                className="form-control"
                value={fromDate}
                onChange={handleFromDateChange}
                max={fromDate}
                min={fromDate}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="fromDate" className="form-label fw-bold">To Date</label>
              <input
                type="date"
                id="toDate"
                className="form-control"
                value={toDate}
                onChange={handleToDateChange}
                min={toDate}
                max={toDate}
              />
            </div>
          </div>

      </div>
      <SalesSection title="Total Sales" data={salesData.totalSales} isTotalSales={true}/>

      <div className="row mt-5">
        <div className="col-md-12">
          <h3>Total Received</h3>
          <table className="table table-bordered table-lg">
            <thead>
            <tr className="bg-light">
              <th>PAYMENT</th>
              <th>TIP</th>
              <th>AMOUNT</th>
              <th>REFUND</th>
              <th>RECEIVED</th>
            </tr>
            </thead>
            <tbody>
            {salesData && salesData?.totalReceived?.map((item, index) => (
              <tr key={index}>
                <td>{item.paymentType}</td>
                <td className="text-end p-4">{`$ ${item.tip ? item.tip?.(2) : 0}`}</td>
                <td className="text-end p-4">{`$ ${item.amount?.toFixed(2)}`}</td>
                <td className="text-end p-4">{`$ ${item.refund ? item.refund?.toFixed(2) : 0}`}</td>
                <td className="text-end">{`$ ${item.received.toFixed(2)}`}</td>
              </tr>
            ))}
            <tr>
              <td>Total</td>
              <td
                className="text-end p-4">{`$ ${calculateTotal(salesData.totalReceived?.map((item) => item.tip + 0))?.toFixed(2)}`}</td>
              <td
                className="text-end p-4">{`$ ${calculateTotal(salesData.totalReceived?.map((item) => item.amount))?.toFixed(2)}`}</td>
              <td
                className="text-end p-4">{`$ ${calculateTotal(salesData.totalReceived?.map((item) => item.refund + 0))?.toFixed(2)}`}</td>
              <td
                className="text-end">{`$ ${calculateTotal(salesData.totalReceived?.map((item) => item.received))?.toFixed(2)}`}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <SalesSection title="DineIn" data={salesData.totalSalesByOrderOption?.DineIn}/>
      <SalesSection title="PickUp" data={salesData.totalSalesByOrderOption?.PickUp}/>
      <SalesSection title="Delivery" data={salesData.totalSalesByOrderOption?.Delivery}/>

    </div>
  );
};

export default EndOFDayReport;
