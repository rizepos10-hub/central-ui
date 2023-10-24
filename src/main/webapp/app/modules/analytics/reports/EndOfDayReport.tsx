import React, {useEffect, useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SalesSection from "app/modules/analytics/reports/SalesSections";
import axios from "axios";
import { format, addDays } from 'date-fns';
import {Dropdown} from "primereact/dropdown";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {SourceType} from "app/shared/model/enumerations/source-type.model";

import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {Alert, Spinner} from "reactstrap";
import UnclosedOrders from "app/modules/analytics/reports/unclosed-orders";
const EndOFDayReport = () => {


  const dispatch = useAppDispatch()

  const [salesData, setSalesData]:any[] = useState([]);
  const [loading, setLoading] = useState(false);



  const [selectedBranch, setSelectedBranch] = useState(null);
  // const [selectedSource, setSelectedSource] = useState(null);


  const branchList = useAppSelector(state => state.branch.entities)


  // const sourceTypeOptions = [
  //   { label: "Both", value: null },
  //   ...Object.values(SourceType).map((source) => ({
  //     label: source,
  //     value: source
  //   }))
  // ];

  const filteredBranchOptions = [
    { label: "All", value: null },
    ...branchList
      .map((branch) => ({
        label: branch.name,
        value: branch.id,
      }))];





  const handleSubmit = async (event?) => {
    if (event) {
      event.preventDefault();
    }
    try {
      setLoading(true)
      const { data } = await axios.get(`/api/report/end-of-day?branch=${selectedBranch}`);
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
    dispatch(getBranches({}))

    fetchTodayData();
  }, [selectedBranch]);


  if (!salesData) {
    return <div>No data available.</div>;
  }

  if(!selectedBranch){
    return  (
        <div >
          <div className="text-center my-3">
            <h2>Pos Business 10</h2>
            <h4>End OF Day Report</h4>
            <p>Location: Random Location</p>

          </div>
        <div>
          <Alert variant={"warning"}>Please Select A Branch</Alert>

        </div>
        <div className="d-flex justify-content-start align-items-start"  >
        <Dropdown
          style={{minWidth: '20rem'}}
          value={selectedBranch}
          options={filteredBranchOptions}
          onChange={(e) => setSelectedBranch(e.value)}
          placeholder="Select a branch"
        />
        </div>

      </div>
  )
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

  if(loading){
    return  <Spinner />
  }


  console.log(salesData,'salesDta')

  return (

    <div className="container mt-5">
      <div className="text-center">
        <h4>End OF Day Report</h4>
        <p>Location: Random Location</p>

      </div>
      <div className="d-flex  justify-content-start gap-5 ">

        <Dropdown
          style={{minWidth: '7rem'}}

          value={selectedBranch}
          options={filteredBranchOptions}
          onChange={(e) => setSelectedBranch(e.value)}
          placeholder="Select a branch"
        />
      </div>
      <div>
        <UnclosedOrders openedOrders={salesData.openedOrders} />
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
