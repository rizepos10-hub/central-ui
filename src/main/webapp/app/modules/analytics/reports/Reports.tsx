import React, {useEffect, useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import SalesSection from "app/modules/analytics/reports/SalesSections";
import axios from "axios";
import {format, addDays, addMonths} from 'date-fns';
import {useAppDispatch, useAppSelector} from "app/config/store";
import {Dropdown} from "primereact/dropdown";
import {SourceType} from "app/shared/model/enumerations/source-type.model";
const SalesSummaryReport = () => {

  const  dispatch = useAppDispatch()

  const [salesData, setSalesData]:any = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format((new Date()), "yyyy-MM-dd"));

  const [selectedBranch, setSelectedBranch] = useState(null);


  const [selectedSource, setSelectedSource] = useState(null);


  console.log(Object.values(SourceType), 'ssss')

  const branchList = useAppSelector(state => state.branch.entities)


  const sourceTypeOptions = [
    { label: "Both", value: null },
    ...Object.values(SourceType).map((source) => ({
      label: source,
      value: source
    }))
  ];

  const filteredBranchOptions = [
    { label: "All", value: null },
  ...branchList
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    }))];



  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event) => {
    setToDate(event.target.value);
  };

  const fetchLastWeekData =  () => {
    const today = new Date();
    const lastWeekStartDate = format(addDays(today, -7), "yyyy-MM-dd");
    const lastWeekEndDate = format(today, "yyyy-MM-dd");
    setFromDate(lastWeekStartDate);
    setToDate(lastWeekEndDate);
  };

  const fetchLastTwoWeeksData =  () => {
    const today = new Date();
    const lastTwoWeeksStartDate = format(addDays(today, -14), "yyyy-MM-dd");
    const lastTwoWeeksEndDate = format(today, "yyyy-MM-dd");
    setFromDate(lastTwoWeeksStartDate);
    setToDate(lastTwoWeeksEndDate);
  };

  const fetchLastMonthData =  () => {
    const today = new Date();
    const lastMonthStartDate = format(addMonths(today, -1), "yyyy-MM-dd");
    const lastMonthEndDate = format(today, "yyyy-MM-dd");
    setFromDate(lastMonthStartDate);
    setToDate(lastMonthEndDate);
  };

  const fetchLastThreeMonthsData =  () => {
    const today = new Date();
    const lastThreeMonthsStartDate = format(addMonths(today, -3), "yyyy-MM-dd");
    const lastThreeMonthsEndDate = format(today, "yyyy-MM-dd");
    setFromDate(lastThreeMonthsStartDate);
    setToDate(lastThreeMonthsEndDate);
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
      setLoading(true);
      const formattedFromDate = `${fromDate}T00:00:00.000Z`;
      const formattedToDate = `${toDate}T00:00:00.000Z`;

      const formData = new FormData();

      formData.append('fromDate', formattedFromDate);
      formData.append('toDate', formattedToDate);
      {
        selectedBranch &&
        formData.append('branch', selectedBranch)
      }

      {
        selectedSource &&
        formData.append('source', selectedSource)
      }


      const { data } = await axios.post(`/api/report/sales-summary`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSalesData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
    dispatch(getBranches({}))
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      handleSubmit();
    }
  }, [fromDate, toDate,selectedSource,selectedBranch]);

  const fetchTodayData = async () => {
    await handleSubmit();
  };


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
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="fromDate" className="form-label fw-bold">From Date</label>
                <input type="date" id="fromDate" className="form-control" value={fromDate} onChange={handleFromDateChange} />
              </div>
              <div className="col-md-6">
                <label htmlFor="fromDate" className="form-label fw-bold">To Date</label>

                <input type="date" id="toDate" className="form-control" value={toDate} onChange={handleToDateChange} />
              </div>
            </div>
            <div className="text-center">
              <button type="submit" className="btn btn-primary" >Get Report</button>
            </div>
            <div className="d-flex  justify-content-start gap-5 ">
              <Dropdown
                style={{minWidth: '7rem'}}
                value={selectedSource}
                options={sourceTypeOptions}
                onChange={(e) => setSelectedSource(e.value)}
                placeholder="Select a source"
              />
              <Dropdown
                style={{minWidth: '7rem'}}

                value={selectedBranch}
                options={filteredBranchOptions}
                onChange={(e) => setSelectedBranch(e.value)}
                placeholder="Select a branch"
              />
            </div>
            <div className="d-flex justify-content-end gap-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchLastWeekData}
              >
                Last Week
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchLastTwoWeeksData}
              >
                Last Two Weeks
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchLastMonthData}
              >
                Last Month
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchLastThreeMonthsData}
              >
                Last 3 Months
              </button>
            </div>
          </form>

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

export default SalesSummaryReport;
